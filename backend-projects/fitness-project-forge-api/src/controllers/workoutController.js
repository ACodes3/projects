import pool from '../config/db.js';


// ============================================================
// HELPERS
// ============================================================

function isValidDateString(value) {
  if (
    typeof value !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const [year, month, day] = value
    .split('-')
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  return (
    date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
  );
}


function validateWorkoutPayload(body) {
  const {
    name,
    date,
    youtubeUrl,
    notes,
    exercises,
  } = body;

  if (
    typeof name !== 'string'
    || name.trim().length === 0
  ) {
    return 'Workout name is required.';
  }

  if (!isValidDateString(date)) {
    return 'A valid workout date is required.';
  }

  if (
    youtubeUrl !== undefined
    && youtubeUrl !== null
    && typeof youtubeUrl !== 'string'
  ) {
    return 'YouTube URL must be a string.';
  }

  if (
    notes !== undefined
    && notes !== null
    && typeof notes !== 'string'
  ) {
    return 'Workout notes must be a string.';
  }

  if (
    !Array.isArray(exercises)
    || exercises.length === 0
  ) {
    return 'A workout must contain at least one exercise.';
  }

  for (
    let exerciseIndex = 0;
    exerciseIndex < exercises.length;
    exerciseIndex += 1
  ) {
    const exercise = exercises[exerciseIndex];

    if (
      typeof exercise.name !== 'string'
      || exercise.name.trim().length === 0
    ) {
      return `Exercise ${exerciseIndex + 1} requires a name.`;
    }

    if (
      exercise.trackingMode !== 'reps'
      && exercise.trackingMode !== 'time'
    ) {
      return `Exercise ${exerciseIndex + 1} has an invalid tracking mode.`;
    }

    if (
      exercise.exerciseId !== undefined
      && exercise.exerciseId !== null
    ) {
      const exerciseId = Number(
        exercise.exerciseId,
      );

      if (
        !Number.isInteger(exerciseId)
        || exerciseId <= 0
      ) {
        return `Exercise ${exerciseIndex + 1} has an invalid exercise ID.`;
      }
    }

    if (
      !Array.isArray(exercise.sets)
      || exercise.sets.length === 0
    ) {
      return `Exercise ${exerciseIndex + 1} must contain at least one set.`;
    }

    for (
      let setIndex = 0;
      setIndex < exercise.sets.length;
      setIndex += 1
    ) {
      const set = exercise.sets[setIndex];

      const weight = Number(
        set.weight ?? 0,
      );

      if (
        !Number.isFinite(weight)
        || weight < 0
      ) {
        return `Exercise ${exerciseIndex + 1}, set ${setIndex + 1} has an invalid weight.`;
      }

      if (
        exercise.trackingMode === 'reps'
      ) {
        const reps = Number(set.reps);

        if (
          !Number.isInteger(reps)
          || reps <= 0
        ) {
          return `Exercise ${exerciseIndex + 1}, set ${setIndex + 1} requires valid reps.`;
        }
      }

      if (
        exercise.trackingMode === 'time'
      ) {
        const durationSeconds = Number(
          set.durationSeconds,
        );

        if (
          !Number.isInteger(durationSeconds)
          || durationSeconds <= 0
        ) {
          return `Exercise ${exerciseIndex + 1}, set ${setIndex + 1} requires a valid duration.`;
        }
      }
    }
  }

  return null;
}


// ============================================================
// CREATE WORKOUT EXERCISES + SETS
//
// Shared by POST and PUT.
// ============================================================

async function createWorkoutExercises(
  client,
  workoutId,
  exercises,
) {
  const createdExercises = [];

  for (
    let exerciseIndex = 0;
    exerciseIndex < exercises.length;
    exerciseIndex += 1
  ) {
    const exercise = exercises[exerciseIndex];

    let libraryExerciseId = null;
    let exerciseName = exercise.name.trim();


    // --------------------------------------------------------
    // VERIFY LIBRARY EXERCISE
    // --------------------------------------------------------

    if (
      exercise.exerciseId !== undefined
      && exercise.exerciseId !== null
    ) {
      const exerciseId = Number(
        exercise.exerciseId,
      );

      const libraryResult = await client.query(
        `
          SELECT
            id,
            name
          FROM public.exercises
          WHERE id = $1
            AND is_active = TRUE
          LIMIT 1
        `,
        [exerciseId],
      );

      if (libraryResult.rows.length === 0) {
        const error = new Error(
          `Exercise "${exercise.name}" does not exist in the exercise library.`,
        );

        error.statusCode = 400;

        throw error;
      }

      libraryExerciseId =
        libraryResult.rows[0].id;

      exerciseName =
        libraryResult.rows[0].name;
    }


    // --------------------------------------------------------
    // CREATE WORKOUT EXERCISE
    // --------------------------------------------------------

    const exerciseResult = await client.query(
      `
        INSERT INTO public.workout_exercises (
          workout_id,
          exercise_id,
          exercise_name,
          tracking_mode,
          position
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        RETURNING
          id,
          workout_id,
          exercise_id,
          exercise_name,
          tracking_mode,
          position,
          created_at,
          updated_at
      `,
      [
        workoutId,
        libraryExerciseId,
        exerciseName,
        exercise.trackingMode,
        exerciseIndex + 1,
      ],
    );

    const createdExercise =
      exerciseResult.rows[0];

    const createdSets = [];


    // --------------------------------------------------------
    // CREATE SETS / INTERVALS
    // --------------------------------------------------------

    for (
      let setIndex = 0;
      setIndex < exercise.sets.length;
      setIndex += 1
    ) {
      const set = exercise.sets[setIndex];

      const weight = Number(
        set.weight ?? 0,
      );

      const reps =
        exercise.trackingMode === 'reps'
          ? Number(set.reps)
          : null;

      const durationSeconds =
        exercise.trackingMode === 'time'
          ? Number(set.durationSeconds)
          : null;


      const setResult = await client.query(
        `
          INSERT INTO public.workout_sets (
            workout_exercise_id,
            set_number,
            weight_kg,
            reps,
            duration_seconds
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
          )
          RETURNING
            id,
            workout_exercise_id,
            set_number,
            weight_kg,
            reps,
            duration_seconds,
            created_at,
            updated_at
        `,
        [
          createdExercise.id,
          setIndex + 1,
          weight,
          reps,
          durationSeconds,
        ],
      );

      createdSets.push(
        setResult.rows[0],
      );
    }


    createdExercises.push({
      ...createdExercise,
      sets: createdSets,
    });
  }

  return createdExercises;
}


// ============================================================
// GET ALL WORKOUTS
// GET /api/workouts
// ============================================================

export async function getWorkouts(req, res) {
  try {
    const userId = req.user.id;


    // --------------------------------------------------------
    // WORKOUTS
    // --------------------------------------------------------

    const workoutResult = await pool.query(
      `
        SELECT
          id,
          name,
          workout_date,
          youtube_url,
          notes,
          created_at,
          updated_at
        FROM public.workouts
        WHERE user_id = $1
        ORDER BY
          workout_date DESC,
          created_at DESC
      `,
      [userId],
    );

    const workouts = workoutResult.rows;

    if (workouts.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        workouts: [],
      });
    }


    // --------------------------------------------------------
    // WORKOUT EXERCISES
    // --------------------------------------------------------

    const workoutIds = workouts.map(
      (workout) => workout.id,
    );

    const exerciseResult = await pool.query(
      `
        SELECT
          id,
          workout_id,
          exercise_id,
          exercise_name,
          tracking_mode,
          position,
          created_at,
          updated_at
        FROM public.workout_exercises
        WHERE workout_id = ANY($1::bigint[])
        ORDER BY
          workout_id,
          position
      `,
      [workoutIds],
    );

    const workoutExercises =
      exerciseResult.rows;


    // --------------------------------------------------------
    // SETS / INTERVALS
    // --------------------------------------------------------

    const workoutExerciseIds =
      workoutExercises.map(
        (exercise) => exercise.id,
      );

    let workoutSets = [];

    if (workoutExerciseIds.length > 0) {
      const setResult = await pool.query(
        `
          SELECT
            id,
            workout_exercise_id,
            set_number,
            weight_kg,
            reps,
            duration_seconds,
            created_at,
            updated_at
          FROM public.workout_sets
          WHERE workout_exercise_id =
            ANY($1::bigint[])
          ORDER BY
            workout_exercise_id,
            set_number
        `,
        [workoutExerciseIds],
      );

      workoutSets = setResult.rows;
    }


    // --------------------------------------------------------
    // GROUP SETS BY EXERCISE
    // --------------------------------------------------------

    const setsByExercise = new Map();

    for (const set of workoutSets) {
      if (
        !setsByExercise.has(
          set.workout_exercise_id,
        )
      ) {
        setsByExercise.set(
          set.workout_exercise_id,
          [],
        );
      }

      setsByExercise
        .get(set.workout_exercise_id)
        .push(set);
    }


    // --------------------------------------------------------
    // GROUP EXERCISES BY WORKOUT
    // --------------------------------------------------------

    const exercisesByWorkout = new Map();

    for (
      const exercise of workoutExercises
    ) {
      const exerciseWithSets = {
        ...exercise,

        sets:
          setsByExercise.get(
            exercise.id,
          ) || [],
      };

      if (
        !exercisesByWorkout.has(
          exercise.workout_id,
        )
      ) {
        exercisesByWorkout.set(
          exercise.workout_id,
          [],
        );
      }

      exercisesByWorkout
        .get(exercise.workout_id)
        .push(exerciseWithSets);
    }


    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    const populatedWorkouts =
      workouts.map((workout) => ({
        ...workout,

        exercises:
          exercisesByWorkout.get(
            workout.id,
          ) || [],
      }));


    res.status(200).json({
      success: true,
      count: populatedWorkouts.length,
      workouts: populatedWorkouts,
    });
  } catch (error) {
    console.error(
      'Failed to fetch workouts:',
      error,
    );

    res.status(500).json({
      success: false,
      message: 'Failed to fetch workouts.',
    });
  }
}


// ============================================================
// GET ONE WORKOUT
// GET /api/workouts/:id
// ============================================================

export async function getWorkoutById(
  req,
  res,
) {
  try {
    const userId = req.user.id;

    const workoutId = Number(
      req.params.id,
    );


    // --------------------------------------------------------
    // VALIDATE ID
    // --------------------------------------------------------

    if (
      !Number.isInteger(workoutId)
      || workoutId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workout ID.',
      });
    }


    // --------------------------------------------------------
    // WORKOUT
    // --------------------------------------------------------

    const workoutResult = await pool.query(
      `
        SELECT
          id,
          name,
          workout_date,
          youtube_url,
          notes,
          created_at,
          updated_at
        FROM public.workouts
        WHERE id = $1
          AND user_id = $2
        LIMIT 1
      `,
      [
        workoutId,
        userId,
      ],
    );

    if (
      workoutResult.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found.',
      });
    }

    const workout =
      workoutResult.rows[0];


    // --------------------------------------------------------
    // EXERCISES
    // --------------------------------------------------------

    const exerciseResult = await pool.query(
      `
        SELECT
          id,
          workout_id,
          exercise_id,
          exercise_name,
          tracking_mode,
          position,
          created_at,
          updated_at
        FROM public.workout_exercises
        WHERE workout_id = $1
        ORDER BY position
      `,
      [workoutId],
    );

    const exercises =
      exerciseResult.rows;


    // --------------------------------------------------------
    // SETS / INTERVALS
    // --------------------------------------------------------

    const exerciseIds =
      exercises.map(
        (exercise) => exercise.id,
      );

    let sets = [];

    if (exerciseIds.length > 0) {
      const setResult = await pool.query(
        `
          SELECT
            id,
            workout_exercise_id,
            set_number,
            weight_kg,
            reps,
            duration_seconds,
            created_at,
            updated_at
          FROM public.workout_sets
          WHERE workout_exercise_id =
            ANY($1::bigint[])
          ORDER BY
            workout_exercise_id,
            set_number
        `,
        [exerciseIds],
      );

      sets = setResult.rows;
    }


    // --------------------------------------------------------
    // GROUP SETS
    // --------------------------------------------------------

    const setsByExercise = new Map();

    for (const set of sets) {
      if (
        !setsByExercise.has(
          set.workout_exercise_id,
        )
      ) {
        setsByExercise.set(
          set.workout_exercise_id,
          [],
        );
      }

      setsByExercise
        .get(set.workout_exercise_id)
        .push(set);
    }


    const populatedExercises =
      exercises.map((exercise) => ({
        ...exercise,

        sets:
          setsByExercise.get(
            exercise.id,
          ) || [],
      }));


    res.status(200).json({
      success: true,

      workout: {
        ...workout,
        exercises: populatedExercises,
      },
    });
  } catch (error) {
    console.error(
      'Failed to fetch workout:',
      error,
    );

    res.status(500).json({
      success: false,
      message: 'Failed to fetch workout.',
    });
  }
}


// ============================================================
// CREATE WORKOUT
// POST /api/workouts
// ============================================================

export async function createWorkout(
  req,
  res,
) {
  const validationError =
    validateWorkoutPayload(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  const userId = req.user.id;

  const {
    name,
    date,
    youtubeUrl = null,
    notes = null,
    exercises,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');


    // --------------------------------------------------------
    // CREATE WORKOUT
    // --------------------------------------------------------

    const workoutResult =
      await client.query(
        `
          INSERT INTO public.workouts (
            user_id,
            name,
            workout_date,
            youtube_url,
            notes
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
          )
          RETURNING
            id,
            name,
            workout_date,
            youtube_url,
            notes,
            created_at,
            updated_at
        `,
        [
          userId,
          name.trim(),
          date,

          youtubeUrl?.trim()
            ? youtubeUrl.trim()
            : null,

          notes?.trim()
            ? notes.trim()
            : null,
        ],
      );

    const workout =
      workoutResult.rows[0];


    // --------------------------------------------------------
    // CREATE EXERCISES + SETS
    // --------------------------------------------------------

    const createdExercises =
      await createWorkoutExercises(
        client,
        workout.id,
        exercises,
      );


    await client.query('COMMIT');


    res.status(201).json({
      success: true,
      message:
        'Workout created successfully.',

      workout: {
        ...workout,
        exercises: createdExercises,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');

    console.error(
      'Failed to create workout:',
      error,
    );

    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({
          success: false,
          message: error.message,
        });
    }


    res.status(500).json({
      success: false,
      message: 'Failed to create workout.',
    });
  } finally {
    client.release();
  }
}


// ============================================================
// UPDATE WORKOUT
// PUT /api/workouts/:id
//
// PUT replaces the complete workout contents:
// - workout information
// - exercises
// - sets / timed intervals
// ============================================================

export async function updateWorkout(
  req,
  res,
) {
  const workoutId = Number(
    req.params.id,
  );

  if (
    !Number.isInteger(workoutId)
    || workoutId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid workout ID.',
    });
  }


  const validationError =
    validateWorkoutPayload(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }


  const userId = req.user.id;

  const {
    name,
    date,
    youtubeUrl = null,
    notes = null,
    exercises,
  } = req.body;


  const client = await pool.connect();

  try {
    await client.query('BEGIN');


    // --------------------------------------------------------
    // VERIFY OWNERSHIP
    //
    // FOR UPDATE locks this workout row while the transaction
    // is modifying it.
    // --------------------------------------------------------

    const existingWorkoutResult =
      await client.query(
        `
          SELECT id
          FROM public.workouts
          WHERE id = $1
            AND user_id = $2
          FOR UPDATE
        `,
        [
          workoutId,
          userId,
        ],
      );


    if (
      existingWorkoutResult.rows.length === 0
    ) {
      const error = new Error(
        'Workout not found.',
      );

      error.statusCode = 404;

      throw error;
    }


    // --------------------------------------------------------
    // UPDATE WORKOUT
    // --------------------------------------------------------

    const workoutResult =
      await client.query(
        `
          UPDATE public.workouts
          SET
            name = $1,
            workout_date = $2,
            youtube_url = $3,
            notes = $4
          WHERE id = $5
            AND user_id = $6
          RETURNING
            id,
            name,
            workout_date,
            youtube_url,
            notes,
            created_at,
            updated_at
        `,
        [
          name.trim(),
          date,

          youtubeUrl?.trim()
            ? youtubeUrl.trim()
            : null,

          notes?.trim()
            ? notes.trim()
            : null,

          workoutId,
          userId,
        ],
      );

    const workout =
      workoutResult.rows[0];


    // --------------------------------------------------------
    // REMOVE OLD EXERCISES
    //
    // workout_sets are automatically removed because
    // workout_exercises -> workout_sets uses ON DELETE CASCADE.
    // --------------------------------------------------------

    await client.query(
      `
        DELETE FROM public.workout_exercises
        WHERE workout_id = $1
      `,
      [workoutId],
    );


    // --------------------------------------------------------
    // CREATE NEW EXERCISES + SETS
    // --------------------------------------------------------

    const createdExercises =
      await createWorkoutExercises(
        client,
        workoutId,
        exercises,
      );


    // --------------------------------------------------------
    // COMMIT
    // --------------------------------------------------------

    await client.query('COMMIT');


    res.status(200).json({
      success: true,
      message:
        'Workout updated successfully.',

      workout: {
        ...workout,
        exercises: createdExercises,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');

    console.error(
      'Failed to update workout:',
      error,
    );


    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({
          success: false,
          message: error.message,
        });
    }


    res.status(500).json({
      success: false,
      message: 'Failed to update workout.',
    });
  } finally {
    client.release();
  }
}


// ============================================================
// DELETE WORKOUT
// DELETE /api/workouts/:id
// ============================================================

export async function deleteWorkout(
  req,
  res,
) {
  try {
    const userId = req.user.id;

    const workoutId = Number(
      req.params.id,
    );


    if (
      !Number.isInteger(workoutId)
      || workoutId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workout ID.',
      });
    }


    const result = await pool.query(
      `
        DELETE FROM public.workouts
        WHERE id = $1
          AND user_id = $2
        RETURNING
          id,
          name,
          workout_date
      `,
      [
        workoutId,
        userId,
      ],
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found.',
      });
    }


    res.status(200).json({
      success: true,
      message:
        'Workout deleted successfully.',
      workout: result.rows[0],
    });
  } catch (error) {
    console.error(
      'Failed to delete workout:',
      error,
    );

    res.status(500).json({
      success: false,
      message: 'Failed to delete workout.',
    });
  }
}

import pool from '../config/db.js';

// ============================================================
// HELPERS
// ============================================================

function isValidDateString(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
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
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidId(value) {
  const id = Number(value);

  return (
    Number.isSafeInteger(id) &&
    id > 0
  );
}

function validateWorkoutPayload(body) {
  if (!body || typeof body !== 'object') {
    return 'Invalid workout data.';
  }

  const {
    name,
    date,
    youtubeUrl,
    notes,
    exercises,
  } = body;

  if (
    typeof name !== 'string' ||
    !name.trim()
  ) {
    return 'Workout name is required.';
  }

  if (!isValidDateString(date)) {
    return 'A valid workout date is required.';
  }

  if (
    youtubeUrl !== undefined &&
    youtubeUrl !== null &&
    typeof youtubeUrl !== 'string'
  ) {
    return 'YouTube URL must be a string.';
  }

  if (
    notes !== undefined &&
    notes !== null &&
    typeof notes !== 'string'
  ) {
    return 'Workout notes must be a string.';
  }

  if (
    !Array.isArray(exercises) ||
    exercises.length === 0
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
      !exercise ||
      typeof exercise !== 'object' ||
      typeof exercise.name !== 'string' ||
      !exercise.name.trim()
    ) {
      return `Exercise ${exerciseIndex + 1} requires a name.`;
    }

    if (
      exercise.trackingMode !== 'reps' &&
      exercise.trackingMode !== 'time'
    ) {
      return `Exercise ${exerciseIndex + 1} has an invalid tracking mode.`;
    }

    if (
      exercise.exerciseId !== undefined &&
      exercise.exerciseId !== null &&
      !isValidId(exercise.exerciseId)
    ) {
      return `Exercise ${exerciseIndex + 1} has an invalid exercise ID.`;
    }

    if (
      !Array.isArray(exercise.sets) ||
      exercise.sets.length === 0
    ) {
      return `Exercise ${exerciseIndex + 1} must contain at least one set.`;
    }

    for (
      let setIndex = 0;
      setIndex < exercise.sets.length;
      setIndex += 1
    ) {
      const set = exercise.sets[setIndex];

      if (
        !set ||
        typeof set !== 'object'
      ) {
        return `Exercise ${exerciseIndex + 1}, set ${setIndex + 1} is invalid.`;
      }

      const weight = Number(
        set.weight ?? 0,
      );

      if (
        !Number.isFinite(weight) ||
        weight < 0
      ) {
        return `Exercise ${exerciseIndex + 1}, set ${setIndex + 1} has an invalid weight.`;
      }

      if (exercise.trackingMode === 'reps') {
        const reps = Number(set.reps);

        if (
          !Number.isInteger(reps) ||
          reps <= 0
        ) {
          return `Exercise ${exerciseIndex + 1}, set ${setIndex + 1} requires valid reps.`;
        }
      }

      if (exercise.trackingMode === 'time') {
        const seconds = Number(
          set.durationSeconds,
        );

        if (
          !Number.isInteger(seconds) ||
          seconds <= 0
        ) {
          return `Exercise ${exerciseIndex + 1}, set ${setIndex + 1} requires a valid duration.`;
        }
      }
    }
  }

  return null;
}

// ============================================================
// ERROR HELPERS
// ============================================================

function createHttpError(
  message,
  statusCode = 400,
) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sendServerError(
  res,
  error,
  fallbackMessage,
) {
  console.error(fallbackMessage, error);

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
}

// ============================================================
// CREATE WORKOUT EXERCISES + SETS
//
// Used by both createWorkout and updateWorkout.
//
// Inactive library exercises are permitted
// ONLY when their IDs already belong to the
// workout being edited.
// ============================================================

async function createWorkoutExercises(
  client,
  workoutId,
  exercises,
  allowedInactiveExerciseIds = [],
  historicalNames = new Map(),
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
      exercise.exerciseId !== undefined &&
      exercise.exerciseId !== null
    ) {
      const exerciseId = Number(
        exercise.exerciseId,
      );

      const libraryResult = await client.query(
        `
          SELECT
            id,
            name,
            is_active
          FROM public.exercises
          WHERE id = $1
            AND (
              is_active = TRUE
              OR id = ANY($2::bigint[])
            )
          LIMIT 1
        `,
        [
          exerciseId,
          allowedInactiveExerciseIds,
        ],
      );

      if (libraryResult.rows.length === 0) {
        throw createHttpError(
          `Exercise "${exercise.name}" is not available in the exercise library.`,
        );
      }

      const libraryExercise =
        libraryResult.rows[0];

      libraryExerciseId =
        libraryExercise.id;

      if (libraryExercise.is_active) {
        // Current library exercises use
        // their current official name.
        exerciseName =
          libraryExercise.name;
      } else {
        // Deleted exercises retain the
        // existing workout's saved name.
        // Never trust a new name to
        // rewrite inactive history.
        exerciseName =
          historicalNames.get(
            String(exerciseId),
          ) ?? exercise.name.trim();
      }
    }

    // --------------------------------------------------------
    // INSERT WORKOUT EXERCISE
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
        VALUES ($1, $2, $3, $4, $5)
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
    // INSERT SETS / TIMED INTERVALS
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
          VALUES ($1, $2, $3, $4, $5)
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
// FETCH WORKOUT EXERCISES + SETS
//
// Used for reading workouts.
// Names come from workout_exercises,
// preserving historical snapshots.
// ============================================================

async function getExercisesForWorkouts(
  client,
  workoutIds,
) {
  if (workoutIds.length === 0) {
    return new Map();
  }

  const exerciseResult = await client.query(
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
      ORDER BY workout_id, position
    `,
    [workoutIds],
  );

  const workoutExercises =
    exerciseResult.rows;

  const workoutExerciseIds =
    workoutExercises.map(
      (exercise) => exercise.id,
    );

  let workoutSets = [];

  if (workoutExerciseIds.length > 0) {
    const setResult = await client.query(
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

  // ----------------------------------------------------------
  // GROUP SETS BY WORKOUT EXERCISE
  // ----------------------------------------------------------

  const setsByExercise = new Map();

  for (const set of workoutSets) {
    const key = String(
      set.workout_exercise_id,
    );

    if (!setsByExercise.has(key)) {
      setsByExercise.set(key, []);
    }

    setsByExercise.get(key).push(set);
  }

  // ----------------------------------------------------------
  // GROUP EXERCISES BY WORKOUT
  // ----------------------------------------------------------

  const exercisesByWorkout = new Map();

  for (const exercise of workoutExercises) {
    const workoutKey = String(
      exercise.workout_id,
    );

    const exerciseKey = String(
      exercise.id,
    );

    const exerciseWithSets = {
      ...exercise,
      sets:
        setsByExercise.get(
          exerciseKey,
        ) ?? [],
    };

    if (
      !exercisesByWorkout.has(workoutKey)
    ) {
      exercisesByWorkout.set(
        workoutKey,
        [],
      );
    }

    exercisesByWorkout
      .get(workoutKey)
      .push(exerciseWithSets);
  }

  return exercisesByWorkout;
}

// ============================================================
// GET ALL WORKOUTS
// GET /api/workouts
// ============================================================

export async function getWorkouts(req, res) {
  try {
    const userId = req.user.id;

    const workoutResult = await pool.query(
      `
        SELECT
          id,
          name,
          workout_date::text AS workout_date,
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

    const workoutIds = workouts.map(
      (workout) => workout.id,
    );

    const exercisesByWorkout =
      await getExercisesForWorkouts(
        pool,
        workoutIds,
      );

    const populatedWorkouts =
      workouts.map((workout) => ({
        ...workout,
        workout_date: workout.workout_date,
        exercises:
          exercisesByWorkout.get(
            String(workout.id),
          ) ?? [],
      }));

    return res.status(200).json({
      success: true,
      count: populatedWorkouts.length,
      workouts: populatedWorkouts,
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      'Failed to fetch workouts.',
    );
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
  const userId = req.user.id;
  const workoutId = req.params.id;

  if (!isValidId(workoutId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid workout ID.',
    });
  }

  try {
    const workoutResult = await pool.query(
      `
        SELECT
          id,
          name,
          workout_date::text AS workout_date,
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

    const exercisesByWorkout =
      await getExercisesForWorkouts(
        pool,
        [workout.id],
      );

    return res.status(200).json({
      success: true,

      workout: {
        ...workout,

        exercises:
          exercisesByWorkout.get(
            String(workout.id),
          ) ?? [],
      },
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      'Failed to fetch workout.',
    );
  }
}

// ============================================================
// CREATE WORKOUT
// POST /api/workouts
//
// New workouts can only use active
// library exercises.
//
// One-off exercises are also allowed
// when exerciseId is null.
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

  let client;

  try {
    client = await pool.connect();

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
          VALUES ($1, $2, $3, $4, $5)
          RETURNING
            id,
            name,
            workout_date::text AS workout_date,
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
    // CREATE WORKOUT EXERCISES + SETS
    //
    // No inactive exercise IDs are allowed.
    // --------------------------------------------------------

    const createdExercises =
      await createWorkoutExercises(
        client,
        workout.id,
        exercises,
      );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message:
        'Workout created successfully.',

      workout: {
        ...workout,
        exercises: createdExercises,
      },
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }

    return sendServerError(
      res,
      error,
      'Failed to create workout.',
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

// ============================================================
// UPDATE WORKOUT
// PUT /api/workouts/:id
//
// PUT replaces:
// - workout details
// - exercises
// - sets and timed intervals
//
// Historical exception:
// Previously linked, inactive exercises
// remain valid when editing this workout.
// ============================================================

export async function updateWorkout(
  req,
  res,
) {
  const workoutId = req.params.id;

  if (!isValidId(workoutId)) {
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

  let client;

  try {
    client = await pool.connect();

    await client.query('BEGIN');

    // --------------------------------------------------------
    // VERIFY WORKOUT OWNERSHIP
    //
    // Lock the row until the transaction
    // finishes to protect concurrent edits.
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
      throw createHttpError(
        'Workout not found.',
        404,
      );
    }

    // --------------------------------------------------------
    // CAPTURE EXISTING EXERCISES
    //
    // MUST happen before deleting old
    // workout_exercises rows.
    //
    // Only these already-linked IDs may
    // remain linked if now inactive.
    // --------------------------------------------------------

    const historicalResult =
      await client.query(
        `
          SELECT
            exercise_id,
            exercise_name
          FROM public.workout_exercises
          WHERE workout_id = $1
            AND exercise_id IS NOT NULL
          ORDER BY position
        `,
        [workoutId],
      );

    const allowedInactiveExerciseIds = [
      ...new Set(
        historicalResult.rows.map(
          (row) => row.exercise_id,
        ),
      ),
    ];

    // Keep names saved in the historical
    // workout, not from renamed/deleted
    // library records.

    const historicalNames = new Map();

    for (
      const row of
      historicalResult.rows
    ) {
      const key = String(
        row.exercise_id,
      );

      if (!historicalNames.has(key)) {
        historicalNames.set(
          key,
          row.exercise_name,
        );
      }
    }

    // --------------------------------------------------------
    // UPDATE WORKOUT DETAILS
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
            workout_date::text AS workout_date,
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
    // DELETE OLD WORKOUT EXERCISES
    //
    // Related workout_sets are deleted
    // through ON DELETE CASCADE.
    //
    // All changes remain inside the same
    // transaction, so any failure rolls
    // the operation back.
    // --------------------------------------------------------

    await client.query(
      `
        DELETE FROM public.workout_exercises
        WHERE workout_id = $1
      `,
      [workoutId],
    );

    // --------------------------------------------------------
    // RECREATE EXERCISES + SETS
    //
    // Active library IDs work normally.
    //
    // Inactive library IDs are accepted
    // only if the exercise was previously
    // referenced by this workout.
    // --------------------------------------------------------

    const createdExercises =
      await createWorkoutExercises(
        client,
        workoutId,
        exercises,
        allowedInactiveExerciseIds,
        historicalNames,
      );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message:
        'Workout updated successfully.',

      workout: {
        ...workout,
        exercises: createdExercises,
      },
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }

    return sendServerError(
      res,
      error,
      'Failed to update workout.',
    );
  } finally {
    if (client) {
      client.release();
    }
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
  const userId = req.user.id;
  const workoutId = req.params.id;

  if (!isValidId(workoutId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid workout ID.',
    });
  }

  try {
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

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Workout deleted successfully.',
      workout: result.rows[0],
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      'Failed to delete workout.',
    );
  }
}

import db from '../config/sqlite.js';

// FORGE workout API — SQLite implementation.
// All create/update changes are atomic, and user ownership is checked.

function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isValidId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0;
}

function validateWorkoutPayload(body) {
  if (!body || typeof body !== 'object') return 'Invalid workout data.';
  const { name, date, youtubeUrl, notes, exercises } = body;
  if (typeof name !== 'string' || !name.trim()) return 'Workout name is required.';
  if (!isValidDateString(date)) return 'A valid workout date is required.';
  if (youtubeUrl != null && typeof youtubeUrl !== 'string') return 'YouTube URL must be a string.';
  if (notes != null && typeof notes !== 'string') return 'Workout notes must be a string.';
  if (!Array.isArray(exercises) || !exercises.length) {
    return 'A workout must contain at least one exercise.';
  }
  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];
    if (!exercise || typeof exercise !== 'object' ||
        typeof exercise.name !== 'string' || !exercise.name.trim()) {
      return `Exercise ${i + 1} requires a name.`;
    }
    if (exercise.trackingMode !== 'reps' && exercise.trackingMode !== 'time') {
      return `Exercise ${i + 1} has an invalid tracking mode.`;
    }
    if (exercise.exerciseId != null && !isValidId(exercise.exerciseId)) {
      return `Exercise ${i + 1} has an invalid exercise ID.`;
    }
    if (!Array.isArray(exercise.sets) || !exercise.sets.length) {
      return `Exercise ${i + 1} must contain at least one set.`;
    }
    for (let j = 0; j < exercise.sets.length; j++) {
      const set = exercise.sets[j];
      if (!set || typeof set !== 'object') {
        return `Exercise ${i + 1}, set ${j + 1} is invalid.`;
      }
      const weight = Number(set.weight ?? 0);
      if (!Number.isFinite(weight) || weight < 0) {
        return `Exercise ${i + 1}, set ${j + 1} has an invalid weight.`;
      }
      if (exercise.trackingMode === 'reps') {
        const reps = Number(set.reps);
        if (!Number.isInteger(reps) || reps <= 0) {
          return `Exercise ${i + 1}, set ${j + 1} requires valid reps.`;
        }
      } else {
        const seconds = Number(set.durationSeconds);
        if (!Number.isInteger(seconds) || seconds <= 0) {
          return `Exercise ${i + 1}, set ${j + 1} requires a valid duration.`;
        }
      }
    }
  }
  return null;
}

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sendServerError(res, error, fallbackMessage) {
  console.error(fallbackMessage, error);
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return res.status(500).json({ success: false, message: fallbackMessage });
}

const workoutColumns = `id, name, workout_date, youtube_url, notes, created_at, updated_at`;
const workoutExerciseColumns = `id, workout_id, exercise_id, exercise_name, tracking_mode,
  position, created_at, updated_at`;
const workoutSetColumns = `id, workout_exercise_id, set_number, weight_kg, reps,
  duration_seconds, created_at, updated_at`;

// Returns workouts with their exercises and sets, maintaining the existing API shape.
function getExercisesForWorkouts(workoutIds) {
  const exercisesByWorkout = new Map();
  if (!workoutIds.length) return exercisesByWorkout;

  const placeholders = workoutIds.map(() => '?').join(', ');
  const workoutExercises = db.prepare(`
    SELECT ${workoutExerciseColumns}
    FROM workout_exercises
    WHERE workout_id IN (${placeholders})
    ORDER BY workout_id, position
  `).all(...workoutIds);

  const setsByExercise = new Map();
  if (workoutExercises.length) {
    const ids = workoutExercises.map((exercise) => exercise.id);
    const setPlaceholders = ids.map(() => '?').join(', ');
    const sets = db.prepare(`
      SELECT ${workoutSetColumns}
      FROM workout_sets
      WHERE workout_exercise_id IN (${setPlaceholders})
      ORDER BY workout_exercise_id, set_number
    `).all(...ids);
    for (const set of sets) {
      const key = String(set.workout_exercise_id);
      if (!setsByExercise.has(key)) setsByExercise.set(key, []);
      setsByExercise.get(key).push(set);
    }
  }

  for (const exercise of workoutExercises) {
    const key = String(exercise.workout_id);
    if (!exercisesByWorkout.has(key)) exercisesByWorkout.set(key, []);
    exercisesByWorkout.get(key).push({
      ...exercise,
      sets: setsByExercise.get(String(exercise.id)) ?? [],
    });
  }
  return exercisesByWorkout;
}

// Must be called inside a transaction for create/update.
function createWorkoutExercises(workoutId, exercises,
  allowedInactiveExerciseIds = new Set(), historicalNames = new Map()) {
  const createdExercises = [];
  const findLibraryExercise = db.prepare(`
    SELECT id, name, is_active FROM exercises WHERE id = ?
  `);
  const insertExercise = db.prepare(`
    INSERT INTO workout_exercises
      (workout_id, exercise_id, exercise_name, tracking_mode, position)
    VALUES (?, ?, ?, ?, ?)
  `);
  const getExercise = db.prepare(`
    SELECT ${workoutExerciseColumns} FROM workout_exercises WHERE id = ?
  `);
  const insertSet = db.prepare(`
    INSERT INTO workout_sets
      (workout_exercise_id, set_number, weight_kg, reps, duration_seconds)
    VALUES (?, ?, ?, ?, ?)
  `);
  const getSet = db.prepare(`SELECT ${workoutSetColumns} FROM workout_sets WHERE id = ?`);

  exercises.forEach((exercise, exerciseIndex) => {
    let libraryExerciseId = null;
    let exerciseName = exercise.name.trim();
    if (exercise.exerciseId != null) {
      const exerciseId = Number(exercise.exerciseId);
      const libraryExercise = findLibraryExercise.get(exerciseId);
      if (!libraryExercise ||
          (!libraryExercise.is_active && !allowedInactiveExerciseIds.has(exerciseId))) {
        throw createHttpError(
          `Exercise "${exercise.name}" is not available in the exercise library.`,
        );
      }
      libraryExerciseId = libraryExercise.id;
      exerciseName = libraryExercise.is_active
        ? libraryExercise.name
        : (historicalNames.get(String(exerciseId)) ?? exerciseName);
    }

    const exerciseInfo = insertExercise.run(
      workoutId, libraryExerciseId, exerciseName,
      exercise.trackingMode, exerciseIndex + 1,
    );
    const createdExercise = getExercise.get(exerciseInfo.lastInsertRowid);
    const createdSets = exercise.sets.map((set, setIndex) => {
      const weight = Number(set.weight ?? 0);
      const reps = exercise.trackingMode === 'reps' ? Number(set.reps) : null;
      const duration = exercise.trackingMode === 'time'
        ? Number(set.durationSeconds) : null;
      const setInfo = insertSet.run(createdExercise.id, setIndex + 1, weight, reps, duration);
      return getSet.get(setInfo.lastInsertRowid);
    });
    createdExercises.push({ ...createdExercise, sets: createdSets });
  });
  return createdExercises;
}

// GET /api/workouts
export function getWorkouts(req, res) {
  try {
    const workouts = db.prepare(`
      SELECT ${workoutColumns} FROM workouts
      WHERE user_id = ?
      ORDER BY workout_date DESC, created_at DESC
    `).all(req.user.id);
    const grouped = getExercisesForWorkouts(workouts.map((w) => w.id));
    const populated = workouts.map((workout) => ({
      ...workout, exercises: grouped.get(String(workout.id)) ?? [],
    }));
    return res.status(200).json({ success: true, count: populated.length, workouts: populated });
  } catch (error) {
    return sendServerError(res, error, 'Failed to fetch workouts.');
  }
}

// GET /api/workouts/:id
export function getWorkoutById(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid workout ID.' });
  }
  try {
    const workout = db.prepare(`
      SELECT ${workoutColumns} FROM workouts WHERE id = ? AND user_id = ?
    `).get(Number(req.params.id), req.user.id);
    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found.' });
    }
    const grouped = getExercisesForWorkouts([workout.id]);
    return res.status(200).json({
      success: true,
      workout: { ...workout, exercises: grouped.get(String(workout.id)) ?? [] },
    });
  } catch (error) {
    return sendServerError(res, error, 'Failed to fetch workout.');
  }
}

// POST /api/workouts
export function createWorkout(req, res) {
  const validationError = validateWorkoutPayload(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }
  const { name, date, youtubeUrl = null, notes = null, exercises } = req.body;
  try {
    const workout = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO workouts (user_id, name, workout_date, youtube_url, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.user.id, name.trim(), date, youtubeUrl?.trim() || null, notes?.trim() || null);
      const row = db.prepare(`SELECT ${workoutColumns} FROM workouts WHERE id = ?`)
        .get(info.lastInsertRowid);
      return { ...row, exercises: createWorkoutExercises(row.id, exercises) };
    })();
    return res.status(201).json({
      success: true, message: 'Workout created successfully.', workout,
    });
  } catch (error) {
    return sendServerError(res, error, 'Failed to create workout.');
  }
}

// PUT /api/workouts/:id — replaces exercises and sets atomically.
export function updateWorkout(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid workout ID.' });
  }
  const validationError = validateWorkoutPayload(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }
  const { name, date, youtubeUrl = null, notes = null, exercises } = req.body;
  try {
    const workout = db.transaction(() => {
      const id = Number(req.params.id);
      const owned = db.prepare('SELECT id FROM workouts WHERE id = ? AND user_id = ?')
        .get(id, req.user.id);
      if (!owned) throw createHttpError('Workout not found.', 404);

      // Keep inactive exercise names as they were saved in this workout.
      const historical = db.prepare(`
        SELECT exercise_id, exercise_name FROM workout_exercises
        WHERE workout_id = ? AND exercise_id IS NOT NULL ORDER BY position
      `).all(id);
      const allowedInactive = new Set(historical.map((row) => row.exercise_id));
      const historicalNames = new Map();
      for (const row of historical) {
        const key = String(row.exercise_id);
        if (!historicalNames.has(key)) historicalNames.set(key, row.exercise_name);
      }

      db.prepare(`
        UPDATE workouts SET name = ?, workout_date = ?, youtube_url = ?, notes = ?
        WHERE id = ? AND user_id = ?
      `).run(name.trim(), date, youtubeUrl?.trim() || null, notes?.trim() || null, id, req.user.id);
      const row = db.prepare(`SELECT ${workoutColumns} FROM workouts WHERE id = ?`).get(id);
      // Foreign keys ON ensures associated sets are deleted by CASCADE.
      db.prepare('DELETE FROM workout_exercises WHERE workout_id = ?').run(id);
      const createdExercises = createWorkoutExercises(id, exercises, allowedInactive, historicalNames);
      return { ...row, exercises: createdExercises };
    })();
    return res.status(200).json({
      success: true, message: 'Workout updated successfully.', workout,
    });
  } catch (error) {
    return sendServerError(res, error, 'Failed to update workout.');
  }
}

// DELETE /api/workouts/:id
export function deleteWorkout(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid workout ID.' });
  }
  try {
    const workout = db.prepare(`
      DELETE FROM workouts WHERE id = ? AND user_id = ?
      RETURNING id, name, workout_date
    `).get(Number(req.params.id), req.user.id);
    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found.' });
    }
    return res.status(200).json({
      success: true, message: 'Workout deleted successfully.', workout,
    });
  } catch (error) {
    return sendServerError(res, error, 'Failed to delete workout.');
  }
}
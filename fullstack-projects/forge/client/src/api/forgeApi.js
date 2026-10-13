import axios from 'axios';


// ============================================================
// AXIOS INSTANCE
// ============================================================

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL
    || 'http://localhost:5000/api',

  headers: {
    'Content-Type': 'application/json',
  },
});


// ============================================================
// RESPONSE ERROR HANDLER
// ============================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const message =
      error.response?.data?.message
      || error.message
      || 'Something went wrong.';

    return Promise.reject(
      new Error(message),
    );
  },
);


// ============================================================
// WORKOUT MAPPERS
// Backend snake_case -> frontend camelCase
// ============================================================

function mapWorkoutSet(set) {
  return {
    id: set.id,

    weight: Number(
      set.weight_kg
      ?? set.weight
      ?? 0,
    ),

    reps:
      set.reps === null
      || set.reps === undefined
        ? null
        : Number(set.reps),

    durationSeconds:
      set.duration_seconds === null
      || set.duration_seconds === undefined
        ? null
        : Number(
            set.duration_seconds,
          ),
  };
}


function mapWorkoutExercise(
  exercise,
) {
  return {
    id: exercise.id,

    exerciseId:
      exercise.exercise_id
      ?? exercise.exerciseId
      ?? null,

    name:
      exercise.exercise_name
      ?? exercise.name,

    trackingMode:
      exercise.tracking_mode
      ?? exercise.trackingMode
      ?? 'reps',

    position:
      exercise.position
      ?? null,

    sets: Array.isArray(
      exercise.sets,
    )
      ? exercise.sets.map(
          mapWorkoutSet,
        )
      : [],
  };
}


function mapWorkout(workout) {
  return {
    id: workout.id,

    name: workout.name,

    date:
      workout.workout_date
      ?? workout.date,

    youtubeUrl:
      workout.youtube_url
      ?? workout.youtubeUrl
      ?? '',

    notes:
      workout.notes
      ?? '',

    createdAt:
      workout.created_at
      ?? workout.createdAt
      ?? null,

    updatedAt:
      workout.updated_at
      ?? workout.updatedAt
      ?? null,

    exercises:
      Array.isArray(
        workout.exercises,
      )
        ? workout.exercises.map(
            mapWorkoutExercise,
          )
        : [],
  };
}


// ============================================================
// WORKOUT PAYLOAD
// Frontend camelCase -> backend request body
// ============================================================

function toWorkoutPayload(
  workout,
) {
  return {
    name:
      workout.name.trim(),

    date:
      workout.date,

    youtubeUrl:
      workout.youtubeUrl
        ?.trim()
      || '',

    notes:
      workout.notes
        ?.trim()
      || '',

    exercises:
      workout.exercises.map(
        (exercise) => ({
          exerciseId:
            exercise.exerciseId
            ?? null,

          name:
            exercise.name.trim(),

          trackingMode:
            exercise.trackingMode
            || 'reps',

          sets:
            exercise.sets.map(
              (set) => ({
                weight:
                  Number(
                    set.weight
                    ?? 0,
                  ),

                reps:
                  exercise.trackingMode
                  === 'reps'
                    ? Number(
                        set.reps,
                      )
                    : null,

                durationSeconds:
                  exercise.trackingMode
                  === 'time'
                    ? Number(
                        set.durationSeconds,
                      )
                    : null,
              }),
            ),
        }),
      ),
  };
}


// ============================================================
// HEALTH
// ============================================================

export async function getHealth() {
  const response =
    await api.get('/health');

  return response.data;
}



// ============================================================
// EXERCISES — FULL CRUD
// ============================================================

// GET ALL ACTIVE EXERCISES
// GET /api/exercises

export async function getExercises() {
  const response =
    await api.get('/exercises');

  return response.data.exercises;
}


// GET A SINGLE EXERCISE
// GET /api/exercises/:id

export async function getExerciseById(
  id,
) {
  const response =
    await api.get(
      `/exercises/${id}`,
    );

  return response.data.exercise;
}


// CREATE A NEW EXERCISE
// POST /api/exercises

export async function createExercise(
  exercise,
) {
  const response =
    await api.post(
      '/exercises',
      exercise,
    );

  return response.data;
}


// UPDATE AN EXISTING EXERCISE
// PUT /api/exercises/:id

export async function updateExercise(
  id,
  exercise,
) {
  const response =
    await api.put(
      `/exercises/${id}`,
      exercise,
    );

  return response.data;
}


// SOFT DELETE AN EXERCISE
// DELETE /api/exercises/:id

export async function deleteExercise(
  id,
) {
  const response =
    await api.delete(
      `/exercises/${id}`,
    );

  return response.data;
}

// ============================================================
// WORKOUTS
// ============================================================

export async function getWorkouts() {
  const response =
    await api.get('/workouts');

  return response.data.workouts.map(
    mapWorkout,
  );
}


export async function getWorkoutById(
  id,
) {
  const response =
    await api.get(
      `/workouts/${id}`,
    );

  return mapWorkout(
    response.data.workout,
  );
}


export async function createWorkout(
  workout,
) {
  const response =
    await api.post(
      '/workouts',
      toWorkoutPayload(workout),
    );

  return mapWorkout(
    response.data.workout,
  );
}


export async function updateWorkout(
  id,
  workout,
) {
  const response =
    await api.put(
      `/workouts/${id}`,
      toWorkoutPayload(workout),
    );

  return mapWorkout(
    response.data.workout,
  );
}


export async function deleteWorkout(
  id,
) {
  const response =
    await api.delete(
      `/workouts/${id}`,
    );

  return response.data;
}


// ============================================================
// NUTRITION
// ============================================================

export async function getNutritionEntries(
  date = null,
) {
  const response =
    await api.get(
      '/nutrition',
      {
        params:
          date
            ? { date }
            : {},
      },
    );

  return response.data;
}


export async function createNutritionEntry(
  entry,
) {
  const response =
    await api.post(
      '/nutrition',
      entry,
    );

  return response.data;
}


export async function updateNutritionEntry(
  id,
  entry,
) {
  const response =
    await api.put(
      `/nutrition/${id}`,
      entry,
    );

  return response.data;
}


export async function deleteNutritionEntry(
  id,
) {
  const response =
    await api.delete(
      `/nutrition/${id}`,
    );

  return response.data;
}


// ============================================================
// NUTRITION GOALS
// ============================================================

export async function getNutritionGoals() {
  const response =
    await api.get(
      '/nutrition/goals',
    );

  return response.data;
}


export async function saveNutritionGoals(
  goals,
) {
  const response =
    await api.put(
      '/nutrition/goals',
      goals,
    );

  return response.data;
}


// ============================================================
// PROGRESS
// ============================================================

export async function getProgressEntries(
  date = null,
) {
  const response =
    await api.get(
      '/progress',
      {
        params:
          date
            ? { date }
            : {},
      },
    );

  return response.data;
}


export async function createProgressEntry(
  entry,
) {
  const response =
    await api.post(
      '/progress',
      entry,
    );

  return response.data;
}


export async function updateProgressEntry(
  id,
  entry,
) {
  const response =
    await api.put(
      `/progress/${id}`,
      entry,
    );

  return response.data;
}


export async function deleteProgressEntry(
  id,
) {
  const response =
    await api.delete(
      `/progress/${id}`,
    );

  return response.data;
}


// ============================================================
// REST DAYS
// ============================================================

export async function getRestDays(
  date = null,
) {
  const response =
    await api.get(
      '/rest-days',
      {
        params:
          date
            ? { date }
            : {},
      },
    );

  return response.data;
}


export async function createRestDay(
  restDay,
) {
  const response =
    await api.post(
      '/rest-days',
      restDay,
    );

  return response.data;
}


export async function deleteRestDay(
  date,
) {
  const response =
    await api.delete(
      `/rest-days/${date}`,
    );

  return response.data;
}


// ============================================================
// PROFILE
// ============================================================

export async function getProfile() {
  const response =
    await api.get('/profile');

  return response.data;
}


export async function saveProfile(
  profile,
) {
  const response =
    await api.put(
      '/profile',
      profile,
    );

  return response.data;
}


// ============================================================
// DASHBOARD
// ============================================================

export async function getDashboard(
  date = null,
) {
  const response =
    await api.get(
      '/dashboard',
      {
        params:
          date
            ? { date }
            : {},
      },
    );

  return response.data;
}


export default api;
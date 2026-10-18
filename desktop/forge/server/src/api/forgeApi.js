const API_BASE_URL =
  import.meta.env.VITE_API_URL
  || 'http://localhost:5000/api';


// ============================================================
// BASE REQUEST
// ============================================================

async function request(
  endpoint,
  options = {},
) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,

      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    },
  );


  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }


  if (!response.ok) {
    throw new Error(
      data?.message
      || `Request failed with status ${response.status}.`,
    );
  }


  return data;
}


// ============================================================
// WORKOUT MAPPERS
// ============================================================

function mapWorkoutSet(set) {
  return {
    id: set.id,

    weight: Number(
      set.weight_kg ?? set.weight ?? 0,
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
        : Number(set.duration_seconds),
  };
}


function mapWorkoutExercise(exercise) {
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
      exercise.position ?? null,

    sets: Array.isArray(exercise.sets)
      ? exercise.sets.map(mapWorkoutSet)
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
      workout.notes ?? '',

    createdAt:
      workout.created_at
      ?? workout.createdAt
      ?? null,

    updatedAt:
      workout.updated_at
      ?? workout.updatedAt
      ?? null,

    exercises:
      Array.isArray(workout.exercises)
        ? workout.exercises.map(
            mapWorkoutExercise,
          )
        : [],
  };
}


// ============================================================
// WORKOUT REQUEST BODY
//
// Converts the frontend workout shape into the body expected
// by the Express API.
// ============================================================

function toWorkoutPayload(workout) {
  return {
    name: workout.name.trim(),

    date: workout.date,

    youtubeUrl:
      workout.youtubeUrl?.trim() || '',

    notes:
      workout.notes?.trim() || '',

    exercises: workout.exercises.map(
      (exercise) => ({
        exerciseId:
          exercise.exerciseId ?? null,

        name: exercise.name.trim(),

        trackingMode:
          exercise.trackingMode || 'reps',

        sets: exercise.sets.map(
          (set) => ({
            weight: Number(
              set.weight ?? 0,
            ),

            reps:
              exercise.trackingMode === 'reps'
                ? Number(set.reps)
                : null,

            durationSeconds:
              exercise.trackingMode === 'time'
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

export function getHealth() {
  return request('/health');
}


// ============================================================
// EXERCISES
// ============================================================

export async function getExercises() {
  const data = await request('/exercises');

  return data.exercises;
}


export async function getExerciseById(id) {
  const data = await request(
    `/exercises/${id}`,
  );

  return data.exercise;
}


// ============================================================
// WORKOUTS
// ============================================================

export async function getWorkouts() {
  const data = await request('/workouts');

  return data.workouts.map(mapWorkout);
}


export async function getWorkoutById(id) {
  const data = await request(
    `/workouts/${id}`,
  );

  return mapWorkout(data.workout);
}


export async function createWorkout(
  workout,
) {
  const data = await request(
    '/workouts',
    {
      method: 'POST',

      body: JSON.stringify(
        toWorkoutPayload(workout),
      ),
    },
  );

  return mapWorkout(data.workout);
}


export async function updateWorkout(
  id,
  workout,
) {
  const data = await request(
    `/workouts/${id}`,
    {
      method: 'PUT',

      body: JSON.stringify(
        toWorkoutPayload(workout),
      ),
    },
  );

  return mapWorkout(data.workout);
}


export async function deleteWorkout(id) {
  return request(
    `/workouts/${id}`,
    {
      method: 'DELETE',
    },
  );
}


// ============================================================
// NUTRITION
// ============================================================

export function getNutritionEntries(
  date = null,
) {
  const query = date
    ? `?date=${encodeURIComponent(date)}`
    : '';

  return request(
    `/nutrition${query}`,
  );
}


export function createNutritionEntry(
  entry,
) {
  return request(
    '/nutrition',
    {
      method: 'POST',
      body: JSON.stringify(entry),
    },
  );
}


export function updateNutritionEntry(
  id,
  entry,
) {
  return request(
    `/nutrition/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(entry),
    },
  );
}


export function deleteNutritionEntry(id) {
  return request(
    `/nutrition/${id}`,
    {
      method: 'DELETE',
    },
  );
}


// ============================================================
// NUTRITION GOALS
// ============================================================

export function getNutritionGoals() {
  return request('/nutrition/goals');
}


export function saveNutritionGoals(
  goals,
) {
  return request(
    '/nutrition/goals',
    {
      method: 'PUT',
      body: JSON.stringify(goals),
    },
  );
}


// ============================================================
// PROGRESS
// ============================================================

export function getProgressEntries(
  date = null,
) {
  const query = date
    ? `?date=${encodeURIComponent(date)}`
    : '';

  return request(
    `/progress${query}`,
  );
}


export function createProgressEntry(
  entry,
) {
  return request(
    '/progress',
    {
      method: 'POST',
      body: JSON.stringify(entry),
    },
  );
}


export function updateProgressEntry(
  id,
  entry,
) {
  return request(
    `/progress/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(entry),
    },
  );
}


export function deleteProgressEntry(id) {
  return request(
    `/progress/${id}`,
    {
      method: 'DELETE',
    },
  );
}


// ============================================================
// REST DAYS
// ============================================================

export function getRestDays(
  date = null,
) {
  const query = date
    ? `?date=${encodeURIComponent(date)}`
    : '';

  return request(
    `/rest-days${query}`,
  );
}


export function createRestDay(
  restDay,
) {
  return request(
    '/rest-days',
    {
      method: 'POST',
      body: JSON.stringify(restDay),
    },
  );
}


export function deleteRestDay(date) {
  return request(
    `/rest-days/${encodeURIComponent(date)}`,
    {
      method: 'DELETE',
    },
  );
}


// ============================================================
// PROFILE
// ============================================================

export function getProfile() {
  return request('/profile');
}


export function saveProfile(profile) {
  return request(
    '/profile',
    {
      method: 'PUT',
      body: JSON.stringify(profile),
    },
  );
}


// ============================================================
// DASHBOARD
// ============================================================

export function getDashboard(
  date = null,
) {
  const query = date
    ? `?date=${encodeURIComponent(date)}`
    : '';

  return request(
    `/dashboard${query}`,
  );
}
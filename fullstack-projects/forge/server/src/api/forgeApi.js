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
    const message =
      data?.message
      || `Request failed with status ${response.status}.`;

    throw new Error(message);
  }


  return data;
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

export function getExercises() {
  return request('/exercises');
}


export function getExerciseById(id) {
  return request(`/exercises/${id}`);
}


// ============================================================
// WORKOUTS
// ============================================================

export function getWorkouts() {
  return request('/workouts');
}


export function getWorkoutById(id) {
  return request(`/workouts/${id}`);
}


export function createWorkout(workout) {
  return request('/workouts', {
    method: 'POST',
    body: JSON.stringify(workout),
  });
}


export function updateWorkout(
  id,
  workout,
) {
  return request(`/workouts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(workout),
  });
}


export function deleteWorkout(id) {
  return request(`/workouts/${id}`, {
    method: 'DELETE',
  });
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

  return request(`/nutrition${query}`);
}


export function createNutritionEntry(
  entry,
) {
  return request('/nutrition', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}


export function updateNutritionEntry(
  id,
  entry,
) {
  return request(`/nutrition/${id}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  });
}


export function deleteNutritionEntry(id) {
  return request(`/nutrition/${id}`, {
    method: 'DELETE',
  });
}


// ============================================================
// NUTRITION GOALS
// ============================================================

export function getNutritionGoals() {
  return request('/nutrition/goals');
}


export function saveNutritionGoals(goals) {
  return request('/nutrition/goals', {
    method: 'PUT',
    body: JSON.stringify(goals),
  });
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

  return request(`/progress${query}`);
}


export function createProgressEntry(
  entry,
) {
  return request('/progress', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}


export function updateProgressEntry(
  id,
  entry,
) {
  return request(`/progress/${id}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  });
}


export function deleteProgressEntry(id) {
  return request(`/progress/${id}`, {
    method: 'DELETE',
  });
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

  return request(`/rest-days${query}`);
}


export function createRestDay(restDay) {
  return request('/rest-days', {
    method: 'POST',
    body: JSON.stringify(restDay),
  });
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
  return request('/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
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

  return request(`/dashboard${query}`);
}
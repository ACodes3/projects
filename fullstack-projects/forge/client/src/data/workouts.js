/* =========================================
   FORGE — WORKOUT ROUTINES
========================================= */

export const workoutRoutines = [
  /* =========================================
     PUSH A
  ========================================= */

  {
    id: 'push-a',
    name: 'Push A',
    description:
      'Primary chest, shoulder and triceps session focused on pressing strength.',
    category: 'Push',
    estimatedTime: 70,

    exercises: [
      {
        exerciseId: 'bench-press',
        sets: 3,
        repRange: '6–8',
        restSeconds: 180,
      },
      {
        exerciseId: 'incline-dumbbell-press',
        sets: 3,
        repRange: '8–10',
        restSeconds: 150,
      },
      {
        exerciseId: 'dumbbell-shoulder-press',
        sets: 3,
        repRange: '8–10',
        restSeconds: 150,
      },
      {
        exerciseId: 'lateral-raise',
        sets: 3,
        repRange: '12–15',
        restSeconds: 90,
      },
      {
        exerciseId: 'tricep-pushdown',
        sets: 3,
        repRange: '10–12',
        restSeconds: 90,
      },
      {
        exerciseId: 'overhead-tricep-extension',
        sets: 2,
        repRange: '12–15',
        restSeconds: 90,
      },
    ],
  },

  /* =========================================
     PULL A
  ========================================= */

  {
    id: 'pull-a',
    name: 'Pull A',
    description:
      'Back and biceps session built around vertical and horizontal pulling.',
    category: 'Pull',
    estimatedTime: 75,

    exercises: [
      {
        exerciseId: 'pull-up',
        sets: 3,
        repRange: '6–10',
        restSeconds: 180,
      },
      {
        exerciseId: 'barbell-row',
        sets: 3,
        repRange: '6–8',
        restSeconds: 180,
      },
      {
        exerciseId: 'lat-pulldown',
        sets: 3,
        repRange: '8–12',
        restSeconds: 120,
      },
      {
        exerciseId: 'seated-cable-row',
        sets: 3,
        repRange: '8–12',
        restSeconds: 120,
      },
      {
        exerciseId: 'face-pull',
        sets: 3,
        repRange: '12–15',
        restSeconds: 90,
      },
      {
        exerciseId: 'barbell-curl',
        sets: 3,
        repRange: '8–10',
        restSeconds: 90,
      },
      {
        exerciseId: 'hammer-curl',
        sets: 2,
        repRange: '10–12',
        restSeconds: 90,
      },
    ],
  },

  /* =========================================
     LEGS A
  ========================================= */

  {
    id: 'legs-a',
    name: 'Legs A',
    description:
      'Lower-body session focused on quadriceps, hamstrings and glutes.',
    category: 'Legs',
    estimatedTime: 80,

    exercises: [
      {
        exerciseId: 'back-squat',
        sets: 3,
        repRange: '5–8',
        restSeconds: 210,
      },
      {
        exerciseId: 'romanian-deadlift',
        sets: 3,
        repRange: '6–10',
        restSeconds: 180,
      },
      {
        exerciseId: 'leg-press',
        sets: 3,
        repRange: '10–12',
        restSeconds: 150,
      },
      {
        exerciseId: 'leg-curl',
        sets: 3,
        repRange: '10–15',
        restSeconds: 90,
      },
      {
        exerciseId: 'leg-extension',
        sets: 3,
        repRange: '12–15',
        restSeconds: 90,
      },
      {
        exerciseId: 'standing-calf-raise',
        sets: 4,
        repRange: '10–15',
        restSeconds: 90,
      },
    ],
  },

  /* =========================================
     UPPER A
  ========================================= */

  {
    id: 'upper-a',
    name: 'Upper A',
    description:
      'Balanced upper-body session covering chest, back, shoulders and arms.',
    category: 'Upper',
    estimatedTime: 75,

    exercises: [
      {
        exerciseId: 'bench-press',
        sets: 3,
        repRange: '6–8',
        restSeconds: 180,
      },
      {
        exerciseId: 'lat-pulldown',
        sets: 3,
        repRange: '8–10',
        restSeconds: 120,
      },
      {
        exerciseId: 'incline-dumbbell-press',
        sets: 3,
        repRange: '8–10',
        restSeconds: 120,
      },
      {
        exerciseId: 'chest-supported-row',
        sets: 3,
        repRange: '8–12',
        restSeconds: 120,
      },
      {
        exerciseId: 'lateral-raise',
        sets: 3,
        repRange: '12–15',
        restSeconds: 90,
      },
      {
        exerciseId: 'cable-curl',
        sets: 2,
        repRange: '10–12',
        restSeconds: 90,
      },
      {
        exerciseId: 'tricep-pushdown',
        sets: 2,
        repRange: '10–12',
        restSeconds: 90,
      },
    ],
  },

  /* =========================================
     LOWER A
  ========================================= */

  {
    id: 'lower-a',
    name: 'Lower A',
    description:
      'Balanced lower-body workout with a mix of strength and hypertrophy work.',
    category: 'Lower',
    estimatedTime: 70,

    exercises: [
      {
        exerciseId: 'back-squat',
        sets: 3,
        repRange: '5–8',
        restSeconds: 210,
      },
      {
        exerciseId: 'romanian-deadlift',
        sets: 3,
        repRange: '6–10',
        restSeconds: 180,
      },
      {
        exerciseId: 'bulgarian-split-squat',
        sets: 3,
        repRange: '8–10',
        restSeconds: 120,
      },
      {
        exerciseId: 'leg-curl',
        sets: 3,
        repRange: '10–15',
        restSeconds: 90,
      },
      {
        exerciseId: 'seated-calf-raise',
        sets: 4,
        repRange: '12–15',
        restSeconds: 90,
      },
      {
        exerciseId: 'cable-crunch',
        sets: 3,
        repRange: '12–15',
        restSeconds: 75,
      },
    ],
  },

  /* =========================================
     FULL BODY
  ========================================= */

  {
    id: 'full-body',
    name: 'Full Body',
    description:
      'Efficient whole-body session for days when a shorter training split is preferred.',
    category: 'Full Body',
    estimatedTime: 65,

    exercises: [
      {
        exerciseId: 'back-squat',
        sets: 3,
        repRange: '6–8',
        restSeconds: 180,
      },
      {
        exerciseId: 'bench-press',
        sets: 3,
        repRange: '6–8',
        restSeconds: 180,
      },
      {
        exerciseId: 'lat-pulldown',
        sets: 3,
        repRange: '8–10',
        restSeconds: 120,
      },
      {
        exerciseId: 'romanian-deadlift',
        sets: 3,
        repRange: '8–10',
        restSeconds: 150,
      },
      {
        exerciseId: 'lateral-raise',
        sets: 2,
        repRange: '12–15',
        restSeconds: 75,
      },
      {
        exerciseId: 'cable-crunch',
        sets: 3,
        repRange: '12–15',
        restSeconds: 75,
      },
    ],
  },
];

/* =========================================
   ROUTINE CATEGORIES
========================================= */

export const workoutCategories = [
  'All',
  'Push',
  'Pull',
  'Legs',
  'Upper',
  'Lower',
  'Full Body',
];

/* =========================================
   HELPERS
========================================= */

export function getWorkoutRoutineById(id) {
  return workoutRoutines.find(
    (routine) => routine.id === id,
  );
}

export function getWorkoutExerciseCount(routine) {
  return routine.exercises.length;
}

export function getWorkoutSetCount(routine) {
  return routine.exercises.reduce(
    (total, exercise) =>
      total + exercise.sets,
    0,
  );
}
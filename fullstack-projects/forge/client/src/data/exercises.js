export const exercises = [
  /* =========================================
     CHEST
  ========================================= */

  {
    id: 'bench-press',
    name: 'Bench Press',
    muscle: 'Chest',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    equipment: 'Barbell',
    type: 'Compound',
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    muscle: 'Chest',
    secondaryMuscles: ['Front Delts', 'Triceps'],
    equipment: 'Barbell',
    type: 'Compound',
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    muscle: 'Chest',
    secondaryMuscles: ['Front Delts', 'Triceps'],
    equipment: 'Dumbbells',
    type: 'Compound',
  },
  {
    id: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    muscle: 'Chest',
    secondaryMuscles: ['Triceps'],
    equipment: 'Dumbbells',
    type: 'Compound',
  },
  {
    id: 'cable-fly',
    name: 'Cable Fly',
    muscle: 'Chest',
    secondaryMuscles: [],
    equipment: 'Cable',
    type: 'Isolation',
  },
  {
    id: 'chest-dip',
    name: 'Chest Dip',
    muscle: 'Chest',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    equipment: 'Bodyweight',
    type: 'Compound',
  },

  /* =========================================
     BACK
  ========================================= */

  {
    id: 'pull-up',
    name: 'Pull-Up',
    muscle: 'Back',
    secondaryMuscles: ['Biceps'],
    equipment: 'Bodyweight',
    type: 'Compound',
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    muscle: 'Back',
    secondaryMuscles: ['Biceps'],
    equipment: 'Cable',
    type: 'Compound',
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    muscle: 'Back',
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: 'Barbell',
    type: 'Compound',
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    muscle: 'Back',
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: 'Cable',
    type: 'Compound',
  },
  {
    id: 'chest-supported-row',
    name: 'Chest Supported Row',
    muscle: 'Back',
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: 'Machine',
    type: 'Compound',
  },
  {
    id: 'straight-arm-pulldown',
    name: 'Straight Arm Pulldown',
    muscle: 'Back',
    secondaryMuscles: [],
    equipment: 'Cable',
    type: 'Isolation',
  },

  /* =========================================
     SHOULDERS
  ========================================= */

  {
    id: 'overhead-press',
    name: 'Overhead Press',
    muscle: 'Shoulders',
    secondaryMuscles: ['Triceps'],
    equipment: 'Barbell',
    type: 'Compound',
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    muscle: 'Shoulders',
    secondaryMuscles: ['Triceps'],
    equipment: 'Dumbbells',
    type: 'Compound',
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    muscle: 'Shoulders',
    secondaryMuscles: [],
    equipment: 'Dumbbells',
    type: 'Isolation',
  },
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    muscle: 'Shoulders',
    secondaryMuscles: [],
    equipment: 'Cable',
    type: 'Isolation',
  },
  {
    id: 'reverse-pec-deck',
    name: 'Reverse Pec Deck',
    muscle: 'Shoulders',
    secondaryMuscles: ['Upper Back'],
    equipment: 'Machine',
    type: 'Isolation',
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    muscle: 'Shoulders',
    secondaryMuscles: ['Upper Back'],
    equipment: 'Cable',
    type: 'Isolation',
  },

  /* =========================================
     BICEPS
  ========================================= */

  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    muscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Barbell',
    type: 'Isolation',
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Curl',
    muscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Dumbbells',
    type: 'Isolation',
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    muscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Dumbbells',
    type: 'Isolation',
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    muscle: 'Biceps',
    secondaryMuscles: [],
    equipment: 'Machine',
    type: 'Isolation',
  },
  {
    id: 'cable-curl',
    name: 'Cable Curl',
    muscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Cable',
    type: 'Isolation',
  },

  /* =========================================
     TRICEPS
  ========================================= */

  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    muscle: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Cable',
    type: 'Isolation',
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Overhead Tricep Extension',
    muscle: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Cable',
    type: 'Isolation',
  },
  {
    id: 'skull-crusher',
    name: 'Skull Crusher',
    muscle: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Barbell',
    type: 'Isolation',
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close Grip Bench Press',
    muscle: 'Triceps',
    secondaryMuscles: ['Chest'],
    equipment: 'Barbell',
    type: 'Compound',
  },

  /* =========================================
     QUADRICEPS
  ========================================= */

  {
    id: 'back-squat',
    name: 'Back Squat',
    muscle: 'Quadriceps',
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    equipment: 'Barbell',
    type: 'Compound',
  },
  {
    id: 'front-squat',
    name: 'Front Squat',
    muscle: 'Quadriceps',
    secondaryMuscles: ['Glutes'],
    equipment: 'Barbell',
    type: 'Compound',
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    muscle: 'Quadriceps',
    secondaryMuscles: ['Glutes'],
    equipment: 'Machine',
    type: 'Compound',
  },
  {
    id: 'hack-squat',
    name: 'Hack Squat',
    muscle: 'Quadriceps',
    secondaryMuscles: ['Glutes'],
    equipment: 'Machine',
    type: 'Compound',
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    muscle: 'Quadriceps',
    secondaryMuscles: [],
    equipment: 'Machine',
    type: 'Isolation',
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    muscle: 'Quadriceps',
    secondaryMuscles: ['Glutes'],
    equipment: 'Dumbbells',
    type: 'Compound',
  },

  /* =========================================
     HAMSTRINGS / GLUTES
  ========================================= */

  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    muscle: 'Hamstrings',
    secondaryMuscles: ['Glutes', 'Back'],
    equipment: 'Barbell',
    type: 'Compound',
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl',
    muscle: 'Hamstrings',
    secondaryMuscles: [],
    equipment: 'Machine',
    type: 'Isolation',
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    muscle: 'Glutes',
    secondaryMuscles: ['Hamstrings'],
    equipment: 'Barbell',
    type: 'Compound',
  },
  {
    id: 'walking-lunge',
    name: 'Walking Lunge',
    muscle: 'Glutes',
    secondaryMuscles: ['Quadriceps', 'Hamstrings'],
    equipment: 'Dumbbells',
    type: 'Compound',
  },

  /* =========================================
     CALVES
  ========================================= */

  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    muscle: 'Calves',
    secondaryMuscles: [],
    equipment: 'Machine',
    type: 'Isolation',
  },
  {
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise',
    muscle: 'Calves',
    secondaryMuscles: [],
    equipment: 'Machine',
    type: 'Isolation',
  },

  /* =========================================
     CORE
  ========================================= */

  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    muscle: 'Core',
    secondaryMuscles: [],
    equipment: 'Cable',
    type: 'Isolation',
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    muscle: 'Core',
    secondaryMuscles: [],
    equipment: 'Bodyweight',
    type: 'Isolation',
  },
  {
    id: 'plank',
    name: 'Plank',
    muscle: 'Core',
    secondaryMuscles: [],
    equipment: 'Bodyweight',
    type: 'Isometric',
  },
];

/* =========================================
   FILTER OPTIONS
========================================= */

export const muscleGroups = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
];

export const equipmentTypes = [
  'All',
  'Barbell',
  'Dumbbells',
  'Cable',
  'Machine',
  'Bodyweight',
];

export const exerciseTypes = [
  'All',
  'Compound',
  'Isolation',
  'Isometric',
];

/* =========================================
   HELPER
========================================= */

export function getExerciseById(id) {
  return exercises.find(
    (exercise) => exercise.id === id,
  );
}
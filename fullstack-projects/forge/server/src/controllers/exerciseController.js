
import pool from '../config/db.js';

// ============================================================
// CONSTANTS
// These values match the PostgreSQL CHECK constraints.
// ============================================================

const EQUIPMENT_TYPES = [
  'Bodyweight',
  'Dumbbells',
  'Resistance Band',
  'Mini Band',
];

const EXERCISE_TYPES = [
  'Compound',
  'Isolation',
  'Core',
  'Carry',
];

const EXERCISE_COLUMNS = `
  id,
  name,
  primary_muscle,
  secondary_muscles,
  equipment,
  exercise_type,
  movement_pattern,
  is_active,
  created_at,
  updated_at
`;

// ============================================================
// HELPERS
// ============================================================

function isValidId(id) {
  return (
    typeof id === 'string' &&
    /^[1-9]\d*$/.test(id)
  );
}

function validateExercise(body) {
  const name =
    typeof body?.name === 'string'
      ? body.name.trim()
      : '';

  const muscleValue =
    body?.muscle ??
    body?.primary_muscle;

  const muscle =
    typeof muscleValue === 'string'
      ? muscleValue.trim()
      : '';

  const equipment =
    typeof body?.equipment === 'string'
      ? body.equipment.trim()
      : '';

  const typeValue =
    body?.type ??
    body?.exercise_type;

  const type =
    typeof typeValue === 'string'
      ? typeValue.trim()
      : '';

  const rawSecondary =
    body?.secondaryMuscles ??
    body?.secondary_muscles ??
    [];

  if (!name) {
    return {
      error: 'Exercise name is required.',
    };
  }

  if (name.length > 150) {
    return {
      error:
        'Exercise name cannot exceed 150 characters.',
    };
  }

  if (!muscle) {
    return {
      error: 'Primary muscle is required.',
    };
  }

  if (muscle.length > 100) {
    return {
      error:
        'Primary muscle cannot exceed 100 characters.',
    };
  }

  if (!EQUIPMENT_TYPES.includes(equipment)) {
    return {
      error:
        'Select a valid equipment type.',
    };
  }

  if (!EXERCISE_TYPES.includes(type)) {
    return {
      error:
        'Select a valid exercise type.',
    };
  }

  if (!Array.isArray(rawSecondary)) {
    return {
      error:
        'Secondary muscles must be an array.',
    };
  }

  if (
    rawSecondary.some(
      (item) =>
        typeof item !== 'string' ||
        item.trim().length === 0 ||
        item.trim().length > 100
    )
  ) {
    return {
      error:
        'Secondary muscles must contain valid muscle names.',
    };
  }

  const secondaryMuscles = [
    ...new Set(
      rawSecondary
        .map((item) => item.trim())
        .filter((item) => item !== muscle)
    ),
  ];

  return {
    error: null,
    values: {
      name,
      muscle,
      equipment,
      type,
      secondaryMuscles,
    },
  };
}

function handleDatabaseError(error, res, action) {
  // PostgreSQL unique constraint violation.
  if (error.code === '23505') {
    return res.status(409).json({
      success: false,
      message:
        'An exercise with this name already exists.',
    });
  }

  // PostgreSQL CHECK constraint violation.
  if (error.code === '23514') {
    return res.status(400).json({
      success: false,
      message:
        'One or more exercise values are not allowed.',
    });
  }

  // PostgreSQL foreign key constraint violation.
  if (error.code === '23503') {
    return res.status(409).json({
      success: false,
      message:
        'This exercise is referenced by other records.',
    });
  }

  console.error(
    `Failed to ${action} exercise:`,
    error
  );

  return res.status(500).json({
    success: false,
    message: `Failed to ${action} exercise.`,
  });
}

// ============================================================
// GET ALL EXERCISES
// GET /api/exercises
// ============================================================

export async function getExercises(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        ${EXERCISE_COLUMNS}
      FROM public.exercises
      WHERE is_active = TRUE
      ORDER BY name ASC
    `);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      exercises: result.rows,
    });
  } catch (error) {
    console.error(
      'Failed to fetch exercises:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to fetch exercises.',
    });
  }
}

// ============================================================
// GET ONE EXERCISE
// GET /api/exercises/:id
// ============================================================

export async function getExerciseById(req, res) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exercise ID.',
      });
    }

    const result = await pool.query(
      `
        SELECT
          ${EXERCISE_COLUMNS}
        FROM public.exercises
        WHERE id = $1
          AND is_active = TRUE
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found.',
      });
    }

    return res.status(200).json({
      success: true,
      exercise: result.rows[0],
    });
  } catch (error) {
    console.error(
      'Failed to fetch exercise:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to fetch exercise.',
    });
  }
}

// ============================================================
// CREATE EXERCISE
// POST /api/exercises
// ============================================================

export async function createExercise(req, res) {
  const validation = validateExercise(req.body);

  if (validation.error) {
    return res.status(400).json({
      success: false,
      message: validation.error,
    });
  }

  const {
    name,
    muscle,
    secondaryMuscles,
    equipment,
    type,
  } = validation.values;

  try {
    const result = await pool.query(
      `
        INSERT INTO public.exercises (
          name,
          primary_muscle,
          secondary_muscles,
          equipment,
          exercise_type
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        RETURNING
          ${EXERCISE_COLUMNS}
      `,
      [
        name,
        muscle,
        secondaryMuscles,
        equipment,
        type,
      ]
    );

    return res.status(201).json({
      success: true,
      message:
        'Exercise created successfully.',
      exercise: result.rows[0],
    });
  } catch (error) {
    return handleDatabaseError(
      error,
      res,
      'create'
    );
  }
}

// ============================================================
// UPDATE EXERCISE
// PUT /api/exercises/:id
// ============================================================

export async function updateExercise(req, res) {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid exercise ID.',
    });
  }

  const validation = validateExercise(req.body);

  if (validation.error) {
    return res.status(400).json({
      success: false,
      message: validation.error,
    });
  }

  const {
    name,
    muscle,
    secondaryMuscles,
    equipment,
    type,
  } = validation.values;

  try {
    const result = await pool.query(
      `
        UPDATE public.exercises
        SET
          name = $2,
          primary_muscle = $3,
          secondary_muscles = $4,
          equipment = $5,
          exercise_type = $6,
          updated_at = NOW()
        WHERE id = $1
          AND is_active = TRUE
        RETURNING
          ${EXERCISE_COLUMNS}
      `,
      [
        id,
        name,
        muscle,
        secondaryMuscles,
        equipment,
        type,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Exercise updated successfully.',
      exercise: result.rows[0],
    });
  } catch (error) {
    return handleDatabaseError(
      error,
      res,
      'update'
    );
  }
}

// ============================================================
// DELETE EXERCISE (SOFT DELETE)
// DELETE /api/exercises/:id
//
// Soft deletion keeps historical references safe.
// The exercise no longer appears in GET /exercises.
// ============================================================

export async function deleteExercise(req, res) {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid exercise ID.',
    });
  }

  try {
    const result = await pool.query(
      `
        UPDATE public.exercises
        SET
          is_active = FALSE,
          updated_at = NOW()
        WHERE id = $1
          AND is_active = TRUE
        RETURNING
          ${EXERCISE_COLUMNS}
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          'Exercise not found or already deleted.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Exercise deleted successfully.',
      exercise: result.rows[0],
    });
  } catch (error) {
    return handleDatabaseError(
      error,
      res,
      'delete'
    );
  }
}

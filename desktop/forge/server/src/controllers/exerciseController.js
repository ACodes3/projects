import db from '../config/sqlite.js';

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
  id, name, primary_muscle, secondary_muscles,
  equipment, exercise_type, movement_pattern,
  is_active, created_at, updated_at
`;

function parseId(id) {
  if (typeof id !== 'string' || !/^[1-9]\d*$/.test(id)) return null;
  const number = Number(id);
  return Number.isSafeInteger(number) ? number : null;
}

function formatExercise(row) {
  if (!row) return null;
  return {
    ...row,
    secondary_muscles: JSON.parse(row.secondary_muscles),
    is_active: Boolean(row.is_active),
  };
}

function validateExercise(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const muscleValue = body?.muscle ?? body?.primary_muscle;
  const muscle = typeof muscleValue === 'string' ? muscleValue.trim() : '';
  const equipment = typeof body?.equipment === 'string' ? body.equipment.trim() : '';
  const typeValue = body?.type ?? body?.exercise_type;
  const type = typeof typeValue === 'string' ? typeValue.trim() : '';
  const rawSecondary = body?.secondaryMuscles ?? body?.secondary_muscles ?? [];

  if (!name) return { error: 'Exercise name is required.' };
  if (name.length > 150) return { error: 'Exercise name cannot exceed 150 characters.' };
  if (!muscle) return { error: 'Primary muscle is required.' };
  if (muscle.length > 100) return { error: 'Primary muscle cannot exceed 100 characters.' };
  if (!EQUIPMENT_TYPES.includes(equipment)) return { error: 'Select a valid equipment type.' };
  if (!EXERCISE_TYPES.includes(type)) return { error: 'Select a valid exercise type.' };
  if (!Array.isArray(rawSecondary)) return { error: 'Secondary muscles must be an array.' };
  if (rawSecondary.some(item => typeof item !== 'string' || !item.trim() || item.trim().length > 100)) {
    return { error: 'Secondary muscles must contain valid muscle names.' };
  }

  const secondaryMuscles = [...new Set(rawSecondary.map(item => item.trim()).filter(item => item !== muscle))];
  return { error: null, values: { name, muscle, equipment, type, secondaryMuscles } };
}

function handleDatabaseError(error, res, action) {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      success: false,
      message: 'An exercise with this name already exists.',
    });
  }
  if (error.code === 'SQLITE_CONSTRAINT_CHECK' || error.code === 'SQLITE_CONSTRAINT_NOTNULL') {
    return res.status(400).json({
      success: false,
      message: 'One or more exercise values are not allowed.',
    });
  }
  if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(409).json({
      success: false,
      message: 'This exercise is referenced by other records.',
    });
  }
  console.error(`Failed to ${action} exercise:`, error);
  return res.status(500).json({ success: false, message: `Failed to ${action} exercise.` });
}

// GET /api/exercises
export function getExercises(req, res) {
  try {
    const rows = db.prepare(`
      SELECT ${EXERCISE_COLUMNS}
      FROM exercises
      WHERE is_active = 1
      ORDER BY name ASC
    `).all();

    return res.status(200).json({
      success: true,
      count: rows.length,
      exercises: rows.map(formatExercise),
    });
  } catch (error) {
    console.error('Failed to fetch exercises:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch exercises.' });
  }
}

// GET /api/exercises/:id
export function getExerciseById(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ success: false, message: 'Invalid exercise ID.' });

  try {
    const row = db.prepare(`
      SELECT ${EXERCISE_COLUMNS}
      FROM exercises
      WHERE id = ? AND is_active = 1
    `).get(id);

    if (!row) return res.status(404).json({ success: false, message: 'Exercise not found.' });
    return res.status(200).json({ success: true, exercise: formatExercise(row) });
  } catch (error) {
    console.error('Failed to fetch exercise:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch exercise.' });
  }
}

// POST /api/exercises
export function createExercise(req, res) {
  const validation = validateExercise(req.body);
  if (validation.error) return res.status(400).json({ success: false, message: validation.error });
  const { name, muscle, secondaryMuscles, equipment, type } = validation.values;

  try {
    const row = db.prepare(`
      INSERT INTO exercises (name, primary_muscle, secondary_muscles, equipment, exercise_type)
      VALUES (?, ?, ?, ?, ?)
      RETURNING ${EXERCISE_COLUMNS}
    `).get(name, muscle, JSON.stringify(secondaryMuscles), equipment, type);

    return res.status(201).json({
      success: true,
      message: 'Exercise created successfully.',
      exercise: formatExercise(row),
    });
  } catch (error) {
    return handleDatabaseError(error, res, 'create');
  }
}

// PUT /api/exercises/:id
export function updateExercise(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ success: false, message: 'Invalid exercise ID.' });
  const validation = validateExercise(req.body);
  if (validation.error) return res.status(400).json({ success: false, message: validation.error });
  const { name, muscle, secondaryMuscles, equipment, type } = validation.values;

  try {
    const row = db.prepare(`
      UPDATE exercises
      SET name = ?, primary_muscle = ?, secondary_muscles = ?,
          equipment = ?, exercise_type = ?,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ? AND is_active = 1
      RETURNING ${EXERCISE_COLUMNS}
    `).get(name, muscle, JSON.stringify(secondaryMuscles), equipment, type, id);

    if (!row) return res.status(404).json({ success: false, message: 'Exercise not found.' });
    return res.status(200).json({
      success: true,
      message: 'Exercise updated successfully.',
      exercise: formatExercise(row),
    });
  } catch (error) {
    return handleDatabaseError(error, res, 'update');
  }
}

// DELETE /api/exercises/:id (soft delete)
export function deleteExercise(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ success: false, message: 'Invalid exercise ID.' });

  try {
    const row = db.prepare(`
      UPDATE exercises
      SET is_active = 0,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ? AND is_active = 1
      RETURNING ${EXERCISE_COLUMNS}
    `).get(id);

    if (!row) return res.status(404).json({
      success: false,
      message: 'Exercise not found or already deleted.',
    });
    return res.status(200).json({
      success: true,
      message: 'Exercise deleted successfully.',
      exercise: formatExercise(row),
    });
  } catch (error) {
    return handleDatabaseError(error, res, 'delete');
  }
}
import pool from '../config/db.js';


// ============================================================
// GET ALL EXERCISES
// GET /api/exercises
// ============================================================

export async function getExercises(req, res) {
  try {
    const result = await pool.query(`
      SELECT
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
      FROM public.exercises
      WHERE is_active = TRUE
      ORDER BY name ASC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      exercises: result.rows,
    });
  } catch (error) {
    console.error('Failed to fetch exercises:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch exercises.',
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

    const result = await pool.query(
      `
        SELECT
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
        FROM public.exercises
        WHERE id = $1
          AND is_active = TRUE
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found.',
      });
    }

    res.status(200).json({
      success: true,
      exercise: result.rows[0],
    });
  } catch (error) {
    console.error('Failed to fetch exercise:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch exercise.',
    });
  }
}
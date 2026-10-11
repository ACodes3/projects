import pool from '../config/db.js';


// ============================================================
// DEVELOPMENT USER MIDDLEWARE
//
// Temporary replacement for authentication.
//
// Later, real authentication will set:
//
// req.user = {
//   id,
//   email,
// }
//
// For now we load the seeded demo user.
// ============================================================

export async function devUser(req, res, next) {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          email
        FROM public.users
        WHERE email = $1
        LIMIT 1
      `,
      ['demo@forge.local'],
    );

    if (result.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message:
          'Development user not found. Run the FORGE seed data first.',
      });
    }

    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
    };

    next();
  } catch (error) {
    console.error('Failed to load development user:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to load development user.',
    });
  }
}
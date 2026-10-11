import pool from '../config/db.js';


// ============================================================
// SINGLE-USER CONTEXT
//
// This version of FORGE intentionally has no authentication.
//
// The application uses one seeded database user as the owner
// of all user-specific data.
//
// Every protected route receives:
//
// req.user = {
//   id,
//   email,
// }
//
// This keeps the controllers structured in a way that could
// support authentication in a larger future version without
// changing all database queries.
// ============================================================

export async function devUser(
  req,
  res,
  next,
) {
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
          'FORGE user not found. Run the database seed first.',
      });
    }


    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
    };


    next();
  } catch (error) {
    console.error(
      'Failed to load FORGE user:',
      error,
    );


    res.status(500).json({
      success: false,
      message:
        'Failed to load FORGE user.',
    });
  }
}
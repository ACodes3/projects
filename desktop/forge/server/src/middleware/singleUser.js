import pool from '../config/db.js';


// ============================================================
// SINGLE-USER CONTEXT
//
// This FORGE version intentionally has no authentication.
//
// Every user-owned route loads the single seeded FORGE user
// and exposes:
//
// req.user = {
//   id,
//   email,
// }
//
// A later, larger version of FORGE can replace this middleware
// with real authentication without changing the controllers.
// ============================================================

export async function singleUser(
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
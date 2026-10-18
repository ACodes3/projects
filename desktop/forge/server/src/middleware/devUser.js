
import db from '../config/sqlite.js';

// ============================================================
// DEVELOPMENT USER — SQLITE
// ============================================================

export function devUser(req, res, next) {
  try {
    const user = db
      .prepare(`
        SELECT id, email
        FROM users
        WHERE email = ?
        LIMIT 1
      `)
      .get('demo@forge.local');

    if (!user) {
      return res.status(500).json({
        success: false,
        message:
          'FORGE user not found. Run the database seed first.',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error('Failed to load FORGE user:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load FORGE user.',
    });
  }
}

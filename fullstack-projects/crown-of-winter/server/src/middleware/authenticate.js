
import { pool } from "../db/pool.js";
import { hashSessionToken } from "../services/authService.js";

// -----------------------------------------
// Authentication middleware
// -----------------------------------------

export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.crown_session;

    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/.test(token)
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const tokenHash = hashSessionToken(token);

    const result = await pool.query(
      `
      SELECT
        s.id AS session_id,
        u.id,
        u.username,
        u.email,
        u.account_status,
        u.created_at
      FROM user_sessions s
      JOIN users u
        ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
        AND u.account_status = 'active'
      LIMIT 1
      `,
      [tokenHash]
    );

    const session = result.rows[0];

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session.",
      });
    }

    req.user = {
      id: session.id,
      username: session.username,
      email: session.email,
      account_status: session.account_status,
      created_at: session.created_at,
    };

    req.sessionId = session.session_id;

    next();
  } catch (error) {
    next(error);
  }
}

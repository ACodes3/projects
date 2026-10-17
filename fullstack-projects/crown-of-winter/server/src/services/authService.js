
import argon2 from "argon2";
import { randomBytes, createHash } from "node:crypto";
import { pool } from "../db/pool.js";

const SESSION_DURATION_DAYS = 7;

// -----------------------------------------
// Hash a session token
// -----------------------------------------

export function hashSessionToken(token) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

// -----------------------------------------
// Register a new user
// -----------------------------------------

export async function registerUser({
  username,
  email,
  password,
}) {
  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    throw new Error("Invalid registration data.");
  }

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (
    cleanUsername.length < 3 ||
    cleanUsername.length > 50
  ) {
    throw new Error(
      "Username must be between 3 and 50 characters."
    );
  }

  if (
    cleanEmail.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
  ) {
    throw new Error("Please enter a valid email address.");
  }

  if (password.length < 12 || password.length > 128) {
    throw new Error(
      "Password must be between 12 and 128 characters."
    );
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  const result = await pool.query(
    `
    INSERT INTO users (
      username,
      email,
      password_hash
    )
    VALUES ($1, $2, $3)
    RETURNING
      id,
      username,
      email,
      account_status,
      created_at
    `,
    [cleanUsername, cleanEmail, passwordHash]
  );

  return result.rows[0];
}

// -----------------------------------------
// Log in a user
// -----------------------------------------

export async function loginUser({
  identifier,
  password,
}) {
  if (
    typeof identifier !== "string" ||
    typeof password !== "string" ||
    !identifier.trim() ||
    !password
  ) {
    throw new Error("Invalid login credentials.");
  }

  const result = await pool.query(
    `
    SELECT
      id,
      username,
      email,
      password_hash,
      account_status
    FROM users
    WHERE LOWER(username) = LOWER($1)
       OR LOWER(email) = LOWER($1)
    LIMIT 1
    `,
    [identifier.trim()]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("Invalid login credentials.");
  }

  const validPassword = await argon2.verify(
    user.password_hash,
    password
  );

  if (!validPassword) {
    throw new Error("Invalid login credentials.");
  }

  if (user.account_status !== "active") {
    throw new Error("Account is not active.");
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);

  await pool.query(
    `
    INSERT INTO user_sessions (
      user_id,
      token_hash,
      expires_at
    )
    VALUES (
      $1,
      $2,
      NOW() + ($3 * INTERVAL '1 day')
    )
    `,
    [user.id, tokenHash, SESSION_DURATION_DAYS]
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      account_status: user.account_status,
    },
  };
}

// -----------------------------------------
// Revoke the current session
// -----------------------------------------

export async function logoutUser(sessionId) {
  await pool.query(
    `
    UPDATE user_sessions
    SET revoked_at = NOW()
    WHERE id = $1
      AND revoked_at IS NULL
    `,
    [sessionId]
  );
}


import argon2 from "argon2";
import { pool } from "../db/pool.js";

export async function registerUser({
  username,
  email,
  password,
}) {
  // Validate input types and lengths
  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    throw new Error("Invalid registration data.");
  }

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (cleanUsername.length < 3 || cleanUsername.length > 50) {
    throw new Error("Username must be between 3 and 50 characters.");
  }

  if (
    cleanEmail.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
  ) {
    throw new Error("Please enter a valid email address.");
  }

  if (password.length < 12 || password.length > 128) {
    throw new Error("Password must be between 12 and 128 characters.");
  }

  // Securely hash the password
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  // Insert the new account
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

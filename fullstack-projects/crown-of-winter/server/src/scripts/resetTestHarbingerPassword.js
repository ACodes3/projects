import "dotenv/config";
import argon2 from "argon2";
import { createInterface } from "node:readline/promises";
import process, { stdin as input, stdout as output } from "node:process";
import { pool } from "../db/pool.js";

const USERNAME = "TestHarbinger";

const rl = createInterface({ input, output });

try {
  const password = await rl.question("New password for TestHarbinger: ");

  const confirmation = await rl.question("Confirm new password: ");

  if (password.length < 12 || password.length > 128) {
    throw new Error("Password must be between 12 and 128 characters.");
  }

  if (password !== confirmation) {
    throw new Error("Passwords do not match. Nothing was changed.");
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE users
      SET password_hash = $1
      WHERE LOWER(username) = LOWER($2)
      RETURNING id, username
      `,
      [passwordHash, USERNAME],
    );

    if (result.rowCount !== 1) {
      throw new Error("TestHarbinger account not found. Nothing was changed.");
    }

    await client.query(
      `
      UPDATE user_sessions
      SET revoked_at = NOW()
      WHERE user_id = $1
        AND revoked_at IS NULL
      `,
      [result.rows[0].id],
    );

    await client.query("COMMIT");

    console.log(
      "Password reset successful for TestHarbinger. Previous sessions revoked.",
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
} catch (error) {
  console.error("Password reset failed:", error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}

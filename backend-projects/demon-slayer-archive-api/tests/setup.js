
import { beforeAll } from "vitest";

import pool from "../src/config/db.js";

// ==========================================
// TEST DATABASE SAFETY CHECK
// ==========================================

beforeAll(async () => {
  // Check the environment first.
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "Tests must run with NODE_ENV=test"
    );
  }

  // Verify the actual PostgreSQL database.
  const result = await pool.query(
    "SELECT current_database() AS database"
  );

  const database = result.rows[0].database;

  if (database !== "demon_slayer_archive_test") {
    throw new Error(
      `Unsafe test database connection: ${database}`
    );
  }
});


import { describe, it, expect, afterAll } from "vitest";

import pool from "../src/config/db.js";

// ==========================================
// DATABASE CONNECTION TESTS
// ==========================================

describe("Test Database Safety", () => {
  it("should connect to the test database only", async () => {
    const result = await pool.query(
      "SELECT current_database() AS database"
    );

    const database = result.rows[0].database;

    expect(database).toBe("demon_slayer_archive_test");
  });

  it("should contain all five required tables", async () => {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `);

    const tables = result.rows.map((row) => row.table_name);

    expect(tables).toEqual(
      expect.arrayContaining([
        "slayers",
        "demons",
        "breathing_styles",
        "blood_demon_arts",
        "techniques",
      ])
    );
  });

  it("should contain exactly five archive tables", async () => {
    const result = await pool.query(`
      SELECT COUNT(*)::integer AS total
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `);

    expect(result.rows[0].total).toBe(5);
  });
});

// ==========================================
// CLEANUP
// ==========================================

afterAll(async () => {
  await pool.end();
});

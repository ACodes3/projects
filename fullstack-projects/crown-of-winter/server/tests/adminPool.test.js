
import {
  describe,
  it,
  expect,
  afterAll,
} from "vitest";

import { pool } from "../src/db/pool.js";

import {
  getAdminPool,
  verifyAdminDatabase,
  closeAdminPool,
} from "./helpers/adminPool.js";

const TEST_DATABASE = "crown-of-winter-test";

// -----------------------------------------
// Administrative connection tests
// -----------------------------------------

describe("Test Database Administration", () => {
  afterAll(async () => {
    await closeAdminPool();
  });

  it("connects to the correct test database", async () => {
    const result = await verifyAdminDatabase();

    expect(result.database).toBe(TEST_DATABASE);
  });

  it("uses the configured administrator account", async () => {
    const result = await verifyAdminDatabase();

    expect(result.database_user).toBe(
      process.env.TEST_ADMIN_DB_USER
    );
  });

  it("keeps application and admin pools separate", async () => {
    const applicationResult = await pool.query(
      `
      SELECT
        current_database() AS database,
        current_user AS database_user
      `
    );

    const adminResult = await getAdminPool().query(
      `
      SELECT
        current_database() AS database,
        current_user AS database_user
      `
    );

    expect(applicationResult.rows[0].database)
      .toBe(TEST_DATABASE);

    expect(adminResult.rows[0].database)
      .toBe(TEST_DATABASE);

    expect(getAdminPool()).not.toBe(pool);

    // Both pools may currently use postgres.
    // The important distinction at this stage
    // is that they are separate pool objects.
  });

  it("refuses administrative access outside test mode", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    try {
      process.env.NODE_ENV = "production";

      expect(() => getAdminPool()).toThrow(
        "Administrative test connection is only allowed in the test environment."
      );
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});

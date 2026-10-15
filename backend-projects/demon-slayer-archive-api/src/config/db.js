
import pg from "pg";
import env from "./env.js";

const { Pool } = pg;

// ==========================================
// DATABASE CONFIGURATION
// ==========================================

const isTestEnvironment = env.NODE_ENV === "test";

const database = isTestEnvironment
  ? env.TEST_DB_NAME
  : env.DB_NAME;

// ==========================================
// TEST DATABASE SAFETY
// ==========================================

if (isTestEnvironment) {
  if (!database) {
    throw new Error(
      "TEST_DB_NAME must be configured before running tests"
    );
  }

  if (database === env.DB_NAME) {
    throw new Error(
      "The test database must be different from DB_NAME"
    );
  }

  if (!database.endsWith("_test")) {
    throw new Error(
      "Test database name must end with _test"
    );
  }
}

// ==========================================
// POSTGRESQL CONNECTION POOL
// ==========================================

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

export default pool;

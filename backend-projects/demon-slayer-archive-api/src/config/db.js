
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

// ==========================================
// DATABASE CONFIGURATION
// ==========================================

const isTestEnvironment = process.env.NODE_ENV === "test";

// Use a separate database for automated tests.
const database = isTestEnvironment
  ? process.env.TEST_DB_NAME
  : process.env.DB_NAME;

// Never allow tests to run against the regular database.
if (isTestEnvironment) {
  if (!database) {
    throw new Error(
      "TEST_DB_NAME must be configured before running tests"
    );
  }

  if (database === process.env.DB_NAME) {
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

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export default pool;

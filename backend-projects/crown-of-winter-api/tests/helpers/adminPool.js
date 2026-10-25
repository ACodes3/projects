
import pg from "pg";

const { Pool } = pg;

const TEST_DATABASE = "crown-of-winter-test";

// -----------------------------------------
// Verify the test environment
// -----------------------------------------

function verifyTestEnvironment() {
  if (
    process.env.NODE_ENV !== "test" ||
    process.env.DB_NAME !== TEST_DATABASE
  ) {
    throw new Error(
      "Administrative test connection is only allowed in the test environment."
    );
  }
}

// -----------------------------------------
// Create the administrative test pool
// -----------------------------------------

let adminPool = null;

export function getAdminPool() {
  verifyTestEnvironment();

  if (!adminPool) {
    if (
      !process.env.TEST_ADMIN_DB_USER ||
      !process.env.TEST_ADMIN_DB_PASSWORD
    ) {
      throw new Error(
        "Test administrator database credentials are missing."
      );
    }

    adminPool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: TEST_DATABASE,
      user: process.env.TEST_ADMIN_DB_USER,
      password: process.env.TEST_ADMIN_DB_PASSWORD,

      max: 2,
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 5000,
    });

    adminPool.on("error", (error) => {
      console.error(
        "Unexpected test admin pool error:",
        error
      );
    });
  }

  return adminPool;
}

// -----------------------------------------
// Verify the actual PostgreSQL connection
// -----------------------------------------

export async function verifyAdminDatabase() {
  const admin = getAdminPool();

  const result = await admin.query(
    `
    SELECT
      current_database() AS database,
      current_user AS database_user
    `
  );

  if (result.rows[0].database !== TEST_DATABASE) {
    throw new Error(
      "Administrative connection is not using the test database."
    );
  }

  if (
    result.rows[0].database_user !==
    process.env.TEST_ADMIN_DB_USER
  ) {
    throw new Error(
      "Unexpected administrative database user."
    );
  }

  return result.rows[0];
}

// -----------------------------------------
// Close the connection pool
// -----------------------------------------

export async function closeAdminPool() {
  if (adminPool) {
    const currentPool = adminPool;
    adminPool = null;

    await currentPool.end();
  }
}

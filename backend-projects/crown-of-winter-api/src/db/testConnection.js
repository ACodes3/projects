
import { pool } from "./pool.js";

async function testConnection() {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        current_user AS username,
        NOW() AS connected_at
    `);

    console.log("PostgreSQL connection successful!");
    console.table(result.rows);
  } catch (error) {
    console.error("PostgreSQL connection failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testConnection();

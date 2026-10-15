
import app from "./app.js";
import pool from "./src/config/db.js";
import env from "./src/config/env.js";
import logger from "./src/config/logger.js";

// ==========================================
// SERVER CONFIGURATION
// ==========================================

const PORT = env.PORT;

// ==========================================
// START SERVER
// ==========================================

async function startServer() {
  try {
    // Verify PostgreSQL connectivity.
    await pool.query("SELECT 1");

    logger.info("PostgreSQL connected successfully");

    app.listen(PORT, () => {
      logger.info(
        `Demon Slayer API running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    logger.error("Database connection failed", {
      error: error.message,
      stack: error.stack,
    });

    await pool.end();
    process.exitCode = 1;
  }
}

startServer();

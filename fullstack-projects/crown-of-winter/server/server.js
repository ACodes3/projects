
import "dotenv/config";

import app from "./app.js";
import { pool } from "./src/db/pool.js";

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await pool.query("SELECT 1");

    console.log("PostgreSQL connected successfully.");

    app.listen(PORT, () => {
      console.log(`Crown of Winter API running on port ${PORT}`);
      console.log(
        `Health check: http://localhost:${PORT}/api/health`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);

    await pool.end();
    process.exitCode = 1;
  }
}

startServer();


import "dotenv/config";
import app from "./app.js";
import pool from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await pool.query("SELECT 1");

    console.log("PostgreSQL connected successfully!");

    app.listen(PORT, () => {
      console.log(
        `Demon Slayer API running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();

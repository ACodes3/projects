
import dotenv from 'dotenv';

import app from './app.js';
import db from './config/sqlite.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// ============================================================
// START FORGE API
// ============================================================

function startServer() {
  try {
    // Check SQLite database connection
    const result = db
      .prepare('SELECT COUNT(*) AS total FROM exercises')
      .get();

    console.log('SQLite connected successfully');
    console.log('Exercises in database:', result.total);

    // Start Express server
    app.listen(PORT, '127.0.0.1', () => {
      console.log(
        `FORGE API running at http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error('Failed to start FORGE API');
    console.error(error.message);

    process.exit(1);
  }
}

startServer();

import dotenv from 'dotenv';

import app from './app.js';
import pool from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;


async function startServer() {
  try {
    const result = await pool.query(
      'SELECT current_database(), NOW()',
    );

    console.log('PostgreSQL connected successfully');
    console.log(
      'Database:',
      result.rows[0].current_database,
    );
    console.log(
      'Server time:',
      result.rows[0].now,
    );

    app.listen(PORT, () => {
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
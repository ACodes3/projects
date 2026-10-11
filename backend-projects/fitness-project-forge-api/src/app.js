import express from 'express';
import cors from 'cors';

import exerciseRoutes from './routes/exerciseRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';

const app = express();


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);

app.use(express.json());


// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FORGE API is running.',
  });
});


// ============================================================
// API ROUTES
// ============================================================

app.use('/api/exercises', exerciseRoutes);

app.use('/api/workouts', workoutRoutes);


// ============================================================
// 404
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});


export default app;
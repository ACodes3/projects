import express from 'express';

import {
  getWorkouts,
  getWorkoutById,
  createWorkout,
} from '../controllers/workoutController.js';

import { devUser } from '../middleware/devUser.js';


const router = express.Router();


// ============================================================
// DEVELOPMENT USER
// ============================================================

router.use(devUser);


// ============================================================
// WORKOUT ROUTES
// ============================================================

// GET /api/workouts
router.get('/', getWorkouts);


// POST /api/workouts
router.post('/', createWorkout);


// GET /api/workouts/:id
router.get('/:id', getWorkoutById);


export default router;
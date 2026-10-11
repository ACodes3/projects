import express from 'express';

import {
  getWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
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


// PUT /api/workouts/:id
router.put('/:id', updateWorkout);


// DELETE /api/workouts/:id
router.delete('/:id', deleteWorkout);


export default router;
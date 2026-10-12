import express from 'express';

import {
  getExercises,
  getExerciseById,
} from '../controllers/exerciseController.js';

const router = express.Router();


// ============================================================
// EXERCISE ROUTES
// ============================================================

// GET /api/exercises
router.get('/', getExercises);


// GET /api/exercises/:id
router.get('/:id', getExerciseById);


export default router;

import { Router } from 'express';

import {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
} from '../controllers/exerciseController.js';

// ============================================================
// EXERCISE ROUTES
// ============================================================

const router = Router();

// ============================================================
// GET ALL ACTIVE EXERCISES
// GET /api/exercises
// ============================================================

router.get(
  '/',
  getExercises,
);

// ============================================================
// GET EXERCISE BY ID
// GET /api/exercises/:id
// ============================================================

router.get(
  '/:id',
  getExerciseById,
);

// ============================================================
// CREATE NEW EXERCISE
// POST /api/exercises
// ============================================================

router.post(
  '/',
  createExercise,
);

// ============================================================
// UPDATE EXISTING EXERCISE
// PUT /api/exercises/:id
// ============================================================

router.put(
  '/:id',
  updateExercise,
);

// ============================================================
// SOFT DELETE EXERCISE
// DELETE /api/exercises/:id
// ============================================================

router.delete(
  '/:id',
  deleteExercise,
);

// ============================================================
// EXPORT ROUTER
// ============================================================

export default router;

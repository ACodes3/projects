import express from 'express';

import {
  getNutritionEntries,
  createNutritionEntry,
  updateNutritionEntry,
  deleteNutritionEntry,
} from '../controllers/nutritionController.js';

import {
  getNutritionGoals,
  saveNutritionGoals,
} from '../controllers/nutritionGoalController.js';

import { devUser } from '../middleware/devUser.js';


const router = express.Router();


// ============================================================
// DEVELOPMENT USER
// ============================================================

router.use(devUser);


// ============================================================
// NUTRITION GOALS
//
// IMPORTANT:
// These must come before /:id,
// otherwise "goals" could be treated as an entry ID.
// ============================================================

// GET /api/nutrition/goals
router.get('/goals', getNutritionGoals);


// PUT /api/nutrition/goals
router.put('/goals', saveNutritionGoals);


// ============================================================
// NUTRITION ENTRIES
// ============================================================

// GET /api/nutrition
// GET /api/nutrition?date=2026-10-11
router.get('/', getNutritionEntries);


// POST /api/nutrition
router.post('/', createNutritionEntry);


// PUT /api/nutrition/:id
router.put('/:id', updateNutritionEntry);


// DELETE /api/nutrition/:id
router.delete('/:id', deleteNutritionEntry);


export default router;
import express from 'express';

import {
  getNutritionEntries,
  createNutritionEntry,
  updateNutritionEntry,
  deleteNutritionEntry,
} from '../controllers/nutritionController.js';

import { devUser } from '../middleware/devUser.js';


const router = express.Router();


// ============================================================
// DEVELOPMENT USER
// ============================================================

router.use(devUser);


// ============================================================
// NUTRITION ROUTES
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
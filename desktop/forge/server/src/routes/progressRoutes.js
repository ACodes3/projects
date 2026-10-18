import express from 'express';

import {
  getProgressEntries,
  createProgressEntry,
  updateProgressEntry,
  deleteProgressEntry,
} from '../controllers/progressController.js';

import { devUser } from '../middleware/devUser.js';


const router = express.Router();


// ============================================================
// DEVELOPMENT USER
// ============================================================

router.use(devUser);


// ============================================================
// PROGRESS ROUTES
// ============================================================

// GET /api/progress
// GET /api/progress?date=2026-10-11
router.get('/', getProgressEntries);


// POST /api/progress
router.post('/', createProgressEntry);


// PUT /api/progress/:id
router.put('/:id', updateProgressEntry);


// DELETE /api/progress/:id
router.delete('/:id', deleteProgressEntry);


export default router;
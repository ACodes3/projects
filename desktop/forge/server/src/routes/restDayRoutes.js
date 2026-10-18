import express from 'express';

import {
  getRestDays,
  createRestDay,
  deleteRestDay,
} from '../controllers/restDayController.js';

import { devUser } from '../middleware/devUser.js';


const router = express.Router();


// ============================================================
// DEVELOPMENT USER
// ============================================================

router.use(devUser);


// ============================================================
// REST DAY ROUTES
// ============================================================

// GET /api/rest-days
// GET /api/rest-days?date=2026-10-11
router.get('/', getRestDays);


// POST /api/rest-days
router.post('/', createRestDay);


// DELETE /api/rest-days/:date
router.delete('/:date', deleteRestDay);


export default router;
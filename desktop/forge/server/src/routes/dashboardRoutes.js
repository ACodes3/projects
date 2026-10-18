import express from 'express';

import {
  getDashboard,
} from '../controllers/dashboardController.js';

import { devUser } from '../middleware/devUser.js';


const router = express.Router();


// ============================================================
// SINGLE-USER CONTEXT
// ============================================================

router.use(devUser);


// ============================================================
// DASHBOARD ROUTES
// ============================================================

// GET /api/dashboard
// GET /api/dashboard?date=2026-10-11
router.get('/', getDashboard);


export default router;
import express from 'express';

import {
  getProfile,
  saveProfile,
} from '../controllers/profileController.js';

import { devUser } from '../middleware/devUser.js';


const router = express.Router();


// ============================================================
// DEVELOPMENT USER
// ============================================================

router.use(devUser);


// ============================================================
// PROFILE ROUTES
// ============================================================

// GET /api/profile
router.get('/', getProfile);


// PUT /api/profile
router.put('/', saveProfile);


export default router;

import { Router } from "express";

import {
  register,
  login,
  getCurrentUser,
  logout,
} from "../controllers/authController.js";

import { authenticate } from "../middleware/authenticate.js";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", authenticate, getCurrentUser);
router.post("/logout", authenticate, logout);

export default router;

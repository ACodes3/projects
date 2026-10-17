
import { Router } from "express";

import {
  register,
  login,
  getCurrentUser,
  logout,
} from "../controllers/authController.js";

import { authenticate } from "../middleware/authenticate.js";
import { loginRateLimiter } from "../middleware/loginRateLimiter.js";

const router = Router();

// -----------------------------------------
// Public routes
// -----------------------------------------

router.post("/register", register);

router.post(
  "/login",
  loginRateLimiter,
  login
);

// -----------------------------------------
// Protected routes
// -----------------------------------------

router.get(
  "/me",
  authenticate,
  getCurrentUser
);

router.post(
  "/logout",
  authenticate,
  logout
);

export default router;


import { rateLimit } from "express-rate-limit";

// ==========================================
// GENERAL API RATE LIMITER
// ==========================================

// Maximum 100 requests per IP every 15 minutes.

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests. Please try again in 15 minutes."
  }
});

// ==========================================
// WRITE OPERATION RATE LIMITER
// ==========================================

// Stricter limits for POST, PATCH and DELETE.
// Maximum 30 write requests per IP every 15 minutes.

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many write requests. Please try again later."
  }
});

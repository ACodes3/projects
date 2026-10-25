
import { rateLimit } from "express-rate-limit";

// -----------------------------------------
// Crown of Winter
// Login Rate Limiter
// -----------------------------------------

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_LIMIT = 10;

// -----------------------------------------
// Create an independent login rate limiter
// -----------------------------------------
// The factory allows security tests to use
// a separate in-memory store and a shorter
// attempt limit.
//
// Production uses the defaults.

export function createLoginRateLimiter({
  windowMs = DEFAULT_WINDOW_MS,
  limit = DEFAULT_LIMIT,
} = {}) {
  return rateLimit({
    windowMs,
    limit,

    // Count failed responses, not successful
    // login requests.
    skipSuccessfulRequests: true,

    // Modern RateLimit response headers.
    standardHeaders: "draft-8",
    legacyHeaders: false,

    // Consistent API error response.
    message: {
      success: false,
      message:
        "Too many login attempts. Please try again in 15 minutes.",
    },
  });
}

// -----------------------------------------
// Production middleware instance
// -----------------------------------------

export const loginRateLimiter =
  createLoginRateLimiter();


import AppError from "../utils/AppError.js";
import logger from "../config/logger.js";

// ==========================================
// CENTRALIZED ERROR HANDLER
// ==========================================

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = "Internal server error";

  // ========================================
  // CUSTOM APPLICATION ERRORS
  // ========================================

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // ========================================
  // POSTGRESQL ERRORS
  // ========================================

  // Duplicate primary key
  else if (err.code === "23505") {
    statusCode = 409;
    message = "A record with this value already exists";
  }

  // Foreign key violation
  else if (err.code === "23503") {
    statusCode = 409;
    message = "Database relationship constraint violated";
  }

  // Check constraint violation
  else if (err.code === "23514") {
    statusCode = 400;
    message = "A database constraint was violated";
  }

  // NOT NULL violation
  else if (err.code === "23502") {
    statusCode = 400;
    message = "A required database field is missing";
  }

  // ========================================
  // INVALID JSON REQUESTS
  // ========================================

  else if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    statusCode = 400;
    message = "Invalid JSON request body";
  }

  // ========================================
  // WINSTON ERROR LOGGING
  // ========================================

  const logDetails = {
    method: req.method,
    path: req.path,
    statusCode,
  };

  if (statusCode >= 500) {
    // Unexpected server errors:
    // Record details for debugging, but do not
    // expose internal information to the client.
    logger.error("Unhandled API error", {
      ...logDetails,
      error: err.message,
      stack: err.stack,
    });
  } else if (statusCode >= 400) {
    // Expected client errors:
    // Log basic information without a stack trace.
    // Avoid recording request bodies or credentials.
    logger.warn("API request rejected", {
      ...logDetails,
      reason: message,
    });
  }

  // ========================================
  // ERROR RESPONSE
  // ========================================

  res.status(statusCode).json({
    success: false,
    message,
  });
}

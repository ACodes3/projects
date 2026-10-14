
import AppError from "../utils/AppError.js";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = "Internal server error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // PostgreSQL: duplicate primary key
  else if (err.code === "23505") {
    statusCode = 409;
    message = "A record with this value already exists";
  }

  // PostgreSQL: foreign key violation
  else if (err.code === "23503") {
    statusCode = 409;
    message = "Database relationship constraint violated";
  }

  // PostgreSQL: check constraint violation
  else if (err.code === "23514") {
    statusCode = 400;
    message = "A database constraint was violated";
  }

  // PostgreSQL: NOT NULL violation
  else if (err.code === "23502") {
    statusCode = 400;
    message = "A required database field is missing";
  }

  // Malformed JSON request
  else if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    statusCode = 400;
    message = "Invalid JSON request body";
  }

  if (statusCode >= 500) {
    console.error("API Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message
  });
}


import AppError from "../utils/AppError.js";

export function notFound(req, res, next) {
  next(
    new AppError(
      `Route ${req.method} ${req.path} not found`,
      404
    )
  );
}

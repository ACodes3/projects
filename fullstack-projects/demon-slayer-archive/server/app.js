
import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import env from "./src/config/env.js";

import archiveRoutes from "./src/routes/archiveRoutes.js";
import swaggerSpec from "./src/docs/swagger.js";

import requestLogger from "./src/middleware/requestLogger.js";

import {
  apiLimiter,
  writeLimiter,
} from "./src/middleware/rateLimiter.js";

import {
  notFound,
} from "./src/middleware/notFound.js";

import {
  errorHandler,
} from "./src/middleware/errorHandler.js";

const app = express();

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

app.use(helmet());

// ==========================================
// REQUEST LOGGING
// ==========================================

app.use(requestLogger);

// ==========================================
// CORS
// ==========================================

const allowedOrigins = env.CLIENT_ORIGIN
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients without Origin headers.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error(
        "Origin not allowed by CORS"
      );

      error.status = 403;

      return callback(error);
    },

    methods: [
      "GET",
      "POST",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ==========================================
// REQUEST BODY PARSING
// ==========================================

app.use(
  express.json({
    limit: "100kb",
  })
);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Demon Slayer Archive API is running!",
    environment: env.NODE_ENV,
  });
});

// ==========================================
// SWAGGER DOCUMENTATION
// ==========================================

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// ==========================================
// RATE LIMITING
// ==========================================

// General API requests.
app.use("/api", apiLimiter);

// Stricter limit for database write operations.
app.use("/api", (req, res, next) => {
  if (
    ["POST", "PATCH", "DELETE"].includes(req.method)
  ) {
    return writeLimiter(req, res, next);
  }

  next();
});

// ==========================================
// API ROUTES
// ==========================================

app.use("/api", archiveRoutes);

// ==========================================
// 404 HANDLING
// ==========================================

app.use(notFound);

// ==========================================
// CENTRALIZED ERROR HANDLING
// ==========================================

app.use(errorHandler);

export default app;

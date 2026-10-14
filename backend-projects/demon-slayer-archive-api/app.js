
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";

import archiveRoutes from "./src/routes/archiveRoutes.js";

import {
  apiLimiter,
  writeLimiter
} from "./src/middleware/rateLimiter.js";

import {
  notFound
} from "./src/middleware/notFound.js";

import {
  errorHandler
} from "./src/middleware/errorHandler.js";

const app = express();

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

app.use(helmet());

// Allowed browser origins
const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
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
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]
  })
);

// ==========================================
// REQUEST BODY PARSING
// ==========================================

app.use(
  express.json({
    limit: "100kb"
  })
);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Demon Slayer Archive API is running!",
    environment: process.env.NODE_ENV || "development"
  });
});

// ==========================================
// API RATE LIMITING
// ==========================================

// Applies to all API requests
app.use("/api", apiLimiter);

// Applies only to write methods
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
// ERROR HANDLING
// ==========================================

app.use(notFound);

app.use(errorHandler);

export default app;

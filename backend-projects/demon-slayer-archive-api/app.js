
import express from "express";
import cors from "cors";
import helmet from "helmet";

import archiveRoutes from "./src/routes/archiveRoutes.js";

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

// Set security-related HTTP headers
app.use(helmet());

// Configure allowed browser origins
const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without Origin headers,
      // such as Thunder Client or curl.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Origin not allowed by CORS")
      );
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
// BODY PARSING
// ==========================================

// Limit JSON request size
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
// API ROUTES
// ==========================================

app.use("/api", archiveRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

// Unknown endpoints
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

export default app;

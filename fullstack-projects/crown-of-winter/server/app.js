
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRoutes from "./src/routes/authRoutes.js";

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: "100kb" }));

// Parse cookies
app.use(cookieParser());

// -----------------------------------------
// Health check
// -----------------------------------------

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Crown of Winter API is running.",
    timestamp: new Date().toISOString(),
  });
});

// -----------------------------------------
// Authentication routes
// -----------------------------------------

app.use("/api/auth", authRoutes);

// -----------------------------------------
// Handle unknown routes
// -----------------------------------------

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// -----------------------------------------
// Centralized error handler
// -----------------------------------------

app.use((error, req, res, next) => {
  console.error("Unhandled API error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

export default app;

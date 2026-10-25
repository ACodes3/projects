import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRoutes from "./src/routes/authRoutes.js";
import warBoardRoutes from "./src/routes/warBoardRoutes.js";
import worldRoutes from "./src/routes/worldRoutes.js";
import invitationRoutes from "./src/routes/invitationRoutes.js";
import characterRoutes from "./src/routes/characterRoutes.js";
import accessRoutes from "./src/routes/accessRoutes.js";
import auditRoutes from "./src/routes/auditRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";

import { csrfProtection } from "./src/middleware/csrfProtection.js";

const app = express();

// -----------------------------------------
// Security middleware
// -----------------------------------------

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// -----------------------------------------
// CSRF Origin Protection
// -----------------------------------------
// Checks POST, PUT, PATCH and DELETE requests.
//
// Our React frontend must send requests from
// the origin configured in CLIENT_URL.
//
// GET, HEAD and OPTIONS requests are unaffected.

app.use("/api", csrfProtection);

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
// World routes
// -----------------------------------------

app.use("/api/worlds", worldRoutes);

// -----------------------------------------
// Imperial invitations
// -----------------------------------------

app.use("/api", invitationRoutes);

// -----------------------------------------
// Character assignments
// -----------------------------------------

app.use("/api/worlds", characterRoutes);

// -----------------------------------------
// Character-based authorization
// -----------------------------------------

app.use("/api/worlds", accessRoutes);

// -----------------------------------------
// Imperial audit history
// -----------------------------------------

app.use("/api/worlds", auditRoutes);

// -----------------------------------------
// Imperial Strategy Board
// -----------------------------------------

app.use("/api/worlds", warBoardRoutes);

// -----------------------------------------
// Imperial Communications
// -----------------------------------------

app.use("/api/worlds", chatRoutes);

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

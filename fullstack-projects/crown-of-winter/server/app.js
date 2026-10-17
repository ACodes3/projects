
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRoutes from "./src/routes/authRoutes.js";
import worldRoutes from "./src/routes/worldRoutes.js";
import invitationRoutes from "./src/routes/invitationRoutes.js";

const app = express();

// Security middleware
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Crown of Winter API is running.",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/worlds", worldRoutes);
app.use("/api", invitationRoutes);

// Unknown routes
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Unhandled API error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

export default app;


import express from "express";
import cors from "cors";

import archiveRoutes from "./src/routes/archiveRoutes.js";
import { notFound } from "./src/middleware/notFound.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "100kb" }));

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Demon Slayer Archive API is running!"
  });
});

// API routes
app.use("/api", archiveRoutes);

// Unknown routes
app.use(notFound);

// Centralized error handler (must be last)
app.use(errorHandler);

export default app;

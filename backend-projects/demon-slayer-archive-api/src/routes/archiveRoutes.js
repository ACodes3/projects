
import { Router } from "express";

import {
  getAll,
  getById,
  createSlayer,
  updateSlayer
} from "../controllers/archiveController.js";

const router = Router();

// POST
router.post("/slayers", createSlayer);

// PATCH
router.patch("/slayers/:id", updateSlayer);

// GET
router.get("/:collection", getAll);
router.get("/:collection/:id", getById);

export default router;

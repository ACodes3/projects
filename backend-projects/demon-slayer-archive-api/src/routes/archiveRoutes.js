
import { Router } from "express";

import {
  getAll,
  getById,
  createSlayer,
  updateSlayer,
  deleteSlayer
} from "../controllers/archiveController.js";

const router = Router();

// POST
router.post("/slayers", createSlayer);

// PATCH
router.patch("/slayers/:id", updateSlayer);

// DELETE
router.delete("/slayers/:id", deleteSlayer);

// GET
router.get("/:collection", getAll);
router.get("/:collection/:id", getById);

export default router;

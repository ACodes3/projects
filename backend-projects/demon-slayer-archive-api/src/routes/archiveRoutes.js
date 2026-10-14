
import { Router } from "express";

import {
  getAll,
  getById,
  createSlayer,
  updateSlayer,
  deleteSlayer,
  createDemon,
  updateDemon,
  deleteDemon
} from "../controllers/archiveController.js";

const router = Router();

// SLAYERS
router.post("/slayers", createSlayer);
router.patch("/slayers/:id", updateSlayer);
router.delete("/slayers/:id", deleteSlayer);

// DEMONS
router.post("/demons", createDemon);
router.patch("/demons/:id", updateDemon);
router.delete("/demons/:id", deleteDemon);

// GET (all collections)
router.get("/:collection", getAll);
router.get("/:collection/:id", getById);

export default router;

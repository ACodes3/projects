
import { Router } from "express";

import {
  getAll,
  getById,
  createSlayer
} from "../controllers/archiveController.js";

const router = Router();

// POST
router.post("/slayers", createSlayer);

// GET
router.get("/:collection", getAll);
router.get("/:collection/:id", getById);

export default router;

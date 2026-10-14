import { Router } from "express";

import {
  getAll,
  getById,
  createSlayer,
  updateSlayer,
  deleteSlayer,
  createDemon,
  updateDemon,
  deleteDemon,
  createBreathingStyle,
  updateBreathingStyle,
  deleteBreathingStyle,
  createBloodDemonArt,
  updateBloodDemonArt,
  deleteBloodDemonArt,
  createTechnique,
  updateTechnique,
  deleteTechnique,
} from "../controllers/archiveController.js";

const router = Router();

// SLAYERS
router.post("/slayers", createSlayer);
router.patch("/slayers/:id", updateSlayer);
router.delete("/slayers/:id", deleteSlayer);

// BLOOD DEMON ARTS
router.post("/blood-demon-arts", createBloodDemonArt);
router.patch("/blood-demon-arts/:id", updateBloodDemonArt);
router.delete("/blood-demon-arts/:id", deleteBloodDemonArt);

// DEMONS
router.post("/demons", createDemon);
router.patch("/demons/:id", updateDemon);
router.delete("/demons/:id", deleteDemon);

// BREATHING STYLES
router.post("/breathing-styles", createBreathingStyle);
router.patch("/breathing-styles/:id", updateBreathingStyle);
router.delete("/breathing-styles/:id", deleteBreathingStyle);

// TECHNIQUES
router.post("/techniques", createTechnique);
router.patch("/techniques/:id", updateTechnique);
router.delete("/techniques/:id", deleteTechnique);

// GET (all collections)
router.get("/:collection", getAll);
router.get("/:collection/:id", getById);

export default router;

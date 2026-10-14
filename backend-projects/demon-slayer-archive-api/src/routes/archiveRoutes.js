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

import { validate } from "../middleware/validate.js";

import {
  slayerSchema,
  slayerPatchSchema,
  demonSchema,
  demonPatchSchema,
  breathingStyleSchema,
  breathingStylePatchSchema,
  bloodDemonArtSchema,
  bloodDemonArtPatchSchema,
  techniqueSchema,
  techniquePatchSchema,
} from "../validators/archiveSchemas.js";

const router = Router();

// SLAYERS
router.post("/slayers", validate(slayerSchema), createSlayer);
router.patch("/slayers/:id", validate(slayerPatchSchema), updateSlayer);
router.delete("/slayers/:id", deleteSlayer);

// DEMONS
router.post("/demons", validate(demonSchema), createDemon);
router.patch("/demons/:id", validate(demonPatchSchema), updateDemon);
router.delete("/demons/:id", deleteDemon);

// BREATHING STYLES
router.post(
  "/breathing-styles",
  validate(breathingStyleSchema),
  createBreathingStyle,
);
router.patch(
  "/breathing-styles/:id",
  validate(breathingStylePatchSchema),
  updateBreathingStyle,
);
router.delete("/breathing-styles/:id", deleteBreathingStyle);

// BLOOD DEMON ARTS
router.post(
  "/blood-demon-arts",
  validate(bloodDemonArtSchema),
  createBloodDemonArt,
);
router.patch(
  "/blood-demon-arts/:id",
  validate(bloodDemonArtPatchSchema),
  updateBloodDemonArt,
);
router.delete("/blood-demon-arts/:id", deleteBloodDemonArt);

// TECHNIQUES
router.post("/techniques", validate(techniqueSchema), createTechnique);
router.patch(
  "/techniques/:id",
  validate(techniquePatchSchema),
  updateTechnique,
);
router.delete("/techniques/:id", deleteTechnique);

// GET routes
router.get("/:collection", getAll);
router.get("/:collection/:id", getById);

export default router;


import { Router } from "express";

// ==========================================
// CONTROLLERS
// ==========================================

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

// ==========================================
// VALIDATION MIDDLEWARE
// ==========================================

import { validate } from "../middleware/validate.js";

import {
  validateRelationships,
  protectDeletion,
} from "../validators/relationships.js";

// ==========================================
// ZOD SCHEMAS
// ==========================================

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

// ==========================================
// SLAYERS
// ==========================================

// CREATE
router.post(
  "/slayers",
  validate(slayerSchema),
  validateRelationships("slayers"),
  createSlayer
);

// UPDATE
router.patch(
  "/slayers/:id",
  validate(slayerPatchSchema),
  validateRelationships("slayers"),
  updateSlayer
);

// DELETE
router.delete(
  "/slayers/:id",
  protectDeletion("slayers"),
  deleteSlayer
);

// ==========================================
// DEMONS
// ==========================================

// CREATE
router.post(
  "/demons",
  validate(demonSchema),
  validateRelationships("demons"),
  createDemon
);

// UPDATE
router.patch(
  "/demons/:id",
  validate(demonPatchSchema),
  validateRelationships("demons"),
  updateDemon
);

// DELETE
router.delete(
  "/demons/:id",
  protectDeletion("demons"),
  deleteDemon
);

// ==========================================
// BREATHING STYLES
// ==========================================

// CREATE
router.post(
  "/breathing-styles",
  validate(breathingStyleSchema),
  validateRelationships("breathing-styles"),
  createBreathingStyle
);

// UPDATE
router.patch(
  "/breathing-styles/:id",
  validate(breathingStylePatchSchema),
  validateRelationships("breathing-styles"),
  updateBreathingStyle
);

// DELETE
router.delete(
  "/breathing-styles/:id",
  protectDeletion("breathing-styles"),
  deleteBreathingStyle
);

// ==========================================
// BLOOD DEMON ARTS
// ==========================================

// CREATE
router.post(
  "/blood-demon-arts",
  validate(bloodDemonArtSchema),
  validateRelationships("blood-demon-arts"),
  createBloodDemonArt
);

// UPDATE
router.patch(
  "/blood-demon-arts/:id",
  validate(bloodDemonArtPatchSchema),
  validateRelationships("blood-demon-arts"),
  updateBloodDemonArt
);

// DELETE
router.delete(
  "/blood-demon-arts/:id",
  protectDeletion("blood-demon-arts"),
  deleteBloodDemonArt
);

// ==========================================
// TECHNIQUES
// ==========================================

// CREATE
router.post(
  "/techniques",
  validate(techniqueSchema),
  validateRelationships("techniques"),
  createTechnique
);

// UPDATE
router.patch(
  "/techniques/:id",
  validate(techniquePatchSchema),
  validateRelationships("techniques"),
  updateTechnique
);

// DELETE
router.delete(
  "/techniques/:id",
  protectDeletion("techniques"),
  deleteTechnique
);

// ==========================================
// GET ALL / GET BY ID
// ==========================================

// GET /api/slayers
// GET /api/demons
// GET /api/breathing-styles
// GET /api/blood-demon-arts
// GET /api/techniques

router.get("/:collection", getAll);

// GET /api/slayers/:id
// GET /api/demons/:id
// etc.

router.get("/:collection/:id", getById);

export default router;

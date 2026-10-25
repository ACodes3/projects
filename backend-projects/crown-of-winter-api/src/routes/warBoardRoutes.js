
import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";

import {
  loadWorldCharacter,
  requirePermission,
} from "../middleware/authorize.js";

import {
  getWarBoard,
  moveWarBoardPiece,
} from "../controllers/warBoardController.js";

const router = Router();

// ==========================================
// AUTHENTICATION & WORLD ACCESS
// ==========================================

// All routes require an authenticated user.
router.use(authenticate);

// Load the player's active character in the world.
router.use("/:worldId", loadWorldCharacter);

// ==========================================
// GET — RETRIEVE WAR BOARD
// ==========================================

router.get(
  "/:worldId/war-board",
  requirePermission("operations.view"),
  getWarBoard
);

// ==========================================
// PATCH — MOVE A NATION PIECE
// ==========================================

router.patch(
  "/:worldId/war-board/:regionId",
  requirePermission("operations.manage"),
  moveWarBoardPiece
);

export default router;

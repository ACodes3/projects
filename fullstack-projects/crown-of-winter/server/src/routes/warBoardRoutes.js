
import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";

import {
  loadWorldCharacter,
  requirePermission,
} from "../middleware/authorize.js";

import { getWarBoard } from "../controllers/warBoardController.js";

const router = Router();

// All War Board routes require authentication.
router.use(authenticate);

// Verify active world membership and assigned character.
router.use("/:worldId", loadWorldCharacter);

// GET /api/worlds/:worldId/war-board
// Requires operations.view permission.
router.get(
  "/:worldId/war-board",
  requirePermission("operations.view"),
  getWarBoard
);

export default router;

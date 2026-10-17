
import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";

import {
  listCharacters,
  listAssignments,
  createAssignment,
} from "../controllers/characterController.js";

const router = Router();

// All character-management routes
// require a valid login session.
router.use(authenticate);

router.get(
  "/:worldId/characters",
  listCharacters
);

router.get(
  "/:worldId/assignments",
  listAssignments
);

router.post(
  "/:worldId/assignments",
  createAssignment
);

export default router;

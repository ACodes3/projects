
import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";

import {
  loadWorldCharacter,
  requireSovereign,
} from "../middleware/authorize.js";

import {
  getMyPermissions,
  verifySovereignAccess,
} from "../controllers/accessController.js";

const router = Router();

// Every route requires a logged-in user
// who controls an active character.
router.use(authenticate);
router.use("/:worldId", loadWorldCharacter);

// GET current character permissions
router.get(
  "/:worldId/me/permissions",
  getMyPermissions
);

// GET sovereign access test
router.get(
  "/:worldId/sovereign/verify",
  requireSovereign,
  verifySovereignAccess
);

export default router;

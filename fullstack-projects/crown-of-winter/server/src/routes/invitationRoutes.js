
import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";

import {
  invite,
  members,
  myInvitations,
  accept,
} from "../controllers/invitationController.js";

const router = Router();

// -----------------------------------------
// World invitations (Sovereign only)
// -----------------------------------------

router.post(
  "/worlds/:worldId/invitations",
  authenticate,
  invite
);

router.get(
  "/worlds/:worldId/members",
  authenticate,
  members
);

// -----------------------------------------
// Player invitations
// -----------------------------------------

router.get(
  "/invitations",
  authenticate,
  myInvitations
);

router.post(
  "/invitations/:membershipId/accept",
  authenticate,
  accept
);

export default router;

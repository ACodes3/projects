
import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";

import {
  invite,
  members,
  myInvitations,
  accept,
} from "../controllers/invitationController.js";

const router = Router();

// All routes require authentication.
router.use(authenticate);

router.post("/worlds/:worldId/invitations", invite);
router.get("/worlds/:worldId/members", members);

router.get("/invitations", myInvitations);
router.post("/invitations/:membershipId/accept", accept);

export default router;

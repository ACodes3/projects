
import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";

import {
  loadWorldCharacter,
  requirePermission,
} from "../middleware/authorize.js";

import {
  getAuditHistory,
} from "../controllers/auditController.js";

const router = Router();

// -----------------------------------------
// Protected world audit history
// -----------------------------------------

router.get(
  "/:worldId/audit-logs",
  authenticate,
  loadWorldCharacter,
  requirePermission("audit.view"),
  getAuditHistory
);

export default router;

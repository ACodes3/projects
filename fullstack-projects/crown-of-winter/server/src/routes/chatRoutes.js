
import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";
import { loadWorldCharacter } from "../middleware/authorize.js";

import {
  getChatMessages,
  sendChatMessage,
} from "../controllers/chatController.js";

const router = Router();

// ==========================================
// AUTHENTICATION & WORLD ACCESS
// ==========================================

// Every chat request requires a valid session.
router.use(authenticate);

// Verify active world membership and character.
router.use("/:worldId", loadWorldCharacter);

// ==========================================
// GET — RETRIEVE CHAT HISTORY
// ==========================================

router.get(
  "/:worldId/chat/messages",
  getChatMessages
);

// ==========================================
// POST — SEND CHAT MESSAGE
// ==========================================

router.post(
  "/:worldId/chat/messages",
  sendChatMessage
);

export default router;

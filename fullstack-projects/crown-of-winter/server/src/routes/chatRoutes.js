import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";
import { loadWorldCharacter } from "../middleware/authorize.js";
import {
  getChatMessages,
  sendChatMessage,
} from "../controllers/chatController.js";
import {
  getChatContacts,
  getChatConversations,
  createDirectConversation,
  getConversationMessages,
  sendConversationMessage,
} from "../controllers/chatConversationController.js";

const router = Router();

// All endpoints require a valid login and active world character.
router.use(authenticate);
router.use("/:worldId", loadWorldCharacter);

// Conversation chooser and contacts.
router.get("/:worldId/chat/conversations", getChatConversations);
router.get("/:worldId/chat/contacts", getChatContacts);
router.post("/:worldId/chat/conversations", createDirectConversation);

// Message history and sending for the selected conversation.
// The controller verifies direct-conversation participation.
router.get(
  "/:worldId/chat/conversations/:conversationId/messages",
  getConversationMessages,
);
router.post(
  "/:worldId/chat/conversations/:conversationId/messages",
  sendConversationMessage,
);

// Legacy common-chat GET remains available to the current popup.
router.get("/:worldId/chat/messages", getChatMessages);

// Migration 002 requires conversation_id for every message.
// Do not call the old INSERT handler until it has been updated.
router.post("/:worldId/chat/messages", sendChatMessage);

export default router;

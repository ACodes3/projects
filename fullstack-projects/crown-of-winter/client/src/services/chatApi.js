import { apiRequest } from "./api";

function worldChatPath(worldId) {
  return `/api/worlds/${encodeURIComponent(worldId)}/chat`;
}

export const chatApi = {
  // ==========================================
  // LEGACY COMMON CHAT
  // Keep these until AppShell is fully migrated.
  // ==========================================

  getMessages(worldId) {
    return apiRequest(`${worldChatPath(worldId)}/messages`);
  },

  sendMessage(worldId, content) {
    return apiRequest(`${worldChatPath(worldId)}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  // ==========================================
  // CONVERSATION LIST
  // ==========================================

  getConversations(worldId) {
    return apiRequest(`${worldChatPath(worldId)}/conversations`);
  },

  // ==========================================
  // AVAILABLE PLAYERS
  // ==========================================

  getContacts(worldId) {
    return apiRequest(`${worldChatPath(worldId)}/contacts`);
  },

  // ==========================================
  // CREATE OR OPEN PRIVATE CONVERSATION
  // ==========================================

  createDirectConversation(worldId, recipientWorldCharacterId) {
    return apiRequest(`${worldChatPath(worldId)}/conversations`, {
      method: "POST",
      body: JSON.stringify({
        recipient_world_character_id: recipientWorldCharacterId,
      }),
    });
  },

  // ==========================================
  // GET SELECTED CONVERSATION MESSAGES
  // ==========================================

  getConversationMessages(worldId, conversationId) {
    return apiRequest(
      `${worldChatPath(worldId)}/conversations/${encodeURIComponent(conversationId)}/messages`,
    );
  },

  // ==========================================
  // SEND MESSAGE TO SELECTED CONVERSATION
  // ==========================================

  sendConversationMessage(worldId, conversationId, content) {
    return apiRequest(
      `${worldChatPath(worldId)}/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
    );
  },
};


import { apiRequest } from "./api";

export const chatApi = {
  // GET — Retrieve the latest 50 messages.
  // Requires active world membership and character assignment.
  getMessages(worldId) {
    return apiRequest(
      `/api/worlds/${encodeURIComponent(worldId)}/chat/messages`
    );
  },

  // POST — Send a message as the authenticated character.
  // The backend determines the sender's identity.
  sendMessage(worldId, content) {
    return apiRequest(
      `/api/worlds/${encodeURIComponent(worldId)}/chat/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      }
    );
  },
};

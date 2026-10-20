
import { apiRequest } from "./api";

export const invitationApi = {
  // Invite a registered user to a world.
  invite(worldId, username) {
    return apiRequest(
      `/api/worlds/${encodeURIComponent(worldId)}/invitations`,
      {
        method: "POST",
        body: JSON.stringify({ username }),
      }
    );
  },

  // Get all members of a world (Sovereign only).
  getMembers(worldId) {
    return apiRequest(
      `/api/worlds/${encodeURIComponent(worldId)}/members`
    );
  },

  // Get invitations awaiting the current user's response.
  getMyInvitations() {
    return apiRequest("/api/invitations");
  },

  // Accept an invitation using its membership ID.
  accept(membershipId) {
    return apiRequest(
      `/api/invitations/${encodeURIComponent(membershipId)}/accept`,
      {
        method: "POST",
      }
    );
  },
};

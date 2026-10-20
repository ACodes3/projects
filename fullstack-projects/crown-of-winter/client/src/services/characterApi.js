
import { apiRequest } from "./api";

export const characterApi = {
  // List playable characters and assignment status.
  getCharacters(worldId) {
    return apiRequest(
      `/api/worlds/${encodeURIComponent(worldId)}/characters`
    );
  },

  // List active character assignments.
  getAssignments(worldId) {
    return apiRequest(
      `/api/worlds/${encodeURIComponent(worldId)}/assignments`
    );
  },

  // Assign a character and its initial roles to a member.
  assign(worldId, membershipId, characterId, roles) {
    return apiRequest(
      `/api/worlds/${encodeURIComponent(worldId)}/assignments`,
      {
        method: "POST",
        body: JSON.stringify({
          membership_id: membershipId,
          character_id: characterId,
          roles,
        }),
      }
    );
  },
};

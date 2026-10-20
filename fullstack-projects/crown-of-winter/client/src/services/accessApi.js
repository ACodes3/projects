
import { apiRequest } from "./api";

export const accessApi = {
  // Retrieve the logged-in player's character,
  // assigned roles, and effective permissions.
  getMyPermissions(worldId) {
    return apiRequest(
      `/api/worlds/${encodeURIComponent(worldId)}/me/permissions`
    );
  },

  // Verify whether the player controls the
  // world's Sovereign character.
  verifySovereign(worldId) {
    return apiRequest(
      `/api/worlds/${encodeURIComponent(worldId)}/sovereign/verify`
    );
  },
};

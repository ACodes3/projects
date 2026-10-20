
import { apiRequest } from "./api";

export const worldApi = {
  list() {
    return apiRequest("/api/worlds");
  },

  getById(worldId) {
    return apiRequest(
      `/api/worlds/${encodeURIComponent(worldId)}`
    );
  },

  create(name, mode) {
    return apiRequest("/api/worlds", {
      method: "POST",
      body: JSON.stringify({
        name,
        mode,
      }),
    });
  },
};

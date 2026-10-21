
import { apiRequest } from "./api";

export const warBoardApi = {
  // GET — Retrieve saved piece positions.
  // Requires operations.view permission.
  getBoard(worldId) {
    return apiRequest(
      `/api/worlds/${encodeURIComponent(worldId)}/war-board`
    );
  },

  // PATCH — Save a nation's new position.
  // Requires operations.manage permission.
  movePiece(worldId, regionId, gridX, gridY) {
    return apiRequest(
      `/api/worlds/${encodeURIComponent(worldId)}/war-board/${encodeURIComponent(regionId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          grid_x: gridX,
          grid_y: gridY,
        }),
      }
    );
  },
};

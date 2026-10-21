
import { pool } from "../db/pool.js";

// GET /api/worlds/:worldId/war-board
export async function getWarBoard(req, res) {
  const { worldId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        region_id,
        grid_x,
        grid_y,
        updated_at
      FROM war_board_pieces
      WHERE world_id = $1
      ORDER BY region_id ASC
      `,
      [worldId]
    );

    return res.status(200).json({
      success: true,
      data: {
        pieces: result.rows,
      },
    });
  } catch (error) {
    console.error("Failed to retrieve war board:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve imperial strategy board.",
    });
  }
}

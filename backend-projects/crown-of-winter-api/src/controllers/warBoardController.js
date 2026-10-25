
import { pool } from "../db/pool.js";

// ==========================================
// GET /api/worlds/:worldId/war-board
// Retrieve all nation pieces for a world.
// ==========================================

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

// ==========================================
// PATCH /api/worlds/:worldId/war-board/:regionId
// Move a nation piece to another square.
// ==========================================

export async function moveWarBoardPiece(req, res) {
  const { worldId, regionId } = req.params;
  const { grid_x, grid_y } = req.body ?? {};

  // ----------------------------------------
  // Validate board coordinates
  // ----------------------------------------

  if (
    !Number.isInteger(grid_x) ||
    !Number.isInteger(grid_y) ||
    grid_x < 0 ||
    grid_x > 7 ||
    grid_y < 0 ||
    grid_y > 7
  ) {
    return res.status(400).json({
      success: false,
      message: "Board coordinates must be integers between 0 and 7.",
    });
  }

  try {
    // ----------------------------------------
    // Save movement in PostgreSQL
    // ----------------------------------------

    const result = await pool.query(
      `
      UPDATE war_board_pieces
      SET
        grid_x = $3,
        grid_y = $4,
        updated_at = NOW()
      WHERE world_id = $1
        AND region_id = $2
      RETURNING
        region_id,
        grid_x,
        grid_y,
        updated_at
      `,
      [worldId, regionId, grid_x, grid_y]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Nation piece not found in this world.",
      });
    }

    const piece = result.rows[0];

    // ----------------------------------------
    // Real-time movement notification
    // ----------------------------------------

    // The shared broadcaster will be installed
    // on the Express app in our next step.
    //
    // It will revalidate each recipient's active
    // session and world membership before emitting.
    //
    // No raw room broadcast is used here.

    const broadcastWarBoardMove =
      req.app.get("broadcastWarBoardMove");

    if (typeof broadcastWarBoardMove === "function") {
      try {
        await broadcastWarBoardMove({
          worldId,
          piece,
        });
      } catch (broadcastError) {
        // The database update has already succeeded.
        // A notification failure must not make the
        // successful movement appear to have failed.
        console.error(
          "War board notification failed:",
          broadcastError
        );
      }
    }

    // ----------------------------------------
    // Return successful REST response
    // ----------------------------------------

    return res.status(200).json({
      success: true,
      message: "Imperial strategy piece moved successfully.",
      data: {
        piece,
      },
    });
  } catch (error) {
    // ----------------------------------------
    // Occupied square
    // ----------------------------------------

    if (
      error.code === "23505" &&
      error.constraint === "war_board_unique_square"
    ) {
      return res.status(409).json({
        success: false,
        message: "That board square is already occupied.",
      });
    }

    console.error("Failed to move war board piece:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update imperial strategy board.",
    });
  }
}

import { pool } from "../db/pool.js";

const MAX_MESSAGE_LENGTH = 2000;
const HISTORY_LIMIT = 50;

// ==========================================
// GET /api/worlds/:worldId/chat/messages
// Retrieve the latest 50 messages in this world.
// Authentication and active character access
// are enforced by chatRoutes middleware.
// ==========================================
export async function getChatMessages(req, res) {
  const { worldId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT * FROM (
        SELECT
          m.id,
          m.world_id,
          m.sender_user_id,
          m.sender_world_character_id,
          m.content,
          m.created_at,
          c.name AS sender_name,
          c.slug AS sender_slug,
          c.portrait_url AS sender_portrait_url
        FROM chat_messages m
        JOIN world_characters wc
          ON wc.id = m.sender_world_character_id
         AND wc.world_id = m.world_id
        JOIN characters c ON c.id = wc.character_id
        WHERE m.world_id = $1
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT $2
      ) recent
      ORDER BY created_at ASC, id ASC
      `,
      [worldId, HISTORY_LIMIT],
    );

    return res.status(200).json({
      success: true,
      data: { messages: result.rows },
    });
  } catch (error) {
    console.error("Failed to retrieve chat messages:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve imperial communications.",
    });
  }
}

// ==========================================
// POST /api/worlds/:worldId/chat/messages
// Persist a message as the authenticated user's
// currently assigned world character.
// ==========================================
export async function sendChatMessage(req, res) {
  const { worldId } = req.params;
  const rawContent = req.body?.content;

  if (typeof rawContent !== "string") {
    return res.status(400).json({
      success: false,
      message: "Message content must be text.",
    });
  }

  const content = rawContent.trim();

  if (content.length < 1 || content.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Message must contain 1 to ${MAX_MESSAGE_LENGTH} characters.`,
    });
  }

  try {
    // Resolve sender from the active membership and assignment,
    // not from a client-supplied character ID. Recheck during INSERT
    // in case access changed since the authorization middleware ran.
    const result = await pool.query(
      `
      WITH saved AS (
        INSERT INTO chat_messages (
          world_id,
          sender_user_id,
          sender_world_character_id,
          content
        )
        SELECT
          wm.world_id,
          wm.user_id,
          wc.id,
          $3
        FROM world_members wm
        JOIN character_assignments ca
          ON ca.world_member_id = wm.id
         AND ca.world_id = wm.world_id
         AND ca.revoked_at IS NULL
        JOIN world_characters wc
          ON wc.id = ca.world_character_id
         AND wc.world_id = wm.world_id
         AND wc.status = 'active'
        WHERE wm.world_id = $1
          AND wm.user_id = $2
          AND wm.status = 'active'
          AND wc.id = $4
        RETURNING *
      )
      SELECT
        saved.id,
        saved.world_id,
        saved.sender_user_id,
        saved.sender_world_character_id,
        saved.content,
        saved.created_at,
        c.name AS sender_name,
        c.slug AS sender_slug,
        c.portrait_url AS sender_portrait_url
      FROM saved
      JOIN world_characters wc
        ON wc.id = saved.sender_world_character_id
       AND wc.world_id = saved.world_id
      JOIN characters c ON c.id = wc.character_id
      `,
      [worldId, req.user.id, content, req.character.id],
    );

    if (result.rowCount === 0) {
      return res.status(403).json({
        success: false,
        message: "You no longer have an active character in this world.",
      });
    }

    const message = result.rows[0];

    // A validated Socket.IO broadcaster will be registered on
    // the Express app in the real-time integration step.
    const broadcastChatMessage = req.app.get("broadcastChatMessage");

    if (typeof broadcastChatMessage === "function") {
      try {
        await broadcastChatMessage({ worldId, message });
      } catch (broadcastError) {
        // Message is already saved: don't report a false failure.
        console.error("Chat notification failed:", broadcastError);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: { message },
    });
  } catch (error) {
    console.error("Failed to send chat message:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send imperial communication.",
    });
  }
}

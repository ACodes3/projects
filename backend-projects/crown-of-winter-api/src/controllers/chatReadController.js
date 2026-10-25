
import { pool } from "../db/pool.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return (
    typeof value === "string" &&
    UUID_PATTERN.test(value)
  );
}

function handleServerError(res, error) {
  console.error(
    "Imperial Communications read-state error:",
    error,
  );

  return res.status(500).json({
    success: false,
    message: "Unable to update correspondence status.",
  });
}

// ==========================================
// GET CONVERSATION UNREAD COUNTS
//
// GET /api/worlds/:worldId/chat/unread
// ==========================================

export async function getChatUnreadCounts(req, res) {
  const { worldId } = req.params;

  const characterId = req.character.id;
  const memberId = req.character.membership_id;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `
      WITH accessible_conversations AS (
        SELECT cc.id, cc.world_id
        FROM chat_conversations cc
        WHERE cc.world_id = $1
          AND (
            cc.kind = 'world'
            OR (
              cc.kind = 'direct'
              AND $2 IN (
                cc.character_a_id,
                cc.character_b_id
              )
              AND EXISTS (
                SELECT 1
                FROM chat_conversation_participants cp
                WHERE cp.conversation_id = cc.id
                  AND cp.world_id = cc.world_id
                  AND cp.world_character_id = $2
              )
              AND (
                SELECT COUNT(*)
                FROM chat_conversation_participants cp
                WHERE cp.conversation_id = cc.id
                  AND cp.world_id = cc.world_id
                  AND cp.world_character_id IN (
                    cc.character_a_id,
                    cc.character_b_id
                  )
              ) = 2
            )
          )
      )
      SELECT
        ac.id AS conversation_id,
        COUNT(m.id)::int AS unread_count
      FROM accessible_conversations ac
      LEFT JOIN chat_conversation_read_states rs
        ON rs.conversation_id = ac.id
       AND rs.world_id = ac.world_id
       AND rs.world_member_id = $3
      LEFT JOIN chat_messages m
        ON m.conversation_id = ac.id
       AND m.world_id = ac.world_id
       AND m.sender_user_id <> $4
       AND m.created_at > COALESCE(
         rs.last_read_at,
         '-infinity'::timestamptz
       )
      GROUP BY ac.id
      ORDER BY ac.id
      `,
      [worldId, characterId, memberId, userId],
    );

    const unreadCounts = result.rows;

    const totalUnread = unreadCounts.reduce(
      (sum, item) => sum + item.unread_count,
      0,
    );

    return res.status(200).json({
      success: true,
      data: {
        unread_counts: unreadCounts,
        total_unread: totalUnread,
      },
    });
  } catch (error) {
    return handleServerError(res, error);
  }
}

// ==========================================
// MARK CONVERSATION AS READ
//
// POST /api/worlds/:worldId/chat/
//      conversations/:conversationId/read
// ==========================================

export async function markChatConversationRead(
  req,
  res,
) {
  const { worldId, conversationId } = req.params;

  if (!isUuid(conversationId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid conversation ID.",
    });
  }

  const characterId = req.character.id;
  const memberId = req.character.membership_id;

  try {
    // Insert or advance the member's read position.
    // Conversation authorization is checked in SQL.
    // A read position can never move backwards.

    const result = await pool.query(
      `
      INSERT INTO chat_conversation_read_states (
        conversation_id,
        world_id,
        world_member_id,
        last_read_at
      )
      SELECT
        cc.id,
        cc.world_id,
        $3,
        NOW()
      FROM chat_conversations cc
      WHERE cc.id = $1
        AND cc.world_id = $2
        AND (
          cc.kind = 'world'
          OR (
            cc.kind = 'direct'
            AND $4 IN (
              cc.character_a_id,
              cc.character_b_id
            )
            AND EXISTS (
              SELECT 1
              FROM chat_conversation_participants cp
              WHERE cp.conversation_id = cc.id
                AND cp.world_id = cc.world_id
                AND cp.world_character_id = $4
            )
            AND (
              SELECT COUNT(*)
              FROM chat_conversation_participants cp
              WHERE cp.conversation_id = cc.id
                AND cp.world_id = cc.world_id
                AND cp.world_character_id IN (
                  cc.character_a_id,
                  cc.character_b_id
                )
            ) = 2
          )
        )
      ON CONFLICT (
        conversation_id,
        world_member_id
      )
      DO UPDATE SET
        last_read_at = GREATEST(
          chat_conversation_read_states.last_read_at,
          EXCLUDED.last_read_at
        )
      RETURNING
        conversation_id,
        last_read_at
      `,
      [
        conversationId,
        worldId,
        memberId,
        characterId,
      ],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        conversation_id:
          result.rows[0].conversation_id,
        last_read_at:
          result.rows[0].last_read_at,
      },
    });
  } catch (error) {
    return handleServerError(res, error);
  }
}

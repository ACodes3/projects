import { pool } from "../db/pool.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HISTORY_LIMIT = 50;
const MAX_MESSAGE_LENGTH = 2000;

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function serverError(res, label, error) {
  console.error(label, error);
  return res.status(500).json({
    success: false,
    message: "Unable to process imperial correspondence.",
  });
}

// Called only after authenticate + loadWorldCharacter middleware.
// A direct chat must belong to the requesting character. For the common
// world chat, loadWorldCharacter already verifies current world access.
async function getAccessibleConversation(db, worldId, conversationId, characterId) {
  const result = await db.query(
    `
    SELECT cc.id, cc.world_id, cc.kind,
           cc.character_a_id, cc.character_b_id, cc.created_at
    FROM chat_conversations cc
    WHERE cc.id = $1
      AND cc.world_id = $2
      AND (
        cc.kind = 'world'
        OR (
          cc.kind = 'direct'
          AND cc.character_a_id <> cc.character_b_id
          AND EXISTS (
            SELECT 1
            FROM chat_conversation_participants cp
            WHERE cp.conversation_id = cc.id
              AND cp.world_id = cc.world_id
              AND cp.world_character_id = $3
          )
          AND cc.character_a_id IS NOT NULL
          AND cc.character_b_id IS NOT NULL
          AND (
            SELECT COUNT(*)
            FROM chat_conversation_participants cp
            WHERE cp.conversation_id = cc.id
              AND cp.world_id = cc.world_id
              AND cp.world_character_id IN (cc.character_a_id, cc.character_b_id)
          ) = 2
        )
      )
    LIMIT 1
    `,
    [conversationId, worldId, characterId],
  );
  return result.rows[0] ?? null;
}

// GET /api/worlds/:worldId/chat/contacts
export async function getChatContacts(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT wc.id AS world_character_id,
             c.name, c.slug, c.portrait_url
      FROM world_members wm
      JOIN character_assignments ca
        ON ca.world_member_id = wm.id
       AND ca.world_id = wm.world_id
       AND ca.revoked_at IS NULL
      JOIN world_characters wc
        ON wc.id = ca.world_character_id
       AND wc.world_id = wm.world_id
       AND wc.status = 'active'
      JOIN characters c ON c.id = wc.character_id
      JOIN users u ON u.id = wm.user_id AND u.account_status = 'active'
      WHERE wm.world_id = $1
        AND wm.status = 'active'
        AND wc.id <> $2
      ORDER BY c.name ASC
      `,
      [req.params.worldId, req.character.id],
    );
    return res.status(200).json({ success: true, data: { contacts: result.rows } });
  } catch (error) {
    return serverError(res, "Failed to retrieve chat contacts:", error);
  }
}

// GET /api/worlds/:worldId/chat/conversations
export async function getChatConversations(req, res) {
  const { worldId } = req.params;
  const characterId = req.character.id;
  try {
    // Also provisions the common chat for worlds created after migration 002.
    await pool.query(
      `INSERT INTO chat_conversations (world_id, kind)
       SELECT id, 'world' FROM worlds WHERE id = $1
       ON CONFLICT (world_id) WHERE kind = 'world' DO NOTHING`,
      [worldId],
    );

    const result = await pool.query(
      `
      SELECT cc.id, cc.world_id, cc.kind, cc.created_at,
             CASE WHEN cc.kind = 'direct' THEN wc.id END AS other_world_character_id,
             CASE WHEN cc.kind = 'direct' THEN c.name END AS other_name,
             CASE WHEN cc.kind = 'direct' THEN c.slug END AS other_slug,
             CASE WHEN cc.kind = 'direct' THEN c.portrait_url END AS other_portrait_url,
             last_message.id AS last_message_id,
             last_message.content AS last_message_content,
             last_message.created_at AS last_message_at
      FROM chat_conversations cc
      LEFT JOIN world_characters wc
        ON wc.id = CASE WHEN cc.character_a_id = $2
                       THEN cc.character_b_id ELSE cc.character_a_id END
       AND wc.world_id = cc.world_id AND cc.kind = 'direct'
      LEFT JOIN characters c ON c.id = wc.character_id
      LEFT JOIN LATERAL (
        SELECT m.id, m.content, m.created_at
        FROM chat_messages m
        WHERE m.conversation_id = cc.id
          AND m.world_id = cc.world_id
        ORDER BY m.created_at DESC, m.id DESC LIMIT 1
      ) last_message ON TRUE
      WHERE cc.world_id = $1
        AND (
          cc.kind = 'world'
          OR (
            cc.kind = 'direct'
            AND EXISTS (
              SELECT 1 FROM chat_conversation_participants cp
              WHERE cp.conversation_id = cc.id
                AND cp.world_id = cc.world_id
                AND cp.world_character_id = $2
            )
          )
        )
      ORDER BY CASE WHEN cc.kind = 'world' THEN 0 ELSE 1 END,
               last_message.created_at DESC NULLS LAST, cc.created_at DESC
      `,
      [worldId, characterId],
    );
    return res.status(200).json({ success: true, data: { conversations: result.rows } });
  } catch (error) {
    return serverError(res, "Failed to retrieve conversations:", error);
  }
}

// POST /api/worlds/:worldId/chat/conversations
// Body: { recipient_world_character_id: UUID }
export async function createDirectConversation(req, res) {
  const { worldId } = req.params;
  const recipientId = req.body?.recipient_world_character_id;
  const senderId = req.character.id;

  if (!isUuid(recipientId) || recipientId === senderId) {
    return res.status(400).json({
      success: false,
      message: "Select another valid world character.",
    });
  }

  const [characterA, characterB] = [senderId, recipientId].sort();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check the recipient has an active membership, assignment and account.
    const eligible = await client.query(
      `SELECT 1
       FROM world_members wm
       JOIN users u ON u.id = wm.user_id AND u.account_status = 'active'
       JOIN character_assignments ca
         ON ca.world_member_id = wm.id AND ca.world_id = wm.world_id
        AND ca.revoked_at IS NULL
       JOIN world_characters wc
         ON wc.id = ca.world_character_id AND wc.world_id = wm.world_id
        AND wc.status = 'active'
       WHERE wm.world_id = $1 AND wm.status = 'active' AND wc.id = $2
       LIMIT 1`,
      [worldId, recipientId],
    );
    if (!eligible.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "That character is unavailable for correspondence.",
      });
    }

    const result = await client.query(
      `INSERT INTO chat_conversations
         (world_id, kind, character_a_id, character_b_id)
       VALUES ($1, 'direct', $2, $3)
       ON CONFLICT (world_id, character_a_id, character_b_id)
         WHERE kind = 'direct'
       DO UPDATE SET world_id = EXCLUDED.world_id
       RETURNING id, world_id, kind, character_a_id, character_b_id, created_at`,
      [worldId, characterA, characterB],
    );
    const conversation = result.rows[0];

    await client.query(
      `INSERT INTO chat_conversation_participants
         (conversation_id, world_id, world_character_id)
       VALUES ($1, $2, $3), ($1, $2, $4)
       ON CONFLICT (conversation_id, world_character_id) DO NOTHING`,
      [conversation.id, worldId, characterA, characterB],
    );

    await client.query("COMMIT");
    return res.status(200).json({ success: true, data: { conversation } });
  } catch (error) {
    await client.query("ROLLBACK");
    return serverError(res, "Failed to create direct conversation:", error);
  } finally {
    client.release();
  }
}

// GET /api/worlds/:worldId/chat/conversations/:conversationId/messages
export async function getConversationMessages(req, res) {
  const { worldId, conversationId } = req.params;
  if (!isUuid(conversationId)) {
    return res.status(400).json({ success: false, message: "Invalid conversation ID." });
  }
  try {
    const conversation = await getAccessibleConversation(
      pool, worldId, conversationId, req.character.id,
    );
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }
    const result = await pool.query(
      `SELECT * FROM (
         SELECT m.id, m.world_id, m.conversation_id,
                m.sender_user_id, m.sender_world_character_id,
                m.content, m.created_at,
                c.name AS sender_name, c.slug AS sender_slug,
                c.portrait_url AS sender_portrait_url
         FROM chat_messages m
         JOIN world_characters wc
           ON wc.id = m.sender_world_character_id AND wc.world_id = m.world_id
         JOIN characters c ON c.id = wc.character_id
         WHERE m.world_id = $1 AND m.conversation_id = $2
         ORDER BY m.created_at DESC, m.id DESC
         LIMIT $3
       ) recent ORDER BY created_at ASC, id ASC`,
      [worldId, conversationId, HISTORY_LIMIT],
    );
    return res.status(200).json({ success: true, data: { messages: result.rows } });
  } catch (error) {
    return serverError(res, "Failed to retrieve conversation messages:", error);
  }
}

// POST /api/worlds/:worldId/chat/conversations/:conversationId/messages
export async function sendConversationMessage(req, res) {
  const { worldId, conversationId } = req.params;
  const rawContent = req.body?.content;
  if (!isUuid(conversationId)) {
    return res.status(400).json({ success: false, message: "Invalid conversation ID." });
  }
  if (typeof rawContent !== "string" ||
      rawContent.trim().length < 1 || rawContent.trim().length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Message must contain 1 to ${MAX_MESSAGE_LENGTH} characters.`,
    });
  }

  try {
    // Resolve participant access and sender assignment in the INSERT itself.
    // This avoids trusting any character/user ID from the request body.
    const result = await pool.query(
      `WITH saved AS (
         INSERT INTO chat_messages
           (world_id, conversation_id, sender_user_id,
            sender_world_character_id, content)
         SELECT cc.world_id, cc.id, wm.user_id, wc.id, $5
         FROM chat_conversations cc
         JOIN world_members wm
           ON wm.world_id = cc.world_id AND wm.user_id = $3
          AND wm.status = 'active'
         JOIN character_assignments ca
           ON ca.world_member_id = wm.id AND ca.world_id = wm.world_id
          AND ca.revoked_at IS NULL
         JOIN world_characters wc
           ON wc.id = ca.world_character_id AND wc.world_id = wm.world_id
          AND wc.status = 'active'
         WHERE cc.world_id = $1 AND cc.id = $2 AND wc.id = $4
           AND (cc.kind = 'world' OR (
             cc.kind = 'direct'
             AND EXISTS (
               SELECT 1 FROM chat_conversation_participants cp
               WHERE cp.conversation_id = cc.id AND cp.world_id = cc.world_id
                 AND cp.world_character_id = wc.id
             )
           ))
         RETURNING *
       )
       SELECT saved.id, saved.world_id, saved.conversation_id,
              saved.sender_user_id, saved.sender_world_character_id,
              saved.content, saved.created_at,
              c.name AS sender_name, c.slug AS sender_slug,
              c.portrait_url AS sender_portrait_url
       FROM saved
       JOIN world_characters wc
         ON wc.id = saved.sender_world_character_id
        AND wc.world_id = saved.world_id
       JOIN characters c ON c.id = wc.character_id`,
      [worldId, conversationId, req.user.id, req.character.id, rawContent.trim()],
    );
    if (!result.rowCount) {
      return res.status(403).json({ success: false, message: "Conversation access denied." });
    }
    const message = result.rows[0];
    // Do not emit to the whole world: direct messages need recipient-only delivery.
    // The next step will add conversation-authorized Socket.IO broadcasting.
    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: { message },
    });
  } catch (error) {
    return serverError(res, "Failed to send conversation message:", error);
  }
}
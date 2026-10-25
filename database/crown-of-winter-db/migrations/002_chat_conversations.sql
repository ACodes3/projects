-- CROWN OF WINTER
-- Migration 002: World conversations and private correspondence
-- Run once against the existing database AFTER the original chat tables exist.
-- Preserves existing chat_messages and chat_read_states.

BEGIN;

-- A world has one shared conversation; a direct conversation is a unique
-- unordered pair of world character identities in that world.
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
    kind VARCHAR(10) NOT NULL CHECK (kind IN ('world', 'direct')),
    character_a_id UUID,
    character_b_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_chat_conversation_id_world UNIQUE (id, world_id),
    CONSTRAINT fk_chat_conversation_a
        FOREIGN KEY (character_a_id, world_id)
        REFERENCES world_characters(id, world_id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_conversation_b
        FOREIGN KEY (character_b_id, world_id)
        REFERENCES world_characters(id, world_id) ON DELETE CASCADE,
    CONSTRAINT chk_chat_conversation_kind CHECK (
        (kind = 'world' AND character_a_id IS NULL AND character_b_id IS NULL)
        OR
        (kind = 'direct' AND character_a_id IS NOT NULL
            AND character_b_id IS NOT NULL
            AND character_a_id < character_b_id)
    )
);

CREATE UNIQUE INDEX uq_chat_one_world_conversation
    ON chat_conversations(world_id) WHERE kind = 'world';

CREATE UNIQUE INDEX uq_chat_direct_character_pair
    ON chat_conversations(world_id, character_a_id, character_b_id)
    WHERE kind = 'direct';

-- Direct conversations must have two participants, inserted by the API in
-- the same transaction as the conversation. For world chat all active
-- world members are implicitly authorized; no participant rows are needed.
CREATE TABLE chat_conversation_participants (
    conversation_id UUID NOT NULL,
    world_id UUID NOT NULL,
    world_character_id UUID NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (conversation_id, world_character_id),
    CONSTRAINT fk_chat_participant_conversation
        FOREIGN KEY (conversation_id, world_id)
        REFERENCES chat_conversations(id, world_id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_participant_character
        FOREIGN KEY (world_character_id, world_id)
        REFERENCES world_characters(id, world_id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_participants_character
    ON chat_conversation_participants(world_id, world_character_id);

-- Create a common conversation for EVERY existing world, including
-- Imperial Alliance, before migrating any saved messages.
INSERT INTO chat_conversations (world_id, kind)
SELECT w.id, 'world'
FROM worlds w
ON CONFLICT (world_id) WHERE kind = 'world' DO NOTHING;

-- Attach historical messages to their world's common conversation.
ALTER TABLE chat_messages
    ADD COLUMN conversation_id UUID;

UPDATE chat_messages m
SET conversation_id = cc.id
FROM chat_conversations cc
WHERE cc.world_id = m.world_id
  AND cc.kind = 'world';

ALTER TABLE chat_messages
    ALTER COLUMN conversation_id SET NOT NULL;

ALTER TABLE chat_messages
    ADD CONSTRAINT fk_chat_message_conversation
    FOREIGN KEY (conversation_id, world_id)
    REFERENCES chat_conversations(id, world_id)
    ON DELETE CASCADE;

CREATE INDEX idx_chat_messages_conversation_created
    ON chat_messages(conversation_id, created_at DESC, id DESC);

-- New, conversation-specific read tracking. Keep the old
-- chat_read_states table untouched until the API is migrated.
CREATE TABLE chat_conversation_read_states (
    conversation_id UUID NOT NULL,
    world_id UUID NOT NULL,
    world_member_id UUID NOT NULL,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (conversation_id, world_member_id),
    CONSTRAINT fk_chat_read_conversation
        FOREIGN KEY (conversation_id, world_id)
        REFERENCES chat_conversations(id, world_id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_read_world_member
        FOREIGN KEY (world_member_id, world_id)
        REFERENCES world_members(id, world_id) ON DELETE CASCADE
);

-- Preserve existing common-chat read positions if there are any.
INSERT INTO chat_conversation_read_states
    (conversation_id, world_id, world_member_id, last_read_at)
SELECT cc.id, old.world_id, old.world_member_id, old.last_read_at
FROM chat_read_states old
JOIN chat_conversations cc
  ON cc.world_id = old.world_id AND cc.kind = 'world'
ON CONFLICT (conversation_id, world_member_id) DO NOTHING;

COMMIT;

-- Verification (read-only):
-- SELECT kind, COUNT(*) FROM chat_conversations GROUP BY kind;
-- SELECT COUNT(*) AS total_messages,
--        COUNT(conversation_id) AS linked_messages FROM chat_messages;

-- ============================================
-- CROWN OF WINTER
-- 001 — IMPERIAL COMMUNICATIONS
-- ============================================

BEGIN;

-- --------------------------------------------
-- 1. WORLD CHAT MESSAGES
-- --------------------------------------------

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    world_id UUID NOT NULL,
    sender_user_id UUID NOT NULL,
    sender_world_character_id UUID NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_chat_message_world
        FOREIGN KEY (world_id)
        REFERENCES worlds(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_chat_message_user
        FOREIGN KEY (sender_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_chat_message_character
        FOREIGN KEY (sender_world_character_id, world_id)
        REFERENCES world_characters(id, world_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_chat_message_content
        CHECK (
            LENGTH(TRIM(content)) BETWEEN 1 AND 2000
        )
);

CREATE INDEX idx_chat_messages_world_created
    ON chat_messages (
        world_id,
        created_at DESC,
        id DESC
    );

-- --------------------------------------------
-- 2. CHAT READ STATES
-- --------------------------------------------

CREATE TABLE chat_read_states (
    world_id UUID NOT NULL,
    world_member_id UUID NOT NULL,

    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_chat_read_states
        PRIMARY KEY (world_id, world_member_id),

    CONSTRAINT fk_chat_read_state_member
        FOREIGN KEY (world_member_id, world_id)
        REFERENCES world_members(id, world_id)
        ON DELETE CASCADE
);

COMMIT;

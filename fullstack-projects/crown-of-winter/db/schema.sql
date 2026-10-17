-- Crown of Winter — database schema backup
-- PostgreSQL 15+
-- Run on an EMPTY crown-of-winter database.
-- This reproduces the tables and constraints created through Step 2.11.
-- Gameplay and audit-log tables have not been created yet.

BEGIN;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    account_status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (account_status IN ('active', 'suspended', 'disabled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_session_expiry CHECK (expires_at > created_at)
);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

CREATE TABLE worlds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    mode VARCHAR(20) NOT NULL DEFAULT 'singleplayer'
        CHECK (mode IN ('singleplayer', 'multiplayer')),
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_world_creator FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE RESTRICT
);
CREATE INDEX idx_worlds_created_by ON worlds(created_by);

CREATE TABLE world_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'invited'
        CHECK (status IN ('invited', 'active', 'removed')),
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_world_member_world FOREIGN KEY (world_id)
        REFERENCES worlds(id) ON DELETE CASCADE,
    CONSTRAINT fk_world_member_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_world_member UNIQUE (world_id, user_id),
    CONSTRAINT chk_world_member_joined CHECK (status <> 'active' OR joined_at IS NOT NULL),
    CONSTRAINT uq_world_members_id_world UNIQUE (id, world_id)
);
CREATE INDEX idx_world_members_user_id ON world_members(user_id);

CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(150),
    description TEXT,
    portrait_url TEXT,
    is_unique BOOLEAN NOT NULL DEFAULT TRUE,
    is_playable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_character_name CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_character_slug CHECK (LENGTH(TRIM(slug)) > 0)
);

CREATE TABLE world_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL,
    character_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'absent', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_world_character_world FOREIGN KEY (world_id)
        REFERENCES worlds(id) ON DELETE CASCADE,
    CONSTRAINT fk_world_character_character FOREIGN KEY (character_id)
        REFERENCES characters(id) ON DELETE RESTRICT,
    CONSTRAINT uq_world_character UNIQUE (world_id, character_id),
    CONSTRAINT uq_world_character_id_world UNIQUE (id, world_id)
);

CREATE TABLE character_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL,
    world_character_id UUID NOT NULL,
    world_member_id UUID NOT NULL,
    assigned_by UUID,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    CONSTRAINT fk_assignment_world FOREIGN KEY (world_id)
        REFERENCES worlds(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_character FOREIGN KEY (world_character_id, world_id)
        REFERENCES world_characters(id, world_id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_member FOREIGN KEY (world_member_id, world_id)
        REFERENCES world_members(id, world_id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_authorizer FOREIGN KEY (assigned_by, world_id)
        REFERENCES world_characters(id, world_id) ON DELETE SET NULL (assigned_by),
    CONSTRAINT chk_assignment_dates CHECK (revoked_at IS NULL OR revoked_at >= assigned_at)
);
CREATE UNIQUE INDEX uq_active_character_assignment
    ON character_assignments(world_character_id) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX uq_active_member_assignment
    ON character_assignments(world_member_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_character_assignments_world ON character_assignments(world_id);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_role_code CHECK (LENGTH(TRIM(code)) > 0),
    CONSTRAINT chk_role_name CHECK (LENGTH(TRIM(name)) > 0)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_permission_code CHECK (LENGTH(TRIM(code)) > 0)
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_role_permissions PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id)
        REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id)
        REFERENCES permissions(id) ON DELETE CASCADE
);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

CREATE TABLE world_character_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL,
    world_character_id UUID NOT NULL,
    role_id UUID NOT NULL,
    assigned_by UUID,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_wcr_character FOREIGN KEY (world_character_id, world_id)
        REFERENCES world_characters(id, world_id) ON DELETE CASCADE,
    CONSTRAINT fk_wcr_role FOREIGN KEY (role_id)
        REFERENCES roles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_wcr_assigned_by FOREIGN KEY (assigned_by, world_id)
        REFERENCES world_characters(id, world_id) ON DELETE SET NULL (assigned_by),
    CONSTRAINT uq_world_character_role UNIQUE (world_character_id, role_id)
);
CREATE INDEX idx_wcr_role_id ON world_character_roles(role_id);
CREATE INDEX idx_wcr_world_id ON world_character_roles(world_id);

CREATE OR REPLACE FUNCTION validate_sovereign_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_slug VARCHAR(100);
    target_role VARCHAR(60);
BEGIN
    SELECT c.slug INTO target_slug
    FROM world_characters wc
    JOIN characters c ON c.id = wc.character_id
    WHERE wc.id = NEW.world_character_id AND wc.world_id = NEW.world_id;

    SELECT r.code INTO target_role FROM roles r WHERE r.id = NEW.role_id;

    IF target_role = 'SOVEREIGN' AND target_slug IS DISTINCT FROM 'tsaritsa' THEN
        RAISE EXCEPTION 'Only the Tsaritsa can hold the SOVEREIGN role.';
    END IF;

    IF target_slug = 'tsaritsa' AND target_role <> 'SOVEREIGN' THEN
        RAISE EXCEPTION 'The Tsaritsa cannot receive non-sovereign roles.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_sovereign_role
BEFORE INSERT OR UPDATE ON world_character_roles
FOR EACH ROW EXECUTE FUNCTION validate_sovereign_role();

COMMIT;

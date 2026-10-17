
-- ============================================
-- CROWN OF WINTER
-- Migration: Protect Sovereign Authority
-- PostgreSQL 15+
-- ============================================

BEGIN;

-- --------------------------------------------
-- 1. Protect the Sovereign role assignment
-- --------------------------------------------

CREATE OR REPLACE FUNCTION protect_sovereign_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    old_role_code VARCHAR(60);
BEGIN
    SELECT code
    INTO old_role_code
    FROM roles
    WHERE id = OLD.role_id;

    IF old_role_code = 'SOVEREIGN' THEN
        RAISE EXCEPTION
            'The Sovereign role cannot be removed or transferred.'
            USING ERRCODE = '23514';
    END IF;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_sovereign_role
ON world_character_roles;

CREATE TRIGGER trg_protect_sovereign_role
BEFORE DELETE OR UPDATE
ON world_character_roles
FOR EACH ROW
EXECUTE FUNCTION protect_sovereign_role();


-- --------------------------------------------
-- 2. Protect the Tsaritsa's player assignment
-- --------------------------------------------

CREATE OR REPLACE FUNCTION protect_sovereign_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    character_slug VARCHAR(100);
BEGIN
    SELECT c.slug
    INTO character_slug
    FROM world_characters wc
    JOIN characters c
        ON c.id = wc.character_id
    WHERE wc.id = OLD.world_character_id;

    IF character_slug = 'tsaritsa' THEN
        RAISE EXCEPTION
            'The Tsaritsa assignment cannot be revoked or transferred.'
            USING ERRCODE = '23514';
    END IF;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_sovereign_assignment
ON character_assignments;

CREATE TRIGGER trg_protect_sovereign_assignment
BEFORE DELETE OR UPDATE
ON character_assignments
FOR EACH ROW
EXECUTE FUNCTION protect_sovereign_assignment();


-- --------------------------------------------
-- 3. Prevent changing the Tsaritsa's identity
-- --------------------------------------------

CREATE OR REPLACE FUNCTION protect_sovereign_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    old_slug VARCHAR(100);
    new_slug VARCHAR(100);
BEGIN
    SELECT slug INTO old_slug
    FROM characters
    WHERE id = OLD.character_id;

    SELECT slug INTO new_slug
    FROM characters
    WHERE id = NEW.character_id;

    IF old_slug = 'tsaritsa'
       OR new_slug = 'tsaritsa'
    THEN
        IF NEW.character_id IS DISTINCT FROM OLD.character_id
           OR NEW.world_id IS DISTINCT FROM OLD.world_id
        THEN
            RAISE EXCEPTION
                'The Sovereign character identity cannot be changed.'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_sovereign_identity
ON world_characters;

CREATE TRIGGER trg_protect_sovereign_identity
BEFORE UPDATE
ON world_characters
FOR EACH ROW
EXECUTE FUNCTION protect_sovereign_identity();

COMMIT;


SELECT
    event_object_table AS table_name,
    trigger_name,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN (
    'trg_protect_sovereign_role',
    'trg_protect_sovereign_assignment',
    'trg_protect_sovereign_identity'
)
ORDER BY table_name, trigger_name;

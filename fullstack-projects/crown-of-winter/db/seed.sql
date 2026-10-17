-- Crown of Winter — initial reference data
-- Run AFTER schema.sql. Safe to rerun; existing rows are not overwritten.
-- No users or worlds are seeded: accounts must be created through the server.

BEGIN;

INSERT INTO characters (name, slug, title, description, is_unique, is_playable)
VALUES ('The Tsaritsa', 'tsaritsa', 'Cryo Archon and Sovereign of Snezhnaya',
        'Supreme ruler of Snezhnaya and ultimate authority of the Fatui.', TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roles (code, name, description, is_system_role)
VALUES
('SOVEREIGN', 'Sovereign', 'Supreme ruler of Snezhnaya with complete in-world authority.', TRUE),
('DIRECTOR', 'Director', 'Oversees high-level Fatui administration and coordination.', TRUE),
('HARBINGER', 'Fatui Harbinger', 'Commands authorized Fatui operations and personnel.', TRUE),
('RESEARCH_DIRECTOR', 'Research Director', 'Manages research projects, personnel and laboratories.', FALSE),
('PALACE_ADMIN', 'Palace Administrator', 'Manages palace operations, personnel and facilities.', FALSE),
('PALACE_STAFF', 'Palace Staff', 'Handles assigned palace duties and correspondence.', FALSE),
('INTELLIGENCE_OFFICER', 'Intelligence Officer', 'Handles authorized intelligence reports and investigations.', FALSE),
('RESEARCHER', 'Researcher', 'Works on assigned research projects.', FALSE),
('AGENT', 'Fatui Agent', 'Carries out assigned operations and field duties.', FALSE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, description)
VALUES
('characters.view', 'View character profiles.'),
('characters.assign', 'Assign characters to players.'),
('characters.revoke', 'Revoke character assignments.'),
('characters.manage', 'Manage character records.'),
('roles.view', 'View roles and permissions.'),
('roles.assign', 'Assign roles to characters.'),
('roles.revoke', 'Revoke character roles.'),
('roles.manage', 'Manage configurable roles.'),
('directives.view', 'View authorized directives.'),
('directives.create', 'Issue new directives.'),
('directives.manage', 'Update and revoke authorized directives.'),
('operations.view', 'View authorized operations.'),
('operations.create', 'Create new operations.'),
('operations.manage', 'Manage operations and assignments.'),
('intelligence.read', 'Read authorized intelligence reports.'),
('intelligence.create', 'Submit intelligence reports.'),
('intelligence.manage', 'Manage intelligence records.'),
('research.view', 'View authorized research projects.'),
('research.create', 'Create research projects.'),
('research.manage', 'Manage laboratories and research projects.'),
('palace.view', 'View authorized palace information.'),
('palace.manage', 'Manage palace operations and personnel.'),
('treasury.view', 'View authorized treasury records.'),
('treasury.manage', 'Manage treasury allocations and budgets.'),
('gnoses.view', 'View authorized Gnosis records.'),
('gnoses.manage', 'Manage Gnosis-related records.'),
('vault.view', 'View authorized vault records.'),
('vault.manage', 'Manage relics and vault access.'),
('world.members.view', 'View world membership.'),
('world.members.invite', 'Invite players to the world.'),
('world.members.remove', 'Remove players from the world.'),
('audit.view', 'View administrative audit records.')
ON CONFLICT (code) DO NOTHING;

-- Sovereign gets all existing permissions.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'SOVEREIGN'
ON CONFLICT DO NOTHING;

-- Role-to-permission mapping for all other starter roles.
WITH grants (role_code, permission_code) AS (
    VALUES
    ('DIRECTOR', 'characters.view'),
    ('DIRECTOR', 'roles.view'),
    ('DIRECTOR', 'directives.view'),
    ('DIRECTOR', 'directives.create'),
    ('DIRECTOR', 'directives.manage'),
    ('DIRECTOR', 'operations.view'),
    ('DIRECTOR', 'operations.create'),
    ('DIRECTOR', 'operations.manage'),
    ('DIRECTOR', 'intelligence.read'),
    ('DIRECTOR', 'world.members.view'),
    ('HARBINGER', 'characters.view'),
    ('HARBINGER', 'directives.view'),
    ('HARBINGER', 'operations.view'),
    ('HARBINGER', 'operations.create'),
    ('HARBINGER', 'operations.manage'),
    ('HARBINGER', 'intelligence.read'),
    ('RESEARCH_DIRECTOR', 'research.view'),
    ('RESEARCH_DIRECTOR', 'research.create'),
    ('RESEARCH_DIRECTOR', 'research.manage'),
    ('RESEARCH_DIRECTOR', 'vault.view'),
    ('RESEARCHER', 'research.view'),
    ('RESEARCHER', 'intelligence.create'),
    ('PALACE_ADMIN', 'palace.view'),
    ('PALACE_ADMIN', 'palace.manage'),
    ('PALACE_ADMIN', 'characters.view'),
    ('PALACE_ADMIN', 'treasury.view'),
    ('PALACE_STAFF', 'palace.view'),
    ('PALACE_STAFF', 'directives.view'),
    ('INTELLIGENCE_OFFICER', 'intelligence.read'),
    ('INTELLIGENCE_OFFICER', 'intelligence.create'),
    ('INTELLIGENCE_OFFICER', 'operations.view'),
    ('AGENT', 'directives.view'),
    ('AGENT', 'operations.view'),
    ('AGENT', 'intelligence.create')
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM grants g
JOIN roles r ON r.code = g.role_code
JOIN permissions p ON p.code = g.permission_code
ON CONFLICT DO NOTHING;

COMMIT;

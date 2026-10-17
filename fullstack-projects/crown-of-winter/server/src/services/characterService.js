
import { pool } from "../db/pool.js";

export class CharacterError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

// Verify that the authenticated user controls
// the Tsaritsa in the requested world.
async function requireSovereign(db, worldId, userId) {
  const result = await db.query(
    `
    SELECT wc.id AS sovereign_id
    FROM world_members wm
    JOIN character_assignments ca
      ON ca.world_member_id = wm.id
      AND ca.world_id = wm.world_id
      AND ca.revoked_at IS NULL
    JOIN world_characters wc
      ON wc.id = ca.world_character_id
      AND wc.world_id = wm.world_id
    JOIN characters c
      ON c.id = wc.character_id
    JOIN world_character_roles wcr
      ON wcr.world_character_id = wc.id
      AND wcr.world_id = wc.world_id
    JOIN roles r
      ON r.id = wcr.role_id
    WHERE wm.world_id = $1
      AND wm.user_id = $2
      AND wm.status = 'active'
      AND c.slug = 'tsaritsa'
      AND r.code = 'SOVEREIGN'
    LIMIT 1
    `,
    [worldId, userId]
  );

  if (result.rowCount === 0) {
    throw new CharacterError(
      "Sovereign authority required.",
      403
    );
  }

  return result.rows[0].sovereign_id;
}

// -----------------------------------------
// List characters and their assignment status
// -----------------------------------------

export async function getWorldCharacters(worldId, userId) {
  if (!isUuid(worldId)) {
    throw new CharacterError("Invalid world ID.");
  }

  await requireSovereign(pool, worldId, userId);

  const result = await pool.query(
    `
    SELECT
      c.id AS character_id,
      c.name,
      c.slug,
      c.title,
      c.portrait_url,
      wc.id AS world_character_id,
      u.username AS assigned_player,
      CASE
        WHEN ca.id IS NOT NULL THEN 'assigned'
        ELSE 'available'
      END AS assignment_status
    FROM characters c
    LEFT JOIN world_characters wc
      ON wc.character_id = c.id
      AND wc.world_id = $1
    LEFT JOIN character_assignments ca
      ON ca.world_character_id = wc.id
      AND ca.revoked_at IS NULL
    LEFT JOIN world_members wm
      ON wm.id = ca.world_member_id
      AND wm.world_id = $1
    LEFT JOIN users u
      ON u.id = wm.user_id
    WHERE c.is_playable = TRUE
    ORDER BY
      CASE WHEN c.slug = 'tsaritsa' THEN 0 ELSE 1 END,
      c.name
    `,
    [worldId]
  );

  return result.rows;
}

// -----------------------------------------
// List active assignments
// -----------------------------------------

export async function getWorldAssignments(worldId, userId) {
  if (!isUuid(worldId)) {
    throw new CharacterError("Invalid world ID.");
  }

  await requireSovereign(pool, worldId, userId);

  const result = await pool.query(
    `
    SELECT
      ca.id AS assignment_id,
      ca.assigned_at,
      wm.id AS membership_id,
      u.username,
      wc.id AS world_character_id,
      c.name AS character_name,
      c.slug AS character_slug,
      COALESCE(
        ARRAY_AGG(DISTINCT r.code)
          FILTER (WHERE r.code IS NOT NULL),
        ARRAY[]::VARCHAR[]
      ) AS roles
    FROM character_assignments ca
    JOIN world_members wm
      ON wm.id = ca.world_member_id
      AND wm.world_id = ca.world_id
    JOIN users u
      ON u.id = wm.user_id
    JOIN world_characters wc
      ON wc.id = ca.world_character_id
      AND wc.world_id = ca.world_id
    JOIN characters c
      ON c.id = wc.character_id
    LEFT JOIN world_character_roles wcr
      ON wcr.world_character_id = wc.id
      AND wcr.world_id = wc.world_id
    LEFT JOIN roles r
      ON r.id = wcr.role_id
    WHERE ca.world_id = $1
      AND ca.revoked_at IS NULL
    GROUP BY
      ca.id, ca.assigned_at,
      wm.id, u.username,
      wc.id, c.name, c.slug
    ORDER BY ca.assigned_at
    `,
    [worldId]
  );

  return result.rows;
}

// -----------------------------------------
// Assign a character and grant initial roles
// -----------------------------------------

export async function assignCharacter({
  worldId,
  actorId,
  membershipId,
  characterId,
  roleCodes,
}) {
  if (
    !isUuid(worldId) ||
    !isUuid(membershipId) ||
    !isUuid(characterId)
  ) {
    throw new CharacterError("Invalid ID supplied.");
  }

  if (
    !Array.isArray(roleCodes) ||
    roleCodes.length === 0 ||
    roleCodes.length > 10 ||
    roleCodes.some(
      (code) =>
        typeof code !== "string" ||
        !/^[A-Z_]{2,60}$/.test(code)
    )
  ) {
    throw new CharacterError(
      "Provide between 1 and 10 valid role codes."
    );
  }

  const uniqueRoles = [...new Set(roleCodes)];

  if (uniqueRoles.includes("SOVEREIGN")) {
    throw new CharacterError(
      "The Sovereign role cannot be assigned.",
      403
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Serialize assignments inside this world.
    const worldResult = await client.query(
      `
      SELECT id
      FROM worlds
      WHERE id = $1
      FOR UPDATE
      `,
      [worldId]
    );

    if (worldResult.rowCount === 0) {
      throw new CharacterError("World not found.", 404);
    }

    const sovereignId = await requireSovereign(
      client,
      worldId,
      actorId
    );

    // Only active members can receive characters.
    const memberResult = await client.query(
      `
      SELECT id, user_id
      FROM world_members
      WHERE id = $1
        AND world_id = $2
        AND status = 'active'
      `,
      [membershipId, worldId]
    );

    if (memberResult.rowCount === 0) {
      throw new CharacterError(
        "Active world member not found.",
        404
      );
    }

    // The sovereign's own character is protected.
    if (memberResult.rows[0].user_id === actorId) {
      throw new CharacterError(
        "The Sovereign's assignment is protected.",
        403
      );
    }

    const characterResult = await client.query(
      `
      SELECT id, name, slug
      FROM characters
      WHERE id = $1
        AND is_playable = TRUE
        AND is_unique = TRUE
      `,
      [characterId]
    );

    if (characterResult.rowCount === 0) {
      throw new CharacterError(
        "Playable unique character not found.",
        404
      );
    }

    const character = characterResult.rows[0];

    if (character.slug === "tsaritsa") {
      throw new CharacterError(
        "The Tsaritsa cannot be reassigned.",
        403
      );
    }

    // Validate every requested role.
    const rolesResult = await client.query(
      `
      SELECT id, code
      FROM roles
      WHERE code = ANY($1::VARCHAR[])
        AND code <> 'SOVEREIGN'
      `,
      [uniqueRoles]
    );

    if (rolesResult.rowCount !== uniqueRoles.length) {
      throw new CharacterError(
        "One or more roles do not exist."
      );
    }

    const existingMemberAssignment = await client.query(
      `
      SELECT id
      FROM character_assignments
      WHERE world_member_id = $1
        AND revoked_at IS NULL
      `,
      [membershipId]
    );

    if (existingMemberAssignment.rowCount > 0) {
      throw new CharacterError(
        "This player already controls a character.",
        409
      );
    }

    // Create the character instance if it does not
    // already exist in this world.
    const worldCharacterResult = await client.query(
      `
      INSERT INTO world_characters (
        world_id,
        character_id
      )
      VALUES ($1, $2)
      ON CONFLICT (world_id, character_id)
      DO UPDATE SET character_id = EXCLUDED.character_id
      RETURNING id
      `,
      [worldId, characterId]
    );

    const worldCharacterId =
      worldCharacterResult.rows[0].id;

    const existingCharacterAssignment = await client.query(
      `
      SELECT id
      FROM character_assignments
      WHERE world_character_id = $1
        AND revoked_at IS NULL
      `,
      [worldCharacterId]
    );

    if (existingCharacterAssignment.rowCount > 0) {
      throw new CharacterError(
        "This character is already assigned.",
        409
      );
    }

    // Assign the character to the player.
    const assignmentResult = await client.query(
      `
      INSERT INTO character_assignments (
        world_id,
        world_character_id,
        world_member_id,
        assigned_by
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, assigned_at
      `,
      [
        worldId,
        worldCharacterId,
        membershipId,
        sovereignId,
      ]
    );

    // Grant the requested roles to the character.
    for (const role of rolesResult.rows) {
      await client.query(
        `
        INSERT INTO world_character_roles (
          world_id,
          world_character_id,
          role_id,
          assigned_by
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (world_character_id, role_id)
        DO NOTHING
        `,
        [
          worldId,
          worldCharacterId,
          role.id,
          sovereignId,
        ]
      );
    }

    await client.query("COMMIT");

    return {
      assignment_id: assignmentResult.rows[0].id,
      assigned_at: assignmentResult.rows[0].assigned_at,
      membership_id: membershipId,
      world_character_id: worldCharacterId,
      character: character.name,
      roles: uniqueRoles,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

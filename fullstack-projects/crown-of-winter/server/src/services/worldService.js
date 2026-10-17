
import { pool } from "../db/pool.js";

// -----------------------------------------
// Create a new world
// -----------------------------------------

export async function createWorld({ userId, name, mode }) {
  if (typeof name !== "string") {
    throw new Error("World name is required.");
  }

  const cleanName = name.trim();

  if (cleanName.length < 3 || cleanName.length > 100) {
    throw new Error(
      "World name must be between 3 and 100 characters."
    );
  }

  if (!["singleplayer", "multiplayer"].includes(mode)) {
    throw new Error("Invalid world mode.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create world
    const worldResult = await client.query(
      `
      INSERT INTO worlds (name, mode, created_by)
      VALUES ($1, $2, $3)
      RETURNING
        id, name, mode, created_by, created_at
      `,
      [cleanName, mode, userId]
    );

    const world = worldResult.rows[0];

    // 2. Add founder as an active world member
    const memberResult = await client.query(
      `
      INSERT INTO world_members (
        world_id, user_id, status, joined_at
      )
      VALUES ($1, $2, 'active', NOW())
      RETURNING id
      `,
      [world.id, userId]
    );

    const memberId = memberResult.rows[0].id;

    // 3. Create the world's unique Tsaritsa
    const characterResult = await client.query(
      `
      INSERT INTO world_characters (
        world_id, character_id
      )
      SELECT $1, id
      FROM characters
      WHERE slug = 'tsaritsa'
        AND is_playable = TRUE
      RETURNING id
      `,
      [world.id]
    );

    if (characterResult.rowCount !== 1) {
      throw new Error("Tsaritsa character not found.");
    }

    const tsaritsaId = characterResult.rows[0].id;

    // 4. Assign the Tsaritsa to the founder
    await client.query(
      `
      INSERT INTO character_assignments (
        world_id,
        world_character_id,
        world_member_id
      )
      VALUES ($1, $2, $3)
      `,
      [world.id, tsaritsaId, memberId]
    );

    // 5. Grant Sovereign role to the Tsaritsa
    const roleResult = await client.query(
      `
      INSERT INTO world_character_roles (
        world_id,
        world_character_id,
        role_id
      )
      SELECT $1, $2, id
      FROM roles
      WHERE code = 'SOVEREIGN'
      RETURNING id
      `,
      [world.id, tsaritsaId]
    );

    if (roleResult.rowCount !== 1) {
      throw new Error("Sovereign role not found.");
    }

    await client.query("COMMIT");

    return {
      ...world,
      character: {
        id: tsaritsaId,
        name: "The Tsaritsa",
        role: "SOVEREIGN",
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// -----------------------------------------
// Get worlds belonging to a user
// -----------------------------------------

export async function getUserWorlds(userId) {
  const result = await pool.query(
    `
    SELECT
      w.id,
      w.name,
      w.mode,
      w.created_by,
      w.created_at,
      wm.status AS membership_status
    FROM worlds w
    JOIN world_members wm
      ON wm.world_id = w.id
    WHERE wm.user_id = $1
      AND wm.status = 'active'
    ORDER BY w.created_at DESC
    `,
    [userId]
  );

  return result.rows;
}

// -----------------------------------------
// Get a single world
// -----------------------------------------

export async function getWorldById(worldId, userId) {
  const result = await pool.query(
    `
    SELECT
      w.id,
      w.name,
      w.mode,
      w.created_by,
      w.created_at,
      wm.status AS membership_status,
      c.name AS character_name,
      wc.id AS world_character_id
    FROM worlds w
    JOIN world_members wm
      ON wm.world_id = w.id
    LEFT JOIN character_assignments ca
      ON ca.world_member_id = wm.id
      AND ca.revoked_at IS NULL
    LEFT JOIN world_characters wc
      ON wc.id = ca.world_character_id
    LEFT JOIN characters c
      ON c.id = wc.character_id
    WHERE w.id = $1
      AND wm.user_id = $2
      AND wm.status = 'active'
    `,
    [worldId, userId]
  );

  return result.rows[0] ?? null;
}

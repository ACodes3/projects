
import { pool } from "../db/pool.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// -----------------------------------------
// Load the current playable character
// -----------------------------------------

export async function loadWorldCharacter(req, res, next) {
  try {
    const { worldId } = req.params;

    if (!UUID_PATTERN.test(worldId ?? "")) {
      return res.status(400).json({
        success: false,
        message: "Invalid world ID.",
      });
    }

    // Confirm that the user is an active world
    // member with an active character assignment.
    const result = await pool.query(
      `
      SELECT
        wm.id AS membership_id,
        wc.id AS world_character_id,
        c.id AS character_id,
        c.name AS character_name,
        c.slug AS character_slug
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
      WHERE wm.world_id = $1
        AND wm.user_id = $2
        AND wm.status = 'active'
        AND wc.status = 'active'
      LIMIT 1
      `,
      [worldId, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({
        success: false,
        message: "No active playable character in this world.",
      });
    }

    const character = result.rows[0];

    // Load the roles assigned to this world character.
    const rolesResult = await pool.query(
      `
      SELECT r.code
      FROM world_character_roles wcr
      JOIN roles r
        ON r.id = wcr.role_id
      WHERE wcr.world_id = $1
        AND wcr.world_character_id = $2
      ORDER BY r.code
      `,
      [worldId, character.world_character_id]
    );

    const roles = rolesResult.rows.map(
      (row) => row.code
    );

    // SOVEREIGN is valid only for the Tsaritsa.
    const isSovereign =
      character.character_slug === "tsaritsa" &&
      roles.includes("SOVEREIGN");

    // Get all permissions provided by the roles.
    const permissionsResult = await pool.query(
      `
      SELECT DISTINCT p.code
      FROM world_character_roles wcr
      JOIN role_permissions rp
        ON rp.role_id = wcr.role_id
      JOIN permissions p
        ON p.id = rp.permission_id
      WHERE wcr.world_id = $1
        AND wcr.world_character_id = $2
      ORDER BY p.code
      `,
      [worldId, character.world_character_id]
    );

    let permissions = permissionsResult.rows.map(
      (row) => row.code
    );

    // The Sovereign receives all current in-world
    // permissions, even newly introduced ones.
    if (isSovereign) {
      const allPermissions = await pool.query(
        `
        SELECT code
        FROM permissions
        ORDER BY code
        `
      );

      permissions = allPermissions.rows.map(
        (row) => row.code
      );
    }

    // Save the verified character and permissions
    // for the next middleware/controller.
    req.character = {
      id: character.world_character_id,
      character_id: character.character_id,
      name: character.character_name,
      slug: character.character_slug,
      world_id: worldId,
      membership_id: character.membership_id,
      roles,
      isSovereign,
    };

    req.permissions = permissions;

    next();
  } catch (error) {
    next(error);
  }
}

// -----------------------------------------
// Require a particular permission
// -----------------------------------------

export function requirePermission(permissionCode) {
  return (req, res, next) => {
    if (!req.character || !req.permissions) {
      return res.status(500).json({
        success: false,
        message: "Authorization context missing.",
      });
    }

    if (
      req.character.isSovereign ||
      req.permissions.includes(permissionCode)
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Insufficient permissions.",
    });
  };
}

// -----------------------------------------
// Require Sovereign authority specifically
// -----------------------------------------

export function requireSovereign(req, res, next) {
  if (!req.character) {
    return res.status(500).json({
      success: false,
      message: "Authorization context missing.",
    });
  }

  if (!req.character.isSovereign) {
    return res.status(403).json({
      success: false,
      message: "Sovereign authority required.",
    });
  }

  next();
}

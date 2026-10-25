
import { pool } from "../db/pool.js";
import { createAuditLog } from "./auditService.js";

export class InvitationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const isUuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// -----------------------------------------
// Check who controls the Sovereign character
// -----------------------------------------

async function requireSovereign(client, worldId, userId) {
  const result = await client.query(
    `
    SELECT wc.id AS world_character_id
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
    throw new InvitationError(
      "Sovereign authority required.",
      403
    );
  }

  return result.rows[0].world_character_id;
}

// -----------------------------------------
// Invite a registered user
// -----------------------------------------

export async function inviteUser({
  worldId,
  actorId,
  username,
}) {
  if (!isUuid(worldId)) {
    throw new InvitationError("Invalid world ID.");
  }

  if (
    typeof username !== "string" ||
    !username.trim()
  ) {
    throw new InvitationError("Username is required.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // -------------------------------------
    // 1. Lock the world
    // -------------------------------------

    const world = await client.query(
      "SELECT id FROM worlds WHERE id = $1 FOR UPDATE",
      [worldId]
    );

    if (world.rowCount === 0) {
      throw new InvitationError(
        "World not found.",
        404
      );
    }

    // -------------------------------------
    // 2. Verify Sovereign authority
    // -------------------------------------

    const sovereignCharacterId = await requireSovereign(
      client,
      worldId,
      actorId
    );

    // -------------------------------------
    // 3. Find the invited account
    // -------------------------------------

    const account = await client.query(
      `
      SELECT id, username
      FROM users
      WHERE LOWER(username) = LOWER($1)
        AND account_status = 'active'
      `,
      [username.trim()]
    );

    if (account.rowCount === 0) {
      throw new InvitationError(
        "No active account found with that username.",
        404
      );
    }

    const target = account.rows[0];

    if (target.id === actorId) {
      throw new InvitationError(
        "You already belong to this world."
      );
    }

    // -------------------------------------
    // 4. Check existing membership
    // -------------------------------------

    const existing = await client.query(
      `
      SELECT id, status
      FROM world_members
      WHERE world_id = $1
        AND user_id = $2
      `,
      [worldId, target.id]
    );

    let membership;

    if (existing.rowCount > 0) {
      const member = existing.rows[0];

      if (member.status !== "removed") {
        throw new InvitationError(
          "This user is already invited or a member.",
          409
        );
      }

      // Reinvite a previously removed member.
      const updated = await client.query(
        `
        UPDATE world_members
        SET status = 'invited',
            joined_at = NULL
        WHERE id = $1
        RETURNING
          id,
          world_id,
          status,
          created_at
        `,
        [member.id]
      );

      membership = updated.rows[0];
    } else {
      // Create a new invitation.
      const inserted = await client.query(
        `
        INSERT INTO world_members (
          world_id,
          user_id,
          status
        )
        VALUES ($1, $2, 'invited')
        RETURNING
          id,
          world_id,
          status,
          created_at
        `,
        [worldId, target.id]
      );

      membership = inserted.rows[0];
    }

    // -------------------------------------
    // 5. Record the invitation
    // -------------------------------------

    await createAuditLog({
      client,
      worldId,
      userId: actorId,
      worldCharacterId: sovereignCharacterId,
      action: "world.member.invited",
      resourceType: "world_member",
      resourceId: membership.id,
      details: {
        invited_user_id: target.id,
        invited_username: target.username,
        membership_id: membership.id,
        status: membership.status,
      },
    });

    // -------------------------------------
    // 6. Commit transaction
    // -------------------------------------

    await client.query("COMMIT");

    return {
      ...membership,
      username: target.username,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// -----------------------------------------
// List world members (Sovereign only)
// -----------------------------------------

export async function getWorldMembers(worldId, actorId) {
  if (!isUuid(worldId)) {
    throw new InvitationError("Invalid world ID.");
  }

  await requireSovereign(pool, worldId, actorId);

  const result = await pool.query(
    `
    SELECT
      wm.id,
      wm.status,
      wm.joined_at,
      u.id AS user_id,
      u.username,
      c.name AS character_name
    FROM world_members wm
    JOIN users u
      ON u.id = wm.user_id
    LEFT JOIN character_assignments ca
      ON ca.world_member_id = wm.id
      AND ca.revoked_at IS NULL
    LEFT JOIN world_characters wc
      ON wc.id = ca.world_character_id
      AND wc.world_id = wm.world_id
    LEFT JOIN characters c
      ON c.id = wc.character_id
    WHERE wm.world_id = $1
    ORDER BY wm.created_at
    `,
    [worldId]
  );

  return result.rows;
}

// -----------------------------------------
// List current user's pending invitations
// -----------------------------------------

export async function getMyInvitations(userId) {
  const result = await pool.query(
    `
    SELECT
      wm.id AS membership_id,
      w.id AS world_id,
      w.name AS world_name,
      w.mode,
      wm.created_at
    FROM world_members wm
    JOIN worlds w
      ON w.id = wm.world_id
    WHERE wm.user_id = $1
      AND wm.status = 'invited'
    ORDER BY wm.created_at DESC
    `,
    [userId]
  );

  return result.rows;
}

// -----------------------------------------
// Accept invitation
// -----------------------------------------

export async function acceptInvitation(membershipId, userId) {
  if (!isUuid(membershipId)) {
    throw new InvitationError(
      "Invalid invitation ID."
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // -------------------------------------
    // 1. Activate the invited membership
    // -------------------------------------

    const result = await client.query(
      `
      UPDATE world_members
      SET status = 'active',
          joined_at = NOW()
      WHERE id = $1
        AND user_id = $2
        AND status = 'invited'
      RETURNING
        id,
        world_id,
        status,
        joined_at
      `,
      [membershipId, userId]
    );

    if (result.rowCount === 0) {
      throw new InvitationError(
        "Invitation not found or no longer pending.",
        404
      );
    }

    const membership = result.rows[0];

    // -------------------------------------
    // 2. Record the player joining
    // -------------------------------------
    // This user does not necessarily have an
    // assigned character yet, so the character
    // reference is intentionally null.

    await createAuditLog({
      client,
      worldId: membership.world_id,
      userId,
      worldCharacterId: null,
      action: "world.member.joined",
      resourceType: "world_member",
      resourceId: membership.id,
      details: {
        membership_id: membership.id,
        joined_user_id: userId,
        status: membership.status,
      },
    });

    // -------------------------------------
    // 3. Commit transaction
    // -------------------------------------

    await client.query("COMMIT");

    return membership;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

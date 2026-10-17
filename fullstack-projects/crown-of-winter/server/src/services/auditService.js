
/**
 * Crown of Winter
 * Audit Logging Service
 *
 * Records important actions performed by users
 * and characters inside the application.
 *
 * Can operate using the main PostgreSQL pool
 * or an existing transaction client.
 */

import { pool } from "../db/pool.js";

/**
 * Create an audit log entry.
 *
 * @param {Object} options
 * @param {Object} [options.client]
 * @param {string|null} [options.worldId]
 * @param {string|null} [options.userId]
 * @param {string|null} [options.worldCharacterId]
 * @param {string} options.action
 * @param {string} options.resourceType
 * @param {string|null} [options.resourceId]
 * @param {Object} [options.details]
 * @param {string|null} [options.ipAddress]
 *
 * @returns {Promise<Object>}
 */
export async function createAuditLog({
  client = pool,
  worldId = null,
  userId = null,
  worldCharacterId = null,
  action,
  resourceType,
  resourceId = null,
  details = {},
  ipAddress = null,
}) {
  // ---------------------------------------
  // Validate required information
  // ---------------------------------------

  if (
    typeof action !== "string" ||
    !action.trim()
  ) {
    throw new Error(
      "Audit action is required."
    );
  }

  if (
    typeof resourceType !== "string" ||
    !resourceType.trim()
  ) {
    throw new Error(
      "Audit resource type is required."
    );
  }

  if (
    details === null ||
    typeof details !== "object" ||
    Array.isArray(details)
  ) {
    throw new Error(
      "Audit details must be an object."
    );
  }

  // ---------------------------------------
  // Insert audit record
  // ---------------------------------------

  const result = await client.query(
    `
    INSERT INTO audit_logs (
      world_id,
      user_id,
      world_character_id,
      action,
      resource_type,
      resource_id,
      details,
      ip_address
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7::jsonb,
      $8
    )
    RETURNING
      id,
      world_id,
      user_id,
      world_character_id,
      action,
      resource_type,
      resource_id,
      details,
      ip_address,
      created_at
    `,
    [
      worldId,
      userId,
      worldCharacterId,
      action.trim(),
      resourceType.trim(),
      resourceId,
      JSON.stringify(details),
      ipAddress,
    ]
  );

  return result.rows[0];
}

/**
 * Retrieve audit records belonging to a world.
 *
 * This function does not perform authorization.
 * Callers must verify that the requesting user
 * has permission to view the world's audit logs.
 *
 * @param {string} worldId
 * @param {Object} options
 * @returns {Promise<Array>}
 */
export async function getWorldAuditLogs(
  worldId,
  {
    client = pool,
    limit = 50,
    offset = 0,
  } = {}
) {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new Error(
      "Audit log limit must be between 1 and 100."
    );
  }

  if (
    !Number.isInteger(offset) ||
    offset < 0
  ) {
    throw new Error(
      "Audit log offset must be a non-negative integer."
    );
  }

  const result = await client.query(
    `
    SELECT
      al.id,
      al.world_id,
      al.user_id,
      al.world_character_id,
      al.action,
      al.resource_type,
      al.resource_id,
      al.details,
      al.ip_address,
      al.created_at,
      u.username AS performed_by
    FROM audit_logs al
    LEFT JOIN users u
      ON u.id = al.user_id
    WHERE al.world_id = $1
    ORDER BY al.created_at DESC, al.id DESC
    LIMIT $2
    OFFSET $3
    `,
    [worldId, limit, offset]
  );

  return result.rows;
}

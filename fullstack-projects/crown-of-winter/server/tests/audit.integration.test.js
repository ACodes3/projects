import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
} from "vitest";

import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../app.js";
import { pool } from "../src/db/pool.js";

import {
  getAdminPool,
  verifyAdminDatabase,
} from "./helpers/adminPool.js";

import {
  getWorldAuditLogs,
} from "../src/services/auditService.js";

// -----------------------------------------
// Test configuration
// -----------------------------------------

const TEST_DATABASE = "crown-of-winter-test";
const TEST_PASSWORD = "WinterTesting2026!";

const runId = randomUUID()
  .replaceAll("-", "")
  .slice(0, 12);

const founderAccount = {
  username: `audit_founder_${runId}`,
  email: `audit_founder_${runId}@example.com`,
  password: TEST_PASSWORD,
};

const friendAccount = {
  username: `audit_friend_${runId}`,
  email: `audit_friend_${runId}@example.com`,
  password: TEST_PASSWORD,
};

const outsiderAccount = {
  username: `audit_outsider_${runId}`,
  email: `audit_outsider_${runId}@example.com`,
  password: TEST_PASSWORD,
};

const createdUserIds = new Set();
const createdWorldIds = new Set();

let databaseVerified = false;

let founderAgent;
let friendAgent;
let outsiderAgent;

let founderId;
let friendId;
let outsiderId;

let firstWorldId;
let secondWorldId;

let firstTsaritsaId;
let secondTsaritsaId;

let invitationId;

// Character assignment audit test data
let dottoreCharacterId;
let dottoreAssignmentId;
let dottoreWorldCharacterId;

// -----------------------------------------
// Database safety
// -----------------------------------------

async function verifyTestDatabase() {
  if (
    process.env.NODE_ENV !== "test" ||
    process.env.DB_NAME !== TEST_DATABASE
  ) {
    throw new Error(
      "Unsafe test environment."
    );
  }

  const result = await pool.query(
    "SELECT current_database() AS database"
  );

  if (result.rows[0].database !== TEST_DATABASE) {
    throw new Error(
      "Audit tests require crown-of-winter-test."
    );
  }

  databaseVerified = true;
}

// -----------------------------------------
// Helpers
// -----------------------------------------

async function registerTestUser(account) {
  const response = await request(app)
    .post("/api/auth/register")
    .send(account);

  expect(response.status).toBe(201);

  const userId = response.body.data.user.id;

  createdUserIds.add(userId);

  return userId;
}

async function loginTestUser(account) {
  const agent = request.agent(app);

  const response = await agent
    .post("/api/auth/login")
    .send({
      identifier: account.username,
      password: account.password,
    });

  expect(response.status).toBe(200);

  return agent;
}

async function createTestWorld(name, mode) {
  const response = await founderAgent
    .post("/api/worlds")
    .send({
      name,
      mode,
    });

  expect(response.status).toBe(201);

  const world = response.body.data.world;

  createdWorldIds.add(world.id);

  return world;
}

async function getAuditEntries(worldId, action) {
  const result = await pool.query(
    `
    SELECT
      id,
      world_id,
      user_id,
      world_character_id,
      action,
      resource_type,
      resource_id,
      details,
      created_at
    FROM audit_logs
    WHERE world_id = $1
      AND action = $2
    ORDER BY created_at, id
    `,
    [worldId, action]
  );

  return result.rows;
}

// -----------------------------------------
// Setup
// -----------------------------------------

beforeAll(async () => {
  await verifyTestDatabase();

  founderId = await registerTestUser(
    founderAccount
  );

  friendId = await registerTestUser(
    friendAccount
  );

  outsiderId = await registerTestUser(
    outsiderAccount
  );

  founderAgent = await loginTestUser(
    founderAccount
  );

  friendAgent = await loginTestUser(
    friendAccount
  );

  outsiderAgent = await loginTestUser(
    outsiderAccount
  );

  // Create two independent worlds.
  const firstWorld = await createTestWorld(
    "Audit Test Palace",
    "multiplayer"
  );

  firstWorldId = firstWorld.id;
  firstTsaritsaId = firstWorld.character.id;

  const secondWorld = await createTestWorld(
    "Audit Test Fortress",
    "singleplayer"
  );

  secondWorldId = secondWorld.id;
  secondTsaritsaId = secondWorld.character.id;

  // Get Dottore's catalog character ID.
  const characterResult = await pool.query(
    `
    SELECT id
    FROM characters
    WHERE slug = 'dottore'
      AND is_playable = TRUE
      AND is_unique = TRUE
    `
  );

  expect(characterResult.rowCount).toBe(1);

  dottoreCharacterId = characterResult.rows[0].id;
}, 20000);

// -----------------------------------------
// Cleanup
// -----------------------------------------

afterAll(async () => {
  if (!databaseVerified) return;

  await verifyTestDatabase();
  await verifyAdminDatabase();

  const admin = getAdminPool();

  if (createdWorldIds.size > 0) {
    const client = await admin.connect();

    try {
      await client.query("BEGIN");

      // Temporary test cleanup bypass.
      // This is not a secure authorization mechanism;
      // it must be replaced in the database triggers.
      await client.query(
        `
        SELECT set_config(
          'crown.world_deletion',
          'authorized',
          true
        )
        `
      );

      await client.query(
        `
        DELETE FROM worlds
        WHERE id = ANY($1::uuid[])
          AND created_by = $2
        `,
        [[...createdWorldIds], founderId]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  if (createdUserIds.size > 0) {
    await admin.query(
      `
      DELETE FROM users
      WHERE id = ANY($1::uuid[])
      `,
      [[...createdUserIds]]
    );
  }
});

// =========================================
// WORLD AUDIT LOGGING
// =========================================

describe("World Audit Logging", () => {

  it("creates an audit record when a world is created", async () => {
    const logs = await getAuditEntries(
      firstWorldId,
      "world.created"
    );

    expect(logs).toHaveLength(1);
    expect(logs[0].id).toBeDefined();
    expect(logs[0].action).toBe("world.created");
  });

  it("records the correct founder and world", async () => {
    const logs = await getAuditEntries(
      firstWorldId,
      "world.created"
    );

    expect(logs).toHaveLength(1);

    const log = logs[0];

    expect(log.world_id).toBe(firstWorldId);
    expect(log.user_id).toBe(founderId);
    expect(log.resource_type).toBe("world");
    expect(log.resource_id).toBe(firstWorldId);
  });

  it("records the Tsaritsa as the responsible character", async () => {
    const logs = await getAuditEntries(
      firstWorldId,
      "world.created"
    );

    expect(logs).toHaveLength(1);

    expect(logs[0].world_character_id).toBe(
      firstTsaritsaId
    );
  });

  it("stores world creation details as JSON", async () => {
    const logs = await getAuditEntries(
      firstWorldId,
      "world.created"
    );

    expect(logs).toHaveLength(1);

    expect(logs[0].details).toMatchObject({
      name: "Audit Test Palace",
      mode: "multiplayer",
      founder_id: founderId,
      sovereign_character: "tsaritsa",
      sovereign_role: "SOVEREIGN",
    });
  });

  it("keeps audit records separated by world", async () => {
    const firstLogs = await getWorldAuditLogs(
      firstWorldId
    );

    const secondLogs = await getWorldAuditLogs(
      secondWorldId
    );

    expect(firstLogs).toHaveLength(1);
    expect(secondLogs).toHaveLength(1);

    expect(firstLogs[0].world_id).toBe(
      firstWorldId
    );

    expect(secondLogs[0].world_id).toBe(
      secondWorldId
    );

    expect(secondLogs[0].world_character_id)
      .toBe(secondTsaritsaId);

    expect(firstLogs[0].id).not.toBe(
      secondLogs[0].id
    );
  });

  it("retrieves audit records with the founder's username", async () => {
    const logs = await getWorldAuditLogs(
      firstWorldId,
      {
        limit: 10,
        offset: 0,
      }
    );

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe("world.created");

    expect(logs[0].performed_by).toBe(
      founderAccount.username
    );

    expect(logs[0].created_at).toBeDefined();
  });

  it("does not log rejected world creation", async () => {
    const before = await pool.query(
      `
      SELECT COUNT(*)::integer AS total
      FROM audit_logs
      WHERE user_id = $1
        AND action = 'world.created'
      `,
      [founderId]
    );

    const response = await founderAgent
      .post("/api/worlds")
      .send({
        name: "A",
        mode: "invalid",
      });

    expect(response.status).toBe(400);

    const after = await pool.query(
      `
      SELECT COUNT(*)::integer AS total
      FROM audit_logs
      WHERE user_id = $1
        AND action = 'world.created'
      `,
      [founderId]
    );

    expect(after.rows[0].total).toBe(
      before.rows[0].total
    );
  });

});

// =========================================
// INVITATION AUDIT LOGGING
// =========================================

describe("Invitation Audit Logging", () => {

  it("records an invitation sent by the Tsaritsa", async () => {
    const response = await founderAgent
      .post(`/api/worlds/${firstWorldId}/invitations`)
      .send({
        username: friendAccount.username,
      });

    expect(response.status).toBe(201);

    invitationId = response.body.data.invitation.id;

    const logs = await getAuditEntries(
      firstWorldId,
      "world.member.invited"
    );

    expect(logs).toHaveLength(1);

    const log = logs[0];

    expect(log.user_id).toBe(founderId);
    expect(log.world_id).toBe(firstWorldId);

    expect(log.world_character_id).toBe(
      firstTsaritsaId
    );

    expect(log.resource_type).toBe("world_member");
    expect(log.resource_id).toBe(invitationId);
  });

  it("stores the correct invitation details", async () => {
    const logs = await getAuditEntries(
      firstWorldId,
      "world.member.invited"
    );

    expect(logs).toHaveLength(1);

    expect(logs[0].details).toMatchObject({
      invited_user_id: friendId,
      invited_username: friendAccount.username,
      membership_id: invitationId,
      status: "invited",
    });
  });

  it("does not log unauthorized invitations", async () => {
    const before = await getAuditEntries(
      firstWorldId,
      "world.member.invited"
    );

    const response = await outsiderAgent
      .post(`/api/worlds/${firstWorldId}/invitations`)
      .send({
        username: friendAccount.username,
      });

    expect(response.status).toBe(403);

    const after = await getAuditEntries(
      firstWorldId,
      "world.member.invited"
    );

    expect(after).toHaveLength(before.length);

    expect(
      after.some((log) => log.user_id === outsiderId)
    ).toBe(false);
  });

  it("does not create another log for duplicate invitations", async () => {
    const before = await getAuditEntries(
      firstWorldId,
      "world.member.invited"
    );

    const response = await founderAgent
      .post(`/api/worlds/${firstWorldId}/invitations`)
      .send({
        username: friendAccount.username,
      });

    expect(response.status).toBe(409);

    const after = await getAuditEntries(
      firstWorldId,
      "world.member.invited"
    );

    expect(after).toHaveLength(before.length);
  });

  it("records an accepted invitation", async () => {
    const response = await friendAgent
      .post(`/api/invitations/${invitationId}/accept`);

    expect(response.status).toBe(200);

    const logs = await getAuditEntries(
      firstWorldId,
      "world.member.joined"
    );

    expect(logs).toHaveLength(1);

    const log = logs[0];

    expect(log.world_id).toBe(firstWorldId);
    expect(log.user_id).toBe(friendId);
    expect(log.world_character_id).toBeNull();

    expect(log.resource_type).toBe("world_member");
    expect(log.resource_id).toBe(invitationId);
  });

  it("stores correct player joining details", async () => {
    const logs = await getAuditEntries(
      firstWorldId,
      "world.member.joined"
    );

    expect(logs).toHaveLength(1);

    expect(logs[0].details).toMatchObject({
      membership_id: invitationId,
      joined_user_id: friendId,
      status: "active",
    });

    const membership = await pool.query(
      `
      SELECT status, joined_at
      FROM world_members
      WHERE id = $1
        AND world_id = $2
        AND user_id = $3
      `,
      [
        invitationId,
        firstWorldId,
        friendId,
      ]
    );

    expect(membership.rowCount).toBe(1);
    expect(membership.rows[0].status).toBe("active");
    expect(membership.rows[0].joined_at).not.toBeNull();
  });

});

// =========================================
// CHARACTER ASSIGNMENT AUDIT LOGGING
// =========================================

describe("Character Assignment Audit Logging", () => {

  it("records assigning Dottore to the invited player", async () => {
    const response = await founderAgent
      .post(`/api/worlds/${firstWorldId}/assignments`)
      .send({
        membership_id: invitationId,
        character_id: dottoreCharacterId,
        roles: [
          "HARBINGER",
          "RESEARCH_DIRECTOR",
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const assignment = response.body.data.assignment;

    dottoreAssignmentId = assignment.assignment_id;
    dottoreWorldCharacterId =
      assignment.world_character_id;

    expect(assignment.character).toBe("Il Dottore");

    const logs = await getAuditEntries(
      firstWorldId,
      "character.assigned"
    );

    expect(logs).toHaveLength(1);

    const log = logs[0];

    expect(log.action).toBe("character.assigned");
    expect(log.world_id).toBe(firstWorldId);
    expect(log.user_id).toBe(founderId);

    expect(log.world_character_id).toBe(
      firstTsaritsaId
    );

    expect(log.resource_type).toBe(
      "character_assignment"
    );

    expect(log.resource_id).toBe(
      dottoreAssignmentId
    );
  });

  it("records the correct assigned player and character", async () => {
    const logs = await getAuditEntries(
      firstWorldId,
      "character.assigned"
    );

    expect(logs).toHaveLength(1);

    const details = logs[0].details;

    expect(details).toMatchObject({
      assignment_id: dottoreAssignmentId,
      membership_id: invitationId,
      assigned_user_id: friendId,
      character_id: dottoreCharacterId,
      world_character_id: dottoreWorldCharacterId,
      character_name: "Il Dottore",
      character_slug: "dottore",
      assigned_by_character_id: firstTsaritsaId,
    });

    expect(details.requested_roles).toEqual(
      expect.arrayContaining([
        "HARBINGER",
        "RESEARCH_DIRECTOR",
      ])
    );

    expect(details.requested_roles).toHaveLength(2);
  });

  it("records the roles newly granted to Dottore", async () => {
    const logs = await getAuditEntries(
      firstWorldId,
      "character.roles.assigned"
    );

    expect(logs).toHaveLength(1);

    const log = logs[0];

    expect(log.user_id).toBe(founderId);
    expect(log.world_character_id).toBe(
      firstTsaritsaId
    );

    expect(log.resource_type).toBe(
      "world_character"
    );

    expect(log.resource_id).toBe(
      dottoreWorldCharacterId
    );

    expect(log.details).toMatchObject({
      assignment_id: dottoreAssignmentId,
      membership_id: invitationId,
      assigned_user_id: friendId,
      character_slug: "dottore",
      assigned_by_character_id: firstTsaritsaId,
    });

    expect(log.details.roles).toEqual(
      expect.arrayContaining([
        "HARBINGER",
        "RESEARCH_DIRECTOR",
      ])
    );

    expect(log.details.roles).toHaveLength(2);
  });

  it("matches the granted roles stored in PostgreSQL", async () => {
    const result = await pool.query(
      `
      SELECT r.code
      FROM world_character_roles wcr
      JOIN roles r
        ON r.id = wcr.role_id
      WHERE wcr.world_id = $1
        AND wcr.world_character_id = $2
      ORDER BY r.code
      `,
      [
        firstWorldId,
        dottoreWorldCharacterId,
      ]
    );

    const databaseRoles = result.rows
      .map((row) => row.code)
      .sort();

    const logs = await getAuditEntries(
      firstWorldId,
      "character.roles.assigned"
    );

    expect(logs).toHaveLength(1);

    const loggedRoles = [
      ...logs[0].details.roles,
    ].sort();

    expect(databaseRoles).toEqual([
      "HARBINGER",
      "RESEARCH_DIRECTOR",
    ]);

    expect(loggedRoles).toEqual(databaseRoles);

    // Confirm the character assignment
    // was saved in the same transaction.
    const assignmentResult = await pool.query(
      `
      SELECT id, revoked_at
      FROM character_assignments
      WHERE id = $1
        AND world_id = $2
        AND world_character_id = $3
        AND world_member_id = $4
      `,
      [
        dottoreAssignmentId,
        firstWorldId,
        dottoreWorldCharacterId,
        invitationId,
      ]
    );

    expect(assignmentResult.rowCount).toBe(1);
    expect(
      assignmentResult.rows[0].revoked_at
    ).toBeNull();
  });

  it("does not log duplicate character assignments", async () => {
    const assignmentsBefore = await getAuditEntries(
      firstWorldId,
      "character.assigned"
    );

    const rolesBefore = await getAuditEntries(
      firstWorldId,
      "character.roles.assigned"
    );

    const response = await founderAgent
      .post(`/api/worlds/${firstWorldId}/assignments`)
      .send({
        membership_id: invitationId,
        character_id: dottoreCharacterId,
        roles: [
          "HARBINGER",
          "RESEARCH_DIRECTOR",
        ],
      });

    expect(response.status).toBe(409);

    const assignmentsAfter = await getAuditEntries(
      firstWorldId,
      "character.assigned"
    );

    const rolesAfter = await getAuditEntries(
      firstWorldId,
      "character.roles.assigned"
    );

    expect(assignmentsAfter).toHaveLength(
      assignmentsBefore.length
    );

    expect(rolesAfter).toHaveLength(
      rolesBefore.length
    );
  });

  it("does not log unauthorized character assignments", async () => {
    const assignmentsBefore = await getAuditEntries(
      firstWorldId,
      "character.assigned"
    );

    const rolesBefore = await getAuditEntries(
      firstWorldId,
      "character.roles.assigned"
    );

    const response = await outsiderAgent
      .post(`/api/worlds/${firstWorldId}/assignments`)
      .send({
        membership_id: invitationId,
        character_id: dottoreCharacterId,
        roles: ["HARBINGER"],
      });

    expect(response.status).toBe(403);

    const assignmentsAfter = await getAuditEntries(
      firstWorldId,
      "character.assigned"
    );

    const rolesAfter = await getAuditEntries(
      firstWorldId,
      "character.roles.assigned"
    );

    expect(assignmentsAfter).toHaveLength(
      assignmentsBefore.length
    );

    expect(rolesAfter).toHaveLength(
      rolesBefore.length
    );

    expect(
      assignmentsAfter.some(
        (log) => log.user_id === outsiderId
      )
    ).toBe(false);

    expect(
      rolesAfter.some(
        (log) => log.user_id === outsiderId
      )
    ).toBe(false);
  });

});
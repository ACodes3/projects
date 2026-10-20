import { describe, it, expect, beforeAll, afterAll } from "vitest";

import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../app.js";
import { pool } from "../src/db/pool.js";
import { getAdminPool, verifyAdminDatabase } from "./helpers/adminPool.js";

// -----------------------------------------
// Test configuration
// -----------------------------------------

const TEST_DATABASE = "crown-of-winter-test";
const TEST_PASSWORD = "WinterTesting2026!";

const runId = randomUUID().replaceAll("-", "").slice(0, 12);

function makeAccount(prefix) {
  return {
    username: `${prefix}_${runId}`,
    email: `${prefix}_${runId}@example.com`,
    password: TEST_PASSWORD,
  };
}

const sovereignAccount = makeAccount("audit_api_queen");
const dottoreAccount = makeAccount("audit_api_doctor");
const unassignedAccount = makeAccount("audit_api_member");
const otherSovereignAccount = makeAccount("audit_api_other");

const createdUserIds = new Set();
const createdWorldIds = new Set();

let databaseVerified = false;

let sovereignAgent;
let dottoreAgent;
let unassignedAgent;
let otherSovereignAgent;

let sovereignUserId;
let otherSovereignUserId;

let worldId;
let otherWorldId;

// -----------------------------------------
// Database safety
// -----------------------------------------

async function verifyTestDatabase() {
  if (
    process.env.NODE_ENV !== "test" ||
    process.env.DB_NAME !== TEST_DATABASE
  ) {
    throw new Error("Unsafe test environment.");
  }

  const result = await pool.query("SELECT current_database() AS database");

  if (result.rows[0].database !== TEST_DATABASE) {
    throw new Error("Audit API tests require crown-of-winter-test.");
  }

  databaseVerified = true;
}

// -----------------------------------------
// Test helpers
// -----------------------------------------

async function registerTestUser(account) {
  const response = await request(app).post("/api/auth/register").send(account);

  expect(response.status).toBe(201);

  const userId = response.body.data.user.id;

  createdUserIds.add(userId);

  return userId;
}

async function loginTestUser(account) {
  const agent = request.agent(app);

  const response = await agent.post("/api/auth/login").send({
    identifier: account.username,
    password: account.password,
  });

  expect(response.status).toBe(200);

  return agent;
}

async function createTestWorld(agent, name) {
  const response = await agent.post("/api/worlds").send({
    name,
    mode: "multiplayer",
  });

  expect(response.status).toBe(201);

  const world = response.body.data.world;

  createdWorldIds.add(world.id);

  return world.id;
}

async function inviteAndAccept(
  invitingAgent,
  acceptingAgent,
  targetUsername,
  targetWorldId,
) {
  const invitation = await invitingAgent
    .post(`/api/worlds/${targetWorldId}/invitations`)
    .send({
      username: targetUsername,
    });

  expect(invitation.status).toBe(201);

  const membershipId = invitation.body.data.invitation.id;

  const acceptance = await acceptingAgent.post(
    `/api/invitations/${membershipId}/accept`,
  );

  expect(acceptance.status).toBe(200);

  return membershipId;
}

// -----------------------------------------
// Setup
// -----------------------------------------

beforeAll(async () => {
  await verifyTestDatabase();

  // Create four independent test accounts.
  sovereignUserId = await registerTestUser(sovereignAccount);

  await registerTestUser(dottoreAccount);
  await registerTestUser(unassignedAccount);

  otherSovereignUserId = await registerTestUser(otherSovereignAccount);

  sovereignAgent = await loginTestUser(sovereignAccount);

  dottoreAgent = await loginTestUser(dottoreAccount);

  unassignedAgent = await loginTestUser(unassignedAccount);

  otherSovereignAgent = await loginTestUser(otherSovereignAccount);

  // Create two worlds with different Sovereigns.
  worldId = await createTestWorld(sovereignAgent, "Imperial Audit API Palace");

  otherWorldId = await createTestWorld(
    otherSovereignAgent,
    "Independent Audit API Palace",
  );

  // Invite and activate the future Dottore.
  const dottoreMembershipId = await inviteAndAccept(
    sovereignAgent,
    dottoreAgent,
    dottoreAccount.username,
    worldId,
  );

  // Invite and activate another player.
  // This player will NOT receive a character.
  await inviteAndAccept(
    sovereignAgent,
    unassignedAgent,
    unassignedAccount.username,
    worldId,
  );

  // Find Dottore's catalog character.
  const characterResult = await pool.query(
    `
    SELECT id
    FROM characters
    WHERE slug = 'dottore'
      AND is_playable = TRUE
      AND is_unique = TRUE
    `,
  );

  expect(characterResult.rowCount).toBe(1);

  // Assign Dottore to the first player.
  const assignment = await sovereignAgent
    .post(`/api/worlds/${worldId}/assignments`)
    .send({
      membership_id: dottoreMembershipId,
      character_id: characterResult.rows[0].id,
      roles: ["HARBINGER", "RESEARCH_DIRECTOR"],
    });

  expect(assignment.status).toBe(201);
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

      // Temporary test-only world deletion
      // mechanism. Not production authorization.
      await client.query(
        `
        SELECT set_config(
          'crown.world_deletion',
          'authorized',
          true
        )
        `,
      );

      await client.query(
        `
        DELETE FROM worlds
        WHERE id = ANY($1::uuid[])
          AND created_by = ANY($2::uuid[])
        `,
        [[...createdWorldIds], [sovereignUserId, otherSovereignUserId]],
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
    await verifyTestDatabase();

    await admin.query(
      `
      DELETE FROM users
      WHERE id = ANY($1::uuid[])
      `,
      [[...createdUserIds]],
    );
  }
});

// =========================================
// AUDIT HISTORY API SECURITY TESTS
// =========================================

describe("Audit History API Security", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await request(app).get(
      `/api/worlds/${worldId}/audit-logs`,
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("allows the Tsaritsa to view her world's audit history", async () => {
    const response = await sovereignAgent.get(
      `/api/worlds/${worldId}/audit-logs`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data.world_id).toBe(worldId);

    expect(Array.isArray(response.body.data.logs)).toBe(true);

    // The setup generates seven audit events:
    // 1 world creation
    // 2 invitations
    // 2 accepted invitations
    // 1 character assignment
    // 1 role grant

    expect(response.body.data.logs).toHaveLength(7);
  });

  it("returns the correct recorded audit actions", async () => {
    const response = await sovereignAgent.get(
      `/api/worlds/${worldId}/audit-logs`,
    );

    expect(response.status).toBe(200);

    const actions = response.body.data.logs.map((log) => log.action);

    expect(actions).toContain("world.created");
    expect(actions).toContain("world.member.invited");
    expect(actions).toContain("world.member.joined");
    expect(actions).toContain("character.assigned");
    expect(actions).toContain("character.roles.assigned");

    expect(
      actions.filter((action) => action === "world.member.invited"),
    ).toHaveLength(2);

    expect(
      actions.filter((action) => action === "world.member.joined"),
    ).toHaveLength(2);
  });

  it("returns records belonging only to the requested world", async () => {
    const response = await sovereignAgent.get(
      `/api/worlds/${worldId}/audit-logs`,
    );

    expect(response.status).toBe(200);

    for (const log of response.body.data.logs) {
      expect(log.world_id).toBe(worldId);
      expect(log.world_id).not.toBe(otherWorldId);
    }
  });

  it("denies audit access to Dottore without audit.view", async () => {
    const response = await dottoreAgent.get(
      `/api/worlds/${worldId}/audit-logs`,
    );

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe("Insufficient permissions.");
  });

  it("denies a member without an assigned character", async () => {
    const response = await unassignedAgent.get(
      `/api/worlds/${worldId}/audit-logs`,
    );

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "No active playable character in this world.",
    );
  });

  it("prevents another world's Sovereign from reading logs", async () => {
    const response = await otherSovereignAgent.get(
      `/api/worlds/${worldId}/audit-logs`,
    );

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("allows the other Sovereign to read only their own world", async () => {
    const response = await otherSovereignAgent.get(
      `/api/worlds/${otherWorldId}/audit-logs`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data.world_id).toBe(otherWorldId);

    // Only world creation occurred here.
    expect(response.body.data.logs).toHaveLength(1);

    expect(response.body.data.logs[0].action).toBe("world.created");

    expect(response.body.data.logs[0].user_id).toBe(otherSovereignUserId);
  });

  it("rejects invalid world identifiers", async () => {
    const response = await sovereignAgent.get(
      "/api/worlds/not-a-uuid/audit-logs",
    );

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe("Invalid world ID.");
  });

  it("rejects invalid pagination parameters", async () => {
    const invalidQueries = [
      "?limit=0",
      "?limit=101",
      "?limit=abc",
      "?limit=1.5",
      "?offset=-1",
      "?offset=abc",
      "?offset=1.5",
    ];

    for (const query of invalidQueries) {
      const response = await sovereignAgent.get(
        `/api/worlds/${worldId}/audit-logs${query}`,
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    }
  });

  it("supports limit and offset pagination", async () => {
    const firstPage = await sovereignAgent.get(
      `/api/worlds/${worldId}/audit-logs?limit=2&offset=0`,
    );

    expect(firstPage.status).toBe(200);

    expect(firstPage.body.data.logs).toHaveLength(2);

    expect(firstPage.body.data.pagination).toMatchObject({
      limit: 2,
      offset: 0,
      count: 2,
    });

    const secondPage = await sovereignAgent.get(
      `/api/worlds/${worldId}/audit-logs?limit=2&offset=2`,
    );

    expect(secondPage.status).toBe(200);

    expect(secondPage.body.data.logs).toHaveLength(2);

    expect(secondPage.body.data.pagination).toMatchObject({
      limit: 2,
      offset: 2,
      count: 2,
    });

    const firstIds = firstPage.body.data.logs.map((log) => log.id);

    const secondIds = secondPage.body.data.logs.map((log) => log.id);

    // Pages should not contain duplicate records.
    for (const id of firstIds) {
      expect(secondIds).not.toContain(id);
    }
  });

  it("returns an empty page when offset exceeds available logs", async () => {
    const response = await sovereignAgent.get(
      `/api/worlds/${worldId}/audit-logs?limit=5&offset=100`,
    );

    expect(response.status).toBe(200);

    expect(response.body.data.logs).toEqual([]);

    expect(response.body.data.pagination).toMatchObject({
      limit: 5,
      offset: 100,
      count: 0,
      has_more: false,
    });
  });
});

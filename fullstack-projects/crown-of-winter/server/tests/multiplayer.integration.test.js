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
import { getAdminPool, verifyAdminDatabase } from "./helpers/adminPool.js";

const TEST_DATABASE = "crown-of-winter-test";
const TEST_PASSWORD = "WinterTesting2026!";

const runId = randomUUID()
  .replaceAll("-", "")
  .slice(0, 12);

const sovereignAccount = {
  username: `tsaritsa_${runId}`,
  email: `tsaritsa_${runId}@example.com`,
  password: TEST_PASSWORD,
};

const friendAccount = {
  username: `dottore_${runId}`,
  email: `dottore_${runId}@example.com`,
  password: TEST_PASSWORD,
};

const outsiderAccount = {
  username: `outsider_${runId}`,
  email: `outsider_${runId}@example.com`,
  password: TEST_PASSWORD,
};

const createdUserIds = new Set();
const createdWorldIds = new Set();

let databaseVerified = false;

let sovereignAgent;
let friendAgent;
let outsiderAgent;

let sovereignUserId;
let friendUserId;

let worldId;
let membershipId;
let dottoreCharacterId;
let assignmentId;

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

  const result = await pool.query(
    "SELECT current_database() AS database"
  );

  if (result.rows[0].database !== TEST_DATABASE) {
    throw new Error(
      "Integration tests require crown-of-winter-test."
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

// -----------------------------------------
// Setup
// -----------------------------------------

beforeAll(async () => {
  await verifyTestDatabase();

  sovereignUserId = await registerTestUser(
    sovereignAccount
  );

  friendUserId = await registerTestUser(
    friendAccount
  );

  await registerTestUser(outsiderAccount);

  sovereignAgent = await loginTestUser(
    sovereignAccount
  );

  friendAgent = await loginTestUser(
    friendAccount
  );

  outsiderAgent = await loginTestUser(
    outsiderAccount
  );

  // Create the multiplayer world.
  const response = await sovereignAgent
    .post("/api/worlds")
    .send({
      name: "Imperial Multiplayer Test",
      mode: "multiplayer",
    });

  expect(response.status).toBe(201);

  worldId = response.body.data.world.id;

  createdWorldIds.add(worldId);

  // Find Dottore's character definition.
  const characterResult = await pool.query(
    `
    SELECT id
    FROM characters
    WHERE slug = 'dottore'
      AND is_playable = TRUE
    `
  );

  expect(characterResult.rowCount).toBe(1);

  dottoreCharacterId = characterResult.rows[0].id;
});

// -----------------------------------------
// Cleanup
// -----------------------------------------

afterAll(async () => {
  if (!databaseVerified) return;

  await verifyTestDatabase();

  // All destructive cleanup uses the separate admin connection.
  await verifyAdminDatabase();
  const admin = getAdminPool();

  // Delete only worlds created by this suite.
  if (createdWorldIds.size > 0) {
    const client = await admin.connect();

    try {
      await client.query("BEGIN");

      // Temporary test-only bypass used by the existing
      // Sovereign triggers. We will remove this separately.
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
        [[...createdWorldIds], sovereignUserId]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete only accounts created by this suite.
  if (createdUserIds.size > 0) {
    await verifyAdminDatabase();

    await admin.query(
      `
      DELETE FROM users
      WHERE id = ANY($1::uuid[])
      `,
      [[...createdUserIds]]
    );
  }
});

// -----------------------------------------
// Multiplayer Integration Tests
// -----------------------------------------

describe("Multiplayer Integration", () => {
  it("creates a world with the Tsaritsa", async () => {
    const response = await sovereignAgent
      .get(`/api/worlds/${worldId}/me/permissions`);

    expect(response.status).toBe(200);

    expect(response.body.data.character.slug)
      .toBe("tsaritsa");

    expect(response.body.data.character.isSovereign)
      .toBe(true);

    expect(response.body.data.character.roles)
      .toContain("SOVEREIGN");
  });

  it("prevents an outsider from inviting users", async () => {
    const response = await outsiderAgent
      .post(`/api/worlds/${worldId}/invitations`)
      .send({
        username: friendAccount.username,
      });

    expect(response.status).toBe(403);
  });

  it("allows the Tsaritsa to invite a player", async () => {
    const response = await sovereignAgent
      .post(`/api/worlds/${worldId}/invitations`)
      .send({
        username: friendAccount.username,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    membershipId = response.body.data.invitation.id;

    expect(response.body.data.invitation.status)
      .toBe("invited");
  });

  it("rejects duplicate invitations", async () => {
    const response = await sovereignAgent
      .post(`/api/worlds/${worldId}/invitations`)
      .send({
        username: friendAccount.username,
      });

    expect(response.status).toBe(409);
  });

  it("shows the invitation to the invited player", async () => {
    const response = await friendAgent
      .get("/api/invitations");

    expect(response.status).toBe(200);

    const invitations = response.body.data.invitations;

    expect(
      invitations.some(
        (invitation) =>
          invitation.membership_id === membershipId &&
          invitation.world_id === worldId
      )
    ).toBe(true);
  });

  it("prevents another user from accepting the invitation", async () => {
    const response = await outsiderAgent
      .post(`/api/invitations/${membershipId}/accept`);

    expect(response.status).toBe(404);
  });

  it("allows the invited player to join the world", async () => {
    const response = await friendAgent
      .post(`/api/invitations/${membershipId}/accept`);

    expect(response.status).toBe(200);

    expect(response.body.data.membership.status)
      .toBe("active");

    const result = await pool.query(
      `
      SELECT status
      FROM world_members
      WHERE id = $1
        AND world_id = $2
        AND user_id = $3
      `,
      [membershipId, worldId, friendUserId]
    );

    expect(result.rowCount).toBe(1);
    expect(result.rows[0].status).toBe("active");
  });

  it("denies sovereign access without a character", async () => {
    const response = await friendAgent
      .get(`/api/worlds/${worldId}/sovereign/verify`);

    expect(response.status).toBe(403);
  });

  it("prevents a normal member from assigning characters", async () => {
    const response = await friendAgent
      .post(`/api/worlds/${worldId}/assignments`)
      .send({
        membership_id: membershipId,
        character_id: dottoreCharacterId,
        roles: ["HARBINGER"],
      });

    expect(response.status).toBe(403);
  });

  it("prevents granting the Sovereign role", async () => {
    const response = await sovereignAgent
      .post(`/api/worlds/${worldId}/assignments`)
      .send({
        membership_id: membershipId,
        character_id: dottoreCharacterId,
        roles: ["SOVEREIGN"],
      });

    expect(response.status).toBe(403);
  });

  it("allows the Tsaritsa to assign Dottore", async () => {
    const response = await sovereignAgent
      .post(`/api/worlds/${worldId}/assignments`)
      .send({
        membership_id: membershipId,
        character_id: dottoreCharacterId,
        roles: [
          "HARBINGER",
          "RESEARCH_DIRECTOR",
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const assignment = response.body.data.assignment;

    assignmentId = assignment.assignment_id;

    expect(assignment.character).toBe("Il Dottore");

    expect(assignment.roles).toEqual(
      expect.arrayContaining([
        "HARBINGER",
        "RESEARCH_DIRECTOR",
      ])
    );
  });

  it("rejects duplicate character assignments", async () => {
    const response = await sovereignAgent
      .post(`/api/worlds/${worldId}/assignments`)
      .send({
        membership_id: membershipId,
        character_id: dottoreCharacterId,
        roles: [
          "HARBINGER",
          "RESEARCH_DIRECTOR",
        ],
      });

    expect(response.status).toBe(409);
  });

  it("saves Dottore's assignment in PostgreSQL", async () => {
    const result = await pool.query(
      `
      SELECT
        ca.id,
        c.slug,
        u.username
      FROM character_assignments ca
      JOIN world_members wm
        ON wm.id = ca.world_member_id
      JOIN users u
        ON u.id = wm.user_id
      JOIN world_characters wc
        ON wc.id = ca.world_character_id
      JOIN characters c
        ON c.id = wc.character_id
      WHERE ca.id = $1
        AND ca.world_id = $2
        AND ca.revoked_at IS NULL
      `,
      [assignmentId, worldId]
    );

    expect(result.rowCount).toBe(1);
    expect(result.rows[0].slug).toBe("dottore");
    expect(result.rows[0].username)
      .toBe(friendAccount.username);
  });

  it("loads Dottore's roles and permissions", async () => {
    const response = await friendAgent
      .get(`/api/worlds/${worldId}/me/permissions`);

    expect(response.status).toBe(200);

    const { character, permissions } = response.body.data;

    expect(character.slug).toBe("dottore");
    expect(character.isSovereign).toBe(false);

    expect(character.roles).toEqual(
      expect.arrayContaining([
        "HARBINGER",
        "RESEARCH_DIRECTOR",
      ])
    );

    expect(permissions).toContain("research.create");
    expect(permissions).toContain("research.manage");
    expect(permissions).toContain("operations.view");

    expect(permissions).not.toContain("roles.assign");
    expect(permissions).not.toContain(
      "world.members.invite"
    );
  });

  it("denies Dottore Sovereign-only access", async () => {
    const response = await friendAgent
      .get(`/api/worlds/${worldId}/sovereign/verify`);

    expect(response.status).toBe(403);

    expect(response.body.message)
      .toBe("Sovereign authority required.");
  });

  it("allows the Tsaritsa Sovereign-only access", async () => {
    const response = await sovereignAgent
      .get(`/api/worlds/${worldId}/sovereign/verify`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("prevents an outsider from viewing the world", async () => {
    const response = await outsiderAgent
      .get(`/api/worlds/${worldId}`);

    expect(response.status).toBe(404);
  });
});
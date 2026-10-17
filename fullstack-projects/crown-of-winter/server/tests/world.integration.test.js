
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

const TEST_DATABASE = "crown-of-winter-test";
const TEST_PASSWORD = "WinterTesting2026!";

const runId = randomUUID()
  .replaceAll("-", "")
  .slice(0, 12);

const founderAccount = {
  username: `sovereign_${runId}`,
  email: `sovereign_${runId}@example.com`,
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

let founderAgent;
let outsiderAgent;

let founderId;
let worldId;
let tsaritsaId;

// -----------------------------------------
// Verify test database
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
      "Integration tests must use the test database."
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

  founderId = await registerTestUser(founderAccount);

  await registerTestUser(outsiderAccount);

  founderAgent = await loginTestUser(founderAccount);
  outsiderAgent = await loginTestUser(outsiderAccount);

  const response = await founderAgent
    .post("/api/worlds")
    .send({
      name: "Imperial Test Realm",
      mode: "singleplayer",
    });

  expect(response.status).toBe(201);

  worldId = response.body.data.world.id;
  tsaritsaId = response.body.data.world.character.id;

  createdWorldIds.add(worldId);
});

// -----------------------------------------
// Cleanup
// -----------------------------------------

afterAll(async () => {
  if (!databaseVerified) return;

  await verifyTestDatabase();

  // Delete only worlds created by this test file.
  // Sovereign cleanup is permitted within this
  // transaction by the test-only trigger setting.
  if (createdWorldIds.size > 0) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

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

  // Delete only accounts created by this suite.
  // Associated sessions are removed by cascades.
  if (createdUserIds.size > 0) {
    await verifyTestDatabase();

    await pool.query(
      `
      DELETE FROM users
      WHERE id = ANY($1::uuid[])
      `,
      [[...createdUserIds]]
    );
  }
});

// -----------------------------------------
// World Integration Tests
// -----------------------------------------

describe("World & Sovereign Integration", () => {
  it("creates a world successfully", async () => {
    const result = await pool.query(
      `
      SELECT id, name, mode, created_by
      FROM worlds
      WHERE id = $1
      `,
      [worldId]
    );

    expect(result.rowCount).toBe(1);

    expect(result.rows[0]).toMatchObject({
      name: "Imperial Test Realm",
      mode: "singleplayer",
      created_by: founderId,
    });
  });

  it("creates an active founder membership", async () => {
    const result = await pool.query(
      `
      SELECT status, joined_at
      FROM world_members
      WHERE world_id = $1
        AND user_id = $2
      `,
      [worldId, founderId]
    );

    expect(result.rowCount).toBe(1);
    expect(result.rows[0].status).toBe("active");
    expect(result.rows[0].joined_at).not.toBeNull();
  });

  it("creates exactly one Tsaritsa", async () => {
    const result = await pool.query(
      `
      SELECT wc.id
      FROM world_characters wc
      JOIN characters c
        ON c.id = wc.character_id
      WHERE wc.world_id = $1
        AND c.slug = 'tsaritsa'
      `,
      [worldId]
    );

    expect(result.rowCount).toBe(1);
    expect(result.rows[0].id).toBe(tsaritsaId);
  });

  it("assigns the Tsaritsa to the founder", async () => {
    const result = await pool.query(
      `
      SELECT ca.id
      FROM character_assignments ca
      JOIN world_members wm
        ON wm.id = ca.world_member_id
      WHERE ca.world_id = $1
        AND ca.world_character_id = $2
        AND wm.user_id = $3
        AND ca.revoked_at IS NULL
      `,
      [worldId, tsaritsaId, founderId]
    );

    expect(result.rowCount).toBe(1);
  });

  it("grants the Sovereign role to the Tsaritsa", async () => {
    const result = await pool.query(
      `
      SELECT r.code
      FROM world_character_roles wcr
      JOIN roles r
        ON r.id = wcr.role_id
      WHERE wcr.world_id = $1
        AND wcr.world_character_id = $2
      `,
      [worldId, tsaritsaId]
    );

    expect(result.rows.map((row) => row.code))
      .toContain("SOVEREIGN");
  });

  it("rejects a duplicate Tsaritsa in the same world", async () => {
    const character = await pool.query(
      `
      SELECT id
      FROM characters
      WHERE slug = 'tsaritsa'
      `
    );

    const tsaritsaDefinitionId = character.rows[0].id;

    await expect(
      pool.query(
        `
        INSERT INTO world_characters (
          world_id,
          character_id
        )
        VALUES ($1, $2)
        `,
        [worldId, tsaritsaDefinitionId]
      )
    ).rejects.toMatchObject({
      code: "23505",
    });
  });

  it("creates independent Tsaritsa instances in separate worlds", async () => {
    const response = await founderAgent
      .post("/api/worlds")
      .send({
        name: "Second Test Realm",
        mode: "multiplayer",
      });

    expect(response.status).toBe(201);

    const secondWorld = response.body.data.world;

    createdWorldIds.add(secondWorld.id);

    expect(secondWorld.id).not.toBe(worldId);
    expect(secondWorld.character.id).not.toBe(tsaritsaId);
    expect(secondWorld.character.role).toBe("SOVEREIGN");
  });

  it("lists worlds belonging to the founder", async () => {
    const response = await founderAgent
      .get("/api/worlds");

    expect(response.status).toBe(200);

    const worldIds = response.body.data.worlds.map(
      (world) => world.id
    );

    expect(worldIds).toContain(worldId);
  });

  it("prevents another user from accessing the world", async () => {
    const response = await outsiderAgent
      .get(`/api/worlds/${worldId}`);

    expect(response.status).toBe(404);
  });

  it("rejects invalid world creation data", async () => {
    const invalidName = await founderAgent
      .post("/api/worlds")
      .send({
        name: "A",
        mode: "singleplayer",
      });

    expect(invalidName.status).toBe(400);

    const invalidMode = await founderAgent
      .post("/api/worlds")
      .send({
        name: "Invalid World",
        mode: "unknown",
      });

    expect(invalidMode.status).toBe(400);
  });
});

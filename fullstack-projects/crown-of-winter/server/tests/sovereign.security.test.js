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

const TEST_DATABASE = "crown-of-winter-test";
const TEST_PASSWORD = "WinterTesting2026!";

const runId = randomUUID().replaceAll("-", "").slice(0, 12);

const sovereignAccount = {
  username: `security_queen_${runId}`,
  email: `security_queen_${runId}@example.com`,
  password: TEST_PASSWORD,
};

const friendAccount = {
  username: `security_friend_${runId}`,
  email: `security_friend_${runId}@example.com`,
  password: TEST_PASSWORD,
};

const createdUserIds = new Set();
const createdWorldIds = new Set();

let databaseVerified = false;
let sovereignAgent;

let sovereignUserId;
let friendUserId;
let worldId;
let sovereignCharacterId;
let sovereignAssignmentId;
let sovereignRoleId;
let sovereignRoleAssignmentId;

let friendMembershipId;
let dottoreCharacterId;
let dottoreWorldCharacterId;
let dottoreAssignmentId;

// -----------------------------------------
// Verify the application database
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
    throw new Error("Incorrect test database.");
  }

  databaseVerified = true;
}

// -----------------------------------------
// Register a test account
// -----------------------------------------

async function registerAccount(account) {
  const response = await request(app)
    .post("/api/auth/register")
    .send(account);

  expect(response.status).toBe(201);

  const userId = response.body.data.user.id;

  createdUserIds.add(userId);

  return userId;
}

// -----------------------------------------
// Setup
// -----------------------------------------

beforeAll(async () => {
  await verifyTestDatabase();

  sovereignUserId = await registerAccount(sovereignAccount);
  friendUserId = await registerAccount(friendAccount);

  sovereignAgent = request.agent(app);

  const login = await sovereignAgent
    .post("/api/auth/login")
    .send({
      identifier: sovereignAccount.username,
      password: TEST_PASSWORD,
    });

  expect(login.status).toBe(200);

  // Create a world.
  const worldResponse = await sovereignAgent
    .post("/api/worlds")
    .send({
      name: "Sovereign Security Test",
      mode: "multiplayer",
    });

  expect(worldResponse.status).toBe(201);

  worldId = worldResponse.body.data.world.id;
  sovereignCharacterId =
    worldResponse.body.data.world.character.id;

  createdWorldIds.add(worldId);

  // Get the founder's character assignment.
  const assignmentResult = await pool.query(
    `
    SELECT ca.id
    FROM character_assignments ca
    JOIN world_members wm
      ON wm.id = ca.world_member_id
    WHERE ca.world_id = $1
      AND wm.user_id = $2
      AND ca.revoked_at IS NULL
    `,
    [worldId, sovereignUserId]
  );

  expect(assignmentResult.rowCount).toBe(1);

  sovereignAssignmentId = assignmentResult.rows[0].id;

  // Get the Sovereign role.
  const roleResult = await pool.query(
    `
    SELECT id
    FROM roles
    WHERE code = 'SOVEREIGN'
    `
  );

  expect(roleResult.rowCount).toBe(1);

  sovereignRoleId = roleResult.rows[0].id;

  const sovereignRoleResult = await pool.query(
    `
    SELECT id
    FROM world_character_roles
    WHERE world_id = $1
      AND world_character_id = $2
      AND role_id = $3
    `,
    [worldId, sovereignCharacterId, sovereignRoleId]
  );

  expect(sovereignRoleResult.rowCount).toBe(1);

  sovereignRoleAssignmentId =
    sovereignRoleResult.rows[0].id;

  // Invite another user to the world.
  const invitation = await sovereignAgent
    .post(`/api/worlds/${worldId}/invitations`)
    .send({
      username: friendAccount.username,
    });

  expect(invitation.status).toBe(201);

  friendMembershipId =
    invitation.body.data.invitation.id;

  // Accept the invitation as the friend.
  const friendAgent = request.agent(app);

  const friendLogin = await friendAgent
    .post("/api/auth/login")
    .send({
      identifier: friendAccount.username,
      password: TEST_PASSWORD,
    });

  expect(friendLogin.status).toBe(200);

  const acceptance = await friendAgent
    .post(`/api/invitations/${friendMembershipId}/accept`);

  expect(acceptance.status).toBe(200);

  // Get Dottore's character definition.
  const dottoreResult = await pool.query(
    `
    SELECT id
    FROM characters
    WHERE slug = 'dottore'
    `
  );

  expect(dottoreResult.rowCount).toBe(1);

  dottoreCharacterId = dottoreResult.rows[0].id;

  // Assign Dottore to the friend.
  const assignment = await sovereignAgent
    .post(`/api/worlds/${worldId}/assignments`)
    .send({
      membership_id: friendMembershipId,
      character_id: dottoreCharacterId,
      roles: [
        "HARBINGER",
        "RESEARCH_DIRECTOR",
      ],
    });

  expect(assignment.status).toBe(201);

  dottoreAssignmentId =
    assignment.body.data.assignment.assignment_id;

  dottoreWorldCharacterId =
    assignment.body.data.assignment.world_character_id;
}, 20000);

// -----------------------------------------
// Cleanup
// -----------------------------------------

afterAll(async () => {
  if (!databaseVerified) return;

  await verifyTestDatabase();
  await verifyAdminDatabase();

  const admin = getAdminPool();

  // Delete only worlds created by this test suite.
  if (createdWorldIds.size > 0) {
    const client = await admin.connect();

    try {
      await client.query("BEGIN");

      // Temporary test-only deletion mechanism.
      // Not suitable as production authorization.
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

  // Delete only user accounts created by this suite.
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

// -----------------------------------------
// Sovereign Security Tests
// -----------------------------------------

describe("Sovereign Security", () => {

  it("prevents revoking the Tsaritsa's assignment", async () => {
    await expect(
      pool.query(
        `
        UPDATE character_assignments
        SET revoked_at = NOW()
        WHERE id = $1
        `,
        [sovereignAssignmentId]
      )
    ).rejects.toMatchObject({
      code: "23514",
    });
  });

  it("prevents transferring the Tsaritsa to another player", async () => {
    await expect(
      pool.query(
        `
        UPDATE character_assignments
        SET world_member_id = $1
        WHERE id = $2
        `,
        [friendMembershipId, sovereignAssignmentId]
      )
    ).rejects.toMatchObject({
      code: "23514",
    });
  });

  it("prevents deleting the Tsaritsa's assignment", async () => {
    await expect(
      pool.query(
        `
        DELETE FROM character_assignments
        WHERE id = $1
        `,
        [sovereignAssignmentId]
      )
    ).rejects.toMatchObject({
      code: "23514",
    });
  });

  it("prevents deleting the Sovereign role", async () => {
    await expect(
      pool.query(
        `
        DELETE FROM world_character_roles
        WHERE id = $1
        `,
        [sovereignRoleAssignmentId]
      )
    ).rejects.toMatchObject({
      code: "23514",
    });
  });

  it("prevents changing the Sovereign role assignment", async () => {
    const harbinger = await pool.query(
      `
      SELECT id
      FROM roles
      WHERE code = 'HARBINGER'
      `
    );

    expect(harbinger.rowCount).toBe(1);

    await expect(
      pool.query(
        `
        UPDATE world_character_roles
        SET role_id = $1
        WHERE id = $2
        `,
        [
          harbinger.rows[0].id,
          sovereignRoleAssignmentId,
        ]
      )
    ).rejects.toMatchObject({
      code: "23514",
    });
  });

  it("prevents giving Dottore the Sovereign role", async () => {
    await expect(
      pool.query(
        `
        INSERT INTO world_character_roles (
          world_id,
          world_character_id,
          role_id
        )
        VALUES ($1, $2, $3)
        `,
        [
          worldId,
          dottoreWorldCharacterId,
          sovereignRoleId,
        ]
      )
    ).rejects.toMatchObject({
      code: "P0001",
    });
  });

  it("prevents changing the Tsaritsa into Dottore", async () => {
    await expect(
      pool.query(
        `
        UPDATE world_characters
        SET character_id = $1
        WHERE id = $2
        `,
        [dottoreCharacterId, sovereignCharacterId]
      )
    ).rejects.toMatchObject({
      code: "23514",
    });
  });

  it("prevents changing Dottore into the Tsaritsa", async () => {
    const tsaritsa = await pool.query(
      `
      SELECT id
      FROM characters
      WHERE slug = 'tsaritsa'
      `
    );

    expect(tsaritsa.rowCount).toBe(1);

    await expect(
      pool.query(
        `
        UPDATE world_characters
        SET character_id = $1
        WHERE id = $2
        `,
        [
          tsaritsa.rows[0].id,
          dottoreWorldCharacterId,
        ]
      )
    ).rejects.toMatchObject({
      code: "23514",
    });
  });

  it("prevents creating a duplicate Tsaritsa", async () => {
    const tsaritsa = await pool.query(
      `
      SELECT id
      FROM characters
      WHERE slug = 'tsaritsa'
      `
    );

    await expect(
      pool.query(
        `
        INSERT INTO world_characters (
          world_id,
          character_id
        )
        VALUES ($1, $2)
        `,
        [worldId, tsaritsa.rows[0].id]
      )
    ).rejects.toMatchObject({
      code: "23505",
    });
  });

  it("allows revoking an ordinary character assignment", async () => {
    const result = await pool.query(
      `
      UPDATE character_assignments
      SET revoked_at = NOW()
      WHERE id = $1
        AND revoked_at IS NULL
      RETURNING revoked_at
      `,
      [dottoreAssignmentId]
    );

    expect(result.rowCount).toBe(1);
    expect(result.rows[0].revoked_at).not.toBeNull();
  });

  it("preserves the Tsaritsa's Sovereign authority", async () => {
    const result = await pool.query(
      `
      SELECT
        ca.id AS assignment_id,
        ca.revoked_at,
        c.slug,
        r.code AS role
      FROM character_assignments ca
      JOIN world_characters wc
        ON wc.id = ca.world_character_id
      JOIN characters c
        ON c.id = wc.character_id
      JOIN world_character_roles wcr
        ON wcr.world_character_id = wc.id
      JOIN roles r
        ON r.id = wcr.role_id
      WHERE ca.id = $1
        AND ca.world_id = $2
        AND r.code = 'SOVEREIGN'
      `,
      [sovereignAssignmentId, worldId]
    );

    expect(result.rowCount).toBe(1);

    expect(result.rows[0].slug).toBe("tsaritsa");
    expect(result.rows[0].role).toBe("SOVEREIGN");
    expect(result.rows[0].revoked_at).toBeNull();
  });

});
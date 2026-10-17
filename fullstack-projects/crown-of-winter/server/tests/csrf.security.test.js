
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

// -----------------------------------------
// Test configuration
// -----------------------------------------

const TEST_DATABASE = "crown-of-winter-test";
const TEST_PASSWORD = "WinterTesting2026!";

const TRUSTED_ORIGIN = new URL(
  process.env.CLIENT_URL || "http://localhost:5173"
).origin;

const UNTRUSTED_ORIGIN = "https://evil.example";

const runId = randomUUID()
  .replaceAll("-", "")
  .slice(0, 12);

const account = {
  username: `csrf_test_${runId}`,
  email: `csrf_test_${runId}@example.com`,
  password: TEST_PASSWORD,
};

const createdUserIds = new Set();

let databaseVerified = false;

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
      "CSRF tests require crown-of-winter-test."
    );
  }

  databaseVerified = true;
}

// -----------------------------------------
// Helpers
// -----------------------------------------

function loginPayload() {
  return {
    identifier: account.username,
    password: TEST_PASSWORD,
  };
}

async function createAuthenticatedAgent() {
  const agent = request.agent(app);

  const response = await agent
    .post("/api/auth/login")
    .set("Origin", TRUSTED_ORIGIN)
    .send(loginPayload());

  expect(response.status).toBe(200);

  return agent;
}

// -----------------------------------------
// Setup
// -----------------------------------------

beforeAll(async () => {
  await verifyTestDatabase();

  // Register through the real protected API
  // with a valid browser Origin header.
  const response = await request(app)
    .post("/api/auth/register")
    .set("Origin", TRUSTED_ORIGIN)
    .send(account);

  expect(response.status).toBe(201);

  createdUserIds.add(
    response.body.data.user.id
  );
}, 20000);

// -----------------------------------------
// Cleanup
// -----------------------------------------

afterAll(async () => {
  if (!databaseVerified) return;

  await verifyTestDatabase();

  if (createdUserIds.size > 0) {
    // Sessions are deleted by the database's
    // existing foreign-key cascade.
    await pool.query(
      `
      DELETE FROM users
      WHERE id = ANY($1::uuid[])
      `,
      [[...createdUserIds]]
    );
  }
});

// =========================================
// CSRF SECURITY TESTS
// =========================================

describe("CSRF Origin Protection", () => {

  it("allows a trusted frontend origin", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", TRUSTED_ORIGIN)
      .send(loginPayload());

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("blocks login requests from untrusted origins", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", UNTRUSTED_ORIGIN)
      .send(loginPayload());

    expect(response.status).toBe(403);

    expect(response.body).toMatchObject({
      success: false,
      message: "Request origin not allowed.",
    });
  });

  it("blocks registration requests from untrusted origins", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .set("Origin", UNTRUSTED_ORIGIN)
      .send({
        username: `blocked_${runId}`,
        email: `blocked_${runId}@example.com`,
        password: TEST_PASSWORD,
      });

    expect(response.status).toBe(403);

    expect(response.body.message).toBe(
      "Request origin not allowed."
    );
  });

  it("rejects malformed Origin headers", async () => {
    const invalidOrigins = [
      "not-a-url",
      "null",
      "://invalid",
    ];

    for (const origin of invalidOrigins) {
      const response = await request(app)
        .post("/api/auth/login")
        .set("Origin", origin)
        .send(loginPayload());

      expect(response.status).toBe(403);

      expect(response.body.message).toBe(
        "Invalid request origin."
      );
    }
  });

  it("rejects origins that imitate the trusted hostname", async () => {
    const trustedUrl = new URL(TRUSTED_ORIGIN);

    const fakeOrigin =
      `${trustedUrl.protocol}//` +
      `${trustedUrl.hostname}.evil.example` +
      `${trustedUrl.port ? `:${trustedUrl.port}` : ""}`;

    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", fakeOrigin)
      .send(loginPayload());

    expect(response.status).toBe(403);

    expect(response.body.message).toBe(
      "Request origin not allowed."
    );
  });

  it("allows missing Origin only under the current test configuration", async () => {
    // csrfProtection.js explicitly permits
    // missing origins when NODE_ENV=test.
    //
    // This test verifies that exception,
    // not production behavior.

    expect(process.env.NODE_ENV).toBe("test");

    const response = await request(app)
      .post("/api/auth/login")
      .send(loginPayload());

    expect(response.status).toBe(200);
  });

  it("blocks cross-origin world creation before authentication", async () => {
    const agent = await createAuthenticatedAgent();

    const response = await agent
      .post("/api/worlds")
      .set("Origin", UNTRUSTED_ORIGIN)
      .send({
        name: "Forbidden Cross Origin World",
        mode: "multiplayer",
      });

    expect(response.status).toBe(403);

    expect(response.body.message).toBe(
      "Request origin not allowed."
    );
  });

  it("allows trusted world requests to reach their controller", async () => {
    const agent = await createAuthenticatedAgent();

    // Invalid input is intentional:
    // reaching the normal controller should
    // produce a validation error (400), not
    // a CSRF error (403).
    //
    // No world will be created.

    const response = await agent
      .post("/api/worlds")
      .set("Origin", TRUSTED_ORIGIN)
      .send({
        name: "A",
        mode: "invalid",
      });

    expect(response.status).toBe(400);

    expect(response.body.message).not.toBe(
      "Request origin not allowed."
    );
  });

  it("blocks cross-origin logout but allows trusted logout", async () => {
    const agent = await createAuthenticatedAgent();

    // First, attempt logout from a foreign site.
    const blocked = await agent
      .post("/api/auth/logout")
      .set("Origin", UNTRUSTED_ORIGIN);

    expect(blocked.status).toBe(403);

    // The blocked request should not have
    // revoked the user's existing session.
    const stillLoggedIn = await agent
      .get("/api/auth/me");

    expect(stillLoggedIn.status).toBe(200);
    expect(stillLoggedIn.body.success).toBe(true);

    // Now logout from the trusted origin.
    const allowed = await agent
      .post("/api/auth/logout")
      .set("Origin", TRUSTED_ORIGIN);

    expect(allowed.status).toBe(200);
    expect(allowed.body.success).toBe(true);

    // The session should now be revoked.
    const afterLogout = await agent
      .get("/api/auth/me");

    expect(afterLogout.status).toBe(401);
  });

  it("does not block safe HTTP methods", async () => {
    // GET should reach the health endpoint
    // even when an Origin header is untrusted.
    const getResponse = await request(app)
      .get("/api/health")
      .set("Origin", UNTRUSTED_ORIGIN);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.success).toBe(true);

    // HEAD is also a safe method.
    const headResponse = await request(app)
      .head("/api/health")
      .set("Origin", UNTRUSTED_ORIGIN);

    expect(headResponse.status).toBe(200);

    // OPTIONS preflight requests are handled
    // by CORS middleware, not rejected by the
    // CSRF middleware.
    const optionsResponse = await request(app)
      .options("/api/auth/login")
      .set("Origin", UNTRUSTED_ORIGIN)
      .set("Access-Control-Request-Method", "POST");

    expect(optionsResponse.status).not.toBe(403);

    // CORS should never authorize the foreign
    // origin as the allowed origin.
    expect(
      optionsResponse.headers[
        "access-control-allow-origin"
      ]
    ).not.toBe(UNTRUSTED_ORIGIN);
  });

});

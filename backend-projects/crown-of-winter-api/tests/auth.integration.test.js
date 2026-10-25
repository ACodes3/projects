import { describe, it, expect, beforeAll, afterAll } from "vitest";

import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../app.js";
import { pool } from "../src/db/pool.js";

import { getAdminPool, verifyAdminDatabase } from "./helpers/adminPool.js";

const TEST_DATABASE = "crown-of-winter-test";
const TEST_PASSWORD = "WinterTesting2026!";

// Unique identifier for this test run
const runId = randomUUID().replaceAll("-", "").slice(0, 12);

const testAccount = {
  username: `test_${runId}`,
  email: `test_${runId}@example.com`,
  password: TEST_PASSWORD,
};

// Track only users created by our tests
const createdUserIds = new Set();

let primaryUserId = null;
let databaseVerified = false;

// -----------------------------------------
// Verify the actual application database
// -----------------------------------------

async function verifyTestDatabase() {
  if (
    process.env.NODE_ENV !== "test" ||
    process.env.DB_NAME !== TEST_DATABASE
  ) {
    throw new Error(
      "Unsafe environment: integration tests require the test database.",
    );
  }

  const result = await pool.query("SELECT current_database() AS database");

  if (result.rows[0].database !== TEST_DATABASE) {
    throw new Error(
      "Unsafe connection: application pool is not using the test database.",
    );
  }

  return true;
}

// -----------------------------------------
// Test setup
// -----------------------------------------

beforeAll(async () => {
  databaseVerified = await verifyTestDatabase();

  // Create a user for login/session tests
  const response = await request(app)
    .post("/api/auth/register")
    .send(testAccount);

  expect(response.status).toBe(201);

  primaryUserId = response.body.data.user.id;
  createdUserIds.add(primaryUserId);
});

// -----------------------------------------
// Test cleanup
// -----------------------------------------

afterAll(async () => {
  if (!databaseVerified || createdUserIds.size === 0) {
    return;
  }

  // Verify both connections before privileged cleanup.
  await verifyTestDatabase();
  await verifyAdminDatabase();

  await getAdminPool().query(
    `
    DELETE FROM users
    WHERE id = ANY($1::uuid[])
    `,
    [[...createdUserIds]],
  );
});

// -----------------------------------------
// Authentication Integration Tests
// -----------------------------------------

describe("Authentication Integration", () => {
  it("registers a new user successfully", async () => {
    const uniqueId = randomUUID().replaceAll("-", "").slice(0, 12);

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        username: `new_${uniqueId}`,
        email: `new_${uniqueId}@example.com`,
        password: TEST_PASSWORD,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toHaveProperty("id");

    createdUserIds.add(response.body.data.user.id);

    // Never expose password hashes
    expect(response.body.data.user).not.toHaveProperty("password_hash");
  });

  it("rejects duplicate usernames", async () => {
    const response = await request(app).post("/api/auth/register").send({
      username: testAccount.username,
      email: "another_unique@example.com",
      password: TEST_PASSWORD,
    });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it("rejects invalid email addresses", async () => {
    const response = await request(app).post("/api/auth/register").send({
      username: "invalid_email_user",
      email: "not-an-email",
      password: TEST_PASSWORD,
    });

    expect(response.status).toBe(400);
  });

  it("rejects passwords shorter than 12 characters", async () => {
    const response = await request(app).post("/api/auth/register").send({
      username: "weak_password_user",
      email: "weak@example.com",
      password: "short",
    });

    expect(response.status).toBe(400);
  });

  it("stores passwords as Argon2id hashes", async () => {
    const result = await pool.query(
      `
      SELECT password_hash
      FROM users
      WHERE id = $1
      `,
      [primaryUserId],
    );

    expect(result.rowCount).toBe(1);

    const storedHash = result.rows[0].password_hash;

    expect(storedHash).not.toBe(TEST_PASSWORD);
    expect(storedHash.startsWith("$argon2id$")).toBe(true);
  });

  it("logs in with valid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      identifier: testAccount.username,
      password: TEST_PASSWORD,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.id).toBe(primaryUserId);

    // Login should create an HTTP-only session cookie
    const cookies = response.headers["set-cookie"];

    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain("crown_session=");
    expect(cookies[0]).toContain("HttpOnly");
  });

  it("rejects incorrect passwords", async () => {
    const response = await request(app).post("/api/auth/login").send({
      identifier: testAccount.username,
      password: "DefinitelyWrong123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("allows authenticated users to access /me", async () => {
    const agent = request.agent(app);

    const login = await agent.post("/api/auth/login").send({
      identifier: testAccount.email,
      password: TEST_PASSWORD,
    });

    expect(login.status).toBe(200);

    const response = await agent.get("/api/auth/me");

    expect(response.status).toBe(200);
    expect(response.body.data.user.id).toBe(primaryUserId);
    expect(response.body.data.user.username).toBe(testAccount.username);
  });

  it("creates a database session after login", async () => {
    const response = await request(app).post("/api/auth/login").send({
      identifier: testAccount.username,
      password: TEST_PASSWORD,
    });

    expect(response.status).toBe(200);

    const result = await pool.query(
      `
      SELECT id, expires_at, revoked_at
      FROM user_sessions
      WHERE user_id = $1
        AND revoked_at IS NULL
        AND expires_at > NOW()
      `,
      [primaryUserId],
    );

    expect(result.rowCount).toBeGreaterThan(0);
  });

  it("revokes the session after logout", async () => {
    const agent = request.agent(app);

    const login = await agent.post("/api/auth/login").send({
      identifier: testAccount.username,
      password: TEST_PASSWORD,
    });

    expect(login.status).toBe(200);

    const beforeLogout = await agent.get("/api/auth/me");

    expect(beforeLogout.status).toBe(200);

    const logout = await agent.post("/api/auth/logout");

    expect(logout.status).toBe(200);
    expect(logout.body.success).toBe(true);

    const afterLogout = await agent.get("/api/auth/me");

    expect(afterLogout.status).toBe(401);
  });
});

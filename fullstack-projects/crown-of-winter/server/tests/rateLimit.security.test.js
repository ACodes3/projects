
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
} from "vitest";

import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../app.js";
import { pool } from "../src/db/pool.js";

import {
  login,
  getCurrentUser,
} from "../src/controllers/authController.js";

import {
  authenticate,
} from "../src/middleware/authenticate.js";

import {
  createLoginRateLimiter,
} from "../src/middleware/loginRateLimiter.js";

// -----------------------------------------
// Test configuration
// -----------------------------------------

const TEST_DATABASE = "crown-of-winter-test";
const TEST_PASSWORD = "WinterTesting2026!";

const runId = randomUUID()
  .replaceAll("-", "")
  .slice(0, 12);

const account = {
  username: `ratelimit_${runId}`,
  email: `ratelimit_${runId}@example.com`,
  password: TEST_PASSWORD,
};

const createdUserIds = new Set();

let databaseVerified = false;

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
      "Rate limit tests require crown-of-winter-test."
    );
  }

  databaseVerified = true;
}

// -----------------------------------------
// Create an isolated test application
// -----------------------------------------
// Uses the real login controller, but has
// its own limiter and in-memory counter.
//
// The limit is reduced to 3 so we can
// verify blocking without 11+ requests.

function createTestApp() {
  const testApp = express();

  testApp.use(express.json());
  testApp.use(cookieParser());

  const limiter = createLoginRateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 3,
  });

  testApp.post(
    "/login",
    limiter,
    login
  );

  // Used to confirm other authenticated
  // routes are not affected by the limiter.
  testApp.get(
    "/me",
    authenticate,
    getCurrentUser
  );

  // Match the main API's server error format.
  testApp.use((error, req, res, next) => {
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  });

  return testApp;
}

// -----------------------------------------
// Login helpers
// -----------------------------------------

function loginPayload(password = TEST_PASSWORD) {
  return {
    identifier: account.username,
    password,
  };
}

async function attemptLogin(
  testApp,
  password = TEST_PASSWORD
) {
  return request(testApp)
    .post("/login")
    .send(loginPayload(password));
}

// -----------------------------------------
// Setup
// -----------------------------------------

beforeAll(async () => {
  await verifyTestDatabase();

  const response = await request(app)
    .post("/api/auth/register")
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
    // User sessions are removed through
    // the existing database cascade.
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
// LOGIN RATE LIMIT SECURITY TESTS
// =========================================

describe("Login Rate Limiting Security", () => {

  it("allows a normal successful login", async () => {
    const testApp = createTestApp();

    const response = await attemptLogin(
      testApp
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("counts unsuccessful login attempts", async () => {
    const testApp = createTestApp();

    const first = await attemptLogin(
      testApp,
      "IncorrectPassword1!"
    );

    const second = await attemptLogin(
      testApp,
      "IncorrectPassword2!"
    );

    expect(first.status).toBe(401);
    expect(second.status).toBe(401);

    // The limiter should report remaining
    // attempts in its standard headers.
    expect(first.headers.ratelimit).toBeDefined();
    expect(second.headers.ratelimit).toBeDefined();
  });

  it("blocks excessive failed logins with HTTP 429", async () => {
    const testApp = createTestApp();

    // Three failed requests are permitted
    // by this isolated test limiter.
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await attemptLogin(
        testApp,
        "IncorrectPassword!"
      );

      expect(response.status).toBe(401);
    }

    // The fourth request must be blocked.
    const blocked = await attemptLogin(
      testApp,
      "IncorrectPassword!"
    );

    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({
      success: false,
      message:
        "Too many login attempts. Please try again in 15 minutes.",
    });
  });

  it("does not count successful logins toward the limit", async () => {
    const testApp = createTestApp();

    // Successful logins should not consume
    // our three allowed failures.
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await attemptLogin(
        testApp
      );

      expect(response.status).toBe(200);
    }

    // Three failed attempts should still
    // be allowed after those successes.
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await attemptLogin(
        testApp,
        "IncorrectPassword!"
      );

      expect(response.status).toBe(401);
    }

    // Fourth failure must be blocked.
    const blocked = await attemptLogin(
      testApp,
      "IncorrectPassword!"
    );

    expect(blocked.status).toBe(429);
  });

  it("includes standard rate-limit headers", async () => {
    const testApp = createTestApp();

    const response = await attemptLogin(
      testApp,
      "IncorrectPassword!"
    );

    expect(response.status).toBe(401);

    // express-rate-limit draft-8 headers.
    expect(response.headers.ratelimit)
      .toBeDefined();

    expect(response.headers["ratelimit-policy"])
      .toBeDefined();

    // Legacy headers should be disabled.
    expect(response.headers["x-ratelimit-limit"])
      .toBeUndefined();
  });

  it("does not block other authenticated endpoints", async () => {
    const testApp = createTestApp();
    const agent = request.agent(testApp);

    // Create a valid session first.
    const successfulLogin = await agent
      .post("/login")
      .send(loginPayload());

    expect(successfulLogin.status).toBe(200);

    // Exhaust the login allowance.
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await agent
        .post("/login")
        .send(
          loginPayload("IncorrectPassword!")
        );

      expect(response.status).toBe(401);
    }

    const blockedLogin = await agent
      .post("/login")
      .send(
        loginPayload("IncorrectPassword!")
      );

    expect(blockedLogin.status).toBe(429);

    // The login limiter should not affect
    // the authenticated /me endpoint.
    const currentUser = await agent
      .get("/me");

    expect(currentUser.status).toBe(200);
    expect(currentUser.body.success).toBe(true);
  });

});

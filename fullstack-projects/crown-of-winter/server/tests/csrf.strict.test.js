
import {
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";

import express from "express";
import request from "supertest";

import {
  csrfProtection,
} from "../src/middleware/csrfProtection.js";

// -----------------------------------------
// Isolated CSRF test application
// -----------------------------------------

function createTestApp() {
  const app = express();

  app.use(csrfProtection);

  app.post("/test-action", (req, res) => {
    return res.status(200).json({
      success: true,
    });
  });

  app.get("/test-action", (req, res) => {
    return res.status(200).json({
      success: true,
    });
  });

  return app;
}

const trustedOrigin =
  process.env.CLIENT_URL || "http://localhost:5173";

afterEach(() => {
  vi.unstubAllEnvs();
});

// -----------------------------------------
// Strict Origin validation tests
// -----------------------------------------

describe("Strict CSRF Origin Validation", () => {
  it("accepts the trusted frontend origin", async () => {
    const response = await request(createTestApp())
      .post("/test-action")
      .set("Origin", trustedOrigin);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("rejects an Origin containing a path", async () => {
    const response = await request(createTestApp())
      .post("/test-action")
      .set("Origin", `${trustedOrigin}/malicious`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Invalid request origin."
    );
  });

  it("rejects an Origin containing a query string", async () => {
    const response = await request(createTestApp())
      .post("/test-action")
      .set("Origin", `${trustedOrigin}?admin=true`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Invalid request origin."
    );
  });

  it("rejects an Origin containing a fragment", async () => {
    const response = await request(createTestApp())
      .post("/test-action")
      .set("Origin", `${trustedOrigin}#fragment`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Invalid request origin."
    );
  });

  it("rejects multiple origins in one header", async () => {
    const response = await request(createTestApp())
      .post("/test-action")
      .set(
        "Origin",
        `${trustedOrigin}, https://evil.example`
      );

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Invalid request origin."
    );
  });

  it("rejects an Origin containing credentials", async () => {
    const response = await request(createTestApp())
      .post("/test-action")
      .set(
        "Origin",
        "https://username:password@evil.example"
      );

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Invalid request origin."
    );
  });

  it("rejects a missing Origin outside test mode", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const response = await request(createTestApp())
      .post("/test-action");

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Origin header required."
    );
  });

  it("does not block safe GET requests", async () => {
    const response = await request(createTestApp())
      .get("/test-action")
      .set("Origin", "https://evil.example");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

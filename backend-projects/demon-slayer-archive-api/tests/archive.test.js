
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";

import app from "../app.js";
import pool from "../src/config/db.js";

// ==========================================
// CLEANUP
// ==========================================

// Close PostgreSQL connections after all tests.
afterAll(async () => {
  await pool.end();
});

// ==========================================
// HEALTH CHECK
// ==========================================

describe("Health Check", () => {
  it("should return 200 when the API is running", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

// ==========================================
// GET ALL SLAYERS
// ==========================================

describe("GET /api/slayers", () => {
  it("should return a paginated list of slayers", async () => {
    const response = await request(app)
      .get("/api/slayers?page=1&limit=5");

    expect(response.status).toBe(200);

    expect(Array.isArray(response.body.data)).toBe(true);

    expect(response.body.data.length).toBeLessThanOrEqual(5);

    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(5);

    expect(response.body.pagination).toHaveProperty("total");
    expect(response.body.pagination).toHaveProperty("totalPages");
  });

  it("should reject an invalid page number", async () => {
    const response = await request(app)
      .get("/api/slayers?page=-1");

    expect(response.status).toBe(400);
  });

  it("should reject a limit greater than 100", async () => {
    const response = await request(app)
      .get("/api/slayers?limit=200");

    expect(response.status).toBe(400);
  });

  it("should reject an invalid sort field", async () => {
    const response = await request(app)
      .get("/api/slayers?sort=password");

    expect(response.status).toBe(400);
  });
});

// ==========================================
// SEARCH
// ==========================================

describe("Searching", () => {
  it("should support searching slayers by name", async () => {
    const response = await request(app)
      .get("/api/slayers?search=tanjiro");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);

    for (const slayer of response.body.data) {
      expect(slayer.name.toLowerCase()).toContain("tanjiro");
    }
  });
});

// ==========================================
// FILTERING
// ==========================================

describe("Filtering", () => {
  it("should reject rank filtering for techniques", async () => {
    const response = await request(app)
      .get("/api/techniques?rank=Hashira");

    expect(response.status).toBe(400);
  });
});

// ==========================================
// GET RECORD BY ID
// ==========================================

describe("GET /api/slayers/:id", () => {
  it("should return 404 for a nonexistent slayer", async () => {
    const response = await request(app)
      .get("/api/slayers/nonexistent-test-slayer-12345");

    expect(response.status).toBe(404);
  });
});

// ==========================================
// UNKNOWN ENDPOINTS
// ==========================================

describe("Unknown Routes", () => {
  it("should return 404 for an unknown endpoint", async () => {
    const response = await request(app)
      .get("/api/unknown-collection");

    expect(response.status).toBe(404);
  });
});

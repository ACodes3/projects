
import {
  describe,
  it,
  expect,
  afterAll,
} from "vitest";

import request from "supertest";
import app from "../app.js";
import pool from "../src/config/db.js";

// ==========================================
// CRUD TEST DATA
// ==========================================

const testSlayer = {
  id: "automated-test-slayer",
  name: "Test Slayer",
  rank: "Mizunoto",
  breathing_style_ids: [],
  technique_ids: [],
  related_character_ids: [],
  description: "Temporary character for API testing",
  stats: {},
  image: null,
};

// ==========================================
// DATABASE SAFETY
// ==========================================

async function verifyTestDatabase() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("CRUD tests require NODE_ENV=test");
  }

  const result = await pool.query(
    "SELECT current_database() AS database"
  );

  if (result.rows[0].database !== "demon_slayer_archive_test") {
    throw new Error("Unsafe database connection");
  }
}

// ==========================================
// SLAYER CRUD TESTS
// ==========================================

describe("Slayer CRUD Operations", () => {
  it("should create a new slayer", async () => {
    await verifyTestDatabase();

    const response = await request(app)
      .post("/api/slayers")
      .send(testSlayer);

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe(testSlayer.id);
    expect(response.body.data.name).toBe(testSlayer.name);
  });

  it("should retrieve the created slayer", async () => {
    const response = await request(app)
      .get(`/api/slayers/${testSlayer.id}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(testSlayer.id);
  });

  it("should update the slayer", async () => {
    await verifyTestDatabase();

    const response = await request(app)
      .patch(`/api/slayers/${testSlayer.id}`)
      .send({
        name: "Updated Test Slayer",
        description: "Updated by an automated test",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe(
      "Updated Test Slayer"
    );
  });

  it("should delete the slayer", async () => {
    await verifyTestDatabase();

    const response = await request(app)
      .delete(`/api/slayers/${testSlayer.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(testSlayer.id);
  });

  it("should return 404 after deletion", async () => {
    const response = await request(app)
      .get(`/api/slayers/${testSlayer.id}`);

    expect(response.status).toBe(404);
  });
});

// ==========================================
// CLEANUP
// ==========================================

// Remove the temporary record if an earlier test fails.
// This ensures it does not remain between test runs.

afterAll(async () => {
  await verifyTestDatabase();

  await pool.query(
    "DELETE FROM slayers WHERE id = $1",
    [testSlayer.id]
  );

  await pool.end();
});

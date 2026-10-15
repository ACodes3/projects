import { describe, it, expect, beforeAll, afterAll } from "vitest";

import request from "supertest";
import app from "../app.js";
import pool from "../src/config/db.js";

// ==========================================
// TEST CONFIGURATION
// ==========================================

const TEST_DATABASE = "demon_slayer_archive_test";

const PREFIX = "automated-validation-test";

// Track only records created by these tests.
const testIds = new Set();

function makeTestId(label) {
  const id = `${PREFIX}-${label}-${crypto.randomUUID()}`;

  testIds.add(id);

  return id;
}

// ==========================================
// DATABASE SAFETY
// ==========================================

async function verifyTestDatabase() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Validation tests require NODE_ENV=test");
  }

  const result = await pool.query("SELECT current_database() AS database");

  const database = result.rows[0].database;

  if (database !== TEST_DATABASE) {
    throw new Error(`Unsafe database connection: ${database}`);
  }
}

beforeAll(async () => {
  await verifyTestDatabase();
});

// ==========================================
// CLEANUP
// ==========================================

afterAll(async () => {
  await verifyTestDatabase();

  const ids = [...testIds];

  // Delete child records before parent records.
  const tables = [
    "techniques",
    "blood_demon_arts",
    "breathing_styles",
    "demons",
    "slayers",
  ];

  for (const table of tables) {
    await pool.query(
      `
      DELETE FROM ${table}
      WHERE id = ANY($1::text[])
      `,
      [ids],
    );
  }
});

// ==========================================
// REQUIRED FIELD VALIDATION
// ==========================================

describe("Required Field Validation", () => {
  it("should reject a Slayer without a name", async () => {
    const response = await request(app)
      .post("/api/slayers")
      .send({
        id: makeTestId("missing-name"),
      });

    expect(response.status).toBe(400);
  });

  it("should reject an empty Slayer request", async () => {
    const response = await request(app).post("/api/slayers").send({});

    expect(response.status).toBe(400);
  });

  it("should reject a Technique without a parent", async () => {
    const response = await request(app)
      .post("/api/techniques")
      .send({
        id: makeTestId("missing-parent"),
        name: "Invalid Technique",
        category: "breathing",
      });

    expect(response.status).toBe(400);
  });
});

// ==========================================
// INVALID FIELD VALIDATION
// ==========================================

describe("Invalid Field Validation", () => {
  it("should reject an invalid Technique category", async () => {
    const response = await request(app)
      .post("/api/techniques")
      .send({
        id: makeTestId("invalid-category"),
        name: "Invalid Technique",
        category: "magic",
        parent_id: "water-breathing",
        user_ids: [],
        description: "",
      });

    expect(response.status).toBe(400);
  });

  it("should reject an unknown field on a Slayer", async () => {
    const response = await request(app)
      .post("/api/slayers")
      .send({
        id: makeTestId("unknown-field"),
        name: "Invalid Slayer",
        unknown_field: "This should not exist",
      });

    expect(response.status).toBe(400);
  });

  it("should reject an empty PATCH request", async () => {
    const id = makeTestId("empty-patch");

    await verifyTestDatabase();

    try {
      // Create a real Slayer in the test database.
      await pool.query(
        `
      INSERT INTO slayers (id, name)
      VALUES ($1, $2)
      `,
        [id, "Empty PATCH Test Slayer"],
      );

      // Attempt to update without providing any fields.
      const response = await request(app).patch(`/api/slayers/${id}`).send({});

      expect(response.status).toBe(400);
    } finally {
      // The test's afterAll hook also provides cleanup.
      await verifyTestDatabase();

      await pool.query("DELETE FROM slayers WHERE id = $1", [id]);
    }
  });
});

// ==========================================
// DUPLICATE ID VALIDATION
// ==========================================

describe("Duplicate ID Validation", () => {
  it("should reject creating a Slayer with an existing ID", async () => {
    const id = makeTestId("duplicate");

    await verifyTestDatabase();

    const slayer = {
      id,
      name: "Duplicate Test Slayer",
      rank: "Mizunoto",
      breathing_style_ids: [],
      technique_ids: [],
      related_character_ids: [],
      description: "Duplicate ID test",
      stats: {},
      image: null,
    };

    const firstResponse = await request(app).post("/api/slayers").send(slayer);

    expect(firstResponse.status, JSON.stringify(firstResponse.body)).toBe(201);

    const secondResponse = await request(app).post("/api/slayers").send(slayer);

    expect(secondResponse.status).toBe(409);
  });
});

// ==========================================
// RELATIONSHIP VALIDATION
// ==========================================

describe("Relationship Validation", () => {
  it("should reject a Technique with a nonexistent parent", async () => {
    const response = await request(app)
      .post("/api/techniques")
      .send({
        id: makeTestId("invalid-parent"),
        name: "Orphan Technique",
        category: "breathing",
        parent_id: "nonexistent-breathing-style",
        user_ids: [],
        description: "This parent does not exist",
      });

    expect(response.status).toBe(400);
  });

  it("should reject a Slayer referencing a nonexistent style", async () => {
    const response = await request(app)
      .post("/api/slayers")
      .send({
        id: makeTestId("invalid-style"),
        name: "Invalid Style Slayer",
        rank: "Mizunoto",
        breathing_style_ids: ["nonexistent-breathing-style"],
        technique_ids: [],
        related_character_ids: [],
        description: "",
        stats: {},
        image: null,
      });

    expect(response.status).toBe(400);
  });

  it("should reject a Breathing Style deriving from itself", async () => {
    const id = makeTestId("self-derivation");

    const response = await request(app).post("/api/breathing-styles").send({
      id,
      name: "Self Derivation Test",
      derived_from_id: id,
      user_ids: [],
      technique_ids: [],
      description: "",
      theme: {},
      image: null,
    });

    expect(response.status).toBe(400);
  });
});

// ==========================================
// NOT FOUND ERRORS
// ==========================================

describe("Not Found Errors", () => {
  it("should return 404 when updating a nonexistent Slayer", async () => {
    const response = await request(app)
      .patch("/api/slayers/nonexistent-test-slayer")
      .send({
        name: "Updated Name",
      });

    expect(response.status).toBe(404);
  });

  it("should return 404 when deleting a nonexistent Demon", async () => {
    const response = await request(app).delete(
      "/api/demons/nonexistent-test-demon",
    );

    expect(response.status).toBe(404);
  });
});

// ==========================================
// PROTECTED DELETION
// ==========================================

describe("Protected Deletion", () => {
  it("should prevent deletion of a referenced Breathing Style", async () => {
    const styleId = makeTestId("protected-style");
    const techniqueId = makeTestId("style-technique");

    await verifyTestDatabase();

    // Create a temporary Breathing Style.
    await pool.query(
      `
      INSERT INTO breathing_styles (id, name)
      VALUES ($1, $2)
      `,
      [styleId, "Protected Test Style"],
    );

    // Create a Technique that belongs to this style.
    await pool.query(
      `
      INSERT INTO techniques (
        id,
        name,
        category,
        parent_id
      )
      VALUES ($1, $2, $3, $4)
      `,
      [techniqueId, "Protected Test Technique", "breathing", styleId],
    );

    const response = await request(app).delete(
      `/api/breathing-styles/${styleId}`,
    );

    expect(response.status).toBe(409);

    // Verify the style was not removed.
    const result = await pool.query(
      "SELECT id FROM breathing_styles WHERE id = $1",
      [styleId],
    );

    expect(result.rows).toHaveLength(1);
  });
});

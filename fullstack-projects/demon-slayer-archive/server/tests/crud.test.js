
import {
  describe,
  it,
  expect,
  beforeAll,
} from "vitest";

import request from "supertest";
import app from "../app.js";
import pool from "../src/config/db.js";

// ==========================================
// TEST CONFIGURATION
// ==========================================

const TEST_DATABASE = "demon_slayer_archive_test";

// Every test record uses this prefix.
// Do not use this prefix for real records.
const PREFIX = "automated-crud-test";

// ==========================================
// DATABASE SAFETY
// ==========================================

async function verifyTestDatabase() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "CRUD tests require NODE_ENV=test"
    );
  }

  const result = await pool.query(
    "SELECT current_database() AS database"
  );

  const database = result.rows[0].database;

  if (database !== TEST_DATABASE) {
    throw new Error(
      `Unsafe database connection: ${database}`
    );
  }
}

beforeAll(async () => {
  await verifyTestDatabase();
});

// ==========================================
// TEST HELPERS
// ==========================================

// Use a different ID for every test execution.
function makeTestId(label) {
  return `${PREFIX}-${label}-${crypto.randomUUID()}`;
}

// Verify a complete CRUD lifecycle.
// All five operations happen within one test,
// so tests do not depend on execution order.
async function testCrudLifecycle({
  collection,
  record,
  updates,
}) {
  const url = `/api/${collection}`;
  const id = record.id;

  // POST - Create
  const created = await request(app)
    .post(url)
    .send(record);

  expect(created.status, JSON.stringify(created.body)).toBe(201);
  expect(created.body.data.id).toBe(id);

  // GET - Retrieve
  const retrieved = await request(app)
    .get(`${url}/${id}`);

  expect(retrieved.status).toBe(200);
  expect(retrieved.body.id).toBe(id);

  // PATCH - Update
  const updated = await request(app)
    .patch(`${url}/${id}`)
    .send(updates);

  expect(updated.status, JSON.stringify(updated.body)).toBe(200);

  for (const [field, value] of Object.entries(updates)) {
    expect(updated.body.data[field]).toEqual(value);
  }

  // GET - Confirm changes
  const afterUpdate = await request(app)
    .get(`${url}/${id}`);

  expect(afterUpdate.status).toBe(200);

  for (const [field, value] of Object.entries(updates)) {
    expect(afterUpdate.body[field]).toEqual(value);
  }

  // DELETE - Remove
  const deleted = await request(app)
    .delete(`${url}/${id}`);

  expect(deleted.status, JSON.stringify(deleted.body)).toBe(200);
  expect(deleted.body.data.id).toBe(id);

  // GET - Confirm deletion
  const afterDeletion = await request(app)
    .get(`${url}/${id}`);

  expect(afterDeletion.status).toBe(404);
}

// ==========================================
// CLEANUP HELPERS
// ==========================================

// Table names are hardcoded, never user input.
// Delete child records before parent records.
async function cleanupTestRecords(ids) {
  await verifyTestDatabase();

  const tables = [
    "techniques",
    "blood_demon_arts",
    "breathing_styles",
    "demons",
    "slayers",
  ];

  for (const table of tables) {
    await pool.query(
      `DELETE FROM ${table}
       WHERE id = ANY($1::text[])`,
      [ids]
    );
  }
}

// ==========================================
// SLAYER CRUD
// ==========================================

describe("Slayer CRUD", () => {
  it("should complete the full Slayer lifecycle", async () => {
    const id = makeTestId("slayer");

    try {
      await testCrudLifecycle({
        collection: "slayers",

        record: {
          id,
          name: "Automated Test Slayer",
          rank: "Mizunoto",
          breathing_style_ids: [],
          technique_ids: [],
          related_character_ids: [],
          description: "Temporary Slayer",
          stats: {},
          image: null,
        },

        updates: {
          name: "Updated Test Slayer",
          description: "Updated by Vitest",
        },
      });
    } finally {
      await cleanupTestRecords([id]);
    }
  });
});

// ==========================================
// DEMON CRUD
// ==========================================

describe("Demon CRUD", () => {
  it("should complete the full Demon lifecycle", async () => {
    const id = makeTestId("demon");

    try {
      await testCrudLifecycle({
        collection: "demons",

        record: {
          id,
          name: "Automated Test Demon",
          rank: "Lower Rank Six",
          blood_demon_art_ids: [],
          ability_ids: [],
          related_character_ids: [],
          description: "Temporary Demon",
          stats: {},
          image: null,
        },

        updates: {
          name: "Updated Test Demon",
          description: "Updated by Vitest",
        },
      });
    } finally {
      await cleanupTestRecords([id]);
    }
  });
});

// ==========================================
// BREATHING STYLE CRUD
// ==========================================

describe("Breathing Style CRUD", () => {
  it("should complete the full Breathing Style lifecycle", async () => {
    const id = makeTestId("breathing-style");

    try {
      await testCrudLifecycle({
        collection: "breathing-styles",

        record: {
          id,
          name: "Automated Test Breathing",
          derived_from_id: null,
          user_ids: [],
          technique_ids: [],
          description: "Temporary Breathing Style",
          theme: {},
          image: null,
        },

        updates: {
          name: "Updated Test Breathing",
          description: "Updated by Vitest",
        },
      });
    } finally {
      await cleanupTestRecords([id]);
    }
  });
});

// ==========================================
// BLOOD DEMON ART CRUD
// ==========================================

describe("Blood Demon Art CRUD", () => {
  it("should complete the full Blood Demon Art lifecycle", async () => {
    const demonId = makeTestId("art-owner");
    const artId = makeTestId("blood-demon-art");

    try {
      // A Blood Demon Art requires a valid Demon owner.
      // Create the dependency in the test database.
      await pool.query(
        `
        INSERT INTO demons (id, name)
        VALUES ($1, $2)
        `,
        [demonId, "Temporary Art Owner"]
      );

      await testCrudLifecycle({
        collection: "blood-demon-arts",

        record: {
          id: artId,
          name: "Automated Test Blood Demon Art",
          user_id: demonId,
          ability_ids: [],
          description: "Temporary Blood Demon Art",
          theme: {},
          image: null,
        },

        updates: {
          name: "Updated Test Blood Demon Art",
          description: "Updated by Vitest",
        },
      });
    } finally {
      // The art is deleted before its Demon owner.
      await cleanupTestRecords([artId, demonId]);
    }
  });
});

// ==========================================
// TECHNIQUE CRUD
// ==========================================

describe("Technique CRUD", () => {
  it("should complete the full Technique lifecycle", async () => {
    const styleId = makeTestId("technique-parent");
    const techniqueId = makeTestId("technique");

    try {
      // A Breathing Technique needs an existing style.
      await pool.query(
        `
        INSERT INTO breathing_styles (id, name)
        VALUES ($1, $2)
        `,
        [styleId, "Temporary Parent Style"]
      );

      await testCrudLifecycle({
        collection: "techniques",

        record: {
          id: techniqueId,
          name: "Automated Test Technique",
          category: "breathing",
          parent_id: styleId,
          user_ids: [],
          description: "Temporary Breathing Technique",
        },

        updates: {
          name: "Updated Test Technique",
          description: "Updated by Vitest",
        },
      });
    } finally {
      // The technique is deleted before its parent style.
      await cleanupTestRecords([
        techniqueId,
        styleId,
      ]);
    }
  });
});

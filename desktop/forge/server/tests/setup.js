
import { beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(currentDir, "../../db");

// Each test worker receives its own temporary directory.
const tempDir = mkdtempSync(
  path.join(tmpdir(), "forge-test-")
);

const testDbPath = path.join(tempDir, "test.sqlite");

// Set this BEFORE importing the Express app or controllers.
process.env.FORGE_DB_PATH = testDbPath;

// Create the test database using your real SQLite schema.
const db = new Database(testDbPath);

try {
  db.pragma("foreign_keys = ON");

  const schema = readFileSync(
    path.join(dbDir, "schema.sqlite.sql"),
    "utf8"
  );

  db.exec(schema);

  // Provide the demo user required by devUser middleware.
  db.prepare(`
    INSERT INTO users (email, password_hash)
    VALUES (?, ?)
  `).run(
    "demo@forge.local",
    "TEST_ONLY_NOT_A_REAL_PASSWORD_HASH"
  );
} finally {
  db.close();
}

// Remove temporary database files after the test suite.

afterAll(async () => {
  // Import the same database instance used by our controllers.
  const { default: db } = await import(
    "../src/config/sqlite.js"
  );

  // Close the SQLite connection before deleting files.
  if (db.open) {
    db.close();
  }

  // Windows can now remove the database directory.
  rmSync(tempDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
});


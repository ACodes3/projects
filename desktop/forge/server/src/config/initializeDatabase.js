import Database from "better-sqlite3";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";

/**
 * Initializes a FORGE SQLite database.
 *
 * Call this before importing modules that open
 * the application's main database connection.
 *
 * @param {string} databasePath - Absolute database path
 * @param {string} resourcesDir - Directory containing SQL files
 */
export function initializeDatabase(databasePath, resourcesDir) {
  const schemaPath = path.join(resourcesDir, "schema.sqlite.sql");

  const seedPath = path.join(resourcesDir, "seed.desktop.sql");

  mkdirSync(path.dirname(databasePath), {
    recursive: true,
  });

  const db = new Database(databasePath);

  try {
    db.pragma("foreign_keys = ON");

    const tables = db
      .prepare(
        `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name = 'users'
    `,
      )
      .get();

    // Only initialize a brand-new database.
    if (!tables) {
      const schema = readFileSync(schemaPath, "utf8");
      const seed = readFileSync(seedPath, "utf8");

      // The seed file already manages its own transaction.
      // Remove its transaction statements before executing it
      // inside our application's transaction.
      const seedWithoutTransactions = seed
        .replace(/^\s*BEGIN(?:\s+TRANSACTION)?\s*;\s*$/gim, "")
        .replace(/^\s*COMMIT(?:\s+TRANSACTION)?\s*;\s*$/gim, "");

      const initialize = db.transaction(() => {
        db.exec(schema);
        db.exec(seedWithoutTransactions);
      });

      initialize();

      console.log("FORGE database initialized successfully.");
    }

    db.pragma("journal_mode = WAL");

    const integrity = db.pragma("integrity_check", {
      simple: true,
    });

    if (integrity !== "ok") {
      throw new Error(`FORGE database integrity check failed: ${integrity}`);
    }

    const foreignKeyErrors = db.pragma("foreign_key_check");

    if (foreignKeyErrors.length > 0) {
      throw new Error("FORGE database contains invalid foreign keys.");
    }

    return {
      databasePath,
      initialized: !tables,
    };
  } finally {
    db.close();
  }
}

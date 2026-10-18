
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Resolve paths relative to this script.
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(scriptDir, "../../db");

const databasePath = path.join(dbDir, "forge.sqlite");
const schemaPath = path.join(dbDir, "schema.sqlite.sql");

// Open or create the local database.
const db = new Database(databasePath);

try {
  db.pragma("foreign_keys = ON");

  // Protect an already initialized database.
  const existingTable = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'"
    )
    .get();

  if (existingTable) {
    console.log("Database is already initialized.");
  } else {
    const schema = readFileSync(schemaPath, "utf8");

    db.transaction(() => {
      db.exec(schema);
    })();

    console.log("FORGE SQLite database created successfully!");
  }

  const tables = db
    .prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)
    .all();

  console.log("\nDatabase tables:");
  for (const table of tables) {
    console.log(`  - ${table.name}`);
  }
} finally {
  db.close();
}

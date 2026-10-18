
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(
  fileURLToPath(import.meta.url)
);

// Development database location
const defaultDatabasePath = path.resolve(
  currentDir,
  "../../../db/forge.sqlite"
);

// Tests can override the database location.
// Electron will eventually use this too.
const databasePath =
  process.env.FORGE_DB_PATH || defaultDatabasePath;

const db = new Database(databasePath, {
  fileMustExist: true,
});

// Enforce relationships
db.pragma("foreign_keys = ON");

// Improve concurrent read/write behavior
db.pragma("journal_mode = WAL");

export default db;

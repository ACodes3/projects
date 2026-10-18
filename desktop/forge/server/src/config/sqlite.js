
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Get the current file's directory
const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Locate the FORGE SQLite database
const databasePath = path.resolve(
  currentDir,
  "../../../db/forge.sqlite"
);

// Open the existing local database
const db = new Database(databasePath, {
  fileMustExist: true,
});

// Enable foreign key constraints
db.pragma("foreign_keys = ON");

// Improve performance and reliability for local access
db.pragma("journal_mode = WAL");

export default db;

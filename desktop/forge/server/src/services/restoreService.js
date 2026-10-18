
import Database from "better-sqlite3";
import { statSync } from "node:fs";
import path from "node:path";

const REQUIRED_TABLES = [
  "users",
  "profiles",
  "nutrition_goals",
  "exercises",
  "workouts",
  "workout_exercises",
  "workout_sets",
  "nutrition_entries",
  "progress_entries",
  "rest_days",
];

/**
 * Validate a FORGE SQLite backup without modifying it.
 *
 * @param {string} backupPath
 * @returns {{valid: boolean, exercises: number, workouts: number}}
 */
export function validateDatabaseBackup(backupPath) {
  if (
    typeof backupPath !== "string" ||
    !path.isAbsolute(backupPath)
  ) {
    throw new Error("Backup path must be absolute.");
  }

  if (path.extname(backupPath).toLowerCase() !== ".sqlite") {
    throw new Error("Backup must be a .sqlite file.");
  }

  const stats = statSync(backupPath);

  if (!stats.isFile() || stats.size === 0) {
    throw new Error("Backup file is empty or invalid.");
  }

  const db = new Database(backupPath, {
    readonly: true,
    fileMustExist: true,
  });

  try {
    const integrity = db.pragma("integrity_check", {
      simple: true,
    });

    if (integrity !== "ok") {
      throw new Error("Backup failed SQLite integrity check.");
    }

    const foreignKeyErrors = db.pragma("foreign_key_check");

    if (foreignKeyErrors.length > 0) {
      throw new Error("Backup contains broken foreign keys.");
    }

    const tables = new Set(
      db.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
      `).all().map((row) => row.name)
    );

    for (const table of REQUIRED_TABLES) {
      if (!tables.has(table)) {
        throw new Error(
          `Backup is missing required table: ${table}`
        );
      }
    }

    const user = db.prepare(`
      SELECT id
      FROM users
      WHERE email = ?
    `).get("demo@forge.local");

    if (!user) {
      throw new Error(
        "Backup does not contain the FORGE local user."
      );
    }

    const exercises = db.prepare(`
      SELECT COUNT(*) AS total FROM exercises
    `).get().total;

    const workouts = db.prepare(`
      SELECT COUNT(*) AS total FROM workouts
    `).get().total;

    return {
      valid: true,
      exercises,
      workouts,
    };
  } finally {
    db.close();
  }
}

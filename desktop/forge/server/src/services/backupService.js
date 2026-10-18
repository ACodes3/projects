
import fs from "node:fs";
import path from "node:path";

import db from "../config/sqlite.js";

/**
 * Create a consistent backup of the FORGE database.
 *
 * Uses SQLite's backup API to safely back up
 * databases operating in WAL mode.
 *
 * @param {string} destinationPath
 * @returns {Promise<{path: string, bytes: number}>}
 */
export async function createDatabaseBackup(destinationPath) {
  if (!path.isAbsolute(destinationPath)) {
    throw new Error("Backup destination must be an absolute path.");
  }

  const target = path.resolve(destinationPath);

  if (path.extname(target).toLowerCase() !== ".sqlite") {
    throw new Error("Backup filename must end in .sqlite.");
  }

  fs.mkdirSync(path.dirname(target), {
    recursive: true,
  });

  if (fs.existsSync(target)) {
    throw new Error("A backup already exists at that location.");
  }

  try {
    // Resolves when SQLite has finished creating the backup.
    await db.backup(target);

    const stats = fs.statSync(target);

    if (stats.size === 0) {
      throw new Error("The backup file is empty.");
    }

    return {
      path: target,
      bytes: stats.size,
    };
  } catch (error) {
    // Remove incomplete backup files if backup creation fails.
    if (fs.existsSync(target)) {
      fs.rmSync(target, { force: true });
    }

    throw error;
  }
}

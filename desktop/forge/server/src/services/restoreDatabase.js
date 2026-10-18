
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { validateDatabaseBackup } from "./restoreService.js";

/**
 * Restore a backup into an existing SQLite database.
 *
 * SAFETY REQUIREMENTS:
 * - The target database must not be open.
 * - No other application may be using the target.
 * - The source backup must pass validation.
 * - A safety backup is created before replacement.
 *
 * This service is intended for controlled application
 * shutdown/restoration, NOT direct use in an API route.
 */
export async function restoreDatabase(
  backupPath,
  targetPath,
  safetyBackupPath
) {
  const source = path.resolve(backupPath);
  const target = path.resolve(targetPath);
  const safety = path.resolve(safetyBackupPath);

  if (
    source === target ||
    source === safety ||
    target === safety
  ) {
    throw new Error(
      "Backup, database, and safety backup paths must differ."
    );
  }

  // Validate the source before touching the current database.
  validateDatabaseBackup(source);

  if (!fs.existsSync(target)) {
    throw new Error("Target database does not exist.");
  }

  if (fs.existsSync(safety)) {
    throw new Error(
      "Safety backup already exists. Choose another filename."
    );
  }

  fs.mkdirSync(path.dirname(safety), {
    recursive: true,
  });

  // Create a consistent safety backup of the target.
  const currentDb = new Database(target, {
    fileMustExist: true,
  });

  try {
    await currentDb.backup(safety);
  } finally {
    currentDb.close();
  }

  // Validate the safety backup before continuing.
  validateDatabaseBackup(safety);

  // Replace through SQLite's backup API rather than copying
  // database files, which can be unsafe with WAL mode.
  const replacementDb = new Database(source, {
    readonly: true,
    fileMustExist: true,
  });

  try {
    await replacementDb.backup(target);
  } finally {
    replacementDb.close();
  }

  // Confirm the restored database is valid.
  validateDatabaseBackup(target);

  return {
    restored: true,
    safetyBackupPath: safety,
    databasePath: target,
  };
}

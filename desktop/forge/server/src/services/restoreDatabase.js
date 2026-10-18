import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { validateDatabaseBackup } from "./restoreService.js";

/**
 * Copy a SQLite database using SQLite's backup API rather than a raw file copy.
 * The destination database must not be in use by another process.
 */
async function copyDatabase(sourcePath, destinationPath) {
  const sourceDb = new Database(sourcePath, {
    readonly: true,
    fileMustExist: true,
  });

  try {
    await sourceDb.backup(destinationPath);
  } finally {
    sourceDb.close();
  }
}

/**
 * Restore a validated FORGE backup into a CLOSED SQLite database.
 *
 * REQUIREMENTS:
 * - Express and all other users of the target database have stopped.
 * - The caller must ensure no other process can reopen the target during restore.
 * - The chosen backup, target, and safety backup are different files.
 *
 * If replacement or post-restore validation fails, this function attempts
 * to recover the original target from the verified safety backup.
 * The safety backup is NEVER deleted by this function.
 */
export async function restoreDatabase(
  backupPath,
  targetPath,
  safetyBackupPath,
  options = {}
) {
  const source = path.resolve(backupPath);
  const target = path.resolve(targetPath);
  const safety = path.resolve(safetyBackupPath);

  if (source === target || source === safety || target === safety) {
    throw new Error(
      "Backup, database, and safety backup paths must differ."
    );
  }

  // Failure injection is only allowed in explicit test mode, on a temporary
  // target. Never allow it on the application database.
  const simulateFailure = options.simulateFailureAfterReplacement === true;
  if (simulateFailure) {
    const relative = path.relative(os.tmpdir(), target);
    const isWithinTemp = relative && relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);

    if (process.env.FORGE_RESTORE_TEST_MODE !== "1" || !isWithinTemp) {
      throw new Error("Restore failure simulation is allowed only for temporary test databases.");
    }
  }

  // Validate the selected backup before opening or changing the target.
  validateDatabaseBackup(source);

  if (!fs.existsSync(target)) {
    throw new Error("Target database does not exist.");
  }

  if (fs.existsSync(safety)) {
    throw new Error(
      "Safety backup already exists. Choose another filename."
    );
  }

  fs.mkdirSync(path.dirname(safety), { recursive: true });

  // Make a consistent snapshot of the current database.
  const currentDb = new Database(target, { fileMustExist: true });
  try {
    await currentDb.backup(safety);
  } finally {
    currentDb.close();
  }

  // Never proceed with replacement unless the safety snapshot is valid.
  validateDatabaseBackup(safety);

  try {
    await copyDatabase(source, target);

    // Deliberately fail AFTER the replacement to exercise rollback.
    // This branch is unreachable in normal operation.
    if (simulateFailure) {
      throw new Error("Simulated failure after database replacement.");
    }

    validateDatabaseBackup(target);
  } catch (restoreError) {
    // The target may have been partly replaced. Attempt to roll it back.
    try {
      await copyDatabase(safety, target);
      validateDatabaseBackup(target);
    } catch (recoveryError) {
      // Keep the safety file intact so the user can recover manually.
      throw new AggregateError(
        [restoreError, recoveryError],
        `Restore failed AND automatic recovery failed. ` +
          `Do not restart FORGE until the database is recovered. ` +
          `Safety backup: ${safety}`
      );
    }

    throw new Error(
      `Restore failed. The previous database was recovered successfully. ` +
        `Safety backup: ${safety}`,
      { cause: restoreError }
    );
  }

  return {
    restored: true,
    safetyBackupPath: safety,
    databasePath: target,
  };
}
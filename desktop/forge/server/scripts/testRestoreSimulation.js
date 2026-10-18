import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { restoreDatabase } from "../src/services/restoreDatabase.js";
import { validateDatabaseBackup } from "../src/services/restoreService.js";

/*
 * FORGE — SAFE RESTORE SIMULATION
 *
 * Run from forge/server:
 *   node scripts/testRestoreSimulation.js "C:\\Users\\...\\Downloads\\forge-backup.sqlite"
 *
 * All restore targets are created inside a fresh temporary directory.
 * The live FORGE database is never used as a restore target.
 */

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(scriptsDir, "..");
const liveDatabasePath = path.resolve(serverDir, "../db/forge.sqlite");
const backupPath = process.argv[2];

async function main() {
  if (!backupPath) {
    throw new Error("Pass the absolute path to a downloaded .sqlite backup.");
  }

  const selectedBackup = path.resolve(backupPath);
  if (selectedBackup === liveDatabasePath) {
    throw new Error("Select a downloaded backup, not the live database.");
  }

  const sourceInfo = validateDatabaseBackup(selectedBackup);
  console.log("Selected backup valid:", sourceInfo);

  if (!fs.existsSync(liveDatabasePath)) {
    throw new Error(`Live database not found: ${liveDatabasePath}`);
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "forge-restore-test-"));
  const testTarget = path.join(tempDir, "test-target.sqlite");
  const safetyBackup = path.join(tempDir, "test-safety.sqlite");

  console.log("Temporary test directory:", tempDir);
  console.log("Live database will NOT be replaced.");

  try {
    // Clone the live database with SQLite's online backup API.
    // This READS the live database; it does not replace or edit it.
    const liveDb = new Database(liveDatabasePath, {
      readonly: true,
      fileMustExist: true,
    });

    try {
      await liveDb.backup(testTarget);
    } finally {
      liveDb.close();
    }

    const before = validateDatabaseBackup(testTarget);
    console.log("Temporary target before restore:", before);

    const result = await restoreDatabase(
      selectedBackup,
      testTarget,
      safetyBackup,
    );

    const after = validateDatabaseBackup(testTarget);
    const safety = validateDatabaseBackup(safetyBackup);

    if (
      after.exercises !== sourceInfo.exercises ||
      after.workouts !== sourceInfo.workouts
    ) {
      throw new Error("Restored counts do not match the selected backup.");
    }

    if (
      safety.exercises !== before.exercises ||
      safety.workouts !== before.workouts
    ) {
      throw new Error("Safety backup counts do not match the original target.");
    }

    console.log("Restore simulation PASSED.");
    console.log("Restored temporary target:", after);
    console.log("Safety backup of original temporary target:", safety);
    console.log("Restore service result:", result);
    console.log("Live database was not used as a restore target.");
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log("Temporary test files cleaned up.");
  }
}

main().catch((error) => {
  console.error("Restore simulation FAILED:", error.message);
  process.exitCode = 1;
});

import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { restoreDatabase } from "../src/services/restoreDatabase.js";
import { validateDatabaseBackup } from "../src/services/restoreService.js";

// Run from forge/server:
// node scripts/testRestoreRecovery.js "C:\\Users\\...\\Downloads\\forge-backup.sqlite"
// This script only WRITES to fresh temporary files.

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(scriptsDir, "..");
const liveDatabasePath = path.resolve(serverDir, "../db/forge.sqlite");
const backupPath = process.argv[2];

async function main() {
  if (!backupPath || !path.isAbsolute(backupPath)) {
    throw new Error("Provide the absolute path to a downloaded SQLite backup.");
  }

  if (path.resolve(backupPath) === liveDatabasePath) {
    throw new Error("Choose a downloaded backup, not the live database.");
  }

  validateDatabaseBackup(backupPath);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "forge-recovery-test-"));
  const targetPath = path.join(tempDir, "test-target.sqlite");
  const safetyPath = path.join(tempDir, "safety.sqlite");

  console.log("Temporary test directory:", tempDir);
  console.log("Live database will NOT be replaced.");

  try {
    // Read the live database through SQLite's backup API, into a TEMPORARY file.
    const liveDb = new Database(liveDatabasePath, {
      readonly: true,
      fileMustExist: true,
    });
    try {
      await liveDb.backup(targetPath);
    } finally {
      liveDb.close();
    }

    const before = validateDatabaseBackup(targetPath);
    console.log("Before simulated failure:", before);

    let restoreError;
    process.env.FORGE_RESTORE_TEST_MODE = "1";
    try {
      await restoreDatabase(backupPath, targetPath, safetyPath, {
        simulateFailureAfterReplacement: true,
      });
    } catch (error) {
      restoreError = error;
    } finally {
      delete process.env.FORGE_RESTORE_TEST_MODE;
    }

    if (!restoreError) {
      throw new Error("Expected an injected restore failure, but restore succeeded.");
    }

    if (!restoreError.message.includes("recovered successfully")) {
      throw new Error(`Recovery not confirmed: ${restoreError.message}`);
    }

    const recovered = validateDatabaseBackup(targetPath);
    const safety = validateDatabaseBackup(safetyPath);

    for (const key of ["exercises", "workouts"]) {
      if (recovered[key] !== before[key] || safety[key] !== before[key]) {
        throw new Error(`${key} mismatch after recovery.`);
      }
    }

    console.log("Injected restore error:", restoreError.cause?.message);
    console.log("Recovered temporary database:", recovered);
    console.log("Safety backup:", safety);
    console.log("AUTOMATIC RECOVERY TEST PASSED.");
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log("Temporary test files cleaned up.");
  }
}

main().catch((error) => {
  console.error("AUTOMATIC RECOVERY TEST FAILED:", error.message);
  process.exitCode = 1;
});
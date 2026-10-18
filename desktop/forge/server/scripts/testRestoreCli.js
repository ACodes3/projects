import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateDatabaseBackup } from "../src/services/restoreService.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDb = path.resolve(scriptDir, "../../db/forge.sqlite");
const backupArg = process.argv[2];

if (!backupArg) {
  console.error('Usage: node scripts/testRestoreCli.js "C:\\path\\to\\backup.sqlite"');
  process.exit(1);
}

const backup = path.resolve(backupArg);
let directory;

try {
  const sourceInfo = validateDatabaseBackup(backup);
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "forge-cli-restore-test-"));
  const target = path.join(directory, "temporary-target.sqlite");
  const safety = path.join(directory, "temporary-safety.sqlite");

  // Snapshot the real DB via the SQLite backup API. NEVER restore into it.
  const live = new Database(projectDb, { readonly: true, fileMustExist: true });
  try {
    await live.backup(target);
  } finally {
    live.close();
  }

  const before = validateDatabaseBackup(target);
  console.log("Selected backup:", sourceInfo);
  console.log("Temporary target BEFORE:", before);
  console.log("Restore target is temporary:", target);

  const output = execFileSync(
    process.execPath,
    [path.join(scriptDir, "restoreBackupCli.js"), backup, target, safety],
    { cwd: path.resolve(scriptDir, ".."), encoding: "utf8", timeout: 60000 }
  );
  const result = JSON.parse(output.trim());
  if (result.success !== true) throw new Error("Restore CLI reported failure.");

  const after = validateDatabaseBackup(target);
  const previous = validateDatabaseBackup(safety);
  if (after.exercises !== sourceInfo.exercises || after.workouts !== sourceInfo.workouts) {
    throw new Error("Restored data counts do not match selected backup.");
  }
  if (previous.exercises !== before.exercises || previous.workouts !== before.workouts) {
    throw new Error("Safety backup does not match original temporary target.");
  }

  console.log("Temporary target AFTER:", after);
  console.log("Temporary safety backup:", previous);
  console.log("RESTORE CLI TEST PASSED.");
  console.log("Live database was never used as a restore target.");
} catch (error) {
  console.error("RESTORE CLI TEST FAILED:", error.message);
  process.exitCode = 1;
} finally {
  if (directory) {
    try {
      fs.rmSync(directory, { recursive: true, force: true });
      console.log("Temporary test files cleaned up.");
    } catch (error) {
      console.error("Temporary cleanup failed:", error.message);
      process.exitCode = 1;
    }
  }
}
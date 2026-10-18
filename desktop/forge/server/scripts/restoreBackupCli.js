import path from "node:path";
import { restoreDatabase } from "../src/services/restoreDatabase.js";
import { validateDatabaseBackup } from "../src/services/restoreService.js";

// Standalone restore worker. Run ONLY after all connections to the
// target database have closed. It never stops Express by itself.
// Usage: node scripts/restoreBackupCli.js <source.sqlite> <target.sqlite> <safety.sqlite>

const [, , sourceArg, targetArg, safetyArg, ...extra] = process.argv;

if (!sourceArg || !targetArg || !safetyArg || extra.length) {
  console.error("Usage: node scripts/restoreBackupCli.js <source.sqlite> <target.sqlite> <safety.sqlite>");
  process.exitCode = 1;
} else {
  try {
    const source = path.resolve(sourceArg);
    const target = path.resolve(targetArg);
    const safety = path.resolve(safetyArg);

    // Validation also occurs within restoreDatabase immediately before replacement.
    const sourceInfo = validateDatabaseBackup(source);
    const result = await restoreDatabase(source, target, safety);
    const restoredInfo = validateDatabaseBackup(target);
    const safetyInfo = validateDatabaseBackup(safety);

    console.log(JSON.stringify({
      success: true,
      source: sourceInfo,
      restored: restoredInfo,
      previous: safetyInfo,
      safetyBackupPath: result.safetyBackupPath,
      databasePath: result.databasePath,
    }));
  } catch (error) {
    console.error(JSON.stringify({ success: false, message: error.message }));
    process.exitCode = 1;
  }
}
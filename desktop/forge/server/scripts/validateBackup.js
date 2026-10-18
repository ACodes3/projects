
import { validateDatabaseBackup } from "../src/services/restoreService.js";

/* =========================================
   FORGE — BACKUP VALIDATION CLI
========================================= */

const backupPath = process.argv[2];

if (!backupPath) {
  console.error("Please provide a backup file path.");
  process.exitCode = 1;
} else {
  try {
    const result = validateDatabaseBackup(backupPath);

    console.log(
      JSON.stringify({
        success: true,
        ...result,
      })
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        success: false,
        message: error.message,
      })
    );

    process.exitCode = 1;
  }
}

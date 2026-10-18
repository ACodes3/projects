
import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import db from "../src/config/sqlite.js";
import { validateDatabaseBackup } from "../src/services/restoreService.js";

describe("FORGE Backup Validation", () => {
  it("accepts a valid FORGE SQLite backup", async () => {
    const tempDir = mkdtempSync(
      path.join(tmpdir(), "forge-restore-test-")
    );

    const backupPath = path.join(tempDir, "valid.sqlite");

    try {
      // Back up the isolated test database.
      await db.backup(backupPath);

      const result = validateDatabaseBackup(backupPath);

      expect(result.valid).toBe(true);
      expect(result.exercises).toBe(0);
      expect(result.workouts).toBe(0);
    } finally {
      rmSync(tempDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      });
    }
  });

  it("rejects a file that is not SQLite", () => {
    const tempDir = mkdtempSync(
      path.join(tmpdir(), "forge-invalid-backup-")
    );

    const backupPath = path.join(tempDir, "invalid.sqlite");

    try {
      writeFileSync(
        backupPath,
        "This is not a SQLite database."
      );

      expect(() => {
        validateDatabaseBackup(backupPath);
      }).toThrow();
    } finally {
      rmSync(tempDir, {
        recursive: true,
        force: true,
      });
    }
  });

  it("rejects a SQLite database missing FORGE tables", () => {
    const tempDir = mkdtempSync(
      path.join(tmpdir(), "forge-missing-tables-")
    );

    const backupPath = path.join(tempDir, "empty.sqlite");

    const emptyDb = new Database(backupPath);
    emptyDb.exec("CREATE TABLE example (id INTEGER);");
    emptyDb.close();

    try {
      expect(() => {
        validateDatabaseBackup(backupPath);
      }).toThrow(/missing required table/i);
    } finally {
      rmSync(tempDir, {
        recursive: true,
        force: true,
      });
    }
  });

  it("rejects relative backup paths", () => {
    expect(() => {
      validateDatabaseBackup("backup.sqlite");
    }).toThrow("Backup path must be absolute.");
  });

  it("rejects unsupported file extensions", () => {
    expect(() => {
      validateDatabaseBackup(
        path.join(tmpdir(), "backup.txt")
      );
    }).toThrow("Backup must be a .sqlite file.");
  });
});

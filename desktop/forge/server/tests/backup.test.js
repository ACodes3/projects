
import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import db from "../src/config/sqlite.js";
import { createDatabaseBackup } from "../src/services/backupService.js";

describe("FORGE Database Backup", () => {
  it("creates a valid SQLite backup with preserved data", async () => {
    const tempDir = mkdtempSync(
      path.join(tmpdir(), "forge-backup-test-")
    );

    const backupPath = path.join(tempDir, "forge-backup.sqlite");
    let backupDb;

    try {
      // Add a record to the isolated test database.
      db.prepare(`
        INSERT INTO exercises (
          name,
          primary_muscle,
          secondary_muscles,
          equipment,
          exercise_type
        )
        VALUES (?, ?, ?, ?, ?)
      `).run(
        "Backup Test Bench Press",
        "Chest",
        '["Triceps"]',
        "Barbell",
        "Compound"
      );

      // Create a consistent backup using SQLite's backup API.
      const result = await createDatabaseBackup(backupPath);

      expect(result.path).toBe(backupPath);
      expect(result.bytes).toBeGreaterThan(0);
      expect(statSync(backupPath).size).toBeGreaterThan(0);

      // Open the backup and verify its integrity.
      backupDb = new Database(backupPath, {
        readonly: true,
        fileMustExist: true,
      });

      expect(
        backupDb.pragma("integrity_check", { simple: true })
      ).toBe("ok");

      expect(
        backupDb.pragma("foreign_key_check")
      ).toEqual([]);

      const exercise = backupDb.prepare(`
        SELECT name, equipment
        FROM exercises
        WHERE name = ?
      `).get("Backup Test Bench Press");

      expect(exercise).toEqual({
        name: "Backup Test Bench Press",
        equipment: "Barbell",
      });

      // Verify all application tables were included.
      const tables = backupDb.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
      `).all().map(row => row.name);

      expect(tables).toHaveLength(10);

    } finally {
      if (backupDb?.open) {
        backupDb.close();
      }

      rmSync(tempDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      });
    }
  });

  it("rejects relative backup paths", async () => {
    await expect(
      createDatabaseBackup("backup.sqlite")
    ).rejects.toThrow(
      "Backup destination must be an absolute path."
    );
  });

  it("rejects non-SQLite backup filenames", async () => {
    await expect(
      createDatabaseBackup(path.join(tmpdir(), "backup.txt"))
    ).rejects.toThrow(
      "Backup filename must end in .sqlite."
    );
  });
});

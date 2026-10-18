
import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { initializeDatabase } from "../src/config/initializeDatabase.js";
import { restoreDatabase } from "../src/services/restoreDatabase.js";
import { validateDatabaseBackup } from "../src/services/restoreService.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const resourcesDir = path.resolve(currentDir, "../../db");

describe("FORGE Database Restoration", () => {
  it("restores data and preserves the previous database", async () => {
    const tempDir = mkdtempSync(
      path.join(tmpdir(), "forge-restore-operation-")
    );

    const sourcePath = path.join(tempDir, "source.sqlite");
    const targetPath = path.join(tempDir, "target.sqlite");
    const safetyPath = path.join(tempDir, "safety.sqlite");

    try {
      // Create two independent FORGE databases.
      initializeDatabase(sourcePath, resourcesDir);
      initializeDatabase(targetPath, resourcesDir);

      // Add a workout to the source database.
      const sourceDb = new Database(sourcePath);

      const sourceUser = sourceDb.prepare(`
        SELECT id FROM users WHERE email = ?
      `).get("demo@forge.local");

      sourceDb.prepare(`
        INSERT INTO workouts (user_id, name, workout_date)
        VALUES (?, ?, ?)
      `).run(sourceUser.id, "Workout From Backup", "2026-10-18");

      sourceDb.close();

      // Add a different workout to the target database.
      const targetDb = new Database(targetPath);

      const targetUser = targetDb.prepare(`
        SELECT id FROM users WHERE email = ?
      `).get("demo@forge.local");

      targetDb.prepare(`
        INSERT INTO workouts (user_id, name, workout_date)
        VALUES (?, ?, ?)
      `).run(targetUser.id, "Workout Before Restore", "2026-10-17");

      targetDb.close();

      // Restore source into target.
      const result = await restoreDatabase(
        sourcePath,
        targetPath,
        safetyPath
      );

      expect(result.restored).toBe(true);
      expect(result.safetyBackupPath).toBe(safetyPath);

      // Verify restored data.
      const restoredDb = new Database(targetPath, {
        readonly: true,
        fileMustExist: true,
      });

      try {
        const workouts = restoredDb.prepare(`
          SELECT name FROM workouts
        `).all().map(row => row.name);

        expect(workouts).toEqual(["Workout From Backup"]);

        expect(
          restoredDb.pragma("integrity_check", {
            simple: true,
          })
        ).toBe("ok");
      } finally {
        restoredDb.close();
      }

      // Verify safety backup preserves the old target data.
      const safetyDb = new Database(safetyPath, {
        readonly: true,
        fileMustExist: true,
      });

      try {
        const workouts = safetyDb.prepare(`
          SELECT name FROM workouts
        `).all().map(row => row.name);

        expect(workouts).toEqual(["Workout Before Restore"]);
      } finally {
        safetyDb.close();
      }

    } finally {
      rmSync(tempDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      });
    }
  });

  it("rejects invalid backups without modifying the target", async () => {
    const tempDir = mkdtempSync(
      path.join(tmpdir(), "forge-invalid-restore-")
    );

    const sourcePath = path.join(tempDir, "invalid.sqlite");
    const targetPath = path.join(tempDir, "target.sqlite");
    const safetyPath = path.join(tempDir, "safety.sqlite");

    try {
      initializeDatabase(targetPath, resourcesDir);

      writeFileSync(sourcePath, "NOT A SQLITE DATABASE");

      await expect(
        restoreDatabase(sourcePath, targetPath, safetyPath)
      ).rejects.toThrow();

      expect(validateDatabaseBackup(targetPath).valid).toBe(true);
    } finally {
      rmSync(tempDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      });
    }
  });

  it("rejects using the same file as source and target", async () => {
    const tempDir = mkdtempSync(
      path.join(tmpdir(), "forge-same-path-")
    );

    try {
      const databasePath = path.join(tempDir, "forge.sqlite");
      const safetyPath = path.join(tempDir, "safety.sqlite");

      await expect(
        restoreDatabase(
          databasePath,
          databasePath,
          safetyPath
        )
      ).rejects.toThrow(/paths must differ/i);
    } finally {
      rmSync(tempDir, {
        recursive: true,
        force: true,
      });
    }
  });

  it("refuses to overwrite an existing safety backup", async () => {
    const tempDir = mkdtempSync(
      path.join(tmpdir(), "forge-existing-safety-")
    );

    try {
      const sourcePath = path.join(tempDir, "source.sqlite");
      const targetPath = path.join(tempDir, "target.sqlite");
      const safetyPath = path.join(tempDir, "safety.sqlite");

      initializeDatabase(sourcePath, resourcesDir);
      initializeDatabase(targetPath, resourcesDir);

      writeFileSync(safetyPath, "EXISTING SAFETY BACKUP");

      await expect(
        restoreDatabase(sourcePath, targetPath, safetyPath)
      ).rejects.toThrow(/already exists/i);

      expect(validateDatabaseBackup(targetPath).valid).toBe(true);
    } finally {
      rmSync(tempDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      });
    }
  });
});

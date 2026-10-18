
import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { initializeDatabase } from "../src/config/initializeDatabase.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const resourcesDir = path.resolve(currentDir, "../../db");

describe("FORGE First-Run Database Initialization", () => {
  it("creates a clean database with the exercise library", () => {
    const tempDir = mkdtempSync(
      path.join(tmpdir(), "forge-install-test-")
    );

    const databasePath = path.join(
      tempDir,
      "nested",
      "forge.sqlite"
    );

    let db;

    try {
      // Simulate the application's first launch.
      const result = initializeDatabase(
        databasePath,
        resourcesDir
      );

      expect(result.initialized).toBe(true);

      db = new Database(databasePath, {
        fileMustExist: true,
      });

      db.pragma("foreign_keys = ON");

      // Verify that all 10 application tables exist.
      const tables = db.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
      `).all().map(row => row.name);

      expect(tables.sort()).toEqual([
        "exercises",
        "nutrition_entries",
        "nutrition_goals",
        "profiles",
        "progress_entries",
        "rest_days",
        "users",
        "workout_exercises",
        "workout_sets",
        "workouts",
      ]);

      // Verify starter exercises.
      const exercises = db.prepare(`
        SELECT COUNT(*) AS total
        FROM exercises
      `).get();

      expect(exercises.total).toBe(593);

      // Verify local desktop user.
      const user = db.prepare(`
        SELECT id
        FROM users
        WHERE email = ?
      `).get("demo@forge.local");

      expect(user).toBeDefined();

      // A fresh installation must have no fitness history.
      for (const table of [
        "workouts",
        "workout_exercises",
        "workout_sets",
        "nutrition_entries",
        "progress_entries",
        "rest_days",
      ]) {
        const count = db.prepare(`
          SELECT COUNT(*) AS total FROM ${table}
        `).get();

        expect(count.total).toBe(0);
      }

      // Simulate the user creating a workout.
      db.prepare(`
        INSERT INTO workouts (
          user_id,
          name,
          workout_date
        )
        VALUES (?, ?, ?)
      `).run(
        user.id,
        "My First Workout",
        "2026-10-18"
      );

      db.close();
      db = null;

      // Simulate reopening the desktop application.
      const secondRun = initializeDatabase(
        databasePath,
        resourcesDir
      );

      expect(secondRun.initialized).toBe(false);

      db = new Database(databasePath, {
        fileMustExist: true,
      });

      // Confirm no exercises were duplicated.
      const exerciseCount = db.prepare(`
        SELECT COUNT(*) AS total
        FROM exercises
      `).get();

      expect(exerciseCount.total).toBe(593);

      // Confirm the user's workout was preserved.
      const workout = db.prepare(`
        SELECT name
        FROM workouts
        WHERE name = ?
      `).get("My First Workout");

      expect(workout).toBeDefined();

      // Check database integrity.
      expect(
        db.pragma("integrity_check", {
          simple: true,
        })
      ).toBe("ok");

      expect(
        db.pragma("foreign_key_check")
      ).toEqual([]);

    } finally {
      if (db?.open) {
        db.close();
      }

      rmSync(tempDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      });
    }
  });
});

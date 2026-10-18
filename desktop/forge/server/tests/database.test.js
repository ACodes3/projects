
import { describe, it, expect } from "vitest";
import db from "../src/config/sqlite.js";

describe("FORGE SQLite Database", () => {
  it("enforces foreign keys", () => {
    const enabled = db.pragma("foreign_keys", {
      simple: true,
    });

    expect(enabled).toBe(1);
  });

  it("passes SQLite integrity checks", () => {
    expect(
      db.pragma("integrity_check", { simple: true })
    ).toBe("ok");

    expect(db.pragma("foreign_key_check")).toEqual([]);
  });

  it("contains all 10 application tables", () => {
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
  });

  it("rejects invalid foreign keys", () => {
    expect(() => {
      db.prepare(`
        INSERT INTO workouts (
          user_id, name, workout_date
        )
        VALUES (?, ?, ?)
      `).run(999999, "Invalid Workout", "2020-01-15");
    }).toThrow();
  });

  it("enforces unique user emails", () => {
    expect(() => {
      db.prepare(`
        INSERT INTO users (email, password_hash)
        VALUES (?, ?)
      `).run(
        "demo@forge.local",
        "TEST_HASH"
      );
    }).toThrow();
  });

  it("enforces workout set constraints", () => {
    const user = db.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).get("demo@forge.local");

    const workout = db.prepare(`
      INSERT INTO workouts (
        user_id, name, workout_date
      )
      VALUES (?, ?, ?)
    `).run(user.id, "Constraint Test", "2020-01-15");

    const exercise = db.prepare(`
      INSERT INTO workout_exercises (
        workout_id, exercise_name,
        tracking_mode, position
      )
      VALUES (?, ?, ?, ?)
    `).run(
      workout.lastInsertRowid,
      "Push-Up",
      "reps",
      1
    );

    expect(() => {
      db.prepare(`
        INSERT INTO workout_sets (
          workout_exercise_id,
          set_number,
          weight_kg,
          reps,
          duration_seconds
        )
        VALUES (?, ?, ?, ?, ?)
      `).run(
        exercise.lastInsertRowid,
        1,
        0,
        10,
        30
      );
    }).toThrow();

    db.prepare(
      "DELETE FROM workouts WHERE id = ?"
    ).run(workout.lastInsertRowid);
  });

  it("rolls back failed transactions", () => {
    const before = db.prepare(
      "SELECT COUNT(*) AS total FROM users"
    ).get().total;

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO users (email, password_hash)
        VALUES (?, ?)
      `).run("rollback@forge.local", "TEST_HASH");

      throw new Error("Intentional rollback");
    });

    expect(transaction).toThrow("Intentional rollback");

    const after = db.prepare(
      "SELECT COUNT(*) AS total FROM users"
    ).get().total;

    expect(after).toBe(before);
  });

  it("cascades workout deletion to exercises and sets", () => {
    const user = db.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).get("demo@forge.local");

    const workoutId = db.prepare(`
      INSERT INTO workouts (
        user_id, name, workout_date
      )
      VALUES (?, ?, ?)
    `).run(
      user.id, "Cascade Test", "2020-01-15"
    ).lastInsertRowid;

    const exerciseId = db.prepare(`
      INSERT INTO workout_exercises (
        workout_id, exercise_name,
        tracking_mode, position
      )
      VALUES (?, ?, ?, ?)
    `).run(
      workoutId, "Squat", "reps", 1
    ).lastInsertRowid;

    db.prepare(`
      INSERT INTO workout_sets (
        workout_exercise_id,
        set_number, weight_kg, reps
      )
      VALUES (?, ?, ?, ?)
    `).run(exerciseId, 1, 10, 12);

    db.prepare(
      "DELETE FROM workouts WHERE id = ?"
    ).run(workoutId);

    expect(
      db.prepare(
        "SELECT * FROM workout_exercises WHERE id = ?"
      ).get(exerciseId)
    ).toBeUndefined();

    expect(
      db.prepare(
        "SELECT * FROM workout_sets WHERE workout_exercise_id = ?"
      ).get(exerciseId)
    ).toBeUndefined();
  });
});

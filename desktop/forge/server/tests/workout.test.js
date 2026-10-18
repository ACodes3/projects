
import { describe, it, expect } from "vitest";
import request from "supertest";
import db from "../src/config/sqlite.js";
import app from "../src/app.js";

describe("FORGE Workout API", () => {
  let workoutId;

  const payload = {
    name: "SQLite Test Workout",
    date: "2026-10-18",
    youtubeUrl: "",
    notes: "Created during automated testing",
    exercises: [
      {
        exerciseId: null,
        name: "Custom Push-Ups",
        trackingMode: "reps",
        sets: [
          { weight: 0, reps: 10 },
          { weight: 0, reps: 12 },
        ],
      },
      {
        exerciseId: null,
        name: "Timed Plank",
        trackingMode: "time",
        sets: [
          { weight: 0, durationSeconds: 30 },
        ],
      },
    ],
  };

  it("starts with an empty workout history", async () => {
    const response = await request(app).get("/api/workouts");

    expect(response.status).toBe(200);
    expect(response.body.workouts).toEqual([]);
  });

  it("rejects a workout without exercises", async () => {
    const response = await request(app)
      .post("/api/workouts")
      .send({ ...payload, exercises: [] });

    expect(response.status).toBe(400);
  });

  it("creates a workout with exercises and sets", async () => {
    const response = await request(app)
      .post("/api/workouts")
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    workoutId = response.body.workout.id;

    expect(response.body.workout.exercises).toHaveLength(2);
    expect(response.body.workout.exercises[0].sets).toHaveLength(2);
    expect(response.body.workout.exercises[1].sets).toHaveLength(1);
  });

  it("reads the created workout", async () => {
    const response = await request(app)
      .get(`/api/workouts/${workoutId}`);

    expect(response.status).toBe(200);
    expect(response.body.workout.name).toBe("SQLite Test Workout");
    expect(response.body.workout.exercises).toHaveLength(2);
  });

  it("updates a workout and replaces its sets", async () => {
    const response = await request(app)
      .put(`/api/workouts/${workoutId}`)
      .send({
        ...payload,
        name: "Updated SQLite Workout",
        exercises: [
          {
            exerciseId: null,
            name: "Updated Push-Ups",
            trackingMode: "reps",
            sets: [{ weight: 0, reps: 20 }],
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.workout.name).toBe("Updated SQLite Workout");
    expect(response.body.workout.exercises).toHaveLength(1);
    expect(response.body.workout.exercises[0].sets).toHaveLength(1);
  });

  it("rolls back an invalid workout update", async () => {
    const response = await request(app)
      .put(`/api/workouts/${workoutId}`)
      .send({
        ...payload,
        name: "Should Not Be Saved",
        exercises: [
          {
            exerciseId: 999999,
            name: "Nonexistent Exercise",
            trackingMode: "reps",
            sets: [{ weight: 0, reps: 10 }],
          },
        ],
      });

    expect(response.status).toBe(400);

    const stored = db
      .prepare("SELECT name FROM workouts WHERE id = ?")
      .get(workoutId);

    expect(stored.name).toBe("Updated SQLite Workout");
  });

  it("deletes the workout and cascades to its exercises and sets", async () => {
    const exerciseIds = db
      .prepare("SELECT id FROM workout_exercises WHERE workout_id = ?")
      .all(workoutId)
      .map((row) => row.id);

    const response = await request(app)
      .delete(`/api/workouts/${workoutId}`);

    expect(response.status).toBe(200);

    expect(
      db.prepare("SELECT id FROM workouts WHERE id = ?").get(workoutId)
    ).toBeUndefined();

    for (const id of exerciseIds) {
      expect(
        db.prepare("SELECT id FROM workout_exercises WHERE id = ?").get(id)
      ).toBeUndefined();

      expect(
        db.prepare("SELECT id FROM workout_sets WHERE workout_exercise_id = ?")
          .get(id)
      ).toBeUndefined();
    }
  });

  it("returns 404 for a nonexistent workout", async () => {
    const response = await request(app)
      .get("/api/workouts/999999");

    expect(response.status).toBe(404);
  });

  it("rejects an invalid workout ID", async () => {
    const response = await request(app)
      .get("/api/workouts/abc");

    expect(response.status).toBe(400);
  });
});

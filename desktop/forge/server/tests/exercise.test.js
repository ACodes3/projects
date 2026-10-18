
import { describe, it, expect } from "vitest";
import request from "supertest";

import app from "../src/app.js";

describe("FORGE Exercise API", () => {
  let createdExerciseId;

  const exercisePayload = {
    name: "SQLite Test Squat",
    muscle: "Quads",
    secondaryMuscles: ["Glutes", "Core"],
    equipment: "Dumbbells",
    type: "Compound",
  };

  it("returns an empty exercise library initially", async () => {
    const response = await request(app).get("/api/exercises");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(0);
    expect(response.body.exercises).toEqual([]);
  });

  it("creates an exercise", async () => {
    const response = await request(app)
      .post("/api/exercises")
      .send(exercisePayload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.exercise.name).toBe("SQLite Test Squat");
    expect(response.body.exercise.secondary_muscles).toEqual([
      "Glutes",
      "Core",
    ]);
    expect(response.body.exercise.is_active).toBe(true);

    createdExerciseId = response.body.exercise.id;
  });

  it("reads the created exercise", async () => {
    const response = await request(app)
      .get(`/api/exercises/${createdExerciseId}`);

    expect(response.status).toBe(200);
    expect(response.body.exercise.id).toBe(createdExerciseId);
  });

  it("updates the exercise", async () => {
    const response = await request(app)
      .put(`/api/exercises/${createdExerciseId}`)
      .send({
        ...exercisePayload,
        name: "Updated SQLite Squat",
      });

    expect(response.status).toBe(200);
    expect(response.body.exercise.name).toBe("Updated SQLite Squat");
  });

  it("rejects a duplicate exercise name", async () => {
    const response = await request(app)
      .post("/api/exercises")
      .send({
        ...exercisePayload,
        name: "Updated SQLite Squat",
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it("rejects an invalid exercise", async () => {
    const response = await request(app)
      .post("/api/exercises")
      .send({
        ...exercisePayload,
        equipment: "Invalid Equipment",
      });

    expect(response.status).toBe(400);
  });

  it("soft-deletes an exercise", async () => {
    const response = await request(app)
      .delete(`/api/exercises/${createdExerciseId}`);

    expect(response.status).toBe(200);
    expect(response.body.exercise.is_active).toBe(false);
  });

  it("does not return a soft-deleted exercise", async () => {
    const response = await request(app)
      .get(`/api/exercises/${createdExerciseId}`);

    expect(response.status).toBe(404);
  });

  it("rejects an invalid exercise ID", async () => {
    const response = await request(app)
      .get("/api/exercises/abc");

    expect(response.status).toBe(400);
  });
});


import { describe, it, expect } from "vitest";
import request from "supertest";
import db from "../src/config/sqlite.js";
import app from "../src/app.js";

describe("FORGE Rest Days API", () => {
  const date = "2020-01-15";

  it("starts with no rest days", async () => {
    const res = await request(app).get("/api/rest-days");

    expect(res.status).toBe(200);
    expect(res.body.restDays).toEqual([]);
  });

  it("creates a rest day", async () => {
    const res = await request(app)
      .post("/api/rest-days")
      .send({ date, note: "Recovery day" });

    expect(res.status).toBe(201);
    expect(res.body.restDay.date).toBe(date);
  });

  it("reads the saved rest day", async () => {
    const res = await request(app)
      .get(`/api/rest-days?date=${date}`);

    expect(res.status).toBe(200);
    expect(res.body.restDays).toHaveLength(1);
    expect(res.body.restDays[0].note).toBe("Recovery day");
  });

  it("rejects duplicate rest days", async () => {
    const res = await request(app)
      .post("/api/rest-days")
      .send({ date });

    expect(res.status).toBe(409);
  });

  it("rejects future rest days", async () => {
    const res = await request(app)
      .post("/api/rest-days")
      .send({ date: "2099-01-01" });

    expect(res.status).toBe(400);
  });

  it("rejects invalid dates", async () => {
    const res = await request(app)
      .post("/api/rest-days")
      .send({ date: "2026-02-30" });

    expect(res.status).toBe(400);
  });

  it("rejects a rest day on a workout date", async () => {
    const user = db.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).get("demo@forge.local");

    db.prepare(`
      INSERT INTO workouts (user_id, name, workout_date)
      VALUES (?, ?, ?)
    `).run(user.id, "Conflict Test Workout", "2020-01-16");

    const res = await request(app)
      .post("/api/rest-days")
      .send({ date: "2020-01-16" });

    expect(res.status).toBe(409);
  });

  it("deletes a rest day", async () => {
    const res = await request(app)
      .delete(`/api/rest-days/${date}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 404 when deleting a missing rest day", async () => {
    const res = await request(app)
      .delete(`/api/rest-days/${date}`);

    expect(res.status).toBe(404);
  });
});

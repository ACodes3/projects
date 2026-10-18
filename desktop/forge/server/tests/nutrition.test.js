
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("FORGE Nutrition API", () => {
  let entryId;

  const payload = {
    date: "2026-10-18",
    meal: "Breakfast",
    name: "Greek Yogurt",
    calories: 200,
    protein: 20,
    carbs: 15,
    fat: 6,
  };

  it("starts with no nutrition entries", async () => {
    const response = await request(app).get("/api/nutrition");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.entries).toEqual([]);
  });

  it("creates a nutrition entry", async () => {
    const response = await request(app)
      .post("/api/nutrition")
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.entry.name).toBe("Greek Yogurt");
    expect(response.body.entry.calories).toBe(200);

    entryId = response.body.entry.id;
  });

  it("retrieves the created entry", async () => {
    const response = await request(app).get("/api/nutrition");

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.entries[0].id).toBe(entryId);
  });

  it("filters entries by date", async () => {
    const response = await request(app)
      .get("/api/nutrition?date=2026-10-18");

    expect(response.status).toBe(200);
    expect(response.body.entries).toHaveLength(1);
  });

  it("returns no entries for another date", async () => {
    const response = await request(app)
      .get("/api/nutrition?date=2026-10-17");

    expect(response.status).toBe(200);
    expect(response.body.entries).toEqual([]);
  });

  it("updates a nutrition entry", async () => {
    const response = await request(app)
      .put(`/api/nutrition/${entryId}`)
      .send({
        ...payload,
        name: "Greek Yogurt with Berries",
        calories: 250,
      });

    expect(response.status).toBe(200);
    expect(response.body.entry.name).toBe(
      "Greek Yogurt with Berries"
    );
    expect(response.body.entry.calories).toBe(250);
  });

  it("rejects negative calories", async () => {
    const response = await request(app)
      .post("/api/nutrition")
      .send({
        ...payload,
        calories: -100,
      });

    expect(response.status).toBe(400);
  });

  it("rejects invalid meal names", async () => {
    const response = await request(app)
      .post("/api/nutrition")
      .send({
        ...payload,
        meal: "Midnight Feast",
      });

    expect(response.status).toBe(400);
  });

  it("rejects invalid dates", async () => {
    const response = await request(app)
      .get("/api/nutrition?date=2026-02-30");

    expect(response.status).toBe(400);
  });

  it("deletes the nutrition entry", async () => {
    const response = await request(app)
      .delete(`/api/nutrition/${entryId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("returns 404 for a deleted entry", async () => {
    const response = await request(app)
      .delete(`/api/nutrition/${entryId}`);

    expect(response.status).toBe(404);
  });

  it("rejects invalid entry IDs", async () => {
    const response = await request(app)
      .delete("/api/nutrition/abc");

    expect(response.status).toBe(400);
  });
});

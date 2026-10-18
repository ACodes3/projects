
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("FORGE Progress API", () => {
  let entryId;

  const payload = {
    date: "2026-10-18",
    weight: 65.5,
    bodyFat: 22,
    waist: 73,
    chest: 88,
    arms: 29,
    thighs: 55,
    notes: "Test measurements",
  };

  it("starts with no progress entries", async () => {
    const res = await request(app).get("/api/progress");
    expect(res.status).toBe(200);
    expect(res.body.entries).toEqual([]);
  });

  it("creates a progress entry", async () => {
    const res = await request(app)
      .post("/api/progress")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.entry.weight).toBe(65.5);
    expect(res.body.entry.bodyFat).toBe(22);
    entryId = res.body.entry.id;
  });

  it("reads progress history", async () => {
    const res = await request(app).get("/api/progress");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.entries[0].id).toBe(entryId);
  });

  it("filters progress by date", async () => {
    const res = await request(app)
      .get("/api/progress?date=2026-10-18");

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(1);
  });

  it("updates measurements", async () => {
    const res = await request(app)
      .put(`/api/progress/${entryId}`)
      .send({ ...payload, weight: 64.8 });

    expect(res.status).toBe(200);
    expect(res.body.entry.weight).toBe(64.8);
  });

  it("rejects an empty progress entry", async () => {
    const res = await request(app)
      .post("/api/progress")
      .send({ date: "2026-10-18" });

    expect(res.status).toBe(400);
  });

  it("rejects invalid body fat", async () => {
    const res = await request(app)
      .post("/api/progress")
      .send({ ...payload, bodyFat: 120 });

    expect(res.status).toBe(400);
  });

  it("rejects invalid dates", async () => {
    const res = await request(app)
      .get("/api/progress?date=2026-02-30");

    expect(res.status).toBe(400);
  });

  it("deletes a progress entry", async () => {
    const res = await request(app)
      .delete(`/api/progress/${entryId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 404 for an already deleted entry", async () => {
    const res = await request(app)
      .delete(`/api/progress/${entryId}`);

    expect(res.status).toBe(404);
  });
});


import { describe, it, expect } from "vitest";
import request from "supertest";
import db from "../src/config/sqlite.js";
import app from "../src/app.js";

describe("FORGE Profile API", () => {
  const profile = {
    name: "Forge Test User",
    trainingFocus: "Strength & Conditioning",
    height: 168,
    bio: "Testing the SQLite profile API.",
  };

  it("returns an empty profile initially", async () => {
    const res = await request(app).get("/api/profile");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profile).toMatchObject({
      name: null,
      trainingFocus: null,
      height: null,
      bio: null,
    });
  });

  it("creates a profile", async () => {
    const res = await request(app)
      .put("/api/profile")
      .send(profile);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profile).toMatchObject(profile);
  });

  it("reads the saved profile", async () => {
    const res = await request(app).get("/api/profile");

    expect(res.status).toBe(200);
    expect(res.body.profile.name).toBe("Forge Test User");
    expect(res.body.profile.height).toBe(168);
  });

  it("updates the profile without creating duplicates", async () => {
    const res = await request(app)
      .put("/api/profile")
      .send({
        ...profile,
        name: "Updated Forge User",
        height: 170,
      });

    expect(res.status).toBe(200);
    expect(res.body.profile.name).toBe("Updated Forge User");
    expect(res.body.profile.height).toBe(170);

    const count = db.prepare(
      "SELECT COUNT(*) AS total FROM profiles"
    ).get();

    expect(count.total).toBe(1);
  });

  it("allows optional profile fields to be blank", async () => {
    const res = await request(app)
      .put("/api/profile")
      .send({
        name: "Forge User",
        trainingFocus: "",
        height: null,
        bio: "",
      });

    expect(res.status).toBe(200);
    expect(res.body.profile.trainingFocus).toBeNull();
    expect(res.body.profile.height).toBeNull();
    expect(res.body.profile.bio).toBeNull();
  });

  it("rejects negative height", async () => {
    const res = await request(app)
      .put("/api/profile")
      .send({
        ...profile,
        height: -180,
      });

    expect(res.status).toBe(400);
  });

  it("rejects a name longer than 100 characters", async () => {
    const res = await request(app)
      .put("/api/profile")
      .send({
        ...profile,
        name: "A".repeat(101),
      });

    expect(res.status).toBe(400);
  });

  it("rejects invalid training focus types", async () => {
    const res = await request(app)
      .put("/api/profile")
      .send({
        ...profile,
        trainingFocus: 123,
      });

    expect(res.status).toBe(400);
  });

  it("preserves the profile after invalid updates", async () => {
    const res = await request(app).get("/api/profile");

    expect(res.status).toBe(200);
    expect(res.body.profile.name).toBe("Forge User");
  });
});

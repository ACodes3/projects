
import { describe, it, expect } from "vitest";
import request from "supertest";

import app from "../app.js";

describe("Authentication protection", () => {
  it("rejects /api/auth/me without a session", async () => {
    const response = await request(app)
      .get("/api/auth/me");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Authentication required.",
    });
  });

  it("rejects logout without a session", async () => {
    const response = await request(app)
      .post("/api/auth/logout");

    expect(response.status).toBe(401);
  });

  it("rejects invalid session tokens", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set(
        "Cookie",
        "crown_session=invalid-token"
      );

    expect(response.status).toBe(401);
  });

  it("rejects anonymous world creation", async () => {
    const response = await request(app)
      .post("/api/worlds")
      .send({
        name: "Unauthorized World",
        mode: "singleplayer",
      });

    expect(response.status).toBe(401);
  });

  it("rejects anonymous invitations", async () => {
    const worldId =
      "11111111-1111-4111-8111-111111111111";

    const response = await request(app)
      .post(`/api/worlds/${worldId}/invitations`)
      .send({
        username: "test_player",
      });

    expect(response.status).toBe(401);
  });

  it("rejects anonymous character assignments", async () => {
    const worldId =
      "11111111-1111-4111-8111-111111111111";

    const response = await request(app)
      .post(`/api/worlds/${worldId}/assignments`)
      .send({
        membership_id:
          "22222222-2222-4222-8222-222222222222",
        character_id:
          "33333333-3333-4333-8333-333333333333",
        roles: ["HARBINGER"],
      });

    expect(response.status).toBe(401);
  });

  it("rejects anonymous permission requests", async () => {
    const worldId =
      "11111111-1111-4111-8111-111111111111";

    const response = await request(app)
      .get(`/api/worlds/${worldId}/me/permissions`);

    expect(response.status).toBe(401);
  });
});

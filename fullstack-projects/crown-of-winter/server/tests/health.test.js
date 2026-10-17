
import { describe, it, expect } from "vitest";
import request from "supertest";

import app from "../app.js";

describe("Health API", () => {
  it("returns HTTP 200", async () => {
    const response = await request(app)
      .get("/api/health");

    expect(response.status).toBe(200);
  });

  it("returns the correct response structure", async () => {
    const response = await request(app)
      .get("/api/health");

    expect(response.body).toMatchObject({
      success: true,
      message: "Crown of Winter API is running.",
    });

    expect(
      Number.isNaN(Date.parse(response.body.timestamp))
    ).toBe(false);
  });

  it("returns HTTP 404 for unknown routes", async () => {
    const response = await request(app)
      .get("/api/unknown-route");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Route not found.",
    });
  });
});


import { describe, it, expect } from "vitest";
import request from "supertest";

import app from "../src/app.js";

describe("FORGE Health API", () => {
  it("returns a successful health check", async () => {
    const response = await request(app)
      .get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "FORGE API is running.",
    });
  });
});


import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import db from "../src/config/sqlite.js";

describe("FORGE Nutrition Goals API", () => {
  const goals = {
    calories: 2200,
    protein: 150,
    carbs: 230,
    fat: 70,
  };

  it("returns blank goals initially", async () => {
    const response = await request(app)
      .get("/api/nutrition/goals");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.goals).toMatchObject({
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
    });
  });

  it("creates nutrition goals", async () => {
    const response = await request(app)
      .put("/api/nutrition/goals")
      .send(goals);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.goals).toMatchObject(goals);
  });

  it("reads saved nutrition goals", async () => {
    const response = await request(app)
      .get("/api/nutrition/goals");

    expect(response.status).toBe(200);
    expect(response.body.goals).toMatchObject(goals);
  });

  it("updates goals without creating duplicates", async () => {
    const response = await request(app)
      .put("/api/nutrition/goals")
      .send({
        calories: 2000,
        protein: 130,
        carbs: 200,
        fat: 65,
      });

    expect(response.status).toBe(200);
    expect(response.body.goals.calories).toBe(2000);
    expect(response.body.goals.protein).toBe(130);

    const count = db.prepare(`
      SELECT COUNT(*) AS total
      FROM nutrition_goals
    `).get();

    expect(count.total).toBe(1);
  });

  it("allows blank nutrition goals", async () => {
    const response = await request(app)
      .put("/api/nutrition/goals")
      .send({
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
      });

    expect(response.status).toBe(200);
    expect(response.body.goals).toMatchObject({
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
    });
  });

  it("rejects negative calorie goals", async () => {
    const response = await request(app)
      .put("/api/nutrition/goals")
      .send({
        ...goals,
        calories: -200,
      });

    expect(response.status).toBe(400);
  });

  it("rejects invalid macro goals", async () => {
    const response = await request(app)
      .put("/api/nutrition/goals")
      .send({
        ...goals,
        protein: -10,
      });

    expect(response.status).toBe(400);
  });

  it("rejects fractional calorie goals", async () => {
    const response = await request(app)
      .put("/api/nutrition/goals")
      .send({
        ...goals,
        calories: 2000.5,
      });

    expect(response.status).toBe(400);
  });

  it("preserves saved goals after invalid input", async () => {
    const response = await request(app)
      .get("/api/nutrition/goals");

    expect(response.status).toBe(200);
    expect(response.body.goals.calories).toBeNull();
    expect(response.body.goals.protein).toBeNull();
  });
});


import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import db from "../src/config/sqlite.js";

describe("FORGE Dashboard API", () => {
  const date = "2020-01-15";

  const user = db.prepare(`
    SELECT id FROM users WHERE email = ?
  `).get("demo@forge.local");

  const userId = user.id;

  // Reset dashboard-related records before every test.
  beforeEach(() => {
    db.prepare("DELETE FROM workout_sets").run();
    db.prepare("DELETE FROM workout_exercises").run();
    db.prepare("DELETE FROM workouts").run();
    db.prepare("DELETE FROM rest_days").run();
    db.prepare("DELETE FROM nutrition_entries").run();
    db.prepare("DELETE FROM nutrition_goals").run();
    db.prepare("DELETE FROM profiles").run();
  });

  function addWorkout(name = "Strength Workout") {
    return db.prepare(`
      INSERT INTO workouts (user_id, name, workout_date)
      VALUES (?, ?, ?)
    `).run(userId, name, date).lastInsertRowid;
  }

  function addMeal(meal, calories, protein, carbs, fat) {
    db.prepare(`
      INSERT INTO nutrition_entries (
        user_id, entry_date, meal, name,
        calories, protein_g, carbs_g, fat_g
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId, date, meal, `${meal} Test Meal`,
      calories, protein, carbs, fat
    );
  }

  async function getDashboard(queryDate = date) {
    return request(app)
      .get(`/api/dashboard?date=${queryDate}`);
  }

  it("returns an empty daily dashboard", async () => {
    const res = await getDashboard();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.dashboard.date).toBe(date);
    expect(res.body.dashboard.score.total).toBe(0);
    expect(res.body.dashboard.training.hasWorkout).toBe(false);
    expect(res.body.dashboard.training.hasRestDay).toBe(false);
    expect(res.body.dashboard.recentActivity).toEqual([]);
  });

  it("rejects an invalid dashboard date", async () => {
    const res = await getDashboard("2020-02-30");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("loads the user's profile", async () => {
    db.prepare(`
      INSERT INTO profiles (
        user_id, name, training_focus, height_cm, bio
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      userId, "Test Athlete",
      "Strength", 170, "Dashboard profile test"
    );

    const res = await getDashboard();

    expect(res.status).toBe(200);
    expect(res.body.dashboard.profile).toMatchObject({
      name: "Test Athlete",
      trainingFocus: "Strength",
      height: 170,
      bio: "Dashboard profile test",
    });
  });

  it("calculates nutrition totals", async () => {
    addMeal("Breakfast", 400, 25, 40, 12);
    addMeal("Lunch", 600, 45, 60, 20);

    const res = await getDashboard();

    expect(res.status).toBe(200);
    expect(res.body.dashboard.nutrition.totals).toEqual({
      calories: 1000,
      protein: 70,
      carbs: 100,
      fat: 32,
    });

    expect(res.body.dashboard.nutrition.mealCount).toBe(2);
  });

  it("awards nutrition points for logged meals without goals", async () => {
    addMeal("Breakfast", 400, 25, 40, 12);
    addMeal("Lunch", 600, 45, 60, 20);

    const res = await getDashboard();

    expect(res.status).toBe(200);
    expect(res.body.dashboard.score).toEqual({
      total: 30,
      training: 0,
      nutrition: 30,
    });
  });

  it("awards 40 training points for a workout", async () => {
    addWorkout();

    const res = await getDashboard();

    expect(res.status).toBe(200);
    expect(res.body.dashboard.training.hasWorkout).toBe(true);
    expect(res.body.dashboard.score.training).toBe(40);
    expect(res.body.dashboard.training.workouts).toHaveLength(1);
  });

  it("awards 40 training points for a rest day", async () => {
    db.prepare(`
      INSERT INTO rest_days (user_id, rest_date, note)
      VALUES (?, ?, ?)
    `).run(userId, date, "Recovery");

    const res = await getDashboard();

    expect(res.status).toBe(200);
    expect(res.body.dashboard.training.hasRestDay).toBe(true);
    expect(res.body.dashboard.score.training).toBe(40);
    expect(res.body.dashboard.training.restDay.note).toBe("Recovery");
  });

  it("calculates a full daily score of 100", async () => {
    addWorkout();

    db.prepare(`
      INSERT INTO nutrition_goals (
        user_id, calories, protein_g, carbs_g, fat_g
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, 2000, 100, 200, 50);

    addMeal("Breakfast", 500, 25, 50, 12.5);
    addMeal("Lunch", 500, 25, 50, 12.5);
    addMeal("Snacks", 500, 25, 50, 12.5);
    addMeal("Dinner", 500, 25, 50, 12.5);

    const res = await getDashboard();

    expect(res.status).toBe(200);
    expect(res.body.dashboard.score).toEqual({
      total: 100,
      training: 40,
      nutrition: 60,
    });
  });

  it("summarizes the latest workout", async () => {
    const workoutId = addWorkout("Upper Body Test");

    const exerciseId = db.prepare(`
      INSERT INTO workout_exercises (
        workout_id, exercise_name, tracking_mode, position
      )
      VALUES (?, ?, ?, ?)
    `).run(
      workoutId, "Push-Up", "reps", 1
    ).lastInsertRowid;

    db.prepare(`
      INSERT INTO workout_sets (
        workout_exercise_id, set_number, weight_kg, reps
      )
      VALUES (?, ?, ?, ?)
    `).run(exerciseId, 1, 10, 12);

    const res = await getDashboard();

    expect(res.status).toBe(200);
    expect(res.body.dashboard.latestWorkout).toMatchObject({
      name: "Upper Body Test",
      exerciseCount: 1,
      repSetCount: 1,
      intervalCount: 0,
      repVolume: 120,
    });
  });

  it("includes workouts and rest days in recent activity", async () => {
    addWorkout("Strength Day");

    db.prepare(`
      INSERT INTO rest_days (user_id, rest_date, note)
      VALUES (?, ?, ?)
    `).run(userId, "2020-01-14", "Recovery Day");

    const res = await getDashboard();

    expect(res.status).toBe(200);

    const activity = res.body.dashboard.recentActivity;

    expect(activity).toHaveLength(2);
    expect(activity.some(item => item.type === "workout")).toBe(true);
    expect(activity.some(item => item.type === "rest")).toBe(true);
  });
});

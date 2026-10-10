import express from "express";
import pool from "../db/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("📊 Dashboard requested for user:", userId);

    // === 1️⃣ Total workouts this month ===
    const workoutsQuery = pool.query(
      `SELECT COUNT(*)::int AS total_workouts
       FROM workouts
       WHERE user_id = $1
         AND date >= date_trunc('month', CURRENT_DATE)`,
      [userId]
    );

    // === 2️⃣ Steps summary for this month ===
    const stepsQuery = pool.query(
      `SELECT 
         COALESCE(SUM(steps_count), 0)::int AS total_steps
       FROM steps_logs
       WHERE user_id = $1
         AND step_date >= date_trunc('month', CURRENT_DATE)`,
      [userId]
    );

    // === 3️⃣ Active days: days with steps OR workouts ===
    const activeDaysQuery = pool.query(
      `SELECT COUNT(DISTINCT day)::int AS active_days
       FROM (
         SELECT date::date AS day
         FROM workouts
         WHERE user_id = $1
           AND date >= date_trunc('month', CURRENT_DATE)
         UNION
         SELECT step_date::date AS day
         FROM steps_logs
         WHERE user_id = $1
           AND step_date >= date_trunc('month', CURRENT_DATE)
       ) combined`,
      [userId]
    );

    // === 4️⃣ Monthly workout trend (for the chart) ===
    const monthlyWorkoutsQuery = pool.query(
      `SELECT 
         TO_CHAR(date, 'Mon') AS month,
         COUNT(*)::int AS workouts
       FROM workouts
       WHERE user_id = $1
         AND date >= date_trunc('year', CURRENT_DATE)
       GROUP BY TO_CHAR(date, 'Mon'), EXTRACT(MONTH FROM date)
       ORDER BY EXTRACT(MONTH FROM date) ASC`,
      [userId]
    );

    // Execute all queries at once
    const [workouts, steps, activeDays, monthlyWorkouts] = await Promise.all([
      workoutsQuery,
      stepsQuery,
      activeDaysQuery,
      monthlyWorkoutsQuery,
    ]);

    // === Format months for missing months ===
    const allMonths = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyData = allMonths.map((month) => {
      const found = monthlyWorkouts.rows.find((m) => m.month === month);
      return {
        month,
        workouts: found ? found.workouts : 0,
      };
    });

    // === Build response ===
    const response = {
      totalWorkouts: workouts.rows[0]?.total_workouts || 0,
      totalSteps: steps.rows[0]?.total_steps || 0,
      activeDays: activeDays.rows[0]?.active_days || 0,
      monthlyData,
    };

    console.log("✅ Dashboard data:", response);
    res.json(response);
  } catch (err) {
    console.error("❌ Error loading dashboard:", err);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

export default router;

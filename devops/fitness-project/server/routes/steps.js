import express from "express";
import pool from "../db/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Add new steps log
router.post("/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { step_date, steps_count, distance_km, calories_burned } = req.body;

    const insert = await pool.query(
      `INSERT INTO steps_logs (user_id, step_date, steps_count, distance_km, calories_burned)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, step_date)
       DO UPDATE SET 
         steps_count = EXCLUDED.steps_count,
         distance_km = EXCLUDED.distance_km,
         calories_burned = EXCLUDED.calories_burned,
         created_at = NOW()
       RETURNING *`,
      [userId, step_date, steps_count, distance_km, calories_burned]
    );

    res.json({ message: "Steps added successfully", newSteps: insert.rows[0] });
  } catch (err) {
    console.error("❌ Error adding steps:", err);
    res.status(500).json({ error: "Failed to add steps" });
  }
});

export default router;

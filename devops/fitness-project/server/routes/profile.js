import express from "express";
import pool from "../db/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Protected route — requires valid token
router.get("/:userId", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.name, u.email, u.role, u.location, u.joined_at, u.avatar_url,
              f.weight_kg, f.height_cm, f.goal, f.bmi
       FROM users u
       LEFT JOIN fitness_profile f ON u.id = f.user_id
       WHERE u.id = $1`,
      [req.params.userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile info
router.put("/:userId", verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.params.userId;
    const { name, email, role, location, weight_kg, height_cm, goal } =
      req.body;

    await client.query("BEGIN");

    // Update user info
    await client.query(
      `UPDATE users 
       SET name = $1, email = $2, role = $3, location = $4
       WHERE id = $5`,
      [name, email, role, location, userId]
    );

    // Calculate BMI if possible
    const bmi =
      weight_kg && height_cm
        ? Number((weight_kg / Math.pow(height_cm / 100, 2)).toFixed(1))
        : null;

    // Insert or update fitness profile
    await client.query(
      `INSERT INTO fitness_profile (user_id, weight_kg, height_cm, goal, bmi, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET weight_kg = EXCLUDED.weight_kg,
                     height_cm = EXCLUDED.height_cm,
                     goal = EXCLUDED.goal,
                     bmi = EXCLUDED.bmi,
                     updated_at = NOW()`,
      [userId, weight_kg || null, height_cm || null, goal || null, bmi]
    );

    await client.query("COMMIT");

    res.json({ success: true, message: "Profile updated successfully!" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  } finally {
    client.release();
  }
});

export default router;

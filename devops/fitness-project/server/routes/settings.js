import express from "express";
import pool from "../db/db.js";
import { verifyToken } from "../middleware/auth.js";

// Redis
import redis from "../redis.js";

const router = express.Router();

/* -----------------------------------------------------------
   GET USER SETTINGS (CACHED)
----------------------------------------------------------- */
router.get("/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const cacheKey = `settings:user:${userId}`;

    // 🔥 1. Check Redis cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log("🔥 Redis HIT:", cacheKey);
      return res.json(JSON.parse(cached));
    }

    // 2. Load from DB
    const result = await pool.query(
      `SELECT * FROM settings WHERE user_id = $1`,
      [userId]
    );

    // 3. If settings missing → return defaults
    if (result.rows.length === 0) {
      const defaults = {
        user_id: Number(userId),
        theme: "Light",
        language: "English",
        notifications: { emailAlerts: true, smsNotifications: false },
      };

      // Cache defaults for 10 min
      await redis.set(cacheKey, JSON.stringify(defaults), { EX: 600 });

      return res.json(defaults);
    }

    const settings = result.rows[0];

    // 4. Cache DB result for 10 min
    await redis.set(cacheKey, JSON.stringify(settings), { EX: 600 });

    res.json(settings);
  } catch (err) {
    console.error("❌ Error fetching settings:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -----------------------------------------------------------
   UPDATE USER SETTINGS (INVALIDATES CACHE)
----------------------------------------------------------- */
router.put("/:userId", verifyToken, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { theme, language } = req.body;
    let { notifications } = req.body;

    if (!theme || !language) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fix potential stringified JSON
    if (typeof notifications === "string") {
      notifications = JSON.parse(notifications);
    }

    const upsert = await pool.query(
      `INSERT INTO settings (user_id, theme, language, notifications)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id)
       DO UPDATE SET theme = EXCLUDED.theme,
                     language = EXCLUDED.language,
                     notifications = EXCLUDED.notifications
       RETURNING *`,
      [userId, theme, language, notifications]
    );

    // ❌ Invalidate Redis cache
    const cacheKey = `settings:user:${userId}`;
    await redis.del(cacheKey);
    console.log("🗑 Cache cleared:", cacheKey);

    res.json({ message: "Settings saved", settings: upsert.rows[0] });
  } catch (err) {
    console.error("❌ Error updating settings:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

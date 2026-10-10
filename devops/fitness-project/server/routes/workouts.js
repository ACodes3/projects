import express from "express";
import pool from "../db/db.js";
import redis from "../redis.js";

const router = express.Router();

/* -----------------------------------------------------------
   GET ALL WORKOUTS FOR A USER (CACHED)
----------------------------------------------------------- */
router.get("/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const cacheKey = `workouts:user:${userId}`;

    // Check Redis first
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log("🔥 Redis HIT:", cacheKey);
      return res.json(JSON.parse(cached));
    }

    // Fetch from DB
    const result = await pool.query(
      `SELECT * FROM workouts 
       WHERE user_id = $1 
       ORDER BY date DESC`,
      [userId]
    );

    // Cache for 5 minutes
    await redis.set(cacheKey, JSON.stringify(result.rows), { EX: 300 });
    console.log("💾 Cached:", cacheKey);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching workouts:", err);
    res.status(500).json({ error: "Failed to fetch workouts" });
  }
});

/* -----------------------------------------------------------
   GET WORKOUT DETAILS (CACHED)
----------------------------------------------------------- */
router.get("/details/:workoutId", async (req, res) => {
  const workoutId = req.params.workoutId;

  try {
    const cacheKey = `workout:${workoutId}`;

    // Check Redis
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log("🔥 Redis HIT:", cacheKey);
      return res.json(JSON.parse(cached));
    }

    // Load from DB
    const result = await pool.query(
      `SELECT 
          w.id,
          w.user_id,
          w.type,
          w.name,
          w.date,
          w.duration_min AS workout_duration_min,
          w.notes,
          we.exercise_name,
          we.sets,
          we.reps,
          we.weight_kg,
          we.duration_min AS exercise_duration_min
        FROM workouts w
        LEFT JOIN workout_exercises we ON w.id = we.workout_id
        WHERE w.id = $1`,
      [workoutId]
    );

    // Cache for 5 minutes
    await redis.set(cacheKey, JSON.stringify(result.rows), { EX: 300 });
    console.log("💾 Cached:", cacheKey);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching workout details:", err);
    res.status(500).json({ error: "Failed to fetch workout details" });
  }
});

/* -----------------------------------------------------------
   ADD NEW WORKOUT (INVALIDATES CACHE)
----------------------------------------------------------- */
router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id, type, name, date, duration_min, notes, exercises } =
      req.body;

    if (!user_id || !type || !name || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await client.query("BEGIN");

    // Insert workout
    const workoutResult = await client.query(
      `INSERT INTO workouts (user_id, type, name, date, duration_min, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [user_id, type, name, date, duration_min || null, notes || null]
    );

    const workoutId = workoutResult.rows[0].id;

    // Insert exercises
    if (exercises && exercises.length > 0) {
      const insertQuery = `
        INSERT INTO workout_exercises 
          (workout_id, exercise_name, sets, reps, weight_kg, duration_min)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

      for (const ex of exercises) {
        await client.query(insertQuery, [
          workoutId,
          ex.exercise_name || null,
          ex.sets || null,
          ex.reps || null,
          ex.weight_kg || null,
          ex.duration_min || null,
        ]);
      }
    }

    await client.query("COMMIT");

    // ❌ Delete related caches
    await redis.del(`workouts:user:${user_id}`);
    await redis.del(`workout:${workoutId}`);

    res.status(201).json({
      message: "Workout created",
      workout: {
        id: workoutId,
        user_id,
        type,
        name,
        date,
        duration_min,
        notes,
        exercises,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error adding workout:", err);
    res.status(500).json({ error: "Failed to create workout" });
  } finally {
    client.release();
  }
});

/* -----------------------------------------------------------
   UPDATE WORKOUT (INVALIDATES CACHE)
----------------------------------------------------------- */
router.put("/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const workoutId = req.params.id;
    const { name, type, date, duration_min, notes, exercises } = req.body;

    if (!name || !type || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await client.query("BEGIN");

    await client.query(
      `UPDATE workouts
       SET name = $1, type = $2, date = $3, duration_min = $4, notes = $5
       WHERE id = $6`,
      [name, type, date, duration_min || null, notes || null, workoutId]
    );

    await client.query(`DELETE FROM workout_exercises WHERE workout_id = $1`, [
      workoutId,
    ]);

    if (exercises && exercises.length > 0) {
      const insertQuery = `
        INSERT INTO workout_exercises 
          (workout_id, exercise_name, sets, reps, weight_kg, duration_min)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

      for (const ex of exercises) {
        await client.query(insertQuery, [
          workoutId,
          ex.exercise_name || null,
          ex.sets || null,
          ex.reps || null,
          ex.weight_kg || null,
          ex.duration_min || null,
        ]);
      }
    }

    await client.query("COMMIT");

    // ❌ Invalidate all linked caches
    await redis.del(`workout:${workoutId}`);

    // Find userId to invalidate user list
    const userResult = await pool.query(
      `SELECT user_id FROM workouts WHERE id = $1`,
      [workoutId]
    );

    if (userResult.rows.length > 0) {
      await redis.del(`workouts:user:${userResult.rows[0].user_id}`);
    }

    res.json({ message: "Workout updated" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating workout:", err);
    res.status(500).json({ error: "Failed to update workout" });
  } finally {
    client.release();
  }
});

/* -----------------------------------------------------------
   DELETE WORKOUT (INVALIDATES CACHE)
----------------------------------------------------------- */
router.delete("/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const workoutId = req.params.id;

    // Find userId before deletion
    const userResult = await pool.query(
      `SELECT user_id FROM workouts WHERE id = $1`,
      [workoutId]
    );

    await client.query("BEGIN");

    await client.query(`DELETE FROM workout_exercises WHERE workout_id = $1`, [
      workoutId,
    ]);

    await client.query(`DELETE FROM workouts WHERE id = $1`, [workoutId]);

    await client.query("COMMIT");

    // ❌ Invalidate caches
    await redis.del(`workout:${workoutId}`);

    if (userResult.rows.length > 0) {
      await redis.del(`workouts:user:${userResult.rows[0].user_id}`);
    }

    res.json({ message: "Workout deleted" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error deleting workout:", err);
    res.status(500).json({ error: "Failed to delete workout" });
  } finally {
    client.release();
  }
});

export default router;

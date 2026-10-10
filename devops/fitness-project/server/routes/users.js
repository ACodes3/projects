import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import pool from "../db/db.js";

import redis from "../redis.js";

const router = express.Router();

// Get all users
router.get("/", async (req, res) => {
  try {
    // Check cache first
    const cached = await redis.get("users:all");
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    const result = await pool.query("SELECT * FROM users ORDER BY id ASC");
    // Save to Redis for 5 minutes
    await redis.set("users:all", JSON.stringify(result.rows), { EX: 300 });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single user
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/users/signup
router.post("/signup", async (req, res) => {
  const { name, email, password, location, role, weight_kg, height_cm, goal } =
    req.body;

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // 🧩 Insert user with role + location
    const userResult = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, location, joined_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, name, email, role, location`,
      [name, email, hashed, role || "Beginner", location || "Unknown"]
    );

    const user = userResult.rows[0];

    const bmi =
      weight_kg && height_cm
        ? (weight_kg / ((height_cm / 100) * (height_cm / 100))).toFixed(1)
        : null;

    await pool.query(
      `INSERT INTO fitness_profile (user_id, weight_kg, height_cm, goal, bmi, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [user.id, weight_kg || null, height_cm || null, goal || null, bmi]
    );

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "2h" }
    );

    res.status(201).json({
      message: "Signup successful",
      token,
      user,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Failed to create account" });
  }
});

export default router;

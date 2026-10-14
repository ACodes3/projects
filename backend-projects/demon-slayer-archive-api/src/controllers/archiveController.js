
import pool from "../config/db.js";

const collections = {
  slayers: "slayers",
  demons: "demons",
  "breathing-styles": "breathing_styles",
  "blood-demon-arts": "blood_demon_arts",
  techniques: "techniques"
};

// GET all records
export async function getAll(req, res) {
  const table = collections[req.params.collection];

  if (!table) {
    return res.status(404).json({
      message: "Collection not found"
    });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM ${table} ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to retrieve data"
    });
  }
}

// GET one record by ID
export async function getById(req, res) {
  const table = collections[req.params.collection];

  if (!table) {
    return res.status(404).json({
      message: "Collection not found"
    });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM ${table} WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Record not found"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to retrieve record"
    });
  }
}

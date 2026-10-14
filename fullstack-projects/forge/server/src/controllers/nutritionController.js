import pool from "../config/db.js";

// ============================================================
// CONSTANTS
// ============================================================

const ALLOWED_MEALS = ["Breakfast", "Lunch", "Snacks", "Dinner"];

// ============================================================
// HELPERS
// ============================================================

function isValidDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validateNutritionPayload(body) {
  const { date, meal, name, calories, protein, carbs, fat } = body;

  // ----------------------------------------------------------
  // DATE
  // ----------------------------------------------------------

  if (!isValidDateString(date)) {
    return "A valid nutrition date is required.";
  }

  // ----------------------------------------------------------
  // MEAL
  // ----------------------------------------------------------

  if (!ALLOWED_MEALS.includes(meal)) {
    return "Meal must be Breakfast, Lunch, Snacks, or Dinner.";
  }

  // ----------------------------------------------------------
  // FOOD NAME
  // ----------------------------------------------------------

  if (typeof name !== "string" || name.trim().length === 0) {
    return "Food name is required.";
  }

  // ----------------------------------------------------------
  // CALORIES
  // ----------------------------------------------------------

  const parsedCalories = Number(calories);

  if (!Number.isInteger(parsedCalories) || parsedCalories < 0) {
    return "Calories must be a non-negative whole number.";
  }

  // ----------------------------------------------------------
  // MACROS
  // ----------------------------------------------------------

  const macroValues = {
    protein: Number(protein),
    carbs: Number(carbs),
    fat: Number(fat),
  };

  for (const [key, value] of Object.entries(macroValues)) {
    if (!Number.isFinite(value) || value < 0) {
      return `${key} must be a non-negative number.`;
    }
  }

  return null;
}

// ============================================================
// GET NUTRITION ENTRIES
//
// GET /api/nutrition
//
// Optional:
// GET /api/nutrition?date=2026-10-11
// ============================================================

export async function getNutritionEntries(req, res) {
  try {
    const userId = req.user.id;
    const { date } = req.query;

    // --------------------------------------------------------
    // OPTIONAL DATE FILTER
    // --------------------------------------------------------

    if (date !== undefined && !isValidDateString(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date.",
      });
    }

    // IMPORTANT:
    // Return entry_date as YYYY-MM-DD text.
    // This prevents timezone-related date shifts.

    let query = `
      SELECT
        id,
        entry_date::text AS entry_date,
        meal,
        name,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        created_at,
        updated_at
      FROM public.nutrition_entries
      WHERE user_id = $1
    `;

    const values = [userId];

    if (date) {
      query += `
        AND entry_date = $2
      `;

      values.push(date);
    }

    // --------------------------------------------------------
    // MEALS FOLLOW FRONTEND ORDER
    // --------------------------------------------------------

    query += `
      ORDER BY
        entry_date DESC,

        CASE meal
          WHEN 'Breakfast' THEN 1
          WHEN 'Lunch' THEN 2
          WHEN 'Snacks' THEN 3
          WHEN 'Dinner' THEN 4
          ELSE 5
        END,

        created_at ASC
    `;

    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      entries: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch nutrition entries:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch nutrition entries.",
    });
  }
}

// ============================================================
// CREATE NUTRITION ENTRY
//
// POST /api/nutrition
// ============================================================

export async function createNutritionEntry(req, res) {
  const validationError = validateNutritionPayload(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const userId = req.user.id;

    const { date, meal, name, calories, protein, carbs, fat } = req.body;

    const result = await pool.query(
      `
        INSERT INTO public.nutrition_entries (
          user_id,
          entry_date,
          meal,
          name,
          calories,
          protein_g,
          carbs_g,
          fat_g
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8
        )
        RETURNING
          id,
          entry_date::text AS entry_date,
          meal,
          name,
          calories,
          protein_g,
          carbs_g,
          fat_g,
          created_at,
          updated_at
      `,
      [
        userId,
        date,
        meal,
        name.trim(),
        Number(calories),
        Number(protein),
        Number(carbs),
        Number(fat),
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Nutrition entry created successfully.",
      entry: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to create nutrition entry:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create nutrition entry.",
    });
  }
}

// ============================================================
// UPDATE NUTRITION ENTRY
//
// PUT /api/nutrition/:id
// ============================================================

export async function updateNutritionEntry(req, res) {
  const entryId = Number(req.params.id);

  // ----------------------------------------------------------
  // VALIDATE ID
  // ----------------------------------------------------------

  if (!Number.isInteger(entryId) || entryId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid nutrition entry ID.",
    });
  }

  const validationError = validateNutritionPayload(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const userId = req.user.id;

    const { date, meal, name, calories, protein, carbs, fat } = req.body;

    const result = await pool.query(
      `
        UPDATE public.nutrition_entries
        SET
          entry_date = $1,
          meal = $2,
          name = $3,
          calories = $4,
          protein_g = $5,
          carbs_g = $6,
          fat_g = $7
        WHERE id = $8
          AND user_id = $9
        RETURNING
          id,
          entry_date::text AS entry_date,
          meal,
          name,
          calories,
          protein_g,
          carbs_g,
          fat_g,
          created_at,
          updated_at
      `,
      [
        date,
        meal,
        name.trim(),
        Number(calories),
        Number(protein),
        Number(carbs),
        Number(fat),
        entryId,
        userId,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Nutrition entry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Nutrition entry updated successfully.",
      entry: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to update nutrition entry:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update nutrition entry.",
    });
  }
}

// ============================================================
// DELETE NUTRITION ENTRY
//
// DELETE /api/nutrition/:id
// ============================================================

export async function deleteNutritionEntry(req, res) {
  try {
    const userId = req.user.id;
    const entryId = Number(req.params.id);

    // --------------------------------------------------------
    // VALIDATE ID
    // --------------------------------------------------------

    if (!Number.isInteger(entryId) || entryId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid nutrition entry ID.",
      });
    }

    const result = await pool.query(
      `
        DELETE FROM public.nutrition_entries
        WHERE id = $1
          AND user_id = $2
        RETURNING
          id,
          entry_date::text AS entry_date,
          meal,
          name
      `,
      [entryId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Nutrition entry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Nutrition entry deleted successfully.",
      entry: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to delete nutrition entry:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete nutrition entry.",
    });
  }
}

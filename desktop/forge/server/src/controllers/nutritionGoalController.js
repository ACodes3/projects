import db from "../config/sqlite.js";

// ============================================================
// HELPERS
// ============================================================

function normalizeOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return Number(value);
}

function validateGoals(body) {
  const calories = normalizeOptionalNumber(body.calories);

  const protein = normalizeOptionalNumber(body.protein);

  const carbs = normalizeOptionalNumber(body.carbs);

  const fat = normalizeOptionalNumber(body.fat);

  // ----------------------------------------------------------
  // CALORIES
  // Nullable because FORGE allows goals to be unconfigured.
  // ----------------------------------------------------------

  if (calories !== null && (!Number.isInteger(calories) || calories <= 0)) {
    return "Calories must be a positive whole number or blank.";
  }

  // ----------------------------------------------------------
  // MACROS
  // ----------------------------------------------------------

  const macros = {
    protein,
    carbs,
    fat,
  };

  for (const [name, value] of Object.entries(macros)) {
    if (value !== null && (!Number.isFinite(value) || value <= 0)) {
      return `${name} must be a positive number or blank.`;
    }
  }

  return null;
}

// ============================================================
// GET NUTRITION GOALS
//
// GET /api/nutrition/goals

function format(row) {
  return row
    ? {
        id: row.id,
        calories: row.calories,
        protein: row.protein_g,
        carbs: row.carbs_g,
        fat: row.fat_g,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : { calories: null, protein: null, carbs: null, fat: null };
}
export function getNutritionGoals(req, res) {
  try {
    const row = db
      .prepare("SELECT * FROM nutrition_goals WHERE user_id=?")
      .get(req.user.id);
    return res.json({ success: true, goals: format(row) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch nutrition goals." });
  }
}
export function saveNutritionGoals(req, res) {
  const error = validateGoals(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const b = req.body;
    const row = db
      .prepare(
        `INSERT INTO nutrition_goals(user_id,calories,protein_g,carbs_g,fat_g) VALUES(?,?,?,?,?)
 ON CONFLICT(user_id) DO UPDATE SET calories=excluded.calories,protein_g=excluded.protein_g,carbs_g=excluded.carbs_g,fat_g=excluded.fat_g
 RETURNING *`,
      )
      .get(
        req.user.id,
        normalizeOptionalNumber(b.calories),
        normalizeOptionalNumber(b.protein),
        normalizeOptionalNumber(b.carbs),
        normalizeOptionalNumber(b.fat),
      );
    return res.json({
      success: true,
      message: "Nutrition goals saved successfully.",
      goals: format(row),
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to save nutrition goals." });
  }
}

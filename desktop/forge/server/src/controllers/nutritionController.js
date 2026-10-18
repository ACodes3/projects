import db from "../config/sqlite.js";

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

const columns = `id, entry_date, meal, name, calories, protein_g, carbs_g, fat_g, created_at, updated_at`;
function values(b) {
  return [
    b.date,
    b.meal,
    b.name.trim(),
    Number(b.calories),
    Number(b.protein),
    Number(b.carbs),
    Number(b.fat),
  ];
}
function validId(s) {
  const n = Number(s);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
function fail(res, error, message) {
  console.error(message, error);
  return res.status(500).json({ success: false, message });
}

export function getNutritionEntries(req, res) {
  try {
    const { date } = req.query;
    if (date !== undefined && !isValidDateString(date))
      return res.status(400).json({ success: false, message: "Invalid date." });
    const sql = `SELECT ${columns} FROM nutrition_entries WHERE user_id = ? ${date ? "AND entry_date = ?" : ""}
   ORDER BY entry_date DESC, CASE meal WHEN 'Breakfast' THEN 1 WHEN 'Lunch' THEN 2 WHEN 'Snacks' THEN 3 WHEN 'Dinner' THEN 4 ELSE 5 END, created_at ASC`;
    const entries = db
      .prepare(sql)
      .all(...(date ? [req.user.id, date] : [req.user.id]));
    return res.json({ success: true, count: entries.length, entries });
  } catch (error) {
    return fail(res, error, "Failed to fetch nutrition entries.");
  }
}
export function createNutritionEntry(req, res) {
  const validationError = validateNutritionPayload(req.body);
  if (validationError)
    return res.status(400).json({ success: false, message: validationError });
  try {
    const entry = db
      .prepare(
        `INSERT INTO nutrition_entries (user_id,entry_date,meal,name,calories,protein_g,carbs_g,fat_g)
   VALUES (?,?,?,?,?,?,?,?) RETURNING ${columns}`,
      )
      .get(req.user.id, ...values(req.body));
    return res
      .status(201)
      .json({
        success: true,
        message: "Nutrition entry created successfully.",
        entry,
      });
  } catch (error) {
    return fail(res, error, "Failed to create nutrition entry.");
  }
}
export function updateNutritionEntry(req, res) {
  const id = validId(req.params.id);
  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Invalid nutrition entry ID." });
  const validationError = validateNutritionPayload(req.body);
  if (validationError)
    return res.status(400).json({ success: false, message: validationError });
  try {
    const entry = db
      .prepare(
        `UPDATE nutrition_entries SET entry_date=?,meal=?,name=?,calories=?,protein_g=?,carbs_g=?,fat_g=?
   WHERE id=? AND user_id=? RETURNING ${columns}`,
      )
      .get(...values(req.body), id, req.user.id);
    if (!entry)
      return res
        .status(404)
        .json({ success: false, message: "Nutrition entry not found." });
    return res.json({
      success: true,
      message: "Nutrition entry updated successfully.",
      entry,
    });
  } catch (error) {
    return fail(res, error, "Failed to update nutrition entry.");
  }
}
export function deleteNutritionEntry(req, res) {
  const id = validId(req.params.id);
  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Invalid nutrition entry ID." });
  try {
    const entry = db
      .prepare(
        "DELETE FROM nutrition_entries WHERE id=? AND user_id=? RETURNING id, entry_date, meal, name",
      )
      .get(id, req.user.id);
    if (!entry)
      return res
        .status(404)
        .json({ success: false, message: "Nutrition entry not found." });
    return res.json({
      success: true,
      message: "Nutrition entry deleted successfully.",
      entry,
    });
  } catch (error) {
    return fail(res, error, "Failed to delete nutrition entry.");
  }
}

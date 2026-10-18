import db from "../config/sqlite.js";

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

function normalizeOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return Number(value);
}

function normalizeOptionalText(value) {
  if (
    value === undefined ||
    value === null ||
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return null;
  }

  return value.trim();
}

function validateProgressPayload(body) {
  const { date, weight, bodyFat, waist, chest, arms, thighs, notes } = body;

  // ----------------------------------------------------------
  // DATE
  // ----------------------------------------------------------

  if (!isValidDateString(date)) {
    return "A valid progress date is required.";
  }

  // ----------------------------------------------------------
  // NORMALIZE VALUES
  // ----------------------------------------------------------

  const weightValue = normalizeOptionalNumber(weight);

  const bodyFatValue = normalizeOptionalNumber(bodyFat);

  const waistValue = normalizeOptionalNumber(waist);

  const chestValue = normalizeOptionalNumber(chest);

  const armsValue = normalizeOptionalNumber(arms);

  const thighsValue = normalizeOptionalNumber(thighs);

  const notesValue = normalizeOptionalText(notes);

  // ----------------------------------------------------------
  // WEIGHT
  // ----------------------------------------------------------

  if (
    weightValue !== null &&
    (!Number.isFinite(weightValue) || weightValue <= 0)
  ) {
    return "Weight must be a positive number or blank.";
  }

  // ----------------------------------------------------------
  // BODY FAT
  // ----------------------------------------------------------

  if (
    bodyFatValue !== null &&
    (!Number.isFinite(bodyFatValue) || bodyFatValue < 0 || bodyFatValue > 100)
  ) {
    return "Body fat must be between 0 and 100 or blank.";
  }

  // ----------------------------------------------------------
  // BODY MEASUREMENTS
  // ----------------------------------------------------------

  const measurements = {
    waist: waistValue,
    chest: chestValue,
    arms: armsValue,
    thighs: thighsValue,
  };

  for (const [name, value] of Object.entries(measurements)) {
    if (value !== null && (!Number.isFinite(value) || value <= 0)) {
      return `${name} must be a positive number or blank.`;
    }
  }

  // ----------------------------------------------------------
  // NOTES
  // ----------------------------------------------------------

  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return "Notes must be text.";
  }

  // ----------------------------------------------------------
  // REQUIRE AT LEAST ONE VALUE
  //
  // Matches our PostgreSQL constraint.
  // ----------------------------------------------------------

  const hasValue =
    weightValue !== null ||
    bodyFatValue !== null ||
    waistValue !== null ||
    chestValue !== null ||
    armsValue !== null ||
    thighsValue !== null ||
    notesValue !== null;

  if (!hasValue) {
    return "A progress entry must contain at least one measurement or a note.";
  }

  return null;
}

// ============================================================
// GET PROGRESS ENTRIES
//
// GET /api/progress
//
// Optional:
// GET /api/progress?date=2026-10-11

const columns =
  "id,entry_date,weight_kg,body_fat_percent,waist_cm,chest_cm,arms_cm,thighs_cm,notes,created_at,updated_at";
function format(r) {
  return {
    id: r.id,
    date: r.entry_date,
    weight: r.weight_kg,
    bodyFat: r.body_fat_percent,
    waist: r.waist_cm,
    chest: r.chest_cm,
    arms: r.arms_cm,
    thighs: r.thighs_cm,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
function vals(b) {
  return [
    b.date,
    normalizeOptionalNumber(b.weight),
    normalizeOptionalNumber(b.bodyFat),
    normalizeOptionalNumber(b.waist),
    normalizeOptionalNumber(b.chest),
    normalizeOptionalNumber(b.arms),
    normalizeOptionalNumber(b.thighs),
    normalizeOptionalText(b.notes),
  ];
}
function idOf(raw) {
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
function fail(res, error, msg) {
  console.error(msg, error);
  return res.status(500).json({ success: false, message: msg });
}
export function getProgressEntries(req, res) {
  try {
    const { date } = req.query;
    if (date !== undefined && !isValidDateString(date))
      return res.status(400).json({ success: false, message: "Invalid date." });
    const rows = db
      .prepare(
        `SELECT ${columns} FROM progress_entries WHERE user_id=? ${date ? "AND entry_date=?" : ""} ORDER BY entry_date DESC,created_at DESC`,
      )
      .all(...(date ? [req.user.id, date] : [req.user.id]));
    return res.json({
      success: true,
      count: rows.length,
      entries: rows.map(format),
    });
  } catch (error) {
    return fail(res, error, "Failed to fetch progress entries.");
  }
}
export function createProgressEntry(req, res) {
  const error = validateProgressPayload(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const row = db
      .prepare(
        `INSERT INTO progress_entries(user_id,entry_date,weight_kg,body_fat_percent,waist_cm,chest_cm,arms_cm,thighs_cm,notes)
 VALUES(?,?,?,?,?,?,?,?,?) RETURNING ${columns}`,
      )
      .get(req.user.id, ...vals(req.body));
    return res
      .status(201)
      .json({
        success: true,
        message: "Progress entry created successfully.",
        entry: format(row),
      });
  } catch (error) {
    return fail(res, error, "Failed to create progress entry.");
  }
}
export function updateProgressEntry(req, res) {
  const id = idOf(req.params.id);
  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Invalid progress entry ID." });
  const error = validateProgressPayload(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const row = db
      .prepare(
        `UPDATE progress_entries SET entry_date=?,weight_kg=?,body_fat_percent=?,waist_cm=?,chest_cm=?,arms_cm=?,thighs_cm=?,notes=?
 WHERE id=? AND user_id=? RETURNING ${columns}`,
      )
      .get(...vals(req.body), id, req.user.id);
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Progress entry not found." });
    return res.json({
      success: true,
      message: "Progress entry updated successfully.",
      entry: format(row),
    });
  } catch (error) {
    return fail(res, error, "Failed to update progress entry.");
  }
}
export function deleteProgressEntry(req, res) {
  const id = idOf(req.params.id);
  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Invalid progress entry ID." });
  try {
    const row = db
      .prepare(
        "DELETE FROM progress_entries WHERE id=? AND user_id=? RETURNING id,entry_date",
      )
      .get(id, req.user.id);
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Progress entry not found." });
    return res.json({
      success: true,
      message: "Progress entry deleted successfully.",
      entry: row,
    });
  } catch (error) {
    return fail(res, error, "Failed to delete progress entry.");
  }
}

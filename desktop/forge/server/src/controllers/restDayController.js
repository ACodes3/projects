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

// ============================================================
// GET REST DAYS
//
// GET /api/rest-days
//
// Optional:
// GET /api/rest-days?date=2026-10-11

function format(row) {
  return {
    id: row.id,
    date: row.rest_date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export function getRestDays(req, res) {
  try {
    const { date } = req.query;
    if (date !== undefined && !isValidDateString(date))
      return res.status(400).json({ success: false, message: "Invalid date." });
    const rows = db
      .prepare(
        `SELECT id,rest_date,note,created_at,updated_at FROM rest_days WHERE user_id=? ${date ? "AND rest_date=?" : ""} ORDER BY rest_date DESC`,
      )
      .all(...(date ? [req.user.id, date] : [req.user.id]));
    return res.json({
      success: true,
      count: rows.length,
      restDays: rows.map(format),
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch rest days." });
  }
}
export function createRestDay(req, res) {
  const { date, note } = req.body ?? {};
  if (!isValidDateString(date))
    return res
      .status(400)
      .json({ success: false, message: "A valid rest date is required." });
  if (note != null && typeof note !== "string")
    return res
      .status(400)
      .json({ success: false, message: "Rest day note must be text." });
  try {
    const restDay = db.transaction(() => {
      // SQLite's local date follows the user's operating-system timezone.
      // Use a local date built from local year/month/day (avoids locale implementation differences).
      const now = new Date();
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (date > localToday) {
        const e = new Error("A future date cannot be marked as a rest day.");
        e.statusCode = 400;
        throw e;
      }
      if (
        db
          .prepare("SELECT id FROM workouts WHERE user_id=? AND workout_date=?")
          .get(req.user.id, date)
      ) {
        const e = new Error(
          "This date already contains a workout and cannot be marked as a rest day.",
        );
        e.statusCode = 409;
        throw e;
      }
      return db
        .prepare(
          "INSERT INTO rest_days(user_id,rest_date,note) VALUES(?,?,?) RETURNING id,rest_date,note,created_at,updated_at",
        )
        .get(req.user.id, date, normalizeOptionalText(note));
    })();
    return res
      .status(201)
      .json({
        success: true,
        message: "Rest day created successfully.",
        restDay: format(restDay),
      });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE")
      return res
        .status(409)
        .json({
          success: false,
          message: "This date is already marked as a rest day.",
        });
    if (error.statusCode)
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create rest day." });
  }
}
export function deleteRestDay(req, res) {
  const { date } = req.params;
  if (!isValidDateString(date))
    return res
      .status(400)
      .json({ success: false, message: "Invalid rest day date." });
  try {
    const row = db
      .prepare(
        "DELETE FROM rest_days WHERE user_id=? AND rest_date=? RETURNING id,rest_date,note",
      )
      .get(req.user.id, date);
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Rest day not found." });
    return res.json({
      success: true,
      message: "Rest day removed successfully.",
      restDay: { id: row.id, date: row.rest_date, note: row.note },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete rest day." });
  }
}

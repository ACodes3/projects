import db from "../config/sqlite.js";

// ============================================================
// HELPERS
// ============================================================

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

function normalizeOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return Number(value);
}

function validateProfile(body) {
  const { name, trainingFocus, height, bio } = body;

  // ----------------------------------------------------------
  // NAME
  // ----------------------------------------------------------

  if (name !== undefined && name !== null && typeof name !== "string") {
    return "Name must be text.";
  }

  if (typeof name === "string" && name.trim().length > 100) {
    return "Name cannot exceed 100 characters.";
  }

  // ----------------------------------------------------------
  // TRAINING FOCUS
  // ----------------------------------------------------------

  if (
    trainingFocus !== undefined &&
    trainingFocus !== null &&
    typeof trainingFocus !== "string"
  ) {
    return "Training focus must be text.";
  }

  if (typeof trainingFocus === "string" && trainingFocus.trim().length > 150) {
    return "Training focus cannot exceed 150 characters.";
  }

  // ----------------------------------------------------------
  // HEIGHT
  // ----------------------------------------------------------

  const heightValue = normalizeOptionalNumber(height);

  if (
    heightValue !== null &&
    (!Number.isFinite(heightValue) || heightValue <= 0)
  ) {
    return "Height must be a positive number or blank.";
  }

  // ----------------------------------------------------------
  // BIO
  // ----------------------------------------------------------

  if (bio !== undefined && bio !== null && typeof bio !== "string") {
    return "Bio must be text.";
  }

  return null;
}

// ============================================================
// GET PROFILE
//
// GET /api/profile

function format(row) {
  return row
    ? {
        id: row.id,
        name: row.name,
        trainingFocus: row.training_focus,
        height: row.height_cm,
        bio: row.bio,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : { name: null, trainingFocus: null, height: null, bio: null };
}
export function getProfile(req, res) {
  try {
    const row = db
      .prepare("SELECT * FROM profiles WHERE user_id=?")
      .get(req.user.id);
    return res.json({ success: true, profile: format(row) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch profile." });
  }
}
export function saveProfile(req, res) {
  const error = validateProfile(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const { name, trainingFocus, height, bio } = req.body;
    const row = db
      .prepare(
        `INSERT INTO profiles(user_id,name,training_focus,height_cm,bio) VALUES(?,?,?,?,?)
 ON CONFLICT(user_id) DO UPDATE SET name=excluded.name, training_focus=excluded.training_focus,height_cm=excluded.height_cm,bio=excluded.bio
 RETURNING *`,
      )
      .get(
        req.user.id,
        normalizeOptionalText(name),
        normalizeOptionalText(trainingFocus),
        normalizeOptionalNumber(height),
        normalizeOptionalText(bio),
      );
    return res.json({
      success: true,
      message: "Profile saved successfully.",
      profile: format(row),
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to save profile." });
  }
}

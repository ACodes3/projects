import pool from '../config/db.js';


// ============================================================
// HELPERS
// ============================================================

function isValidDateString(value) {
  if (
    typeof value !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const [year, month, day] = value
    .split('-')
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  return (
    date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
  );
}


function normalizeOptionalNumber(value) {
  if (
    value === undefined
    || value === null
    || value === ''
  ) {
    return null;
  }

  return Number(value);
}


function normalizeOptionalText(value) {
  if (
    value === undefined
    || value === null
    || typeof value !== 'string'
    || value.trim() === ''
  ) {
    return null;
  }

  return value.trim();
}


function validateProgressPayload(body) {
  const {
    date,
    weight,
    bodyFat,
    waist,
    chest,
    arms,
    thighs,
    notes,
  } = body;


  // ----------------------------------------------------------
  // DATE
  // ----------------------------------------------------------

  if (!isValidDateString(date)) {
    return 'A valid progress date is required.';
  }


  // ----------------------------------------------------------
  // NORMALIZE VALUES
  // ----------------------------------------------------------

  const weightValue =
    normalizeOptionalNumber(weight);

  const bodyFatValue =
    normalizeOptionalNumber(bodyFat);

  const waistValue =
    normalizeOptionalNumber(waist);

  const chestValue =
    normalizeOptionalNumber(chest);

  const armsValue =
    normalizeOptionalNumber(arms);

  const thighsValue =
    normalizeOptionalNumber(thighs);

  const notesValue =
    normalizeOptionalText(notes);


  // ----------------------------------------------------------
  // WEIGHT
  // ----------------------------------------------------------

  if (
    weightValue !== null
    && (
      !Number.isFinite(weightValue)
      || weightValue <= 0
    )
  ) {
    return 'Weight must be a positive number or blank.';
  }


  // ----------------------------------------------------------
  // BODY FAT
  // ----------------------------------------------------------

  if (
    bodyFatValue !== null
    && (
      !Number.isFinite(bodyFatValue)
      || bodyFatValue < 0
      || bodyFatValue > 100
    )
  ) {
    return 'Body fat must be between 0 and 100 or blank.';
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

  for (
    const [name, value]
    of Object.entries(measurements)
  ) {
    if (
      value !== null
      && (
        !Number.isFinite(value)
        || value <= 0
      )
    ) {
      return `${name} must be a positive number or blank.`;
    }
  }


  // ----------------------------------------------------------
  // NOTES
  // ----------------------------------------------------------

  if (
    notes !== undefined
    && notes !== null
    && typeof notes !== 'string'
  ) {
    return 'Notes must be text.';
  }


  // ----------------------------------------------------------
  // REQUIRE AT LEAST ONE VALUE
  //
  // Matches our PostgreSQL constraint.
  // ----------------------------------------------------------

  const hasValue =
    weightValue !== null
    || bodyFatValue !== null
    || waistValue !== null
    || chestValue !== null
    || armsValue !== null
    || thighsValue !== null
    || notesValue !== null;

  if (!hasValue) {
    return 'A progress entry must contain at least one measurement or a note.';
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
// ============================================================

export async function getProgressEntries(
  req,
  res,
) {
  try {
    const userId = req.user.id;

    const { date } = req.query;


    if (
      date !== undefined
      && !isValidDateString(date)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date.',
      });
    }


    let query = `
      SELECT
        id,
        entry_date,
        weight_kg,
        body_fat_percent,
        waist_cm,
        chest_cm,
        arms_cm,
        thighs_cm,
        notes,
        created_at,
        updated_at
      FROM public.progress_entries
      WHERE user_id = $1
    `;

    const values = [userId];


    if (date) {
      query += `
        AND entry_date = $2
      `;

      values.push(date);
    }


    query += `
      ORDER BY
        entry_date DESC,
        created_at DESC
    `;


    const result = await pool.query(
      query,
      values,
    );


    // --------------------------------------------------------
    // CONVERT POSTGRES NUMERIC STRINGS TO JS NUMBERS
    // --------------------------------------------------------

    const entries = result.rows.map(
      (row) => ({
        id: row.id,

        date: row.entry_date,

        weight:
          row.weight_kg === null
            ? null
            : Number(row.weight_kg),

        bodyFat:
          row.body_fat_percent === null
            ? null
            : Number(row.body_fat_percent),

        waist:
          row.waist_cm === null
            ? null
            : Number(row.waist_cm),

        chest:
          row.chest_cm === null
            ? null
            : Number(row.chest_cm),

        arms:
          row.arms_cm === null
            ? null
            : Number(row.arms_cm),

        thighs:
          row.thighs_cm === null
            ? null
            : Number(row.thighs_cm),

        notes: row.notes,

        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }),
    );


    res.status(200).json({
      success: true,
      count: entries.length,
      entries,
    });
  } catch (error) {
    console.error(
      'Failed to fetch progress entries:',
      error,
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch progress entries.',
    });
  }
}


// ============================================================
// CREATE PROGRESS ENTRY
//
// POST /api/progress
// ============================================================

export async function createProgressEntry(
  req,
  res,
) {
  const validationError =
    validateProgressPayload(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }


  try {
    const userId = req.user.id;

    const {
      date,
      weight,
      bodyFat,
      waist,
      chest,
      arms,
      thighs,
      notes,
    } = req.body;


    const result = await pool.query(
      `
        INSERT INTO public.progress_entries (
          user_id,
          entry_date,
          weight_kg,
          body_fat_percent,
          waist_cm,
          chest_cm,
          arms_cm,
          thighs_cm,
          notes
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9
        )
        RETURNING
          id,
          entry_date,
          weight_kg,
          body_fat_percent,
          waist_cm,
          chest_cm,
          arms_cm,
          thighs_cm,
          notes,
          created_at,
          updated_at
      `,
      [
        userId,
        date,
        normalizeOptionalNumber(weight),
        normalizeOptionalNumber(bodyFat),
        normalizeOptionalNumber(waist),
        normalizeOptionalNumber(chest),
        normalizeOptionalNumber(arms),
        normalizeOptionalNumber(thighs),
        normalizeOptionalText(notes),
      ],
    );


    const row = result.rows[0];


    res.status(201).json({
      success: true,
      message:
        'Progress entry created successfully.',

      entry: {
        id: row.id,

        date: row.entry_date,

        weight:
          row.weight_kg === null
            ? null
            : Number(row.weight_kg),

        bodyFat:
          row.body_fat_percent === null
            ? null
            : Number(row.body_fat_percent),

        waist:
          row.waist_cm === null
            ? null
            : Number(row.waist_cm),

        chest:
          row.chest_cm === null
            ? null
            : Number(row.chest_cm),

        arms:
          row.arms_cm === null
            ? null
            : Number(row.arms_cm),

        thighs:
          row.thighs_cm === null
            ? null
            : Number(row.thighs_cm),

        notes: row.notes,

        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error(
      'Failed to create progress entry:',
      error,
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to create progress entry.',
    });
  }
}


// ============================================================
// UPDATE PROGRESS ENTRY
//
// PUT /api/progress/:id
// ============================================================

export async function updateProgressEntry(
  req,
  res,
) {
  const entryId = Number(
    req.params.id,
  );


  if (
    !Number.isInteger(entryId)
    || entryId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid progress entry ID.',
    });
  }


  const validationError =
    validateProgressPayload(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }


  try {
    const userId = req.user.id;

    const {
      date,
      weight,
      bodyFat,
      waist,
      chest,
      arms,
      thighs,
      notes,
    } = req.body;


    const result = await pool.query(
      `
        UPDATE public.progress_entries
        SET
          entry_date = $1,
          weight_kg = $2,
          body_fat_percent = $3,
          waist_cm = $4,
          chest_cm = $5,
          arms_cm = $6,
          thighs_cm = $7,
          notes = $8
        WHERE id = $9
          AND user_id = $10
        RETURNING
          id,
          entry_date,
          weight_kg,
          body_fat_percent,
          waist_cm,
          chest_cm,
          arms_cm,
          thighs_cm,
          notes,
          created_at,
          updated_at
      `,
      [
        date,
        normalizeOptionalNumber(weight),
        normalizeOptionalNumber(bodyFat),
        normalizeOptionalNumber(waist),
        normalizeOptionalNumber(chest),
        normalizeOptionalNumber(arms),
        normalizeOptionalNumber(thighs),
        normalizeOptionalText(notes),
        entryId,
        userId,
      ],
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          'Progress entry not found.',
      });
    }


    const row = result.rows[0];


    res.status(200).json({
      success: true,
      message:
        'Progress entry updated successfully.',

      entry: {
        id: row.id,

        date: row.entry_date,

        weight:
          row.weight_kg === null
            ? null
            : Number(row.weight_kg),

        bodyFat:
          row.body_fat_percent === null
            ? null
            : Number(row.body_fat_percent),

        waist:
          row.waist_cm === null
            ? null
            : Number(row.waist_cm),

        chest:
          row.chest_cm === null
            ? null
            : Number(row.chest_cm),

        arms:
          row.arms_cm === null
            ? null
            : Number(row.arms_cm),

        thighs:
          row.thighs_cm === null
            ? null
            : Number(row.thighs_cm),

        notes: row.notes,

        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error(
      'Failed to update progress entry:',
      error,
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to update progress entry.',
    });
  }
}


// ============================================================
// DELETE PROGRESS ENTRY
//
// DELETE /api/progress/:id
// ============================================================

export async function deleteProgressEntry(
  req,
  res,
) {
  try {
    const userId = req.user.id;

    const entryId = Number(
      req.params.id,
    );


    if (
      !Number.isInteger(entryId)
      || entryId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid progress entry ID.',
      });
    }


    const result = await pool.query(
      `
        DELETE FROM public.progress_entries
        WHERE id = $1
          AND user_id = $2
        RETURNING
          id,
          entry_date
      `,
      [
        entryId,
        userId,
      ],
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          'Progress entry not found.',
      });
    }


    res.status(200).json({
      success: true,
      message:
        'Progress entry deleted successfully.',
      entry: result.rows[0],
    });
  } catch (error) {
    console.error(
      'Failed to delete progress entry:',
      error,
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to delete progress entry.',
    });
  }
}
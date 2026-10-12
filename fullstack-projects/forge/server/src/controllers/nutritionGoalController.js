import pool from '../config/db.js';


// ============================================================
// HELPERS
// ============================================================

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


function validateGoals(body) {
  const calories = normalizeOptionalNumber(
    body.calories,
  );

  const protein = normalizeOptionalNumber(
    body.protein,
  );

  const carbs = normalizeOptionalNumber(
    body.carbs,
  );

  const fat = normalizeOptionalNumber(
    body.fat,
  );


  // ----------------------------------------------------------
  // CALORIES
  // Nullable because FORGE allows goals to be unconfigured.
  // ----------------------------------------------------------

  if (
    calories !== null
    && (
      !Number.isInteger(calories)
      || calories <= 0
    )
  ) {
    return 'Calories must be a positive whole number or blank.';
  }


  // ----------------------------------------------------------
  // MACROS
  // ----------------------------------------------------------

  const macros = {
    protein,
    carbs,
    fat,
  };

  for (
    const [name, value]
    of Object.entries(macros)
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


  return null;
}


// ============================================================
// GET NUTRITION GOALS
//
// GET /api/nutrition/goals
// ============================================================

export async function getNutritionGoals(
  req,
  res,
) {
  try {
    const userId = req.user.id;


    const result = await pool.query(
      `
        SELECT
          id,
          calories,
          protein_g,
          carbs_g,
          fat_g,
          created_at,
          updated_at
        FROM public.nutrition_goals
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    );


    // --------------------------------------------------------
    // NO GOALS CONFIGURED YET
    //
    // This is not an error.
    // FORGE explicitly allows blank goals.
    // --------------------------------------------------------

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,

        goals: {
          calories: null,
          protein: null,
          carbs: null,
          fat: null,
        },
      });
    }


    const row = result.rows[0];


    res.status(200).json({
      success: true,

      goals: {
        id: row.id,

        calories: row.calories,

        protein:
          row.protein_g === null
            ? null
            : Number(row.protein_g),

        carbs:
          row.carbs_g === null
            ? null
            : Number(row.carbs_g),

        fat:
          row.fat_g === null
            ? null
            : Number(row.fat_g),

        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error(
      'Failed to fetch nutrition goals:',
      error,
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch nutrition goals.',
    });
  }
}


// ============================================================
// SAVE NUTRITION GOALS
//
// PUT /api/nutrition/goals
//
// Uses UPSERT because each user can only have one
// nutrition_goals row.
// ============================================================

export async function saveNutritionGoals(
  req,
  res,
) {
  const validationError =
    validateGoals(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }


  try {
    const userId = req.user.id;


    const calories =
      normalizeOptionalNumber(
        req.body.calories,
      );

    const protein =
      normalizeOptionalNumber(
        req.body.protein,
      );

    const carbs =
      normalizeOptionalNumber(
        req.body.carbs,
      );

    const fat =
      normalizeOptionalNumber(
        req.body.fat,
      );


    // --------------------------------------------------------
    // UPSERT
    //
    // nutrition_goals.user_id is UNIQUE.
    //
    // If the row exists:
    //     update it.
    //
    // If it doesn't:
    //     create it.
    // --------------------------------------------------------

    const result = await pool.query(
      `
        INSERT INTO public.nutrition_goals (
          user_id,
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
          $5
        )

        ON CONFLICT (user_id)
        DO UPDATE SET
          calories = EXCLUDED.calories,
          protein_g = EXCLUDED.protein_g,
          carbs_g = EXCLUDED.carbs_g,
          fat_g = EXCLUDED.fat_g

        RETURNING
          id,
          calories,
          protein_g,
          carbs_g,
          fat_g,
          created_at,
          updated_at
      `,
      [
        userId,
        calories,
        protein,
        carbs,
        fat,
      ],
    );


    const row = result.rows[0];


    res.status(200).json({
      success: true,
      message:
        'Nutrition goals saved successfully.',

      goals: {
        id: row.id,

        calories: row.calories,

        protein:
          row.protein_g === null
            ? null
            : Number(row.protein_g),

        carbs:
          row.carbs_g === null
            ? null
            : Number(row.carbs_g),

        fat:
          row.fat_g === null
            ? null
            : Number(row.fat_g),

        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error(
      'Failed to save nutrition goals:',
      error,
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to save nutrition goals.',
    });
  }
}
import pool from '../config/db.js';


// ============================================================
// HELPERS
// ============================================================

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


function validateProfile(body) {
  const {
    name,
    trainingFocus,
    height,
    bio,
  } = body;


  // ----------------------------------------------------------
  // NAME
  // ----------------------------------------------------------

  if (
    name !== undefined
    && name !== null
    && typeof name !== 'string'
  ) {
    return 'Name must be text.';
  }


  if (
    typeof name === 'string'
    && name.trim().length > 100
  ) {
    return 'Name cannot exceed 100 characters.';
  }


  // ----------------------------------------------------------
  // TRAINING FOCUS
  // ----------------------------------------------------------

  if (
    trainingFocus !== undefined
    && trainingFocus !== null
    && typeof trainingFocus !== 'string'
  ) {
    return 'Training focus must be text.';
  }


  if (
    typeof trainingFocus === 'string'
    && trainingFocus.trim().length > 150
  ) {
    return 'Training focus cannot exceed 150 characters.';
  }


  // ----------------------------------------------------------
  // HEIGHT
  // ----------------------------------------------------------

  const heightValue =
    normalizeOptionalNumber(height);


  if (
    heightValue !== null
    && (
      !Number.isFinite(heightValue)
      || heightValue <= 0
    )
  ) {
    return 'Height must be a positive number or blank.';
  }


  // ----------------------------------------------------------
  // BIO
  // ----------------------------------------------------------

  if (
    bio !== undefined
    && bio !== null
    && typeof bio !== 'string'
  ) {
    return 'Bio must be text.';
  }


  return null;
}


// ============================================================
// GET PROFILE
//
// GET /api/profile
// ============================================================

export async function getProfile(
  req,
  res,
) {
  try {
    const userId = req.user.id;


    const result = await pool.query(
      `
        SELECT
          id,
          name,
          training_focus,
          height_cm,
          bio,
          created_at,
          updated_at
        FROM public.profiles
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    );


    // --------------------------------------------------------
    // NO PROFILE YET
    //
    // This is not an error.
    // --------------------------------------------------------

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,

        profile: {
          name: null,
          trainingFocus: null,
          height: null,
          bio: null,
        },
      });
    }


    const row = result.rows[0];


    res.status(200).json({
      success: true,

      profile: {
        id: row.id,

        name: row.name,

        trainingFocus:
          row.training_focus,

        height:
          row.height_cm === null
            ? null
            : Number(row.height_cm),

        bio: row.bio,

        createdAt:
          row.created_at,

        updatedAt:
          row.updated_at,
      },
    });
  } catch (error) {
    console.error(
      'Failed to fetch profile:',
      error,
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch profile.',
    });
  }
}


// ============================================================
// SAVE PROFILE
//
// PUT /api/profile
//
// Uses UPSERT because each user has at most one profile.
// ============================================================

export async function saveProfile(
  req,
  res,
) {
  const validationError =
    validateProfile(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }


  try {
    const userId = req.user.id;

    const {
      name,
      trainingFocus,
      height,
      bio,
    } = req.body;


    const result = await pool.query(
      `
        INSERT INTO public.profiles (
          user_id,
          name,
          training_focus,
          height_cm,
          bio
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
          name = EXCLUDED.name,
          training_focus =
            EXCLUDED.training_focus,
          height_cm =
            EXCLUDED.height_cm,
          bio = EXCLUDED.bio

        RETURNING
          id,
          name,
          training_focus,
          height_cm,
          bio,
          created_at,
          updated_at
      `,
      [
        userId,

        normalizeOptionalText(name),

        normalizeOptionalText(
          trainingFocus,
        ),

        normalizeOptionalNumber(
          height,
        ),

        normalizeOptionalText(bio),
      ],
    );


    const row = result.rows[0];


    res.status(200).json({
      success: true,
      message:
        'Profile saved successfully.',

      profile: {
        id: row.id,

        name: row.name,

        trainingFocus:
          row.training_focus,

        height:
          row.height_cm === null
            ? null
            : Number(row.height_cm),

        bio: row.bio,

        createdAt:
          row.created_at,

        updatedAt:
          row.updated_at,
      },
    });
  } catch (error) {
    console.error(
      'Failed to save profile:',
      error,
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to save profile.',
    });
  }
}
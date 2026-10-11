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


// ============================================================
// GET REST DAYS
//
// GET /api/rest-days
//
// Optional:
// GET /api/rest-days?date=2026-10-11
// ============================================================

export async function getRestDays(
  req,
  res,
) {
  try {
    const userId = req.user.id;

    const { date } = req.query;


    // --------------------------------------------------------
    // OPTIONAL DATE FILTER
    // --------------------------------------------------------

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
        rest_date,
        note,
        created_at,
        updated_at
      FROM public.rest_days
      WHERE user_id = $1
    `;

    const values = [userId];


    if (date) {
      query += `
        AND rest_date = $2
      `;

      values.push(date);
    }


    query += `
      ORDER BY rest_date DESC
    `;


    const result = await pool.query(
      query,
      values,
    );


    const restDays = result.rows.map(
      (row) => ({
        id: row.id,
        date: row.rest_date,
        note: row.note,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }),
    );


    res.status(200).json({
      success: true,
      count: restDays.length,
      restDays,
    });
  } catch (error) {
    console.error(
      'Failed to fetch rest days:',
      error,
    );

    res.status(500).json({
      success: false,
      message: 'Failed to fetch rest days.',
    });
  }
}


// ============================================================
// CREATE REST DAY
//
// POST /api/rest-days
//
// Body:
// {
//   "date": "2026-10-11",
//   "note": "Recovery day"
// }
// ============================================================

export async function createRestDay(
  req,
  res,
) {
  const { date, note } = req.body;


  // ----------------------------------------------------------
  // VALIDATE DATE
  // ----------------------------------------------------------

  if (!isValidDateString(date)) {
    return res.status(400).json({
      success: false,
      message: 'A valid rest date is required.',
    });
  }


  if (
    note !== undefined
    && note !== null
    && typeof note !== 'string'
  ) {
    return res.status(400).json({
      success: false,
      message: 'Rest day note must be text.',
    });
  }


  const userId = req.user.id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');


    // --------------------------------------------------------
    // DON'T ALLOW FUTURE REST DAYS
    //
    // Uses PostgreSQL CURRENT_DATE so we avoid JS timezone
    // issues when comparing DATE values.
    // --------------------------------------------------------

    const futureCheck = await client.query(
      `
        SELECT $1::date > CURRENT_DATE AS is_future
      `,
      [date],
    );


    if (futureCheck.rows[0].is_future) {
      const error = new Error(
        'A future date cannot be marked as a rest day.',
      );

      error.statusCode = 400;

      throw error;
    }


    // --------------------------------------------------------
    // DON'T ALLOW REST DAY ON A WORKOUT DAY
    // --------------------------------------------------------

    const workoutResult =
      await client.query(
        `
          SELECT id
          FROM public.workouts
          WHERE user_id = $1
            AND workout_date = $2
          LIMIT 1
        `,
        [
          userId,
          date,
        ],
      );


    if (workoutResult.rows.length > 0) {
      const error = new Error(
        'This date already contains a workout and cannot be marked as a rest day.',
      );

      error.statusCode = 409;

      throw error;
    }


    // --------------------------------------------------------
    // CREATE REST DAY
    // --------------------------------------------------------

    const result = await client.query(
      `
        INSERT INTO public.rest_days (
          user_id,
          rest_date,
          note
        )
        VALUES (
          $1,
          $2,
          $3
        )
        RETURNING
          id,
          rest_date,
          note,
          created_at,
          updated_at
      `,
      [
        userId,
        date,
        normalizeOptionalText(note),
      ],
    );


    await client.query('COMMIT');


    const row = result.rows[0];


    res.status(201).json({
      success: true,
      message:
        'Rest day created successfully.',

      restDay: {
        id: row.id,
        date: row.rest_date,
        note: row.note,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');


    // --------------------------------------------------------
    // UNIQUE (user_id, rest_date)
    // --------------------------------------------------------

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message:
          'This date is already marked as a rest day.',
      });
    }


    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({
          success: false,
          message: error.message,
        });
    }


    console.error(
      'Failed to create rest day:',
      error,
    );

    res.status(500).json({
      success: false,
      message: 'Failed to create rest day.',
    });
  } finally {
    client.release();
  }
}


// ============================================================
// DELETE REST DAY BY DATE
//
// DELETE /api/rest-days/:date
//
// Example:
// DELETE /api/rest-days/2026-10-11
// ============================================================

export async function deleteRestDay(
  req,
  res,
) {
  try {
    const userId = req.user.id;

    const { date } = req.params;


    // --------------------------------------------------------
    // VALIDATE DATE
    // --------------------------------------------------------

    if (!isValidDateString(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rest day date.',
      });
    }


    // --------------------------------------------------------
    // DELETE
    // --------------------------------------------------------

    const result = await pool.query(
      `
        DELETE FROM public.rest_days
        WHERE user_id = $1
          AND rest_date = $2
        RETURNING
          id,
          rest_date,
          note
      `,
      [
        userId,
        date,
      ],
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rest day not found.',
      });
    }


    const row = result.rows[0];


    res.status(200).json({
      success: true,
      message:
        'Rest day removed successfully.',

      restDay: {
        id: row.id,
        date: row.rest_date,
        note: row.note,
      },
    });
  } catch (error) {
    console.error(
      'Failed to delete rest day:',
      error,
    );

    res.status(500).json({
      success: false,
      message: 'Failed to delete rest day.',
    });
  }
}
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


function toNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}


// ============================================================
// DAILY SCORE
//
// Training / rest:
//     40 points
//
// Nutrition:
//     60 points
//
// If nutrition goals exist:
//     configured goals share the 60 points equally.
//
// Protein:
//     minimum target
//
// Calories / carbs / fat:
//     closeness to target
//
// If no goals exist:
//     each logged meal = 15 points
// ============================================================

function calculateDailyScore({
  hasWorkout,
  hasRestDay,
  nutritionTotals,
  goals,
  mealCount,
}) {
  const trainingScore =
    hasWorkout || hasRestDay
      ? 40
      : 0;


  const configuredGoals = [];

  if (goals.calories !== null) {
    configuredGoals.push('calories');
  }

  if (goals.protein !== null) {
    configuredGoals.push('protein');
  }

  if (goals.carbs !== null) {
    configuredGoals.push('carbs');
  }

  if (goals.fat !== null) {
    configuredGoals.push('fat');
  }


  let nutritionScore = 0;


  // ----------------------------------------------------------
  // NO GOALS CONFIGURED
  // ----------------------------------------------------------

  if (configuredGoals.length === 0) {
    nutritionScore = Math.min(
      60,
      mealCount * 15,
    );
  } else {
    const pointsPerGoal =
      60 / configuredGoals.length;


    for (const goalName of configuredGoals) {
      const target = goals[goalName];

      const actual =
        nutritionTotals[goalName];


      // ------------------------------------------------------
      // PROTEIN = MINIMUM TARGET
      // ------------------------------------------------------

      if (goalName === 'protein') {
        const ratio = Math.min(
          1,
          actual / target,
        );

        nutritionScore +=
          pointsPerGoal * ratio;

        continue;
      }


      // ------------------------------------------------------
      // CALORIES / CARBS / FAT = CLOSENESS
      // ------------------------------------------------------

      const difference =
        Math.abs(actual - target);

      const ratio = Math.max(
        0,
        1 - difference / target,
      );

      nutritionScore +=
        pointsPerGoal * ratio;
    }
  }


  nutritionScore =
    Math.round(nutritionScore);

  const total =
    trainingScore + nutritionScore;


  return {
    total,
    training: trainingScore,
    nutrition: nutritionScore,
  };
}


// ============================================================
// GET DASHBOARD
//
// GET /api/dashboard
//
// Optional:
// GET /api/dashboard?date=2026-10-11
// ============================================================

export async function getDashboard(
  req,
  res,
) {
  try {
    const userId = req.user.id;

    let { date } = req.query;


    // --------------------------------------------------------
    // DEFAULT TO POSTGRES CURRENT_DATE
    // --------------------------------------------------------

    if (date === undefined) {
      const dateResult = await pool.query(
        `
          SELECT
            CURRENT_DATE::text AS date
        `,
      );

      date = dateResult.rows[0].date;
    }


    if (!isValidDateString(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dashboard date.',
      });
    }


    // ========================================================
    // PROFILE
    // ========================================================

    const profileResult = await pool.query(
      `
        SELECT
          name,
          training_focus,
          height_cm,
          bio
        FROM public.profiles
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    );


    const profileRow =
      profileResult.rows[0] || null;


    const profile = profileRow
      ? {
          name: profileRow.name,

          trainingFocus:
            profileRow.training_focus,

          height:
            profileRow.height_cm === null
              ? null
              : Number(profileRow.height_cm),

          bio: profileRow.bio,
        }
      : {
          name: null,
          trainingFocus: null,
          height: null,
          bio: null,
        };


    // ========================================================
    // NUTRITION GOALS
    // ========================================================

    const goalsResult = await pool.query(
      `
        SELECT
          calories,
          protein_g,
          carbs_g,
          fat_g
        FROM public.nutrition_goals
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    );


    const goalsRow =
      goalsResult.rows[0] || null;


    const goals = {
      calories:
        goalsRow?.calories ?? null,

      protein:
        goalsRow?.protein_g === null
        || goalsRow?.protein_g === undefined
          ? null
          : Number(goalsRow.protein_g),

      carbs:
        goalsRow?.carbs_g === null
        || goalsRow?.carbs_g === undefined
          ? null
          : Number(goalsRow.carbs_g),

      fat:
        goalsRow?.fat_g === null
        || goalsRow?.fat_g === undefined
          ? null
          : Number(goalsRow.fat_g),
    };


    // ========================================================
    // NUTRITION TOTALS FOR SELECTED DATE
    // ========================================================

    const nutritionResult =
      await pool.query(
        `
          SELECT
            COALESCE(
              SUM(calories),
              0
            ) AS calories,

            COALESCE(
              SUM(protein_g),
              0
            ) AS protein,

            COALESCE(
              SUM(carbs_g),
              0
            ) AS carbs,

            COALESCE(
              SUM(fat_g),
              0
            ) AS fat,

            COUNT(
              DISTINCT meal
            ) AS meal_count
          FROM public.nutrition_entries
          WHERE user_id = $1
            AND entry_date = $2
        `,
        [
          userId,
          date,
        ],
      );


    const nutritionRow =
      nutritionResult.rows[0];


    const nutritionTotals = {
      calories:
        toNumber(nutritionRow.calories),

      protein:
        toNumber(nutritionRow.protein),

      carbs:
        toNumber(nutritionRow.carbs),

      fat:
        toNumber(nutritionRow.fat),
    };


    const mealCount = Number(
      nutritionRow.meal_count,
    );


    // ========================================================
    // WORKOUT STATUS FOR SELECTED DATE
    // ========================================================

    const dayWorkoutResult =
      await pool.query(
        `
          SELECT
            id,
            name,
            workout_date
          FROM public.workouts
          WHERE user_id = $1
            AND workout_date = $2
          ORDER BY created_at DESC
        `,
        [
          userId,
          date,
        ],
      );


    const dayWorkouts =
      dayWorkoutResult.rows;


    const hasWorkout =
      dayWorkouts.length > 0;


    // ========================================================
    // REST DAY STATUS
    // ========================================================

    const restDayResult =
      await pool.query(
        `
          SELECT
            id,
            rest_date,
            note
          FROM public.rest_days
          WHERE user_id = $1
            AND rest_date = $2
          LIMIT 1
        `,
        [
          userId,
          date,
        ],
      );


    const restDay =
      restDayResult.rows[0] || null;


    const hasRestDay =
      restDay !== null;


    // ========================================================
    // DAILY SCORE
    // ========================================================

    const score =
      calculateDailyScore({
        hasWorkout,
        hasRestDay,
        nutritionTotals,
        goals,
        mealCount,
      });


    // ========================================================
    // LATEST WORKOUT
    // ========================================================

    const latestWorkoutResult =
      await pool.query(
        `
          SELECT
            id,
            name,
            workout_date,
            youtube_url,
            notes,
            created_at
          FROM public.workouts
          WHERE user_id = $1
          ORDER BY
            workout_date DESC,
            created_at DESC
          LIMIT 1
        `,
        [userId],
      );


    let latestWorkout = null;


    if (
      latestWorkoutResult.rows.length > 0
    ) {
      const workout =
        latestWorkoutResult.rows[0];


      // ------------------------------------------------------
      // EXERCISE / SET SUMMARY
      // ------------------------------------------------------

      const summaryResult =
        await pool.query(
          `
            SELECT
              COUNT(
                DISTINCT we.id
              ) AS exercise_count,

              COUNT(
                ws.id
              ) FILTER (
                WHERE
                  we.tracking_mode = 'reps'
              ) AS rep_set_count,

              COUNT(
                ws.id
              ) FILTER (
                WHERE
                  we.tracking_mode = 'time'
              ) AS interval_count,

              COALESCE(
                SUM(
                  ws.weight_kg
                  * ws.reps
                )
                FILTER (
                  WHERE
                    we.tracking_mode = 'reps'
                    AND ws.reps IS NOT NULL
                ),
                0
              ) AS rep_volume,

              COALESCE(
                SUM(
                  ws.duration_seconds
                )
                FILTER (
                  WHERE
                    we.tracking_mode = 'time'
                    AND ws.duration_seconds
                      IS NOT NULL
                ),
                0
              ) AS time_under_tension
            FROM public.workout_exercises we

            LEFT JOIN public.workout_sets ws
              ON ws.workout_exercise_id =
                we.id

            WHERE we.workout_id = $1
          `,
          [workout.id],
        );


      const summary =
        summaryResult.rows[0];


      latestWorkout = {
        id: workout.id,
        name: workout.name,
        date: workout.workout_date,

        youtubeUrl:
          workout.youtube_url,

        notes: workout.notes,

        exerciseCount: Number(
          summary.exercise_count,
        ),

        repSetCount: Number(
          summary.rep_set_count,
        ),

        intervalCount: Number(
          summary.interval_count,
        ),

        repVolume: Number(
          summary.rep_volume,
        ),

        timeUnderTensionSeconds:
          Number(
            summary.time_under_tension,
          ),
      };
    }


    // ========================================================
    // RECENT ACTIVITY
    //
    // Workouts + intentional rest days.
    // ========================================================

    const recentActivityResult =
      await pool.query(
        `
          SELECT
            activity_date,
            activity_type,
            title,
            activity_id
          FROM (
            SELECT
              workout_date
                AS activity_date,

              'workout'
                AS activity_type,

              name
                AS title,

              id
                AS activity_id,

              created_at
            FROM public.workouts
            WHERE user_id = $1


            UNION ALL


            SELECT
              rest_date
                AS activity_date,

              'rest'
                AS activity_type,

              COALESCE(
                note,
                'Rest Day'
              ) AS title,

              id
                AS activity_id,

              created_at
            FROM public.rest_days
            WHERE user_id = $1
          ) AS activity

          ORDER BY
            activity_date DESC,
            created_at DESC

          LIMIT 8
        `,
        [userId],
      );


    const recentActivity =
      recentActivityResult.rows.map(
        (row) => ({
          id: row.activity_id,
          type: row.activity_type,
          date: row.activity_date,
          title: row.title,
        }),
      );


    // ========================================================
    // RESPONSE
    // ========================================================

    res.status(200).json({
      success: true,

      dashboard: {
        date,

        profile,

        score,

        training: {
          hasWorkout,
          hasRestDay,

          workouts: dayWorkouts,

          restDay:
            restDay === null
              ? null
              : {
                  id: restDay.id,
                  date:
                    restDay.rest_date,
                  note: restDay.note,
                },
        },

        nutrition: {
          totals: nutritionTotals,
          goals,
          mealCount,
        },

        latestWorkout,

        recentActivity,
      },
    });
  } catch (error) {
    console.error(
      'Failed to fetch dashboard:',
      error,
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch dashboard.',
    });
  }
}
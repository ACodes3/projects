import db from "../config/sqlite.js";

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
  const trainingScore = hasWorkout || hasRestDay ? 40 : 0;

  const configuredGoals = [];

  if (goals.calories !== null) {
    configuredGoals.push("calories");
  }

  if (goals.protein !== null) {
    configuredGoals.push("protein");
  }

  if (goals.carbs !== null) {
    configuredGoals.push("carbs");
  }

  if (goals.fat !== null) {
    configuredGoals.push("fat");
  }

  let nutritionScore = 0;

  // ----------------------------------------------------------
  // NO GOALS CONFIGURED
  // ----------------------------------------------------------

  if (configuredGoals.length === 0) {
    nutritionScore = Math.min(60, mealCount * 15);
  } else {
    const pointsPerGoal = 60 / configuredGoals.length;

    for (const goalName of configuredGoals) {
      const target = goals[goalName];

      const actual = nutritionTotals[goalName];

      // ------------------------------------------------------
      // PROTEIN = MINIMUM TARGET
      // ------------------------------------------------------

      if (goalName === "protein") {
        const ratio = Math.min(1, actual / target);

        nutritionScore += pointsPerGoal * ratio;

        continue;
      }

      // ------------------------------------------------------
      // CALORIES / CARBS / FAT = CLOSENESS
      // ------------------------------------------------------

      const difference = Math.abs(actual - target);

      const ratio = Math.max(0, 1 - difference / target);

      nutritionScore += pointsPerGoal * ratio;
    }
  }

  nutritionScore = Math.round(nutritionScore);

  const total = trainingScore + nutritionScore;

  return {
    total,
    training: trainingScore,
    nutrition: nutritionScore,
  };
}

export function getDashboard(req, res) {
  try {
    const userId = req.user.id;
    let { date } = req.query;
    if (date === undefined) {
      const now = new Date();
      date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    }
    if (!isValidDateString(date))
      return res
        .status(400)
        .json({ success: false, message: "Invalid dashboard date." });
    const profileRow = db
      .prepare(
        "SELECT name,training_focus,height_cm,bio FROM profiles WHERE user_id=?",
      )
      .get(userId);
    const profile = profileRow
      ? {
          name: profileRow.name,
          trainingFocus: profileRow.training_focus,
          height: profileRow.height_cm,
          bio: profileRow.bio,
        }
      : { name: null, trainingFocus: null, height: null, bio: null };
    const goalsRow = db
      .prepare(
        "SELECT calories,protein_g,carbs_g,fat_g FROM nutrition_goals WHERE user_id=?",
      )
      .get(userId);
    const goals = {
      calories: goalsRow?.calories ?? null,
      protein: goalsRow?.protein_g ?? null,
      carbs: goalsRow?.carbs_g ?? null,
      fat: goalsRow?.fat_g ?? null,
    };
    const total = db
      .prepare(
        `SELECT COALESCE(SUM(calories),0) AS calories,COALESCE(SUM(protein_g),0) AS protein,
 COALESCE(SUM(carbs_g),0) AS carbs,COALESCE(SUM(fat_g),0) AS fat,COUNT(DISTINCT meal) AS meal_count
 FROM nutrition_entries WHERE user_id=? AND entry_date=?`,
      )
      .get(userId, date);
    const nutritionTotals = {
      calories: toNumber(total.calories),
      protein: toNumber(total.protein),
      carbs: toNumber(total.carbs),
      fat: toNumber(total.fat),
    };
    const mealCount = Number(total.meal_count);
    const dayWorkouts = db
      .prepare(
        "SELECT id,name,workout_date FROM workouts WHERE user_id=? AND workout_date=? ORDER BY created_at DESC",
      )
      .all(userId, date);
    const restDay =
      db
        .prepare(
          "SELECT id,rest_date,note FROM rest_days WHERE user_id=? AND rest_date=?",
        )
        .get(userId, date) ?? null;
    const hasWorkout = dayWorkouts.length > 0,
      hasRestDay = restDay !== null;
    const score = calculateDailyScore({
      hasWorkout,
      hasRestDay,
      nutritionTotals,
      goals,
      mealCount,
    });
    const latest = db
      .prepare(
        "SELECT id,name,workout_date,youtube_url,notes,created_at FROM workouts WHERE user_id=? ORDER BY workout_date DESC,created_at DESC LIMIT 1",
      )
      .get(userId);
    let latestWorkout = null;
    if (latest) {
      const summary = db
        .prepare(
          `SELECT COUNT(DISTINCT we.id) AS exercise_count,
   COUNT(CASE WHEN we.tracking_mode='reps' THEN ws.id END) AS rep_set_count,
   COUNT(CASE WHEN we.tracking_mode='time' THEN ws.id END) AS interval_count,
   COALESCE(SUM(CASE WHEN we.tracking_mode='reps' AND ws.reps IS NOT NULL THEN ws.weight_kg*ws.reps END),0) AS rep_volume,
   COALESCE(SUM(CASE WHEN we.tracking_mode='time' THEN ws.duration_seconds END),0) AS time_under_tension
   FROM workout_exercises we LEFT JOIN workout_sets ws ON ws.workout_exercise_id=we.id WHERE we.workout_id=?`,
        )
        .get(latest.id);
      latestWorkout = {
        id: latest.id,
        name: latest.name,
        date: latest.workout_date,
        youtubeUrl: latest.youtube_url,
        notes: latest.notes,
        exerciseCount: Number(summary.exercise_count),
        repSetCount: Number(summary.rep_set_count),
        intervalCount: Number(summary.interval_count),
        repVolume: Number(summary.rep_volume),
        timeUnderTensionSeconds: Number(summary.time_under_tension),
      };
    }
    const recentActivity = db
      .prepare(
        `SELECT activity_date,activity_type,title,activity_id FROM (
  SELECT workout_date AS activity_date,'workout' AS activity_type,name AS title,id AS activity_id,created_at FROM workouts WHERE user_id=?
  UNION ALL
  SELECT rest_date AS activity_date,'rest' AS activity_type,COALESCE(note,'Rest Day') AS title,id AS activity_id,created_at FROM rest_days WHERE user_id=?
 ) AS activity ORDER BY activity_date DESC,created_at DESC LIMIT 8`,
      )
      .all(userId, userId)
      .map((row) => ({
        id: row.activity_id,
        type: row.activity_type,
        date: row.activity_date,
        title: row.title,
      }));
    return res.json({
      success: true,
      dashboard: {
        date,
        profile,
        score,
        training: {
          hasWorkout,
          hasRestDay,
          workouts: dayWorkouts,
          restDay: restDay
            ? { id: restDay.id, date: restDay.rest_date, note: restDay.note }
            : null,
        },
        nutrition: { totals: nutritionTotals, goals, mealCount },
        latestWorkout,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Failed to fetch dashboard:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard." });
  }
}

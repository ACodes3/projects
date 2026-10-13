
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Cookie,
  Dumbbell,
  Moon,
  Plus,
  RefreshCw,
  Scale,
  Target,
  Utensils,
  X,
} from "lucide-react";

import {
  createRestDay,
  deleteRestDay,
  getNutritionEntries,
  getNutritionGoals,
  getProgressEntries,
  getRestDays,
  getWorkouts,
} from "../api/forgeApi.js";

import "./CalendarPage.css";

/* =========================================
   CONSTANTS
========================================= */

const MEALS = [
  "Breakfast",
  "Lunch",
  "Snacks",
  "Dinner",
];

const WEEKDAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

const GOALS = {
  calories: { label: "Calories", unit: "kcal" },
  protein: { label: "Protein", unit: "g" },
  carbs: { label: "Carbs", unit: "g" },
  fat: { label: "Fat", unit: "g" },
};

/* =========================================
   DATE HELPERS
========================================= */

function dateKey(year, month, day) {
  return [
    year,
    String(month + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function todayKey() {
  const today = new Date();

  return dateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
}

function normalizeDate(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toISOString().slice(0, 10);
}

function formatMonth(year, month) {
  return new Date(year, month, 1).toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );
}

function formatFullDate(value) {
  if (!value) return "";

  return new Date(
    `${value}T12:00:00`
  ).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isFutureDate(value) {
  return value > todayKey();
}

/* =========================================
   API HELPERS
========================================= */

function extractEntries(response, property) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.[property])) {
    return response[property];
  }

  if (Array.isArray(response?.entries)) {
    return response.entries;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

function normalizeNutrition(entry) {
  return {
    id: entry.id,
    date: normalizeDate(
      entry.entry_date ?? entry.date
    ),
    meal: entry.meal ?? "Breakfast",
    name: entry.name ?? "",
    calories: Number(entry.calories ?? 0),
    protein: Number(
      entry.protein_g ?? entry.protein ?? 0
    ),
    carbs: Number(entry.carbs_g ?? entry.carbs ?? 0),
    fat: Number(entry.fat_g ?? entry.fat ?? 0),
  };
}

function normalizeProgress(entry) {
  const optionalNumber = (...values) => {
    const value = values.find(
      (item) =>
        item !== null &&
        item !== undefined &&
        item !== ""
    );

    if (value === undefined) return null;

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
  };

  return {
    id: entry.id,
    date: normalizeDate(
      entry.entry_date ?? entry.date
    ),
    weight: optionalNumber(
      entry.weight_kg,
      entry.weight
    ),
    bodyFat: optionalNumber(
      entry.body_fat_percent,
      entry.bodyFat
    ),
    waist: optionalNumber(
      entry.waist_cm,
      entry.waist
    ),
    chest: optionalNumber(
      entry.chest_cm,
      entry.chest
    ),
    arms: optionalNumber(
      entry.arms_cm,
      entry.arms
    ),
    thighs: optionalNumber(
      entry.thighs_cm,
      entry.thighs
    ),
    notes: entry.notes ?? "",
  };
}

function normalizeGoals(response) {
  const raw =
    response?.goals ??
    response?.nutritionGoals ??
    response?.data?.goals ??
    response ??
    {};

  return {
    calories: Number(raw.calories ?? 0),
    protein: Number(
      raw.protein_g ?? raw.protein ?? 0
    ),
    carbs: Number(
      raw.carbs_g ?? raw.carbs ?? 0
    ),
    fat: Number(
      raw.fat_g ?? raw.fat ?? 0
    ),
  };
}

function normalizeRestDays(response) {
  const entries = Array.isArray(response)
    ? response
    : Array.isArray(response?.restDays)
      ? response.restDays
      : Array.isArray(response?.rest_days)
        ? response.rest_days
        : Array.isArray(response?.data)
          ? response.data
          : [];

  return entries
    .map((item) =>
      typeof item === "string"
        ? normalizeDate(item)
        : normalizeDate(
            item.rest_date ?? item.date
          )
    )
    .filter(Boolean);
}

function groupByDate(entries) {
  return entries.reduce((grouped, entry) => {
    if (!entry.date) return grouped;

    if (!grouped[entry.date]) {
      grouped[entry.date] = [];
    }

    grouped[entry.date].push(entry);

    return grouped;
  }, {});
}

/* =========================================
   NUTRITION HELPERS
========================================= */

function getTotals(entries = []) {
  return entries.reduce(
    (total, entry) => ({
      calories:
        total.calories + Number(entry.calories || 0),
      protein:
        total.protein + Number(entry.protein || 0),
      carbs:
        total.carbs + Number(entry.carbs || 0),
      fat:
        total.fat + Number(entry.fat || 0),
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }
  );
}

function configuredGoals(goals) {
  return Object.entries(GOALS)
    .map(([key, definition]) => ({
      key,
      ...definition,
      target: Number(goals[key]) || 0,
    }))
    .filter((goal) => goal.target > 0);
}

function targetRatio(key, actual, target) {
  if (!target) return 0;

  const value = Math.max(0, Number(actual) || 0);

  if (key === "protein") {
    return Math.min(1, value / target);
  }

  const deviation =
    Math.abs(value - target) / target;

  return Math.max(0, 1 - deviation);
}

function calculateDayScore(
  workouts,
  nutrition,
  restDay,
  goals
) {
  const trainingScore =
    workouts.length > 0 || restDay ? 40 : 0;

  const totals = getTotals(nutrition);
  const targets = configuredGoals(goals);

  const loggedMeals = MEALS.filter((meal) =>
    nutrition.some((entry) => entry.meal === meal)
  );

  if (targets.length === 0) {
    const nutritionScore = loggedMeals.length * 15;

    return {
      total: trainingScore + nutritionScore,
      trainingScore,
      nutritionScore,
      nutritionMode: "logging",
      totals,
      loggedMeals,
      goalScores: [],
    };
  }

  const pointsPerGoal = 60 / targets.length;

  const goalScores = targets.map((goal) => {
    const actual = totals[goal.key];

    const ratio = targetRatio(
      goal.key,
      actual,
      goal.target
    );

    return {
      ...goal,
      actual,
      ratio,
      percentage: Math.round(
        (actual / goal.target) * 100
      ),
      points: ratio * pointsPerGoal,
    };
  });

  const nutritionScore = Math.round(
    goalScores.reduce(
      (total, goal) => total + goal.points,
      0
    )
  );

  return {
    total: trainingScore + nutritionScore,
    trainingScore,
    nutritionScore,
    nutritionMode: "targets",
    totals,
    loggedMeals,
    goalScores,
  };
}

function scoreLevel(score, future) {
  if (future) return "future";
  if (score >= 80) return "good";
  if (score >= 50) return "moderate";

  return "poor";
}

function scoreLabel(score, future) {
  if (future) return "Upcoming";
  if (score >= 80) return "Good day";
  if (score >= 50) return "Moderate";
  if (score > 0) return "Needs work";

  return "No progress";
}

function mealIcon(meal) {
  if (meal === "Breakfast") return Coffee;
  if (meal === "Snacks") return Cookie;

  return Utensils;
}

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(1);
}

/* =========================================
   CALENDAR PAGE
========================================= */

export default function CalendarPage() {
  const [workouts, setWorkouts] = useState([]);
  const [nutrition, setNutrition] = useState({});
  const [progress, setProgress] = useState({});
  const [goals, setGoals] = useState({});
  const [restDays, setRestDays] = useState([]);

  const [loading, setLoading] = useState(true);
  const [restSaving, setRestSaving] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [currentMonth, setCurrentMonth] = useState(
    () => {
      const today = new Date();

      return {
        year: today.getFullYear(),
        month: today.getMonth(),
      };
    }
  );

  const [selectedDate, setSelectedDate] = useState(
    todayKey
  );

  /* =========================================
     LOAD ALL CALENDAR DATA
  ========================================= */

  const loadCalendarData = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError("");

        const [
          workoutsResponse,
          nutritionResponse,
          goalsResponse,
          restDaysResponse,
          progressResponse,
        ] = await Promise.all([
          getWorkouts(),
          getNutritionEntries(),
          getNutritionGoals(),
          getRestDays(),
          getProgressEntries(),
        ]);

        setWorkouts(
          extractEntries(
            workoutsResponse,
            "workouts"
          )
        );

        const nutritionEntries = extractEntries(
          nutritionResponse,
          "nutritionEntries"
        ).map(normalizeNutrition);

        setNutrition(groupByDate(nutritionEntries));

        setGoals(normalizeGoals(goalsResponse));

        setRestDays(
          normalizeRestDays(restDaysResponse)
        );

        const progressEntries = extractEntries(
          progressResponse,
          "progressEntries"
        ).map(normalizeProgress);

        setProgress(groupByDate(progressEntries));
      } catch (loadError) {
        console.error(
          "Failed to load calendar:",
          loadError
        );

        setError(
          loadError.message ||
            "Failed to load calendar data."
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const initialLoadTimeout = setTimeout(() => {
      loadCalendarData();
    }, 0);

    // Refresh when returning from an edit page.
    function handleFocus() {
      loadCalendarData(false);
    }

    function handleVisibility() {
      if (
        document.visibilityState === "visible"
      ) {
        loadCalendarData(false);
      }
    }

    window.addEventListener("focus", handleFocus);

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      clearTimeout(initialLoadTimeout);

      window.removeEventListener(
        "focus",
        handleFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [loadCalendarData]);

  /* =========================================
     TOAST AUTO DISMISS
  ========================================= */

  useEffect(() => {
    if (!toast) return undefined;

    const timeout = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timeout);
  }, [toast]);

  function showToast(type, title, message) {
    setToast({ type, title, message });
  }

  /* =========================================
     WORKOUTS BY DATE
  ========================================= */

  const workoutsByDate = useMemo(() => {
    const grouped = {};

    for (const workout of workouts) {
      const date = normalizeDate(
        workout.date ?? workout.workout_date
      );

      if (!date) continue;

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(workout);
    }

    return grouped;
  }, [workouts]);

  /* =========================================
     CALENDAR DAYS
  ========================================= */

  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth;

    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    const firstDay = new Date(
      year,
      month,
      1
    ).getDay();

    const mondayOffset = (firstDay + 6) % 7;

    const cells = [];

    for (
      let index = 0;
      index < mondayOffset;
      index += 1
    ) {
      cells.push(null);
    }

    for (
      let day = 1;
      day <= daysInMonth;
      day += 1
    ) {
      const date = dateKey(year, month, day);

      const dayWorkouts =
        workoutsByDate[date] || [];

      const dayNutrition =
        nutrition[date] || [];

      const dayProgress =
        progress[date] || [];

      const restDay =
        restDays.includes(date) &&
        dayWorkouts.length === 0;

      const score = calculateDayScore(
        dayWorkouts,
        dayNutrition,
        restDay,
        goals
      );

      cells.push({
        day,
        date,
        workouts: dayWorkouts,
        nutrition: dayNutrition,
        progress: dayProgress,
        restDay,
        future: isFutureDate(date),
        score,
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [
    currentMonth,
    workoutsByDate,
    nutrition,
    progress,
    restDays,
    goals,
  ]);

  /* =========================================
     SELECTED DAY DATA
  ========================================= */

  const selectedWorkouts =
    workoutsByDate[selectedDate] || [];

  const selectedNutrition =
    nutrition[selectedDate] || [];

  const selectedProgress =
    progress[selectedDate] || [];

  const selectedIsRestDay =
    restDays.includes(selectedDate) &&
    selectedWorkouts.length === 0;

  const selectedIsFuture =
    isFutureDate(selectedDate);

  const selectedScore = calculateDayScore(
    selectedWorkouts,
    selectedNutrition,
    selectedIsRestDay,
    goals
  );

  const selectedLevel = scoreLevel(
    selectedScore.total,
    selectedIsFuture
  );

  const selectedTotals = selectedScore.totals;

  const goalsConfigured =
    configuredGoals(goals).length > 0;

  /* =========================================
     REST DAY CREATE / DELETE
  ========================================= */

  async function toggleRestDay() {
    if (
      selectedIsFuture ||
      selectedWorkouts.length > 0 ||
      restSaving
    ) {
      return;
    }

    const wasRestDay =
      restDays.includes(selectedDate);

    try {
      setRestSaving(true);
      setError("");

      if (wasRestDay) {
        await deleteRestDay(selectedDate);
      } else {
        await createRestDay({
          date: selectedDate,
          note: "",
        });
      }

      // Update the calendar immediately after
      // the API confirms the change.
      setRestDays((current) =>
        wasRestDay
          ? current.filter(
              (date) => date !== selectedDate
            )
          : [...current, selectedDate]
      );

      showToast(
        "success",
        wasRestDay
          ? "Rest day removed"
          : "Rest day saved",
        wasRestDay
          ? "This day is no longer marked as recovery."
          : "Your recovery day was recorded."
      );
    } catch (restError) {
      console.error(
        "Failed to update rest day:",
        restError
      );

      setError(
        restError.message ||
          "Failed to update rest day."
      );

      showToast(
        "error",
        "Unable to update rest day",
        restError.message ||
          "Please try again."
      );
    } finally {
      setRestSaving(false);
    }
  }

  /* =========================================
     MONTH NAVIGATION
  ========================================= */

  function changeMonth(direction) {
    const nextDate = new Date(
      currentMonth.year,
      currentMonth.month + direction,
      1
    );

    const next = {
      year: nextDate.getFullYear(),
      month: nextDate.getMonth(),
    };

    setCurrentMonth(next);

    setSelectedDate(
      dateKey(next.year, next.month, 1)
    );
  }

  function goToToday() {
    const now = new Date();

    setCurrentMonth({
      year: now.getFullYear(),
      month: now.getMonth(),
    });

    setSelectedDate(todayKey());
  }

  /* =========================================
     RENDER
  ========================================= */

  return (
    <main className="calendar-page">

      {/* =====================================
          TOAST
      ===================================== */}

      {toast && (
        <div
          className={`calendar-page__toast calendar-page__toast--${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <div className="calendar-page__toast-icon">
            <CheckCircle2 size={18} />
          </div>

          <div className="calendar-page__toast-copy">
            <strong>{toast.title}</strong>
            <span>{toast.message}</span>
          </div>

          <button
            type="button"
            className="calendar-page__toast-close"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="page__header">
        <div className="page__header-text">
          <span className="page__eyebrow">
            Daily Progress
          </span>

          <h1 className="page__title">
            Calendar
          </h1>

          <p className="page__description">
            See training, recovery, nutrition, and
            body measurements together across each day.
          </p>
        </div>

        <div className="calendar-page__header-actions">
          <button
            type="button"
            className="button"
            onClick={() =>
              loadCalendarData()
            }
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            type="button"
            className="button"
            onClick={goToToday}
          >
            <CalendarDays size={16} />
            Today
          </button>
        </div>
      </header>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div
          className="calendar-page__goal-notice"
          role="alert"
        >
          <Target size={14} />
          {error}
        </div>
      )}

      {/* =====================================
          LEGEND
      ===================================== */}

      <section className="calendar-page__legend">
        <div>
          <span className="calendar-page__legend-dot calendar-page__legend-dot--good" />
          <strong>80–100%</strong>
          <span>Good</span>
        </div>

        <div>
          <span className="calendar-page__legend-dot calendar-page__legend-dot--moderate" />
          <strong>50–79%</strong>
          <span>Moderate</span>
        </div>

        <div>
          <span className="calendar-page__legend-dot calendar-page__legend-dot--poor" />
          <strong>0–49%</strong>
          <span>Needs work</span>
        </div>

        <div>
          <span className="calendar-page__legend-dot calendar-page__legend-dot--rest" />
          <strong>Rest</strong>
          <span>Recovery day</span>
        </div>

        <p>
          Training / recovery = 40% ·
          nutrition = 60%
        </p>
      </section>

      {/* =====================================
          CALENDAR
      ===================================== */}

      <section className="panel calendar-page__calendar">
        <div className="calendar-page__calendar-header">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft size={18} />
          </button>

          <h2>
            {formatMonth(
              currentMonth.year,
              currentMonth.month
            )}
          </h2>

          <button
            type="button"
            aria-label="Next month"
            onClick={() => changeMonth(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="calendar-page__weekdays">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday}>
              {weekday}
            </span>
          ))}
        </div>

        <div className="calendar-page__grid">
          {calendarDays.map((calendarDay, index) => {
            if (!calendarDay) {
              return (
                <div
                  className="calendar-page__day calendar-page__day--empty"
                  key={`empty-${index}`}
                />
              );
            }

            const {
              day,
              date,
              workouts: dayWorkouts,
              nutrition: dayNutrition,
              progress: dayProgress,
              restDay,
              future,
              score,
            } = calendarDay;

            const level = scoreLevel(
              score.total,
              future
            );

            const isSelected =
              selectedDate === date;

            const isToday =
              date === todayKey();

            return (
              <button
                type="button"
                key={date}
                className={[
                  "calendar-page__day",
                  `calendar-page__day--${level}`,
                  restDay
                    ? "calendar-page__day--rest"
                    : "",
                  isSelected
                    ? "calendar-page__day--selected"
                    : "",
                  isToday
                    ? "calendar-page__day--today"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  setSelectedDate(date)
                }
              >
                <div className="calendar-page__day-top">
                  <span className="calendar-page__day-number">
                    {day}
                  </span>

                  {!future && (
                    <strong className="calendar-page__score">
                      {score.total}%
                    </strong>
                  )}
                </div>

                {!future && (
                  <div className="calendar-page__day-progress">
                    <span
                      style={{
                        width: `${score.total}%`,
                      }}
                    />
                  </div>
                )}

                <div className="calendar-page__day-activity">
                  {restDay ? (
                    <span className="calendar-page__rest-badge">
                      <Moon size={12} />
                      Rest
                    </span>
                  ) : (
                    <span>
                      <Dumbbell size={12} />
                      {dayWorkouts.length}
                    </span>
                  )}

                  <span>
                    <Utensils size={12} />
                    {dayNutrition.length}
                  </span>

                  {dayProgress.length > 0 && (
                    <span className="calendar-page__progress-badge">
                      <Scale size={12} />
                      {dayProgress.length}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =====================================
          DAY DETAILS
      ===================================== */}

      <section className="calendar-page__details">

        {/* ===================================
            DAILY SCORE SUMMARY
        =================================== */}

        <article className="panel calendar-page__summary">
          <div className="calendar-page__summary-heading">
            <div>
              <span>Selected Day</span>

              <h2>
                {formatFullDate(selectedDate)}
              </h2>

              {selectedIsRestDay && (
                <div className="calendar-page__rest-status">
                  <Moon size={14} />
                  Recovery day
                </div>
              )}
            </div>

            <div
              className={`calendar-page__score-circle calendar-page__score-circle--${selectedLevel}`}
            >
              {selectedIsFuture ? (
                <>
                  <CalendarDays size={23} />
                  <span>Upcoming</span>
                </>
              ) : (
                <>
                  <strong>
                    {selectedScore.total}%
                  </strong>

                  <span>
                    {scoreLabel(
                      selectedScore.total,
                      false
                    )}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="calendar-page__breakdown">

            <div>
              <div className="calendar-page__breakdown-heading">
                <span>Training / Recovery</span>

                <strong>
                  {selectedScore.trainingScore} / 40
                </strong>
              </div>

              <div className="calendar-page__breakdown-bar">
                <span
                  style={{
                    width: `${
                      (selectedScore.trainingScore / 40) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="calendar-page__breakdown-heading">
                <span>Nutrition</span>

                <strong>
                  {selectedScore.nutritionScore} / 60
                </strong>
              </div>

              <div className="calendar-page__breakdown-bar">
                <span
                  style={{
                    width: `${
                      (selectedScore.nutritionScore / 60) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="calendar-page__nutrition-score">
            <div className="calendar-page__nutrition-score-heading">
              <div>
                <Target size={18} />

                <div>
                  <strong>
                    Nutrition Progress
                  </strong>

                  <span>
                    {goalsConfigured
                      ? "Calculated against your daily targets."
                      : "Based on meals logged because no targets are configured."}
                  </span>
                </div>
              </div>

              <strong>
                {selectedScore.nutritionScore} / 60
              </strong>
            </div>

            {goalsConfigured ? (
              <div className="calendar-page__nutrition-targets">
                {selectedScore.goalScores.map(
                  (goal) => (
                    <div
                      className="calendar-page__nutrition-target"
                      key={goal.key}
                    >
                      <div className="calendar-page__nutrition-target-heading">
                        <span>{goal.label}</span>

                        <strong>
                          {Math.round(goal.actual)}
                          {" / "}
                          {goal.target}
                          {goal.unit === "g"
                            ? "g"
                            : ""}
                        </strong>

                        <small>
                          {goal.percentage}%
                        </small>
                      </div>

                      <div className="calendar-page__nutrition-target-bar">
                        <span
                          style={{
                            width: `${
                              Math.min(
                                100,
                                Math.max(
                                  0,
                                  goal.percentage
                                )
                              )
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="calendar-page__logging-score">
                {MEALS.map((meal) => (
                  <div
                    className={[
                      "calendar-page__logging-meal",
                      selectedScore.loggedMeals.includes(
                        meal
                      )
                        ? "calendar-page__logging-meal--complete"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={meal}
                  >
                    {meal}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* REST DAY CONTROL */}

          <div className="calendar-page__rest-control">
            <div>
              <Moon size={18} />

              <div>
                <strong>
                  Recovery Day
                </strong>

                <span>
                  {selectedWorkouts.length > 0
                    ? "This day has a recorded workout."
                    : selectedIsFuture
                      ? "Future days cannot be marked as completed recovery."
                      : "Mark a day without training as recovery."}
                </span>
              </div>
            </div>

            <button
              type="button"
              className={[
                "button",
                "calendar-page__rest-button",
                selectedIsRestDay
                  ? "calendar-page__rest-button--active"
                  : "",
              ].join(" ")}
              disabled={
                restSaving ||
                selectedIsFuture ||
                selectedWorkouts.length > 0
              }
              onClick={toggleRestDay}
            >
              <Moon size={14} />

              {restSaving
                ? "Saving..."
                : selectedIsRestDay
                  ? "Remove Rest Day"
                  : "Mark Rest Day"}
            </button>
          </div>
        </article>

        {/* ===================================
            WORKOUTS
        =================================== */}

        <article className="panel calendar-page__section">
          <div className="calendar-page__section-heading">
            <div className="calendar-page__section-icon">
              <Dumbbell size={18} />
            </div>

            <div>
              <h3>Workouts</h3>
              <span>
                {selectedWorkouts.length}
                {" "}
                recorded on this day
              </span>
            </div>

            <Link
              to="/workouts"
              className="calendar-page__section-link"
            >
              View All
            </Link>
          </div>

          {selectedWorkouts.length === 0 ? (
            <div className="calendar-page__empty">
              No workout recorded for this day.
            </div>
          ) : (
            <div className="calendar-page__workouts">
              {selectedWorkouts.map((workout) => (
                <div
                  className="calendar-page__workout"
                  key={workout.id}
                >
                  <div>
                    <strong>
                      {workout.name || "Workout"}
                    </strong>

                    <span>
                      {workout.exercises?.length ?? 0}
                      {" "}
                      exercises
                    </span>
                  </div>

                  <Link
                    to={`/workouts/${workout.id}/edit`}
                    className="calendar-page__item-link"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="calendar-page__section-actions">
            <Link
              to="/workouts/new"
              className="button"
            >
              <Plus size={14} />
              Log Workout
            </Link>
          </div>
        </article>

        {/* ===================================
            NUTRITION
        =================================== */}

        <article className="panel calendar-page__section">
          <div className="calendar-page__section-heading">
            <div className="calendar-page__section-icon">
              <Utensils size={18} />
            </div>

            <div>
              <h3>Nutrition</h3>
              <span>
                {selectedNutrition.length}
                {" "}
                food entries
              </span>
            </div>

            <Link
              to="/nutrition"
              className="calendar-page__section-link"
            >
              Manage
            </Link>
          </div>

          <div className="calendar-page__macro-summary">
            <div>
              <strong>
                {Math.round(selectedTotals.calories)}
              </strong>
              <span>Calories</span>
            </div>

            <div>
              <strong>
                {Math.round(selectedTotals.protein)}g
              </strong>
              <span>Protein</span>
            </div>

            <div>
              <strong>
                {Math.round(selectedTotals.carbs)}g
              </strong>
              <span>Carbs</span>
            </div>

            <div>
              <strong>
                {Math.round(selectedTotals.fat)}g
              </strong>
              <span>Fat</span>
            </div>
          </div>

          {!goalsConfigured && (
            <div className="calendar-page__goal-notice">
              <Target size={14} />
              Daily targets are not configured.
              Nutrition scoring uses meal logging.
            </div>
          )}

          <div className="calendar-page__meals">
            {MEALS.map((meal) => {
              const entries = selectedNutrition.filter(
                (entry) => entry.meal === meal
              );

              const totals = getTotals(entries);
              const MealIcon = mealIcon(meal);
              const logged = entries.length > 0;

              return (
                <div
                  className={[
                    "calendar-page__meal",
                    logged
                      ? "calendar-page__meal--logged"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={meal}
                >
                  <div className="calendar-page__meal-heading">
                    <div className="calendar-page__meal-icon">
                      <MealIcon size={15} />
                    </div>

                    <div>
                      <strong>{meal}</strong>

                      <span>
                        {logged
                          ? `${entries.length} ${
                              entries.length === 1
                                ? "item"
                                : "items"
                            }`
                          : "Not logged"}
                      </span>
                    </div>
                  </div>

                  {logged && (
                    <>
                      <div className="calendar-page__meal-macros">
                        <span>
                          {Math.round(totals.calories)}
                          {" "}kcal
                        </span>

                        <span>
                          {Math.round(totals.protein)}g P
                        </span>

                        <span>
                          {Math.round(totals.carbs)}g C
                        </span>

                        <span>
                          {Math.round(totals.fat)}g F
                        </span>
                      </div>

                      <div className="calendar-page__meal-foods">
                        {entries.map((entry) => (
                          <span key={entry.id}>
                            {entry.name}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="calendar-page__section-actions">
            <Link
              to="/nutrition"
              className="button"
            >
              <Plus size={14} />
              Log Food
            </Link>
          </div>
        </article>

        {/* ===================================
            PROGRESS MEASUREMENTS — NEW
        =================================== */}

        <article className="panel calendar-page__section calendar-page__progress-section">
          <div className="calendar-page__section-heading">
            <div className="calendar-page__section-icon">
              <Scale size={18} />
            </div>

            <div>
              <h3>Body Progress</h3>

              <span>
                {selectedProgress.length}
                {" "}
                measurement entries
              </span>
            </div>

            <Link
              to="/progress"
              className="calendar-page__section-link"
            >
              Manage
            </Link>
          </div>

          {selectedProgress.length === 0 ? (
            <div className="calendar-page__empty">
              No body measurements recorded for this day.
            </div>
          ) : (
            <div className="calendar-page__progress-list">
              {selectedProgress.map((entry) => (
                <div
                  className="calendar-page__progress-entry"
                  key={entry.id}
                >
                  <div className="calendar-page__progress-entry-heading">
                    <Activity size={15} />

                    <strong>
                      Measurement Entry
                    </strong>
                  </div>

                  <div className="calendar-page__progress-values">
                    {entry.weight !== null && (
                      <span>
                        Weight:
                        {" "}
                        <strong>
                          {formatNumber(entry.weight)} kg
                        </strong>
                      </span>
                    )}

                    {entry.bodyFat !== null && (
                      <span>
                        Body Fat:
                        {" "}
                        <strong>
                          {formatNumber(entry.bodyFat)}%
                        </strong>
                      </span>
                    )}

                    {entry.waist !== null && (
                      <span>
                        Waist:
                        {" "}
                        <strong>
                          {formatNumber(entry.waist)} cm
                        </strong>
                      </span>
                    )}

                    {entry.chest !== null && (
                      <span>
                        Chest:
                        {" "}
                        <strong>
                          {formatNumber(entry.chest)} cm
                        </strong>
                      </span>
                    )}

                    {entry.arms !== null && (
                      <span>
                        Arms:
                        {" "}
                        <strong>
                          {formatNumber(entry.arms)} cm
                        </strong>
                      </span>
                    )}

                    {entry.thighs !== null && (
                      <span>
                        Thighs:
                        {" "}
                        <strong>
                          {formatNumber(entry.thighs)} cm
                        </strong>
                      </span>
                    )}
                  </div>

                  {entry.notes && (
                    <p className="calendar-page__progress-notes">
                      {entry.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="calendar-page__section-actions">
            <Link
              to="/progress"
              className="button"
            >
              <Plus size={14} />
              Log Measurement
            </Link>
          </div>
        </article>
      </section>

      {loading && (
        <div
          className="calendar-page__loading"
          role="status"
        >
          <RefreshCw size={16} />
          Loading calendar data...
        </div>
      )}
    </main>
  );
}

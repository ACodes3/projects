import { useMemo, useState } from 'react';

import {
  ArrowRight,
  CalendarDays,
  Dumbbell,
  ExternalLink,
  Flame,
  Moon,
  Plus,
  Scale,
  Utensils,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import './DashboardPage.css';

const WORKOUT_KEY = 'forge:workoutHistory';
const NUTRITION_KEY = 'forge:nutritionLogs';
const PROGRESS_KEY = 'forge:progressEntries';
const REST_DAYS_KEY = 'forge:restDays';

const MEALS = [
  'Breakfast',
  'Lunch',
  'Snacks',
  'Dinner',
];

/* =========================================
   STORAGE
========================================= */

function readArray(key) {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(key) || '[]',
    );

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function readObject(key) {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(key) || '{}',
    );

    return parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

/* =========================================
   DATE
========================================= */

function getToday() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    now.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDate(date) {
  if (!date) {
    return 0;
  }

  const timestamp = new Date(
    `${date}T12:00:00`,
  ).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : 0;
}

function formatDate(date) {
  if (!date) {
    return 'Unknown date';
  }

  return new Date(
    `${date}T12:00:00`,
  ).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  );
}

function formatShortDate(date) {
  if (!date) {
    return '';
  }

  if (date === getToday()) {
    return 'Today';
  }

  return new Date(
    `${date}T12:00:00`,
  ).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
    },
  );
}

function getWeekRange() {
  const start = new Date();

  const day =
    start.getDay();

  start.setDate(
    start.getDate() -
      ((day + 6) % 7),
  );

  start.setHours(
    0,
    0,
    0,
    0,
  );

  const end =
    new Date(start);

  end.setDate(
    end.getDate() + 7,
  );

  return {
    start:
      start.getTime(),

    end:
      end.getTime(),
  };
}

/* =========================================
   WORKOUT HELPERS
========================================= */

function getTrackingMode(exercise) {
  return (
    exercise.trackingMode ||
    'reps'
  );
}

function getWorkoutStats(workout) {
  const exercises =
    workout?.exercises || [];

  let repSets = 0;
  let intervals = 0;
  let tut = 0;
  let volume = 0;

  exercises.forEach(
    (exercise) => {
      const mode =
        getTrackingMode(
          exercise,
        );

      const sets =
        exercise.sets || [];

      if (mode === 'time') {
        intervals +=
          sets.length;

        tut +=
          sets.reduce(
            (total, set) =>
              total +
              Number(
                set.durationSeconds ||
                  0,
              ),
            0,
          );

        return;
      }

      repSets +=
        sets.length;

      volume +=
        sets.reduce(
          (total, set) =>
            total +
            Number(
              set.weight || 0,
            ) *
              Number(
                set.reps || 0,
              ),
          0,
        );
    },
  );

  return {
    exercises:
      exercises.length,

    repSets,
    intervals,
    tut,
    volume,
  };
}

function formatDuration(seconds) {
  const total = Math.max(
    0,
    Math.round(
      Number(seconds) || 0,
    ),
  );

  const hours =
    Math.floor(
      total / 3600,
    );

  const minutes =
    Math.floor(
      (total % 3600) /
        60,
    );

  const remaining =
    total % 60;

  if (hours > 0) {
    return `${hours}:${String(
      minutes,
    ).padStart(2, '0')}:${String(
      remaining,
    ).padStart(2, '0')}`;
  }

  if (minutes > 0) {
    return `${minutes}:${String(
      remaining,
    ).padStart(2, '0')}`;
  }

  return `${remaining}s`;
}

function formatVolume(volume) {
  if (volume >= 1000) {
    return `${(
      volume / 1000
    ).toFixed(1)}k kg`;
  }

  return `${Math.round(
    volume,
  )} kg`;
}

/* =========================================
   NUTRITION
========================================= */

function getNutritionTotals(entries = []) {
  return entries.reduce(
    (totals, entry) => ({
      calories:
        totals.calories +
        Number(
          entry.calories || 0,
        ),

      protein:
        totals.protein +
        Number(
          entry.protein || 0,
        ),

      carbs:
        totals.carbs +
        Number(
          entry.carbs || 0,
        ),

      fat:
        totals.fat +
        Number(
          entry.fat || 0,
        ),
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  );
}

/* =========================================
   DAILY SCORE
========================================= */

function getDailyScore({
  hasWorkout,
  isRestDay,
  nutritionEntries,
}) {
  const loggedMeals =
    MEALS.filter(
      (meal) =>
        nutritionEntries.some(
          (entry) =>
            entry.meal === meal,
        ),
    );

  const training =
    hasWorkout ||
    isRestDay
      ? 40
      : 0;

  const nutrition =
    loggedMeals.length * 15;

  return {
    total:
      training +
      nutrition,

    training,
    nutrition,
    loggedMeals,
  };
}

function getScoreLabel(score) {
  if (score >= 80) {
    return 'Good day';
  }

  if (score >= 50) {
    return 'Moderate';
  }

  if (score > 0) {
    return 'Needs work';
  }

  return 'Not started';
}

function getScoreLevel(score) {
  if (score >= 80) {
    return 'good';
  }

  if (score >= 50) {
    return 'moderate';
  }

  return 'poor';
}

/* =========================================
   DASHBOARD
========================================= */

export default function DashboardPage() {
  const [workouts] =
    useState(() =>
      readArray(
        WORKOUT_KEY,
      ),
    );

  const [nutrition] =
    useState(() =>
      readObject(
        NUTRITION_KEY,
      ),
    );

  const [progress] =
    useState(() =>
      readArray(
        PROGRESS_KEY,
      ),
    );

  const [restDays] =
    useState(() =>
      readArray(
        REST_DAYS_KEY,
      ),
    );

  const today =
    getToday();

  /* =========================================
     SORTED DATA
  ========================================= */

  const sortedWorkouts =
    useMemo(
      () =>
        [...workouts].sort(
          (a, b) =>
            parseDate(
              b.date,
            ) -
              parseDate(
                a.date,
              ) ||
            new Date(
              b.createdAt || 0,
            ) -
              new Date(
                a.createdAt || 0,
              ),
        ),
      [workouts],
    );

  const sortedProgress =
    useMemo(
      () =>
        [...progress].sort(
          (a, b) =>
            parseDate(
              b.date,
            ) -
              parseDate(
                a.date,
              ),
        ),
      [progress],
    );

  const latestWorkout =
    sortedWorkouts[0] ||
    null;

  const latestWeight =
    sortedProgress.find(
      (entry) =>
        Number.isFinite(
          Number(
            entry.weight,
          ),
        ),
    ) || null;

  /* =========================================
     TODAY
  ========================================= */

  const todayWorkouts =
    workouts.filter(
      (workout) =>
        workout.date ===
        today,
    );

  const todayNutrition =
    nutrition[today] || [];

  const todayTotals =
    getNutritionTotals(
      todayNutrition,
    );

  const todayIsRestDay =
    restDays.includes(
      today,
    ) &&
    todayWorkouts.length ===
      0;

  const todayScore =
    getDailyScore({
      hasWorkout:
        todayWorkouts.length >
        0,

      isRestDay:
        todayIsRestDay,

      nutritionEntries:
        todayNutrition,
    });

  const scoreLevel =
    getScoreLevel(
      todayScore.total,
    );

  /* =========================================
     WEEK
  ========================================= */

  const week =
    getWeekRange();

  const workoutsThisWeek =
    workouts.filter(
      (workout) => {
        const date =
          parseDate(
            workout.date,
          );

        return (
          date >=
            week.start &&
          date <
            week.end
        );
      },
    ).length;

  /* =========================================
     LATEST WORKOUT STATS
  ========================================= */

  const latestWorkoutStats =
    latestWorkout
      ? getWorkoutStats(
          latestWorkout,
        )
      : null;

  /* =========================================
     RECENT ACTIVITY
  ========================================= */

  const recentActivity =
    (() => {
      const items = [];

      workouts.forEach(
        (workout) => {
          items.push({
            id:
              `workout-${workout.id}`,

            date:
              workout.date,

            createdAt:
              workout.createdAt,

            type:
              'workout',

            title:
              workout.name ||
              'Workout',

            description:
              'Workout completed',
          });
        },
      );

      Object.entries(
        nutrition,
      ).forEach(
        ([date, entries]) => {
          if (
            !Array.isArray(
              entries,
            ) ||
            entries.length ===
              0
          ) {
            return;
          }

          items.push({
            id:
              `nutrition-${date}`,

            date,

            createdAt:
              `${date}T23:00:00`,

            type:
              'nutrition',

            title:
              'Nutrition logged',

            description:
              `${entries.length} ${
                entries.length ===
                1
                  ? 'food entry'
                  : 'food entries'
              }`,
          });
        },
      );

      progress.forEach(
        (entry) => {
          items.push({
            id:
              `progress-${entry.id}`,

            date:
              entry.date,

            createdAt:
              entry.createdAt,

            type:
              'progress',

            title:
              'Progress updated',

            description:
              entry.weight
                ? `${entry.weight} kg`
                : 'New measurement',
          });
        },
      );

      restDays.forEach(
        (date) => {
          const hasWorkout =
            workouts.some(
              (workout) =>
                workout.date ===
                date,
            );

          if (hasWorkout) {
            return;
          }

          items.push({
            id:
              `rest-${date}`,

            date,

            createdAt:
              `${date}T12:00:00`,

            type:
              'rest',

            title:
              'Recovery day',

            description:
              'Intentional rest day',
          });
        },
      );

      return items
        .sort(
          (a, b) =>
            new Date(
              b.createdAt ||
                `${b.date}T12:00:00`,
            ) -
            new Date(
              a.createdAt ||
                `${a.date}T12:00:00`,
            ),
        )
        .slice(0, 6);
    })();

  /* =========================================
     RENDER
  ========================================= */

  return (
    <main className="dashboard-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            Overview
          </span>

          <h1 className="page__title">
            Dashboard
          </h1>

          <p className="page__description">
            Your training,
            recovery, nutrition
            and progress at a
            glance.
          </p>

        </div>

        <Link
          to="/workouts/session"
          className="button button--primary"
        >
          <Plus size={16} />
          Log Workout
        </Link>

      </header>

      {/* =====================================
          TOP STATS
      ===================================== */}

      <section className="dashboard-page__stats">

        <article className="dashboard-page__stat">

          <div className="dashboard-page__stat-icon">
            <Dumbbell
              size={18}
            />
          </div>

          <div>

            <span>
              This Week
            </span>

            <strong>
              {workoutsThisWeek}
            </strong>

            <small>
              workouts
            </small>

          </div>

        </article>

        <article className="dashboard-page__stat">

          <div className="dashboard-page__stat-icon">
            <Scale
              size={18}
            />
          </div>

          <div>

            <span>
              Latest Weight
            </span>

            <strong>
              {latestWeight
                ? `${latestWeight.weight} kg`
                : '—'}
            </strong>

            <small>
              {latestWeight
                ? formatShortDate(
                    latestWeight.date,
                  )
                : 'not logged'}
            </small>

          </div>

        </article>

        <article className="dashboard-page__stat">

          <div className="dashboard-page__stat-icon">
            <Flame
              size={18}
            />
          </div>

          <div>

            <span>
              Calories Today
            </span>

            <strong>
              {Math.round(
                todayTotals.calories,
              )}
            </strong>

            <small>
              kcal logged
            </small>

          </div>

        </article>

        <article className="dashboard-page__stat">

          <div className="dashboard-page__stat-icon">
            <Utensils
              size={18}
            />
          </div>

          <div>

            <span>
              Protein Today
            </span>

            <strong>
              {Math.round(
                todayTotals.protein,
              )}g
            </strong>

            <small>
              logged
            </small>

          </div>

        </article>

      </section>

      {/* =====================================
          MAIN GRID
      ===================================== */}

      <section className="dashboard-page__grid">

        {/* =================================
            TODAY
        ================================= */}

        <article className="panel dashboard-page__today">

          <div className="dashboard-page__panel-heading">

            <div>

              <span>
                Daily Progress
              </span>

              <h2>
                Today
              </h2>

            </div>

            <Link
              to="/calendar"
            >
              Calendar
              <ArrowRight
                size={14}
              />
            </Link>

          </div>

          <div className="dashboard-page__today-content">

            <div
              className={`dashboard-page__score dashboard-page__score--${scoreLevel}`}
            >

              <strong>
                {
                  todayScore.total
                }%
              </strong>

              <span>
                {getScoreLabel(
                  todayScore.total,
                )}
              </span>

            </div>

            <div className="dashboard-page__today-breakdown">

              <div>

                <div className="dashboard-page__today-label">

                  <span>
                    Training /
                    Recovery
                  </span>

                  <strong>
                    {
                      todayScore.training
                    }
                    /40
                  </strong>

                </div>

                <div className="dashboard-page__progress-bar">
                  <span
                    style={{
                      width: `${
                        (
                          todayScore.training /
                          40
                        ) *
                        100
                      }%`,
                    }}
                  />
                </div>

              </div>

              <div>

                <div className="dashboard-page__today-label">

                  <span>
                    Nutrition
                  </span>

                  <strong>
                    {
                      todayScore.nutrition
                    }
                    /60
                  </strong>

                </div>

                <div className="dashboard-page__progress-bar">
                  <span
                    style={{
                      width: `${
                        (
                          todayScore.nutrition /
                          60
                        ) *
                        100
                      }%`,
                    }}
                  />
                </div>

              </div>

            </div>

          </div>

          <div className="dashboard-page__today-status">

            {todayWorkouts.length >
            0 ? (

              <div>
                <Dumbbell
                  size={16}
                />

                <span>
                  Workout completed
                </span>
              </div>

            ) : todayIsRestDay ? (

              <div className="dashboard-page__today-rest">
                <Moon
                  size={16}
                />

                <span>
                  Recovery day
                </span>
              </div>

            ) : (

              <div>
                <Dumbbell
                  size={16}
                />

                <span>
                  No workout yet
                </span>
              </div>

            )}

          </div>

        </article>

        {/* =================================
            LAST WORKOUT
        ================================= */}

        <article className="panel dashboard-page__last-workout">

          <div className="dashboard-page__panel-heading">

            <div>

              <span>
                Training
              </span>

              <h2>
                Last Workout
              </h2>

            </div>

            <Link
              to="/workouts"
            >
              View All
              <ArrowRight
                size={14}
              />
            </Link>

          </div>

          {!latestWorkout ? (

            <div className="dashboard-page__empty">

              <Dumbbell
                size={22}
              />

              <strong>
                No workouts yet
              </strong>

              <span>
                Your latest
                completed workout
                will appear here.
              </span>

            </div>

          ) : (

            <>

              <div className="dashboard-page__workout-title">

                <div className="dashboard-page__workout-icon">
                  <Dumbbell
                    size={18}
                  />
                </div>

                <div>

                  <strong>
                    {
                      latestWorkout.name
                    }
                  </strong>

                  <span>
                    {formatDate(
                      latestWorkout.date,
                    )}
                  </span>

                </div>

              </div>

              <div className="dashboard-page__workout-stats">

                <div>
                  <strong>
                    {
                      latestWorkoutStats.exercises
                    }
                  </strong>
                  <span>
                    exercises
                  </span>
                </div>

                {latestWorkoutStats.repSets >
                  0 && (
                  <div>
                    <strong>
                      {
                        latestWorkoutStats.repSets
                      }
                    </strong>
                    <span>
                      sets
                    </span>
                  </div>
                )}

                {latestWorkoutStats.intervals >
                  0 && (
                  <div>
                    <strong>
                      {
                        latestWorkoutStats.intervals
                      }
                    </strong>
                    <span>
                      intervals
                    </span>
                  </div>
                )}

                {latestWorkoutStats.tut >
                  0 && (
                  <div>
                    <strong>
                      {formatDuration(
                        latestWorkoutStats.tut,
                      )}
                    </strong>
                    <span>
                      TUT
                    </span>
                  </div>
                )}

                {latestWorkoutStats.volume >
                  0 && (
                  <div>
                    <strong>
                      {formatVolume(
                        latestWorkoutStats.volume,
                      )}
                    </strong>
                    <span>
                      volume
                    </span>
                  </div>
                )}

              </div>

              <div className="dashboard-page__exercise-preview">

                {(
                  latestWorkout.exercises ||
                  []
                )
                  .slice(0, 4)
                  .map(
                    (exercise) => (

                      <div
                        key={
                          exercise.id
                        }
                      >
                        <span>
                          {
                            exercise.name
                          }
                        </span>

                        <small>
                          {getTrackingMode(
                            exercise,
                          ) ===
                          'time'
                            ? `${
                                exercise
                                  .sets
                                  ?.length ||
                                0
                              } intervals`
                            : `${
                                exercise
                                  .sets
                                  ?.length ||
                                0
                              } sets`}
                        </small>
                      </div>

                    ),
                  )}

              </div>

              {latestWorkout.youtubeUrl && (

                <a
                  href={
                    latestWorkout.youtubeUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="dashboard-page__video-link"
                >
                  <ExternalLink
                    size={14}
                  />

                  Open workout video
                </a>

              )}

            </>

          )}

        </article>

        {/* =================================
            TODAY'S NUTRITION
        ================================= */}

        <article className="panel dashboard-page__nutrition">

          <div className="dashboard-page__panel-heading">

            <div>

              <span>
                Nutrition
              </span>

              <h2>
                Today
              </h2>

            </div>

            <Link
              to="/nutrition"
            >
              Open Log
              <ArrowRight
                size={14}
              />
            </Link>

          </div>

          <div className="dashboard-page__macro-grid">

            <div>
              <strong>
                {Math.round(
                  todayTotals.calories,
                )}
              </strong>
              <span>
                kcal
              </span>
            </div>

            <div>
              <strong>
                {Math.round(
                  todayTotals.protein,
                )}g
              </strong>
              <span>
                protein
              </span>
            </div>

            <div>
              <strong>
                {Math.round(
                  todayTotals.carbs,
                )}g
              </strong>
              <span>
                carbs
              </span>
            </div>

            <div>
              <strong>
                {Math.round(
                  todayTotals.fat,
                )}g
              </strong>
              <span>
                fat
              </span>
            </div>

          </div>

          <div className="dashboard-page__meals">

            {MEALS.map(
              (meal) => {
                const mealEntries =
                  todayNutrition.filter(
                    (entry) =>
                      entry.meal ===
                      meal,
                  );

                const logged =
                  mealEntries.length >
                  0;

                return (
                  <div
                    key={meal}
                    className={
                      logged
                        ? 'dashboard-page__meal dashboard-page__meal--logged'
                        : 'dashboard-page__meal'
                    }
                  >

                    <div>
                      <span>
                        {meal}
                      </span>

                      <small>
                        {logged
                          ? `${mealEntries.length} ${
                              mealEntries.length ===
                              1
                                ? 'item'
                                : 'items'
                            }`
                          : 'Not logged'}
                      </small>
                    </div>

                    <span className="dashboard-page__meal-status">
                      {logged
                        ? '✓'
                        : '—'}
                    </span>

                  </div>
                );
              },
            )}

          </div>

        </article>

        {/* =================================
            RECENT ACTIVITY
        ================================= */}

        <article className="panel dashboard-page__activity">

          <div className="dashboard-page__panel-heading">

            <div>

              <span>
                History
              </span>

              <h2>
                Recent Activity
              </h2>

            </div>

          </div>

          {recentActivity.length ===
          0 ? (

            <div className="dashboard-page__empty">

              <CalendarDays
                size={22}
              />

              <strong>
                Nothing logged yet
              </strong>

              <span>
                Your recent
                activity will
                appear here.
              </span>

            </div>

          ) : (

            <div className="dashboard-page__activity-list">

              {recentActivity.map(
                (item) => {

                  let Icon =
                    CalendarDays;

                  if (
                    item.type ===
                    'workout'
                  ) {
                    Icon =
                      Dumbbell;
                  }

                  if (
                    item.type ===
                    'nutrition'
                  ) {
                    Icon =
                      Utensils;
                  }

                  if (
                    item.type ===
                    'progress'
                  ) {
                    Icon =
                      Scale;
                  }

                  if (
                    item.type ===
                    'rest'
                  ) {
                    Icon =
                      Moon;
                  }

                  return (
                    <div
                      className="dashboard-page__activity-item"
                      key={
                        item.id
                      }
                    >

                      <div className="dashboard-page__activity-icon">
                        <Icon
                          size={15}
                        />
                      </div>

                      <div>

                        <strong>
                          {
                            item.title
                          }
                        </strong>

                        <span>
                          {
                            item.description
                          }
                        </span>

                      </div>

                      <time>
                        {formatShortDate(
                          item.date,
                        )}
                      </time>

                    </div>
                  );
                },
              )}

            </div>

          )}

        </article>

      </section>

      {/* =====================================
          QUICK ACTIONS
      ===================================== */}

      <section className="dashboard-page__quick-actions">

        <Link
          to="/workouts/session"
          className="dashboard-page__quick-action"
        >
          <Dumbbell
            size={17}
          />

          <div>
            <strong>
              Log Workout
            </strong>

            <span>
              Reps or timed intervals
            </span>
          </div>

          <ArrowRight
            size={15}
          />
        </Link>

        <Link
          to="/nutrition"
          className="dashboard-page__quick-action"
        >
          <Utensils
            size={17}
          />

          <div>
            <strong>
              Add Food
            </strong>

            <span>
              Update today's nutrition
            </span>
          </div>

          <ArrowRight
            size={15}
          />
        </Link>

        <Link
          to="/calendar"
          className="dashboard-page__quick-action"
        >
          <CalendarDays
            size={17}
          />

          <div>
            <strong>
              Calendar
            </strong>

            <span>
              Progress and rest days
            </span>
          </div>

          <ArrowRight
            size={15}
          />
        </Link>

        <Link
          to="/progress"
          className="dashboard-page__quick-action"
        >
          <Scale
            size={17}
          />

          <div>
            <strong>
              Measurements
            </strong>

            <span>
              Update body progress
            </span>
          </div>

          <ArrowRight
            size={15}
          />
        </Link>

      </section>

    </main>
  );
}
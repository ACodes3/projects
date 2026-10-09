import {
  Activity,
  ArrowRight,
  CalendarDays,
  Dumbbell,
  Flame,
  Plus,
  Scale,
  TrendingUp,
  Utensils,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import './DashboardPage.css';

const WORKOUTS_KEY =
  'forge:workoutHistory';

const NUTRITION_KEY =
  'forge:nutritionLogs';

const PROGRESS_KEY =
  'forge:progressEntries';

/* =========================================
   STORAGE
========================================= */

function readArray(key) {
  try {
    const stored =
      localStorage.getItem(key);

    if (!stored) {
      return [];
    }

    const parsed =
      JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function readObject(key) {
  try {
    const stored =
      localStorage.getItem(key);

    if (!stored) {
      return {};
    }

    const parsed =
      JSON.parse(stored);

    return (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
        ? parsed
        : {}
    );
  } catch {
    return {};
  }
}

/* =========================================
   DASHBOARD
========================================= */

function DashboardPage() {
  const [workouts] =
    useState(() =>
      readArray(
        WORKOUTS_KEY,
      ),
    );

  const [nutritionLogs] =
    useState(() =>
      readObject(
        NUTRITION_KEY,
      ),
    );

  const [progressEntries] =
    useState(() =>
      readArray(
        PROGRESS_KEY,
      ),
    );

  const today =
    getLocalDateString();

  /* =========================================
     SORTED WORKOUTS
  ========================================= */

  const sortedWorkouts =
    useMemo(() => {
      return [...workouts].sort(
        (a, b) =>
          new Date(
            b.date ??
              b.createdAt ??
              0,
          ) -
          new Date(
            a.date ??
              a.createdAt ??
              0,
          ),
      );
    }, [workouts]);

  /* =========================================
     SORTED PROGRESS
  ========================================= */

  const sortedProgress =
    useMemo(() => {
      return [
        ...progressEntries,
      ].sort(
        (a, b) =>
          new Date(
            b.date ??
              b.createdAt ??
              0,
          ) -
          new Date(
            a.date ??
              a.createdAt ??
              0,
          ),
      );
    }, [progressEntries]);

  /* =========================================
     TODAY'S NUTRITION
  ========================================= */

  const todayFoods =
    useMemo(
      () =>
        nutritionLogs[today] ??
        [],
      [nutritionLogs, today],
    );

  const nutrition =
    useMemo(() => {
      return todayFoods.reduce(
        (
          total,
          food,
        ) => ({
          calories:
            total.calories +
            Number(
              food.calories || 0,
            ),

          protein:
            total.protein +
            Number(
              food.protein || 0,
            ),

          carbs:
            total.carbs +
            Number(
              food.carbs || 0,
            ),

          fat:
            total.fat +
            Number(
              food.fat || 0,
            ),
        }),
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      );
    }, [todayFoods]);

  /* =========================================
     WEEKLY WORKOUT COUNT
  ========================================= */

  const weeklyWorkouts =
    useMemo(() => {
      const start =
        getStartOfWeek();

      return workouts.filter(
        (workout) => {
          if (!workout.date) {
            return false;
          }

          const date =
            new Date(
              `${workout.date}T12:00:00`,
            );

          return date >= start;
        },
      ).length;
    }, [workouts]);

  /* =========================================
     LATEST DATA
  ========================================= */

  const latestWorkout =
    sortedWorkouts[0] ??
    null;

  const latestProgress =
    sortedProgress[0] ??
    null;

  const currentWeight =
    latestProgress?.weight !==
      undefined &&
    latestProgress?.weight !==
      null
      ? Number(
          latestProgress.weight,
        )
      : null;

  const workoutVolume =
    latestWorkout
      ? getWorkoutVolume(
          latestWorkout,
        )
      : 0;

  const workoutSets =
    latestWorkout
      ? getWorkoutSetCount(
          latestWorkout,
        )
      : 0;

  /* =========================================
     RECENT ACTIVITY
  ========================================= */

  const recentActivity =
    useMemo(() => {
      const activities = [];

      sortedWorkouts
        .slice(0, 4)
        .forEach(
          (workout) => {
            activities.push({
              id:
                `workout-${workout.id}`,

              type: 'workout',

              title:
                workout.name ||
                'Workout',

              description:
                `${workout.exercises?.length ?? 0} exercises · ${getWorkoutSetCount(workout)} sets`,

              date:
                workout.date,

              timestamp:
                getTimestamp(
                  workout.date,
                  workout.createdAt,
                ),
            });
          },
        );

      sortedProgress
        .slice(0, 3)
        .forEach(
          (entry) => {
            activities.push({
              id:
                `progress-${entry.id}`,

              type: 'progress',

              title:
                `${formatNumber(entry.weight)} kg`,

              description:
                'Body weight recorded',

              date:
                entry.date,

              timestamp:
                getTimestamp(
                  entry.date,
                  entry.createdAt,
                ),
            });
          },
        );

      return activities
        .sort(
          (a, b) =>
            b.timestamp -
            a.timestamp,
        )
        .slice(0, 5);
    }, [
      sortedWorkouts,
      sortedProgress,
    ]);

  return (
    <main className="dashboard-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            Overview
          </span>

          <h1 className="page__title">
            Dashboard
          </h1>

          <p className="page__description">
            An overview of what
            you've actually logged.
          </p>

        </div>

        <Link
          to="/workouts/session"
          className="button button--primary"
        >
          <Plus size={16} />
          Log Workout
        </Link>

      </div>

      {/* =====================================
          SUMMARY
      ===================================== */}

      <section className="dashboard-page__stats">

        <article className="dashboard-page__stat">

          <div>
            <CalendarDays
              size={18}
            />
          </div>

          <span>
            Workouts This Week
          </span>

          <strong>
            {weeklyWorkouts}
          </strong>

        </article>

        <article className="dashboard-page__stat">

          <div>
            <Scale size={18} />
          </div>

          <span>
            Current Weight
          </span>

          <strong>
            {currentWeight !==
            null
              ? `${formatNumber(currentWeight)} kg`
              : '—'}
          </strong>

        </article>

        <article className="dashboard-page__stat">

          <div>
            <Flame size={18} />
          </div>

          <span>
            Calories Today
          </span>

          <strong>
            {Math.round(
              nutrition.calories,
            ).toLocaleString()}
          </strong>

        </article>

        <article className="dashboard-page__stat">

          <div>
            <Activity size={18} />
          </div>

          <span>
            Protein Today
          </span>

          <strong>
            {formatNumber(
              nutrition.protein,
            )}{' '}
            g
          </strong>

        </article>

      </section>

      {/* =====================================
          MAIN GRID
      ===================================== */}

      <section className="dashboard-page__grid">

        {/* ===================================
            LAST WORKOUT
        =================================== */}

        <article className="panel dashboard-page__card dashboard-page__card--large">

          <div className="dashboard-page__card-header">

            <div>

              <span>
                Training
              </span>

              <h2>
                Last Workout
              </h2>

            </div>

            <Link to="/workouts">
              View History
              <ArrowRight
                size={14}
              />
            </Link>

          </div>

          {latestWorkout ? (
            <div className="dashboard-page__workout">

              <div className="dashboard-page__workout-top">

                <div className="dashboard-page__workout-icon">
                  <Dumbbell
                    size={20}
                  />
                </div>

                <div>

                  <strong>
                    {latestWorkout.name ||
                      'Workout'}
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
                  <span>
                    Exercises
                  </span>
                  <strong>
                    {latestWorkout
                      .exercises
                      ?.length ?? 0}
                  </strong>
                </div>

                <div>
                  <span>
                    Sets
                  </span>
                  <strong>
                    {workoutSets}
                  </strong>
                </div>

                <div>
                  <span>
                    Volume
                  </span>
                  <strong>
                    {formatVolume(
                      workoutVolume,
                    )}
                  </strong>
                </div>

              </div>

              <div className="dashboard-page__exercise-preview">

                {latestWorkout.exercises
                  ?.slice(0, 5)
                  .map(
                    (
                      exercise,
                      index,
                    ) => (
                      <div
                        key={
                          exercise.id ??
                          `${exercise.name}-${index}`
                        }
                      >

                        <span>
                          {index + 1}
                        </span>

                        <strong>
                          {exercise.name}
                        </strong>

                        <small>
                          {exercise.sets
                            ?.length ??
                            0}{' '}
                          sets
                        </small>

                      </div>
                    ),
                  )}

              </div>

            </div>
          ) : (
            <div className="dashboard-page__empty">

              <Dumbbell
                size={25}
              />

              <strong>
                No workouts yet
              </strong>

              <p>
                Your most recent
                workout will appear
                here after you log it.
              </p>

              <Link
                to="/workouts/session"
                className="button button--primary"
              >
                <Plus
                  size={15}
                />
                Log Workout
              </Link>

            </div>
          )}

        </article>

        {/* ===================================
            TODAY'S NUTRITION
        =================================== */}

        <article className="panel dashboard-page__card">

          <div className="dashboard-page__card-header">

            <div>

              <span>
                Today
              </span>

              <h2>
                Nutrition
              </h2>

            </div>

            <Link to="/nutrition">
              Open Log
              <ArrowRight
                size={14}
              />
            </Link>

          </div>

          <div className="dashboard-page__nutrition-total">

            <span>
              Calories
            </span>

            <strong>
              {Math.round(
                nutrition.calories,
              ).toLocaleString()}
            </strong>

            <small>
              kcal logged
            </small>

          </div>

          <div className="dashboard-page__macros">

            <div>

              <span>
                Protein
              </span>

              <strong>
                {formatNumber(
                  nutrition.protein,
                )}
                g
              </strong>

            </div>

            <div>

              <span>
                Carbs
              </span>

              <strong>
                {formatNumber(
                  nutrition.carbs,
                )}
                g
              </strong>

            </div>

            <div>

              <span>
                Fat
              </span>

              <strong>
                {formatNumber(
                  nutrition.fat,
                )}
                g
              </strong>

            </div>

          </div>

          <div className="dashboard-page__nutrition-footer">

            <Utensils
              size={15}
            />

            <span>
              {todayFoods.length}{' '}
              {todayFoods.length ===
              1
                ? 'food entry'
                : 'food entries'}{' '}
              today
            </span>

          </div>

        </article>

        {/* ===================================
            RECENT ACTIVITY
        =================================== */}

        <article className="panel dashboard-page__card dashboard-page__card--large">

          <div className="dashboard-page__card-header">

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
            <div className="dashboard-page__activity-empty">

              <TrendingUp
                size={24}
              />

              <p>
                Activity will appear
                here as you use FORGE.
              </p>

            </div>
          ) : (
            <div className="dashboard-page__activity">

              {recentActivity.map(
                (item) => (
                  <div
                    className="dashboard-page__activity-row"
                    key={
                      item.id
                    }
                  >

                    <div className="dashboard-page__activity-icon">

                      {item.type ===
                      'workout' ? (
                        <Dumbbell
                          size={
                            16
                          }
                        />
                      ) : (
                        <Scale
                          size={
                            16
                          }
                        />
                      )}

                    </div>

                    <div>

                      <strong>
                        {item.title}
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
                ),
              )}

            </div>
          )}

        </article>

        {/* ===================================
            QUICK ACTIONS
        =================================== */}

        <article className="panel dashboard-page__card">

          <div className="dashboard-page__card-header">

            <div>

              <span>
                Tracker
              </span>

              <h2>
                Quick Actions
              </h2>

            </div>

          </div>

          <div className="dashboard-page__actions">

            <Link
              to="/workouts/session"
              className="dashboard-page__action"
            >

              <div>
                <Dumbbell
                  size={17}
                />
              </div>

              <span>
                Log Workout
              </span>

              <ArrowRight
                size={15}
              />

            </Link>

            <Link
              to="/nutrition"
              className="dashboard-page__action"
            >

              <div>
                <Utensils
                  size={17}
                />
              </div>

              <span>
                Log Food
              </span>

              <ArrowRight
                size={15}
              />

            </Link>

            <Link
              to="/progress"
              className="dashboard-page__action"
            >

              <div>
                <Scale
                  size={17}
                />
              </div>

              <span>
                Add Measurement
              </span>

              <ArrowRight
                size={15}
              />

            </Link>

            <Link
              to="/library"
              className="dashboard-page__action"
            >

              <div>
                <Activity
                  size={17}
                />
              </div>

              <span>
                Exercise Library
              </span>

              <ArrowRight
                size={15}
              />

            </Link>

          </div>

        </article>

      </section>

    </main>
  );
}

/* =========================================
   WORKOUT HELPERS
========================================= */

function getWorkoutSetCount(
  workout,
) {
  return (
    workout.exercises?.reduce(
      (
        total,
        exercise,
      ) =>
        total +
        (
          exercise.sets
            ?.length ?? 0
        ),
      0,
    ) ?? 0
  );
}

function getWorkoutVolume(
  workout,
) {
  return (
    workout.exercises?.reduce(
      (
        total,
        exercise,
      ) => {
        const volume =
          exercise.sets?.reduce(
            (
              setTotal,
              set,
            ) =>
              setTotal +
              (
                Number(
                  set.weight,
                ) || 0
              ) *
                (
                  Number(
                    set.reps,
                  ) || 0
                ),
            0,
          ) ?? 0;

        return total + volume;
      },
      0,
    ) ?? 0
  );
}

/* =========================================
   DATE HELPERS
========================================= */

function getLocalDateString() {
  const date =
    new Date();

  const offset =
    date.getTimezoneOffset() *
    60000;

  return new Date(
    date.getTime() - offset,
  )
    .toISOString()
    .slice(0, 10);
}

function getStartOfWeek() {
  const now =
    new Date();

  const start =
    new Date(now);

  const day =
    start.getDay();

  const difference =
    day === 0
      ? -6
      : 1 - day;

  start.setDate(
    start.getDate() +
      difference,
  );

  start.setHours(
    0,
    0,
    0,
    0,
  );

  return start;
}

function getTimestamp(
  date,
  createdAt,
) {
  if (createdAt) {
    return new Date(
      createdAt,
    ).getTime();
  }

  if (date) {
    return new Date(
      `${date}T12:00:00`,
    ).getTime();
  }

  return 0;
}

/* =========================================
   FORMATTERS
========================================= */

function formatNumber(value) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number,
    )
  ) {
    return '0';
  }

  return Number.isInteger(
    number,
  )
    ? number.toString()
    : number.toFixed(1);
}

function formatVolume(volume) {
  const number =
    Number(volume || 0);

  if (number >= 1000) {
    return `${(
      number / 1000
    ).toFixed(1)}k kg`;
  }

  return `${Math.round(
    number,
  ).toLocaleString()} kg`;
}

function formatDate(date) {
  if (!date) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    },
  ).format(
    new Date(
      `${date}T12:00:00`,
    ),
  );
}

function formatShortDate(date) {
  if (!date) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
    },
  ).format(
    new Date(
      `${date}T12:00:00`,
    ),
  );
}

export default DashboardPage;
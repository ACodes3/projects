import {
  CalendarDays,
  ChevronRight,
  Dumbbell,
  History,
  Plus,
  Search,
  TrendingUp,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import './WorkoutsPage.css';

const WORKOUT_HISTORY_KEY =
  'forge:workoutHistory';

/* =========================================
   WORKOUTS PAGE
========================================= */

function WorkoutsPage() {
  const [search, setSearch] =
    useState('');

  const [workouts] =
    useState(() =>
      loadWorkoutHistory(),
    );

  /* =========================================
     FILTER
  ========================================= */

  const filteredWorkouts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return workouts;
      }

      return workouts.filter(
        (workout) => {
          const workoutName =
            workout.name
              ?.toLowerCase() ?? '';

          const exerciseNames =
            workout.exercises
              ?.map(
                (exercise) =>
                  exercise.name ??
                  '',
              )
              .join(' ')
              .toLowerCase() ??
            '';

          return (
            workoutName.includes(
              query,
            ) ||
            exerciseNames.includes(
              query,
            )
          );
        },
      );
    }, [
      workouts,
      search,
    ]);

  /* =========================================
     STATS
  ========================================= */

  const stats =
    useMemo(() => {
      const now =
        new Date();

      const startOfWeek =
        new Date(now);

      const day =
        startOfWeek.getDay();

      const difference =
        day === 0
          ? -6
          : 1 - day;

      startOfWeek.setDate(
        startOfWeek.getDate() +
          difference,
      );

      startOfWeek.setHours(
        0,
        0,
        0,
        0,
      );

      const thisWeek =
        workouts.filter(
          (workout) => {
            const workoutDate =
              new Date(
                workout.date ??
                  workout.completedAt,
              );

            return (
              workoutDate >=
              startOfWeek
            );
          },
        ).length;

      const totalSets =
        workouts.reduce(
          (
            workoutTotal,
            workout,
          ) =>
            workoutTotal +
            getWorkoutSetCount(
              workout,
            ),
          0,
        );

      const totalVolume =
        workouts.reduce(
          (
            workoutTotal,
            workout,
          ) =>
            workoutTotal +
            getWorkoutVolume(
              workout,
            ),
          0,
        );

      return {
        thisWeek,
        totalSets,
        totalVolume,
      };
    }, [workouts]);

  return (
    <main className="workouts-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            Training Log
          </span>

          <h1 className="page__title">
            Workouts
          </h1>

          <p className="page__description">
            Record your training and
            review what you have done.
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

      <section className="workouts-page__stats">

        <article className="workouts-page__stat">

          <div>
            <CalendarDays
              size={18}
            />
          </div>

          <span>
            This Week
          </span>

          <strong>
            {stats.thisWeek}
          </strong>

        </article>

        <article className="workouts-page__stat">

          <div>
            <Dumbbell
              size={18}
            />
          </div>

          <span>
            Total Workouts
          </span>

          <strong>
            {workouts.length}
          </strong>

        </article>

        <article className="workouts-page__stat">

          <div>
            <TrendingUp
              size={18}
            />
          </div>

          <span>
            Total Sets
          </span>

          <strong>
            {stats.totalSets}
          </strong>

        </article>

        <article className="workouts-page__stat">

          <div>
            <History
              size={18}
            />
          </div>

          <span>
            Total Volume
          </span>

          <strong>
            {formatVolume(
              stats.totalVolume,
            )}
          </strong>

        </article>

      </section>

      {/* =====================================
          HISTORY
      ===================================== */}

      <section className="panel workouts-page__history">

        <div className="workouts-page__history-header">

          <div>

            <span>
              History
            </span>

            <h2>
              Workout Log
            </h2>

          </div>

          <div className="workouts-page__search">

            <Search
              size={15}
            />

            <input
              type="text"
              placeholder="Search workouts..."
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target.value,
                )
              }
            />

          </div>

        </div>

        {/* ===================================
            EMPTY STATE
        =================================== */}

        {workouts.length === 0 && (
          <div className="workouts-page__empty">

            <div className="workouts-page__empty-icon">
              <Dumbbell
                size={28}
              />
            </div>

            <h2>
              No workouts logged yet
            </h2>

            <p>
              Log your first workout
              and it will appear here.
            </p>

            <Link
              to="/workouts/session"
              className="button button--primary"
            >
              <Plus size={15} />
              Log First Workout
            </Link>

          </div>
        )}

        {/* ===================================
            NO SEARCH RESULTS
        =================================== */}

        {workouts.length > 0 &&
          filteredWorkouts.length ===
            0 && (
            <div className="workouts-page__empty">

              <Search
                size={25}
              />

              <h2>
                No workouts found
              </h2>

              <p>
                Try a different workout
                or exercise name.
              </p>

            </div>
          )}

        {/* ===================================
            WORKOUT LIST
        =================================== */}

        {filteredWorkouts.length >
          0 && (
          <div className="workouts-page__list">

            {filteredWorkouts.map(
              (workout) => {
                const exerciseCount =
                  workout.exercises
                    ?.length ?? 0;

                const setCount =
                  getWorkoutSetCount(
                    workout,
                  );

                const volume =
                  getWorkoutVolume(
                    workout,
                  );

                return (
                  <article
                    key={
                      workout.id
                    }
                    className="workouts-page__workout"
                  >

                    <div className="workouts-page__date">

                      <strong>
                        {formatDay(
                          workout.date ??
                            workout.completedAt,
                        )}
                      </strong>

                      <span>
                        {formatMonth(
                          workout.date ??
                            workout.completedAt,
                        )}
                      </span>

                    </div>

                    <div className="workouts-page__workout-main">

                      <strong>
                        {workout.name ||
                          'Workout'}
                      </strong>

                      <span>
                        {formatFullDate(
                          workout.date ??
                            workout.completedAt,
                        )}
                      </span>

                    </div>

                    <div className="workouts-page__workout-stat">

                      <span>
                        Exercises
                      </span>

                      <strong>
                        {
                          exerciseCount
                        }
                      </strong>

                    </div>

                    <div className="workouts-page__workout-stat">

                      <span>
                        Sets
                      </span>

                      <strong>
                        {setCount}
                      </strong>

                    </div>

                    <div className="workouts-page__workout-stat">

                      <span>
                        Volume
                      </span>

                      <strong>
                        {formatVolume(
                          volume,
                        )}
                      </strong>

                    </div>

                    <ChevronRight
                      size={17}
                    />

                  </article>
                );
              },
            )}

          </div>
        )}

      </section>

    </main>
  );
}

/* =========================================
   STORAGE
========================================= */

function loadWorkoutHistory() {
  try {
    const stored =
      localStorage.getItem(
        WORKOUT_HISTORY_KEY,
      );

    if (!stored) {
      return [];
    }

    const parsed =
      JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.sort(
      (a, b) =>
        new Date(
          b.date ??
            b.completedAt,
        ) -
        new Date(
          a.date ??
            a.completedAt,
        ),
    );
  } catch {
    return [];
  }
}

/* =========================================
   CALCULATIONS
========================================= */

function getWorkoutSetCount(
  workout,
) {
  if (!workout.exercises) {
    return 0;
  }

  return workout.exercises.reduce(
    (
      total,
      exercise,
    ) =>
      total +
      (exercise.sets?.length ??
        0),
    0,
  );
}

function getWorkoutVolume(
  workout,
) {
  if (!workout.exercises) {
    return 0;
  }

  return workout.exercises.reduce(
    (
      workoutVolume,
      exercise,
    ) => {
      const exerciseVolume =
        exercise.sets?.reduce(
          (
            setVolume,
            set,
          ) => {
            const weight =
              Number(
                set.weight,
              ) || 0;

            const reps =
              Number(
                set.reps,
              ) || 0;

            return (
              setVolume +
              weight * reps
            );
          },
          0,
        ) ?? 0;

      return (
        workoutVolume +
        exerciseVolume
      );
    },
    0,
  );
}

/* =========================================
   FORMATTERS
========================================= */

function formatVolume(
  volume,
) {
  if (volume >= 1000) {
    return `${(
      volume / 1000
    ).toFixed(1)}k kg`;
  }

  return `${Math.round(
    volume,
  ).toLocaleString()} kg`;
}

function formatDay(date) {
  if (!date) {
    return '--';
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      day: '2-digit',
    },
  ).format(
    new Date(date),
  );
}

function formatMonth(date) {
  if (!date) {
    return '---';
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
    },
  )
    .format(
      new Date(date),
    )
    .toUpperCase();
}

function formatFullDate(date) {
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
    new Date(date),
  );
}

export default WorkoutsPage;
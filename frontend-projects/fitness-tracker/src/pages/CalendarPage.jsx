import { useMemo, useState } from 'react';

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Cookie,
  Dumbbell,
  Utensils,
} from 'lucide-react';

import './CalendarPage.css';

const WORKOUT_KEY = 'forge:workoutHistory';
const NUTRITION_KEY = 'forge:nutritionLogs';

const MEALS = [
  'Breakfast',
  'Lunch',
  'Snacks',
  'Dinner',
];

const WEEKDAYS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
];

/* =========================================
   STORAGE
========================================= */

function readWorkouts() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(WORKOUT_KEY) || '[]',
    );

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function readNutrition() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(NUTRITION_KEY) || '{}',
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
   DATE HELPERS
========================================= */

function toDateKey(
  year,
  month,
  day,
) {
  const monthString = String(
    month + 1,
  ).padStart(2, '0');

  const dayString = String(
    day,
  ).padStart(2, '0');

  return `${year}-${monthString}-${dayString}`;
}

function getTodayKey() {
  const today = new Date();

  return toDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
}

function formatMonth(
  year,
  month,
) {
  return new Date(
    year,
    month,
    1,
  ).toLocaleDateString(
    'en-US',
    {
      month: 'long',
      year: 'numeric',
    },
  );
}

function formatFullDate(
  dateKey,
) {
  if (!dateKey) {
    return '';
  }

  return new Date(
    `${dateKey}T12:00:00`,
  ).toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    },
  );
}

/* =========================================
   NUTRITION
========================================= */

function getNutritionTotals(
  entries = [],
) {
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
   SCORE
========================================= */

function calculateDayScore(
  workouts,
  nutritionEntries,
) {
  const hasWorkout =
    workouts.length > 0;

  const loggedMeals =
    MEALS.filter(
      (meal) =>
        nutritionEntries.some(
          (entry) =>
            entry.meal === meal,
        ),
    );

  const trainingScore =
    hasWorkout
      ? 40
      : 0;

  const nutritionScore =
    loggedMeals.length * 15;

  const total =
    trainingScore +
    nutritionScore;

  return {
    total,
    trainingScore,
    nutritionScore,
    loggedMeals,
  };
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

  return 'No progress';
}

/* =========================================
   ICONS
========================================= */

function getMealIcon(meal) {
  switch (meal) {
    case 'Breakfast':
      return Coffee;

    case 'Snacks':
      return Cookie;

    default:
      return Utensils;
  }
}

/* =========================================
   PAGE
========================================= */

export default function CalendarPage() {
  const today = new Date();

  const [workouts] =
    useState(readWorkouts);

  const [nutrition] =
    useState(readNutrition);

  const [
    currentMonth,
    setCurrentMonth,
  ] = useState({
    year:
      today.getFullYear(),

    month:
      today.getMonth(),
  });

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getTodayKey(),
  );

  /* =========================================
     GROUP WORKOUTS BY DATE
  ========================================= */

  const workoutsByDate =
    useMemo(() => {
      return workouts.reduce(
        (
          grouped,
          workout,
        ) => {
          if (!workout.date) {
            return grouped;
          }

          if (
            !grouped[
              workout.date
            ]
          ) {
            grouped[
              workout.date
            ] = [];
          }

          grouped[
            workout.date
          ].push(
            workout,
          );

          return grouped;
        },
        {},
      );
    }, [workouts]);

  /* =========================================
     CALENDAR DAYS
  ========================================= */

  const calendarDays =
    useMemo(() => {
      const {
        year,
        month,
      } = currentMonth;

      const daysInMonth =
        new Date(
          year,
          month + 1,
          0,
        ).getDate();

      const firstDay =
        new Date(
          year,
          month,
          1,
        ).getDay();

      /*
        JavaScript:
        Sunday = 0

        Calendar:
        Monday = 0
      */

      const mondayOffset =
        (firstDay + 6) % 7;

      const cells = [];

      for (
        let index = 0;
        index <
        mondayOffset;
        index += 1
      ) {
        cells.push(null);
      }

      for (
        let day = 1;
        day <= daysInMonth;
        day += 1
      ) {
        const date =
          toDateKey(
            year,
            month,
            day,
          );

        const dayWorkouts =
          workoutsByDate[
            date
          ] || [];

        const dayNutrition =
          nutrition[
            date
          ] || [];

        const score =
          calculateDayScore(
            dayWorkouts,
            dayNutrition,
          );

        cells.push({
          day,
          date,
          workouts:
            dayWorkouts,
          nutrition:
            dayNutrition,
          score,
        });
      }

      while (
        cells.length % 7 !==
        0
      ) {
        cells.push(null);
      }

      return cells;
    }, [
      currentMonth,
      workoutsByDate,
      nutrition,
    ]);

  /* =========================================
     SELECTED DAY
  ========================================= */

  const selectedWorkouts =
    workoutsByDate[
      selectedDate
    ] || [];

  const selectedNutrition =
    nutrition[
      selectedDate
    ] || [];

  const selectedScore =
    calculateDayScore(
      selectedWorkouts,
      selectedNutrition,
    );

  const selectedLevel =
    getScoreLevel(
      selectedScore.total,
    );

  const selectedTotals =
    getNutritionTotals(
      selectedNutrition,
    );

  /* =========================================
     MONTH NAVIGATION
  ========================================= */

  function changeMonth(
    direction,
  ) {
    const nextDate =
      new Date(
        currentMonth.year,
        currentMonth.month +
          direction,
        1,
      );

    const next = {
      year:
        nextDate.getFullYear(),

      month:
        nextDate.getMonth(),
    };

    setCurrentMonth(
      next,
    );

    setSelectedDate(
      toDateKey(
        next.year,
        next.month,
        1,
      ),
    );
  }

  function goToToday() {
    const now =
      new Date();

    setCurrentMonth({
      year:
        now.getFullYear(),

      month:
        now.getMonth(),
    });

    setSelectedDate(
      getTodayKey(),
    );
  }

  return (
    <main className="calendar-page">

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
            See how training and
            nutrition come together
            across each day.
          </p>

        </div>

        <button
          type="button"
          className="button"
          onClick={
            goToToday
          }
        >
          <CalendarDays
            size={16}
          />

          Today
        </button>

      </header>

      {/* =====================================
          SCORE EXPLANATION
      ===================================== */}

      <section className="calendar-page__legend">

        <div>
          <span className="calendar-page__legend-dot calendar-page__legend-dot--good" />

          <strong>
            80–100%
          </strong>

          <span>
            Good
          </span>
        </div>

        <div>
          <span className="calendar-page__legend-dot calendar-page__legend-dot--moderate" />

          <strong>
            50–79%
          </strong>

          <span>
            Moderate
          </span>
        </div>

        <div>
          <span className="calendar-page__legend-dot calendar-page__legend-dot--poor" />

          <strong>
            0–49%
          </strong>

          <span>
            Needs work
          </span>
        </div>

        <p>
          40% training + 60%
          nutrition completion
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
            onClick={() =>
              changeMonth(-1)
            }
          >
            <ChevronLeft
              size={18}
            />
          </button>

          <h2>
            {formatMonth(
              currentMonth.year,
              currentMonth.month,
            )}
          </h2>

          <button
            type="button"
            aria-label="Next month"
            onClick={() =>
              changeMonth(1)
            }
          >
            <ChevronRight
              size={18}
            />
          </button>

        </div>

        {/* WEEKDAYS */}

        <div className="calendar-page__weekdays">

          {WEEKDAYS.map(
            (weekday) => (
              <span
                key={
                  weekday
                }
              >
                {weekday}
              </span>
            ),
          )}

        </div>

        {/* DAYS */}

        <div className="calendar-page__grid">

          {calendarDays.map(
            (
              calendarDay,
              index,
            ) => {
              if (
                !calendarDay
              ) {
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
                workouts:
                  dayWorkouts,
                nutrition:
                  dayNutrition,
                score,
              } =
                calendarDay;

              const level =
                getScoreLevel(
                  score.total,
                );

              const isSelected =
                selectedDate ===
                date;

              const isToday =
                date ===
                getTodayKey();

              return (
                <button
                  type="button"
                  key={date}
                  className={[
                    'calendar-page__day',
                    `calendar-page__day--${level}`,
                    isSelected
                      ? 'calendar-page__day--selected'
                      : '',
                    isToday
                      ? 'calendar-page__day--today'
                      : '',
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(' ')}
                  onClick={() =>
                    setSelectedDate(
                      date,
                    )
                  }
                >

                  <div className="calendar-page__day-top">

                    <span className="calendar-page__day-number">
                      {day}
                    </span>

                    <strong className="calendar-page__score">
                      {
                        score.total
                      }%
                    </strong>

                  </div>

                  <div className="calendar-page__day-progress">

                    <span
                      style={{
                        width: `${score.total}%`,
                      }}
                    />

                  </div>

                  <div className="calendar-page__day-activity">

                    <span>
                      <Dumbbell
                        size={12}
                      />

                      {
                        dayWorkouts.length
                      }
                    </span>

                    <span>
                      <Utensils
                        size={12}
                      />

                      {
                        dayNutrition.length
                      }
                    </span>

                  </div>

                </button>
              );
            },
          )}

        </div>

      </section>

      {/* =====================================
          SELECTED DAY DETAILS
      ===================================== */}

      <section className="calendar-page__details">

        {/* SCORE */}

        <article className="panel calendar-page__summary">

          <div className="calendar-page__summary-heading">

            <div>

              <span>
                Selected Day
              </span>

              <h2>
                {formatFullDate(
                  selectedDate,
                )}
              </h2>

            </div>

            <div
              className={`calendar-page__score-circle calendar-page__score-circle--${selectedLevel}`}
            >
              <strong>
                {
                  selectedScore.total
                }%
              </strong>

              <span>
                {getScoreLabel(
                  selectedScore.total,
                )}
              </span>
            </div>

          </div>

          <div className="calendar-page__breakdown">

            <div>

              <div className="calendar-page__breakdown-heading">

                <span>
                  Training
                </span>

                <strong>
                  {
                    selectedScore.trainingScore
                  }
                  /40
                </strong>

              </div>

              <div className="calendar-page__breakdown-bar">

                <span
                  style={{
                    width: `${
                      (selectedScore.trainingScore /
                        40) *
                      100
                    }%`,
                  }}
                />

              </div>

            </div>

            <div>

              <div className="calendar-page__breakdown-heading">

                <span>
                  Nutrition
                </span>

                <strong>
                  {
                    selectedScore.nutritionScore
                  }
                  /60
                </strong>

              </div>

              <div className="calendar-page__breakdown-bar">

                <span
                  style={{
                    width: `${
                      (selectedScore.nutritionScore /
                        60) *
                      100
                    }%`,
                  }}
                />

              </div>

            </div>

          </div>

        </article>

        {/* =================================
            WORKOUTS
        ================================= */}

        <article className="panel calendar-page__section">

          <div className="calendar-page__section-heading">

            <div className="calendar-page__section-icon">
              <Dumbbell
                size={17}
              />
            </div>

            <div>

              <h3>
                Training
              </h3>

              <span>
                {
                  selectedWorkouts.length
                }{' '}
                {selectedWorkouts.length ===
                1
                  ? 'workout'
                  : 'workouts'}
              </span>

            </div>

          </div>

          {selectedWorkouts.length ===
          0 ? (

            <div className="calendar-page__empty">
              No workout completed
              on this day.
            </div>

          ) : (

            <div className="calendar-page__workouts">

              {selectedWorkouts.map(
                (workout) => {
                  const setCount =
                    (
                      workout.exercises ||
                      []
                    ).reduce(
                      (
                        total,
                        exercise,
                      ) =>
                        total +
                        (
                          exercise.sets ||
                          []
                        ).length,
                      0,
                    );

                  return (
                    <div
                      className="calendar-page__workout"
                      key={
                        workout.id
                      }
                    >

                      <div>

                        <strong>
                          {workout.name ||
                            'Workout'}
                        </strong>

                        <span>
                          {
                            workout
                              .exercises
                              ?.length ||
                            0
                          }{' '}
                          exercises ·{' '}
                          {setCount}{' '}
                          sets
                        </span>

                      </div>

                      <Dumbbell
                        size={16}
                      />

                    </div>
                  );
                },
              )}

            </div>

          )}

        </article>

        {/* =================================
            NUTRITION
        ================================= */}

        <article className="panel calendar-page__section">

          <div className="calendar-page__section-heading">

            <div className="calendar-page__section-icon">
              <Utensils
                size={17}
              />
            </div>

            <div>

              <h3>
                Nutrition
              </h3>

              <span>
                {
                  selectedNutrition.length
                } food{' '}
                {selectedNutrition.length ===
                1
                  ? 'entry'
                  : 'entries'}
              </span>

            </div>

          </div>

          <div className="calendar-page__macro-summary">

            <div>
              <strong>
                {Math.round(
                  selectedTotals.calories,
                )}
              </strong>
              <span>
                kcal
              </span>
            </div>

            <div>
              <strong>
                {Math.round(
                  selectedTotals.protein,
                )}g
              </strong>
              <span>
                protein
              </span>
            </div>

            <div>
              <strong>
                {Math.round(
                  selectedTotals.carbs,
                )}g
              </strong>
              <span>
                carbs
              </span>
            </div>

            <div>
              <strong>
                {Math.round(
                  selectedTotals.fat,
                )}g
              </strong>
              <span>
                fat
              </span>
            </div>

          </div>

          <div className="calendar-page__meals">

            {MEALS.map(
              (meal) => {
                const entries =
                  selectedNutrition.filter(
                    (entry) =>
                      entry.meal ===
                      meal,
                  );

                const totals =
                  getNutritionTotals(
                    entries,
                  );

                const MealIcon =
                  getMealIcon(
                    meal,
                  );

                const logged =
                  entries.length >
                  0;

                return (
                  <div
                    className={[
                      'calendar-page__meal',
                      logged
                        ? 'calendar-page__meal--logged'
                        : '',
                    ]
                      .filter(
                        Boolean,
                      )
                      .join(' ')}
                    key={meal}
                  >

                    <div className="calendar-page__meal-heading">

                      <div className="calendar-page__meal-icon">
                        <MealIcon
                          size={15}
                        />
                      </div>

                      <div>

                        <strong>
                          {meal}
                        </strong>

                        <span>
                          {logged
                            ? `${entries.length} ${
                                entries.length ===
                                1
                                  ? 'item'
                                  : 'items'
                              }`
                            : 'Not logged'}
                        </span>

                      </div>

                    </div>

                    {logged && (

                      <>
                        <div className="calendar-page__meal-macros">

                          <span>
                            {
                              Math.round(
                                totals.calories,
                              )
                            }{' '}
                            kcal
                          </span>

                          <span>
                            {
                              Math.round(
                                totals.protein,
                              )
                            }g P
                          </span>

                          <span>
                            {
                              Math.round(
                                totals.carbs,
                              )
                            }g C
                          </span>

                          <span>
                            {
                              Math.round(
                                totals.fat,
                              )
                            }g F
                          </span>

                        </div>

                        <div className="calendar-page__meal-foods">

                          {entries.map(
                            (entry) => (
                              <span
                                key={
                                  entry.id
                                }
                              >
                                {
                                  entry.name
                                }
                              </span>
                            ),
                          )}

                        </div>
                      </>

                    )}

                  </div>
                );
              },
            )}

          </div>

        </article>

      </section>

    </main>
  );
}
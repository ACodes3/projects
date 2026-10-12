import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Cookie,
  Dumbbell,
  Moon,
  Target,
  Utensils,
} from 'lucide-react';

import {
  createRestDay,
  deleteRestDay,
  getNutritionEntries,
  getNutritionGoals,
  getRestDays,
  getWorkouts,
} from '../api/forgeApi.js';

import './CalendarPage.css';


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


const GOAL_DEFINITIONS = {
  calories: {
    label: 'Calories',
    unit: 'kcal',
  },

  protein: {
    label: 'Protein',
    unit: 'g',
  },

  carbs: {
    label: 'Carbs',
    unit: 'g',
  },

  fat: {
    label: 'Fat',
    unit: 'g',
  },
};


/* =========================================
   API NORMALIZATION
========================================= */

function normalizeDate(
  value,
) {
  if (!value) {
    return '';
  }

  if (
    typeof value === 'string'
  ) {
    return value.slice(
      0,
      10,
    );
  }

  try {
    return new Date(value)
      .toISOString()
      .slice(
        0,
        10,
      );
  } catch {
    return '';
  }
}


function extractNutritionEntries(
  response,
) {
  if (
    Array.isArray(response)
  ) {
    return response;
  }

  if (
    Array.isArray(
      response?.entries,
    )
  ) {
    return response.entries;
  }

  if (
    Array.isArray(
      response?.nutritionEntries,
    )
  ) {
    return response.nutritionEntries;
  }

  if (
    Array.isArray(
      response?.data,
    )
  ) {
    return response.data;
  }

  return [];
}


function normalizeNutritionEntry(
  entry,
) {
  return {
    id:
      entry.id,

    date:
      normalizeDate(
        entry.entry_date
        ?? entry.date,
      ),

    meal:
      entry.meal
      ?? 'Breakfast',

    name:
      entry.name
      ?? '',

    calories:
      Number(
        entry.calories
        ?? 0,
      ),

    protein:
      Number(
        entry.protein_g
        ?? entry.protein
        ?? 0,
      ),

    carbs:
      Number(
        entry.carbs_g
        ?? entry.carbs
        ?? 0,
      ),

    fat:
      Number(
        entry.fat_g
        ?? entry.fat
        ?? 0,
      ),
  };
}


function groupNutritionByDate(
  entries,
) {
  return entries.reduce(
    (
      grouped,
      rawEntry,
    ) => {
      const entry =
        normalizeNutritionEntry(
          rawEntry,
        );

      if (!entry.date) {
        return grouped;
      }

      if (
        !grouped[
          entry.date
        ]
      ) {
        grouped[
          entry.date
        ] = [];
      }

      grouped[
        entry.date
      ].push(
        entry,
      );

      return grouped;
    },
    {},
  );
}


function normalizeGoals(
  response,
) {
  const raw =
    response?.goals
    ?? response?.nutritionGoals
    ?? response?.data?.goals
    ?? response
    ?? {};

  return {
    calories:
      Number(
        raw.calories
        ?? 0,
      ),

    protein:
      Number(
        raw.protein_g
        ?? raw.protein
        ?? 0,
      ),

    carbs:
      Number(
        raw.carbs_g
        ?? raw.carbs
        ?? 0,
      ),

    fat:
      Number(
        raw.fat_g
        ?? raw.fat
        ?? 0,
      ),
  };
}


function extractRestDays(
  response,
) {
  let raw = [];

  if (
    Array.isArray(response)
  ) {
    raw =
      response;
  } else if (
    Array.isArray(
      response?.restDays,
    )
  ) {
    raw =
      response.restDays;
  } else if (
    Array.isArray(
      response?.rest_days,
    )
  ) {
    raw =
      response.rest_days;
  } else if (
    Array.isArray(
      response?.data,
    )
  ) {
    raw =
      response.data;
  }

  return raw
    .map(
      (item) => {
        if (
          typeof item ===
          'string'
        ) {
          return normalizeDate(
            item,
          );
        }

        return normalizeDate(
          item?.rest_date
          ?? item?.date,
        );
      },
    )
    .filter(
      Boolean,
    );
}


/* =========================================
   DATE HELPERS
========================================= */

function toDateKey(
  year,
  month,
  day,
) {
  return `${year}-${String(
    month + 1,
  ).padStart(
    2,
    '0',
  )}-${String(
    day,
  ).padStart(
    2,
    '0',
  )}`;
}


function getTodayKey() {
  const today =
    new Date();

  return toDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
}


function isFutureDate(
  dateKey,
) {
  return (
    dateKey >
    getTodayKey()
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
    (
      totals,
      entry,
    ) => ({
      calories:
        totals.calories
        + Number(
          entry.calories || 0,
        ),

      protein:
        totals.protein
        + Number(
          entry.protein || 0,
        ),

      carbs:
        totals.carbs
        + Number(
          entry.carbs || 0,
        ),

      fat:
        totals.fat
        + Number(
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


function getConfiguredGoals(
  goals,
) {
  return Object.entries(
    GOAL_DEFINITIONS,
  )
    .map(
      (
        [
          key,
          definition,
        ],
      ) => ({
        key,

        ...definition,

        target:
          Number(
            goals[key],
          ) || 0,
      }),
    )
    .filter(
      (goal) =>
        goal.target > 0,
    );
}


/* =========================================
   TARGET SCORING
========================================= */

function getTargetRatio(
  key,
  actual,
  target,
) {
  if (!target) {
    return 0;
  }

  const value =
    Math.max(
      0,
      Number(
        actual,
      ) || 0,
    );

  /*
    Protein is treated as a minimum.
  */

  if (
    key === 'protein'
  ) {
    return Math.min(
      1,
      value / target,
    );
  }

  /*
    Calories, carbs and fat are
    scored by closeness.
  */

  const deviation =
    Math.abs(
      value - target,
    ) / target;

  return Math.max(
    0,
    1 - deviation,
  );
}


function calculateNutritionScore(
  nutritionEntries,
  goals,
) {
  const totals =
    getNutritionTotals(
      nutritionEntries,
    );

  const configuredGoals =
    getConfiguredGoals(
      goals,
    );

  /*
    If targets do not exist,
    score by meals logged.
  */

  if (
    configuredGoals.length ===
    0
  ) {
    const loggedMeals =
      MEALS.filter(
        (meal) =>
          nutritionEntries.some(
            (entry) =>
              entry.meal ===
              meal,
          ),
      );

    return {
      score:
        loggedMeals.length
        * 15,

      mode:
        'logging',

      totals,

      loggedMeals,

      goalScores: [],
    };
  }

  const pointsPerGoal =
    60
    / configuredGoals.length;

  const goalScores =
    configuredGoals.map(
      (goal) => {
        const actual =
          totals[
            goal.key
          ];

        const ratio =
          getTargetRatio(
            goal.key,
            actual,
            goal.target,
          );

        return {
          ...goal,

          actual,

          ratio,

          points:
            ratio
            * pointsPerGoal,

          percentage:
            Math.round(
              (
                actual
                / goal.target
              )
              * 100,
            ),
        };
      },
    );

  const score =
    Math.round(
      goalScores.reduce(
        (
          total,
          goal,
        ) =>
          total
          + goal.points,
        0,
      ),
    );

  return {
    score,

    mode:
      'targets',

    totals,

    loggedMeals: [],

    goalScores,
  };
}


/* =========================================
   DAILY SCORE
========================================= */

function calculateDayScore(
  workouts,
  nutritionEntries,
  isRestDay,
  goals,
) {
  const hasWorkout =
    workouts.length > 0;

  const trainingScore =
    hasWorkout
    || isRestDay
      ? 40
      : 0;

  const nutrition =
    calculateNutritionScore(
      nutritionEntries,
      goals,
    );

  return {
    total:
      trainingScore
      + nutrition.score,

    trainingScore,

    nutritionScore:
      nutrition.score,

    hasWorkout,

    isRestDay,

    nutritionMode:
      nutrition.mode,

    nutritionTotals:
      nutrition.totals,

    loggedMeals:
      nutrition.loggedMeals,

    goalScores:
      nutrition.goalScores,
  };
}


/* =========================================
   SCORE LEVEL
========================================= */

function getScoreLevel(
  score,
  future,
) {
  if (future) {
    return 'future';
  }

  if (
    score >= 80
  ) {
    return 'good';
  }

  if (
    score >= 50
  ) {
    return 'moderate';
  }

  return 'poor';
}


function getScoreLabel(
  score,
  future,
) {
  if (future) {
    return 'Upcoming';
  }

  if (
    score >= 80
  ) {
    return 'Good day';
  }

  if (
    score >= 50
  ) {
    return 'Moderate';
  }

  if (
    score > 0
  ) {
    return 'Needs work';
  }

  return 'No progress';
}


/* =========================================
   MEALS
========================================= */

function getMealIcon(
  meal,
) {
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
  const today =
    new Date();

  const [
    workouts,
    setWorkouts,
  ] = useState([]);

  const [
    nutrition,
    setNutrition,
  ] = useState({});

  const [
    goals,
    setGoals,
  ] = useState({});

  const [
    restDays,
    setRestDays,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    restSaving,
    setRestSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

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
     LOAD CALENDAR DATA
  ========================================= */

  async function loadCalendarData() {
    try {
      setLoading(true);
      setError('');

      const [
        workoutsResponse,
        nutritionResponse,
        goalsResponse,
        restDaysResponse,
      ] = await Promise.all([
        getWorkouts(),
        getNutritionEntries(),
        getNutritionGoals(),
        getRestDays(),
      ]);

      setWorkouts(
        Array.isArray(
          workoutsResponse,
        )
          ? workoutsResponse
          : [],
      );

      setNutrition(
        groupNutritionByDate(
          extractNutritionEntries(
            nutritionResponse,
          ),
        ),
      );

      setGoals(
        normalizeGoals(
          goalsResponse,
        ),
      );

      setRestDays(
        extractRestDays(
          restDaysResponse,
        ),
      );
    } catch (loadError) {
      console.error(
        'Failed to load calendar:',
        loadError,
      );

      setError(
        loadError.message
        || 'Failed to load calendar data.',
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    const loadTimer = setTimeout(() => {
      loadCalendarData();
    }, 0);

    return () => {
      clearTimeout(loadTimer);
    };
  }, []);


  /* =========================================
     WORKOUTS BY DATE
  ========================================= */

  const workoutsByDate =
    useMemo(() => {
      return workouts.reduce(
        (
          grouped,
          workout,
        ) => {
          const date =
            normalizeDate(
              workout.date,
            );

          if (!date) {
            return grouped;
          }

          if (
            !grouped[
              date
            ]
          ) {
            grouped[
              date
            ] = [];
          }

          grouped[
            date
          ].push(
            workout,
          );

          return grouped;
        },
        {},
      );
    }, [
      workouts,
    ]);


  /* =========================================
     CALENDAR CELLS
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

      const mondayOffset =
        (
          firstDay + 6
        ) % 7;

      const cells = [];

      for (
        let index = 0;
        index <
        mondayOffset;
        index += 1
      ) {
        cells.push(
          null,
        );
      }

      for (
        let day = 1;
        day <=
        daysInMonth;
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

        const restDay =
          restDays.includes(
            date,
          )
          && dayWorkouts.length ===
            0;

        const score =
          calculateDayScore(
            dayWorkouts,
            dayNutrition,
            restDay,
            goals,
          );

        cells.push({
          day,
          date,

          workouts:
            dayWorkouts,

          nutrition:
            dayNutrition,

          restDay,

          future:
            isFutureDate(
              date,
            ),

          score,
        });
      }

      while (
        cells.length % 7 !==
        0
      ) {
        cells.push(
          null,
        );
      }

      return cells;
    }, [
      currentMonth,
      workoutsByDate,
      nutrition,
      restDays,
      goals,
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

  const selectedIsRestDay =
    restDays.includes(
      selectedDate,
    )
    && selectedWorkouts.length ===
      0;

  const selectedIsFuture =
    isFutureDate(
      selectedDate,
    );

  const selectedScore =
    calculateDayScore(
      selectedWorkouts,
      selectedNutrition,
      selectedIsRestDay,
      goals,
    );

  const selectedLevel =
    getScoreLevel(
      selectedScore.total,
      selectedIsFuture,
    );

  const selectedTotals =
    selectedScore
      .nutritionTotals;

  const goalsConfigured =
    getConfiguredGoals(
      goals,
    ).length > 0;


  /* =========================================
     REST DAY
  ========================================= */

  async function toggleRestDay() {
    if (
      selectedIsFuture
      || selectedWorkouts.length >
        0
      || restSaving
    ) {
      return;
    }

    const exists =
      restDays.includes(
        selectedDate,
      );

    try {
      setRestSaving(
        true,
      );

      setError('');

      if (exists) {
        await deleteRestDay(
          selectedDate,
        );
      } else {
        await createRestDay({
          date:
            selectedDate,

          note: '',
        });
      }

      const response =
        await getRestDays();

      setRestDays(
        extractRestDays(
          response,
        ),
      );
    } catch (restError) {
      console.error(
        'Failed to update rest day:',
        restError,
      );

      setError(
        restError.message
        || 'Failed to update rest day.',
      );
    } finally {
      setRestSaving(
        false,
      );
    }
  }


  /* =========================================
     MONTH NAVIGATION
  ========================================= */

  function changeMonth(
    direction,
  ) {
    const nextDate =
      new Date(
        currentMonth.year,
        currentMonth.month
        + direction,
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


  /* =========================================
     RENDER
  ========================================= */

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
            See training,
            recovery and
            nutrition quality
            together across each
            day.
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
          API STATUS
      ===================================== */}

      {error && (

        <div className="calendar-page__goal-notice">

          <Target
            size={14}
          />

          {error}

        </div>

      )}


      {/* =====================================
          LEGEND
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


        <div>

          <span className="calendar-page__legend-dot calendar-page__legend-dot--rest" />

          <strong>
            Rest
          </strong>

          <span>
            Recovery day
          </span>

        </div>


        <p>
          Training / recovery =
          40% · nutrition targets =
          60%
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
              changeMonth(
                -1,
              )
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
              changeMonth(
                1,
              )
            }
          >
            <ChevronRight
              size={18}
            />
          </button>

        </div>


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

                restDay,
                future,
                score,
              } =
                calendarDay;

              const level =
                getScoreLevel(
                  score.total,
                  future,
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
                  key={
                    date
                  }
                  className={[
                    'calendar-page__day',

                    `calendar-page__day--${level}`,

                    restDay
                      ? 'calendar-page__day--rest'
                      : '',

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
                    .join(
                      ' ',
                    )}
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

                    {!future && (

                      <strong className="calendar-page__score">
                        {
                          score.total
                        }%
                      </strong>

                    )}

                  </div>


                  {!future && (

                    <div className="calendar-page__day-progress">

                      <span
                        style={{
                          width:
                            `${score.total}%`,
                        }}
                      />

                    </div>

                  )}


                  <div className="calendar-page__day-activity">

                    {restDay ? (

                      <span className="calendar-page__rest-badge">

                        <Moon
                          size={12}
                        />

                        Rest
                      </span>

                    ) : (

                      <span>

                        <Dumbbell
                          size={12}
                        />

                        {
                          dayWorkouts.length
                        }
                      </span>

                    )}


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
          SELECTED DAY
      ===================================== */}

      <section className="calendar-page__details">

        {/* =================================
            SCORE SUMMARY
        ================================= */}

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

              {selectedIsRestDay && (

                <div className="calendar-page__rest-status">

                  <Moon
                    size={13}
                  />

                  Intentional recovery day
                </div>

              )}

            </div>


            <div
              className={`calendar-page__score-circle calendar-page__score-circle--${selectedLevel}`}
            >

              {selectedIsFuture ? (

                <>
                  <CalendarDays
                    size={20}
                  />

                  <span>
                    Upcoming
                  </span>
                </>

              ) : (

                <>
                  <strong>
                    {
                      selectedScore.total
                    }%
                  </strong>

                  <span>
                    {getScoreLabel(
                      selectedScore.total,
                      false,
                    )}
                  </span>
                </>

              )}

            </div>

          </div>


          {!selectedIsFuture && (

            <>

              <div className="calendar-page__breakdown">

                {/* TRAINING */}

                <div>

                  <div className="calendar-page__breakdown-heading">

                    <span>
                      Training /
                      Recovery
                    </span>

                    <strong>
                      {
                        selectedScore
                          .trainingScore
                      }
                      /40
                    </strong>

                  </div>

                  <div className="calendar-page__breakdown-bar">

                    <span
                      style={{
                        width:
                          `${(
                            selectedScore
                              .trainingScore
                            / 40
                          ) * 100}%`,
                      }}
                    />

                  </div>

                </div>


                {/* NUTRITION */}

                <div>

                  <div className="calendar-page__breakdown-heading">

                    <span>
                      Nutrition
                    </span>

                    <strong>
                      {
                        selectedScore
                          .nutritionScore
                      }
                      /60
                    </strong>

                  </div>

                  <div className="calendar-page__breakdown-bar">

                    <span
                      style={{
                        width:
                          `${(
                            selectedScore
                              .nutritionScore
                            / 60
                          ) * 100}%`,
                      }}
                    />

                  </div>

                </div>

              </div>


              {/* =============================
                  NUTRITION SCORE DETAIL
              ============================= */}

              <div className="calendar-page__nutrition-score">

                <div className="calendar-page__nutrition-score-heading">

                  <div>

                    <Target
                      size={15}
                    />

                    <div>

                      <strong>
                        Nutrition Score
                      </strong>

                      <span>
                        {
                          selectedScore
                            .nutritionMode
                          === 'targets'
                            ? 'Based on your configured daily targets'
                            : 'Targets are not configured yet — using meal logging'
                        }
                      </span>

                    </div>

                  </div>

                  <strong>
                    {
                      selectedScore
                        .nutritionScore
                    }
                    /60
                  </strong>

                </div>


                {selectedScore
                  .nutritionMode ===
                'targets' ? (

                  <div className="calendar-page__nutrition-targets">

                    {selectedScore
                      .goalScores
                      .map(
                        (goal) => (

                          <div
                            className="calendar-page__nutrition-target"
                            key={
                              goal.key
                            }
                          >

                            <div className="calendar-page__nutrition-target-heading">

                              <span>
                                {
                                  goal.label
                                }
                              </span>

                              <strong>
                                {Math.round(
                                  goal.actual,
                                )}

                                {goal.unit ===
                                'g'
                                  ? 'g'
                                  : ''}{' '}

                                /{' '}

                                {
                                  goal.target
                                }

                                {goal.unit ===
                                'g'
                                  ? 'g'
                                  : ` ${goal.unit}`}
                              </strong>

                              <small>
                                {
                                  goal.percentage
                                }%
                              </small>

                            </div>


                            <div className="calendar-page__nutrition-target-bar">

                              <span
                                style={{
                                  width:
                                    `${Math.min(
                                      100,
                                      Math.max(
                                        0,
                                        goal.ratio
                                        * 100,
                                      ),
                                    )}%`,
                                }}
                              />

                            </div>

                          </div>

                        ),
                      )}

                  </div>

                ) : (

                  <div className="calendar-page__logging-score">

                    {MEALS.map(
                      (meal) => {
                        const logged =
                          selectedScore
                            .loggedMeals
                            .includes(
                              meal,
                            );

                        return (
                          <span
                            className={
                              logged
                                ? 'calendar-page__logging-meal calendar-page__logging-meal--complete'
                                : 'calendar-page__logging-meal'
                            }
                            key={
                              meal
                            }
                          >
                            {meal}
                          </span>
                        );
                      },
                    )}

                  </div>

                )}

              </div>


              {/* =============================
                  REST CONTROL
              ============================= */}

              <div className="calendar-page__rest-control">

                <div>

                  <Moon
                    size={16}
                  />

                  <div>

                    <strong>
                      Recovery Day
                    </strong>

                    <span>
                      Rest is part of
                      progress too.
                    </span>

                  </div>

                </div>


                {selectedWorkouts.length >
                0 ? (

                  <span className="calendar-page__rest-control-note">
                    Workout completed
                  </span>

                ) : (

                  <button
                    type="button"
                    disabled={
                      restSaving
                      || loading
                    }
                    className={
                      selectedIsRestDay
                        ? 'button calendar-page__rest-button calendar-page__rest-button--active'
                        : 'button calendar-page__rest-button'
                    }
                    onClick={
                      toggleRestDay
                    }
                  >
                    <Moon
                      size={14}
                    />

                    {
                      restSaving
                        ? 'Saving...'
                        : selectedIsRestDay
                          ? 'Remove Rest Day'
                          : 'Mark Rest Day'
                    }
                  </button>

                )}

              </div>

            </>

          )}

        </article>


        {/* =================================
            TRAINING
        ================================= */}

        <article className="panel calendar-page__section">

          <div className="calendar-page__section-heading">

            <div className="calendar-page__section-icon">

              {selectedIsRestDay ? (

                <Moon
                  size={17}
                />

              ) : (

                <Dumbbell
                  size={17}
                />

              )}

            </div>

            <div>

              <h3>
                {
                  selectedIsRestDay
                    ? 'Recovery'
                    : 'Training'
                }
              </h3>

              <span>
                {
                  selectedIsRestDay
                    ? 'Rest day'
                    : `${selectedWorkouts.length} ${
                        selectedWorkouts.length ===
                        1
                          ? 'workout'
                          : 'workouts'
                      }`
                }
              </span>

            </div>

          </div>


          {selectedIsRestDay ? (

            <div className="calendar-page__recovery">

              <Moon
                size={20}
              />

              <div>

                <strong>
                  Intentional Rest Day
                </strong>

                <span>
                  Recovery counts
                  toward the daily
                  training score.
                </span>

              </div>

            </div>

          ) : selectedWorkouts.length ===
          0 ? (

            <div className="calendar-page__empty">
              No workout completed
              on this day.
            </div>

          ) : (

            <div className="calendar-page__workouts">

              {selectedWorkouts.map(
                (workout) => {
                  const exercises =
                    workout.exercises
                    || [];

                  const repSets =
                    exercises.reduce(
                      (
                        total,
                        exercise,
                      ) => {
                        const mode =
                          exercise
                            .trackingMode
                          || 'reps';

                        if (
                          mode !==
                          'reps'
                        ) {
                          return total;
                        }

                        return (
                          total
                          + (
                            exercise.sets
                            || []
                          ).length
                        );
                      },
                      0,
                    );

                  const intervals =
                    exercises.reduce(
                      (
                        total,
                        exercise,
                      ) => {
                        if (
                          exercise
                            .trackingMode !==
                          'time'
                        ) {
                          return total;
                        }

                        return (
                          total
                          + (
                            exercise.sets
                            || []
                          ).length
                        );
                      },
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
                          {
                            workout.name
                            || 'Workout'
                          }
                        </strong>

                        <span>
                          {
                            exercises.length
                          }{' '}
                          exercises

                          {repSets > 0
                            && ` · ${repSets} sets`}

                          {intervals > 0
                            && ` · ${intervals} intervals`}
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
                {
                  selectedNutrition.length ===
                  1
                    ? 'entry'
                    : 'entries'
                }
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
                {
                  goals.calories
                    ? `/ ${goals.calories} kcal`
                    : 'kcal'
                }
              </span>

            </div>


            <div>

              <strong>
                {Math.round(
                  selectedTotals.protein,
                )}g
              </strong>

              <span>
                {
                  goals.protein
                    ? `/ ${goals.protein}g protein`
                    : 'protein'
                }
              </span>

            </div>


            <div>

              <strong>
                {Math.round(
                  selectedTotals.carbs,
                )}g
              </strong>

              <span>
                {
                  goals.carbs
                    ? `/ ${goals.carbs}g carbs`
                    : 'carbs'
                }
              </span>

            </div>


            <div>

              <strong>
                {Math.round(
                  selectedTotals.fat,
                )}g
              </strong>

              <span>
                {
                  goals.fat
                    ? `/ ${goals.fat}g fat`
                    : 'fat'
                }
              </span>

            </div>

          </div>


          {!goalsConfigured && (

            <div className="calendar-page__goal-notice">

              <Target
                size={14}
              />

              Nutrition targets
              have not been set
              yet. Calendar
              nutrition scoring is
              temporarily based on
              meal logging.

            </div>

          )}


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
                  entries.length > 0;

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
                      .join(
                        ' ',
                      )}
                    key={
                      meal
                    }
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
                          {
                            logged
                              ? `${entries.length} ${
                                  entries.length === 1
                                    ? 'item'
                                    : 'items'
                                }`
                              : 'Not logged'
                          }
                        </span>

                      </div>

                    </div>


                    {logged && (

                      <>

                        <div className="calendar-page__meal-macros">

                          <span>
                            {Math.round(
                              totals.calories,
                            )}{' '}
                            kcal
                          </span>

                          <span>
                            {Math.round(
                              totals.protein,
                            )}g P
                          </span>

                          <span>
                            {Math.round(
                              totals.carbs,
                            )}g C
                          </span>

                          <span>
                            {Math.round(
                              totals.fat,
                            )}g F
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
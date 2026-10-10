import { useMemo, useState } from 'react';

import {
  Apple,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Coffee,
  Cookie,
  Plus,
  Search,
  Target,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';

import './NutritionPage.css';

const STORAGE_KEY = 'forge:nutritionLogs';
const GOALS_KEY = 'forge:nutritionGoals';

const MEALS = [
  'Breakfast',
  'Lunch',
  'Snacks',
  'Dinner',
];

/* =========================================
   STORAGE
========================================= */

function loadNutritionLogs() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '{}',
    );

    return stored &&
      typeof stored === 'object' &&
      !Array.isArray(stored)
      ? stored
      : {};
  } catch {
    return {};
  }
}

function loadNutritionGoals() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(GOALS_KEY) || '{}',
    );

    return stored &&
      typeof stored === 'object' &&
      !Array.isArray(stored)
      ? {
          calories:
            Number(stored.calories) || 0,

          protein:
            Number(stored.protein) || 0,

          carbs:
            Number(stored.carbs) || 0,

          fat:
            Number(stored.fat) || 0,
        }
      : {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        };
  } catch {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };
  }
}

function saveNutritionLogs(logs) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(logs),
  );
}

/* =========================================
   DATE HELPERS
========================================= */

function getToday() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) {
    return 'Unknown date';
  }

  return new Date(
    `${dateString}T12:00:00`,
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
   NUTRITION HELPERS
========================================= */

function getTotals(entries = []) {
  return entries.reduce(
    (totals, entry) => ({
      calories:
        totals.calories +
        Number(entry.calories || 0),

      protein:
        totals.protein +
        Number(entry.protein || 0),

      carbs:
        totals.carbs +
        Number(entry.carbs || 0),

      fat:
        totals.fat +
        Number(entry.fat || 0),
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  );
}

function getMealEntries(
  entries,
  meal,
) {
  return entries.filter(
    (entry) =>
      entry.meal === meal,
  );
}

function getMealIcon(meal) {
  switch (meal) {
    case 'Breakfast':
      return Coffee;

    case 'Snacks':
      return Cookie;

    case 'Lunch':
    case 'Dinner':
      return Utensils;

    default:
      return Apple;
  }
}

function hasNutritionGoals(goals) {
  return (
    goals.calories > 0 ||
    goals.protein > 0 ||
    goals.carbs > 0 ||
    goals.fat > 0
  );
}

function getPercentage(
  value,
  target,
) {
  if (!target) {
    return null;
  }

  return Math.round(
    (Number(value || 0) /
      target) *
      100,
  );
}

function getProgressWidth(
  value,
  target,
) {
  if (!target) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (Number(value || 0) /
        target) *
        100,
    ),
  );
}

/* =========================================
   EMPTY FORM
========================================= */

function createEmptyForm(
  date = getToday(),
  meal = 'Breakfast',
) {
  return {
    date,
    meal,
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  };
}

/* =========================================
   PAGE
========================================= */

export default function NutritionPage() {
  const [logs, setLogs] =
    useState(
      loadNutritionLogs,
    );

  const [goals] =
    useState(
      loadNutritionGoals,
    );

  const [
    expandedDate,
    setExpandedDate,
  ] = useState(null);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState(() =>
    createEmptyForm(),
  );

  const goalsConfigured =
    hasNutritionGoals(
      goals,
    );

  /* =========================================
     DAYS
  ========================================= */

  const days =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return Object.entries(
        logs,
      )
        .filter(
          ([, entries]) =>
            Array.isArray(
              entries,
            ) &&
            entries.length > 0,
        )
        .sort(
          ([dateA], [dateB]) =>
            dateB.localeCompare(
              dateA,
            ),
        )
        .filter(
          ([date, entries]) => {
            if (!query) {
              return true;
            }

            const dateMatch =
              formatDate(date)
                .toLowerCase()
                .includes(
                  query,
                );

            const foodMatch =
              entries.some(
                (entry) =>
                  entry.name
                    ?.toLowerCase()
                    .includes(
                      query,
                    ),
              );

            return (
              dateMatch ||
              foodMatch
            );
          },
        );
    }, [
      logs,
      search,
    ]);

  /* =========================================
     PAGE STATS
  ========================================= */

  const stats =
    useMemo(() => {
      const allEntries =
        Object.values(
          logs,
        )
          .filter(
            Array.isArray,
          )
          .flat();

      const todayEntries =
        logs[getToday()] ||
        [];

      const todayTotals =
        getTotals(
          todayEntries,
        );

      const trackedDays =
        Object.values(
          logs,
        ).filter(
          (entries) =>
            Array.isArray(
              entries,
            ) &&
            entries.length > 0,
        ).length;

      return {
        trackedDays,

        totalEntries:
          allEntries.length,

        todayCalories:
          todayTotals.calories,

        todayProtein:
          todayTotals.protein,
      };
    }, [logs]);

  /* =========================================
     ADD FOOD
  ========================================= */

  function openAddFood(
    date = getToday(),
    meal = 'Breakfast',
  ) {
    setForm(
      createEmptyForm(
        date,
        meal,
      ),
    );

    setShowModal(
      true,
    );
  }

  function closeModal() {
    setShowModal(
      false,
    );
  }

  function updateForm(
    field,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  /* =========================================
     SAVE FOOD
  ========================================= */

  function saveFood(event) {
    event.preventDefault();

    const name =
      form.name.trim();

    if (!name) {
      return;
    }

    const entry = {
      id:
        crypto.randomUUID?.() ||
        `${Date.now()}-${Math.random()}`,

      name,

      meal:
        form.meal,

      calories:
        Number(
          form.calories,
        ) || 0,

      protein:
        Number(
          form.protein,
        ) || 0,

      carbs:
        Number(
          form.carbs,
        ) || 0,

      fat:
        Number(
          form.fat,
        ) || 0,

      createdAt:
        new Date().toISOString(),
    };

    const updated = {
      ...logs,

      [form.date]: [
        ...(logs[form.date] ||
          []),

        entry,
      ],
    };

    saveNutritionLogs(
      updated,
    );

    setLogs(
      updated,
    );

    setExpandedDate(
      form.date,
    );

    setShowModal(
      false,
    );
  }

  /* =========================================
     DELETE FOOD
  ========================================= */

  function deleteFood(
    date,
    entryId,
  ) {
    const entries =
      logs[date] || [];

    const entry =
      entries.find(
        (item) =>
          item.id ===
          entryId,
      );

    const confirmed =
      window.confirm(
        `Delete "${
          entry?.name ||
          'this food'
        }"?`,
      );

    if (!confirmed) {
      return;
    }

    const remaining =
      entries.filter(
        (item) =>
          item.id !==
          entryId,
      );

    const updated = {
      ...logs,
    };

    if (
      remaining.length ===
      0
    ) {
      delete updated[
        date
      ];
    } else {
      updated[
        date
      ] = remaining;
    }

    saveNutritionLogs(
      updated,
    );

    setLogs(
      updated,
    );

    if (
      remaining.length ===
        0 &&
      expandedDate === date
    ) {
      setExpandedDate(
        null,
      );
    }
  }

  return (
    <main className="nutrition-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            Nutrition Log
          </span>

          <h1 className="page__title">
            Nutrition
          </h1>

          <p className="page__description">
            Track each day,
            meal and food entry
            against your personal
            nutrition targets.
          </p>

        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={() =>
            openAddFood()
          }
        >
          <Plus size={16} />
          Add Food
        </button>

      </header>

      {/* =====================================
          TODAY STATS
      ===================================== */}

      <section className="nutrition-page__stats">

        <article className="nutrition-page__stat">

          <span>
            Calories Today
          </span>

          <strong>
            {Math.round(
              stats.todayCalories,
            )}
          </strong>

          <small>
            {goals.calories
              ? `of ${goals.calories} kcal`
              : 'kcal logged'}
          </small>

        </article>

        <article className="nutrition-page__stat">

          <span>
            Protein Today
          </span>

          <strong>
            {Math.round(
              stats.todayProtein,
            )}g
          </strong>

          <small>
            {goals.protein
              ? `of ${goals.protein}g`
              : 'protein logged'}
          </small>

        </article>

        <article className="nutrition-page__stat">

          <span>
            Tracked Days
          </span>

          <strong>
            {
              stats.trackedDays
            }
          </strong>

          <small>
            days logged
          </small>

        </article>

        <article className="nutrition-page__stat">

          <span>
            Food Entries
          </span>

          <strong>
            {
              stats.totalEntries
            }
          </strong>

          <small>
            total
          </small>

        </article>

      </section>

      {/* =====================================
          GOALS INFO
      ===================================== */}

      {goalsConfigured ? (

        <section className="panel nutrition-page__goals">

          <div className="nutrition-page__goals-heading">

            <div className="nutrition-page__goals-icon">
              <Target
                size={17}
              />
            </div>

            <div>
              <h2>
                Daily Targets
              </h2>

              <p>
                These targets are
                used when evaluating
                your nutrition days.
              </p>
            </div>

          </div>

          <div className="nutrition-page__goal-values">

            {goals.calories >
              0 && (
              <div>
                <strong>
                  {
                    goals.calories
                  }
                </strong>

                <span>
                  kcal
                </span>
              </div>
            )}

            {goals.protein >
              0 && (
              <div>
                <strong>
                  {
                    goals.protein
                  }g
                </strong>

                <span>
                  protein
                </span>
              </div>
            )}

            {goals.carbs >
              0 && (
              <div>
                <strong>
                  {
                    goals.carbs
                  }g
                </strong>

                <span>
                  carbs
                </span>
              </div>
            )}

            {goals.fat >
              0 && (
              <div>
                <strong>
                  {
                    goals.fat
                  }g
                </strong>

                <span>
                  fat
                </span>
              </div>
            )}

          </div>

        </section>

      ) : (

        <section className="nutrition-page__no-goals">

          <Target size={15} />

          <span>
            No nutrition targets
            configured yet.
          </span>

        </section>

      )}

      {/* =====================================
          HISTORY HEADER
      ===================================== */}

      <div className="nutrition-page__section-header">

        <div>

          <h2>
            Nutrition History
          </h2>

          <p>
            Open a day to see
            meals, foods and
            target progress.
          </p>

        </div>

        <div className="nutrition-page__search">

          <Search
            size={15}
          />

          <input
            type="search"
            placeholder="Search days or foods..."
            value={
              search
            }
            onChange={(
              event,
            ) =>
              setSearch(
                event.target
                  .value,
              )
            }
          />

        </div>

      </div>

      {/* =====================================
          EMPTY
      ===================================== */}

      {days.length === 0 ? (

        <section className="panel nutrition-page__empty">

          <Apple
            size={28}
          />

          <h3>
            {stats.trackedDays ===
            0
              ? 'No nutrition logged'
              : 'No matching entries'}
          </h3>

          <p>
            {stats.trackedDays ===
            0
              ? 'Start logging food and your nutrition days will appear here.'
              : 'Try a different search.'}
          </p>

          {stats.trackedDays ===
            0 && (

            <button
              type="button"
              className="button button--primary"
              onClick={() =>
                openAddFood()
              }
            >
              <Plus
                size={15}
              />

              Add Food
            </button>

          )}

        </section>

      ) : (

        /* ===================================
           DAYS
        =================================== */

        <section className="nutrition-page__days">

          {days.map(
            ([date, entries]) => {
              const expanded =
                expandedDate ===
                date;

              const totals =
                getTotals(
                  entries,
                );

              const mealCount =
                MEALS.filter(
                  (meal) =>
                    getMealEntries(
                      entries,
                      meal,
                    ).length >
                    0,
                ).length;

              const caloriePercent =
                getPercentage(
                  totals.calories,
                  goals.calories,
                );

              const proteinPercent =
                getPercentage(
                  totals.protein,
                  goals.protein,
                );

              const carbPercent =
                getPercentage(
                  totals.carbs,
                  goals.carbs,
                );

              const fatPercent =
                getPercentage(
                  totals.fat,
                  goals.fat,
                );

              return (
                <article
                  className="panel nutrition-page__day"
                  key={
                    date
                  }
                >

                  {/* =========================
                      DAY SUMMARY
                  ========================= */}

                  <button
                    type="button"
                    className="nutrition-page__day-toggle"
                    onClick={() =>
                      setExpandedDate(
                        expanded
                          ? null
                          : date,
                      )
                    }
                  >

                    <div className="nutrition-page__day-icon">
                      <CalendarDays
                        size={19}
                      />
                    </div>

                    <div className="nutrition-page__day-main">

                      <div className="nutrition-page__day-heading">

                        <div>

                          <h3>
                            {formatDate(
                              date,
                            )}
                          </h3>

                          <span>
                            {date ===
                            getToday()
                              ? 'Today'
                              : `${entries.length} ${
                                  entries.length ===
                                  1
                                    ? 'food entry'
                                    : 'food entries'
                                }`}
                          </span>

                        </div>

                      </div>

                      <div className="nutrition-page__day-macros">

                        <div>
                          <strong>
                            {Math.round(
                              totals.calories,
                            )}
                          </strong>

                          <span>
                            {goals.calories
                              ? `/ ${goals.calories} kcal`
                              : 'kcal'}
                          </span>
                        </div>

                        <div>
                          <strong>
                            {Math.round(
                              totals.protein,
                            )}g
                          </strong>

                          <span>
                            {goals.protein
                              ? `/ ${goals.protein}g protein`
                              : 'protein'}
                          </span>
                        </div>

                        <div>
                          <strong>
                            {Math.round(
                              totals.carbs,
                            )}g
                          </strong>

                          <span>
                            {goals.carbs
                              ? `/ ${goals.carbs}g carbs`
                              : 'carbs'}
                          </span>
                        </div>

                        <div>
                          <strong>
                            {Math.round(
                              totals.fat,
                            )}g
                          </strong>

                          <span>
                            {goals.fat
                              ? `/ ${goals.fat}g fat`
                              : 'fat'}
                          </span>
                        </div>

                      </div>

                      <div className="nutrition-page__day-meta">

                        <span>
                          {mealCount}{' '}
                          {mealCount ===
                          1
                            ? 'meal'
                            : 'meals'}{' '}
                          logged
                        </span>

                      </div>

                    </div>

                    {expanded ? (
                      <ChevronUp
                        size={19}
                      />
                    ) : (
                      <ChevronDown
                        size={19}
                      />
                    )}

                  </button>

                  {/* =========================
                      EXPANDED DAY
                  ========================= */}

                  {expanded && (

                    <div className="nutrition-page__day-details">

                      {/* =====================
                          TARGET PROGRESS
                      ===================== */}

                      {goalsConfigured && (

                        <section className="nutrition-page__target-progress">

                          <div className="nutrition-page__target-progress-heading">

                            <div>

                              <span>
                                Daily Targets
                              </span>

                              <h4>
                                Nutrition Progress
                              </h4>

                            </div>

                            <Target
                              size={16}
                            />

                          </div>

                          <div className="nutrition-page__target-list">

                            {goals.calories >
                              0 && (

                              <div className="nutrition-page__target">

                                <div className="nutrition-page__target-heading">

                                  <span>
                                    Calories
                                  </span>

                                  <strong>
                                    {Math.round(
                                      totals.calories,
                                    )}{' '}
                                    /{' '}
                                    {
                                      goals.calories
                                    }{' '}
                                    kcal
                                  </strong>

                                  <small>
                                    {
                                      caloriePercent
                                    }%
                                  </small>

                                </div>

                                <div className="nutrition-page__target-bar">

                                  <span
                                    style={{
                                      width: `${getProgressWidth(
                                        totals.calories,
                                        goals.calories,
                                      )}%`,
                                    }}
                                  />

                                </div>

                              </div>

                            )}

                            {goals.protein >
                              0 && (

                              <div className="nutrition-page__target">

                                <div className="nutrition-page__target-heading">

                                  <span>
                                    Protein
                                  </span>

                                  <strong>
                                    {Math.round(
                                      totals.protein,
                                    )}g /{' '}
                                    {
                                      goals.protein
                                    }g
                                  </strong>

                                  <small>
                                    {
                                      proteinPercent
                                    }%
                                  </small>

                                </div>

                                <div className="nutrition-page__target-bar">

                                  <span
                                    style={{
                                      width: `${getProgressWidth(
                                        totals.protein,
                                        goals.protein,
                                      )}%`,
                                    }}
                                  />

                                </div>

                              </div>

                            )}

                            {goals.carbs >
                              0 && (

                              <div className="nutrition-page__target">

                                <div className="nutrition-page__target-heading">

                                  <span>
                                    Carbs
                                  </span>

                                  <strong>
                                    {Math.round(
                                      totals.carbs,
                                    )}g /{' '}
                                    {
                                      goals.carbs
                                    }g
                                  </strong>

                                  <small>
                                    {
                                      carbPercent
                                    }%
                                  </small>

                                </div>

                                <div className="nutrition-page__target-bar">

                                  <span
                                    style={{
                                      width: `${getProgressWidth(
                                        totals.carbs,
                                        goals.carbs,
                                      )}%`,
                                    }}
                                  />

                                </div>

                              </div>

                            )}

                            {goals.fat >
                              0 && (

                              <div className="nutrition-page__target">

                                <div className="nutrition-page__target-heading">

                                  <span>
                                    Fat
                                  </span>

                                  <strong>
                                    {Math.round(
                                      totals.fat,
                                    )}g /{' '}
                                    {
                                      goals.fat
                                    }g
                                  </strong>

                                  <small>
                                    {
                                      fatPercent
                                    }%
                                  </small>

                                </div>

                                <div className="nutrition-page__target-bar">

                                  <span
                                    style={{
                                      width: `${getProgressWidth(
                                        totals.fat,
                                        goals.fat,
                                      )}%`,
                                    }}
                                  />

                                </div>

                              </div>

                            )}

                          </div>

                        </section>

                      )}

                      {/* =====================
                          MEALS
                      ===================== */}

                      {MEALS.map(
                        (meal) => {
                          const mealEntries =
                            getMealEntries(
                              entries,
                              meal,
                            );

                          const mealTotals =
                            getTotals(
                              mealEntries,
                            );

                          const MealIcon =
                            getMealIcon(
                              meal,
                            );

                          return (
                            <section
                              className="nutrition-page__meal"
                              key={
                                meal
                              }
                            >

                              {/* MEAL HEADER */}

                              <div className="nutrition-page__meal-header">

                                <div className="nutrition-page__meal-title">

                                  <div className="nutrition-page__meal-icon">
                                    <MealIcon
                                      size={16}
                                    />
                                  </div>

                                  <div>

                                    <h4>
                                      {meal}
                                    </h4>

                                    <span>
                                      {
                                        mealEntries.length
                                      }{' '}
                                      {mealEntries.length ===
                                      1
                                        ? 'item'
                                        : 'items'}
                                    </span>

                                  </div>

                                </div>

                                <button
                                  type="button"
                                  className="nutrition-page__meal-add"
                                  onClick={() =>
                                    openAddFood(
                                      date,
                                      meal,
                                    )
                                  }
                                >
                                  <Plus
                                    size={14}
                                  />

                                  Add Food
                                </button>

                              </div>

                              {/* MEAL TOTALS */}

                              {mealEntries.length >
                                0 && (

                                <div className="nutrition-page__meal-totals">

                                  <span>
                                    <strong>
                                      {Math.round(
                                        mealTotals.calories,
                                      )}
                                    </strong>
                                    kcal
                                  </span>

                                  <span>
                                    <strong>
                                      {Math.round(
                                        mealTotals.protein,
                                      )}g
                                    </strong>
                                    protein
                                  </span>

                                  <span>
                                    <strong>
                                      {Math.round(
                                        mealTotals.carbs,
                                      )}g
                                    </strong>
                                    carbs
                                  </span>

                                  <span>
                                    <strong>
                                      {Math.round(
                                        mealTotals.fat,
                                      )}g
                                    </strong>
                                    fat
                                  </span>

                                </div>

                              )}

                              {/* FOOD */}

                              {mealEntries.length ===
                              0 ? (

                                <div className="nutrition-page__meal-empty">
                                  No food logged
                                  for this meal.
                                </div>

                              ) : (

                                <div className="nutrition-page__foods">

                                  <div className="nutrition-page__food-heading">

                                    <span>
                                      Food
                                    </span>

                                    <span>
                                      Calories
                                    </span>

                                    <span>
                                      Protein
                                    </span>

                                    <span>
                                      Carbs
                                    </span>

                                    <span>
                                      Fat
                                    </span>

                                    <span />

                                  </div>

                                  {mealEntries.map(
                                    (entry) => (

                                      <div
                                        className="nutrition-page__food"
                                        key={
                                          entry.id
                                        }
                                      >

                                        <strong>
                                          {
                                            entry.name
                                          }
                                        </strong>

                                        <span>
                                          {Math.round(
                                            Number(
                                              entry.calories ||
                                                0,
                                            ),
                                          )}
                                        </span>

                                        <span>
                                          {Math.round(
                                            Number(
                                              entry.protein ||
                                                0,
                                            ),
                                          )}g
                                        </span>

                                        <span>
                                          {Math.round(
                                            Number(
                                              entry.carbs ||
                                                0,
                                            ),
                                          )}g
                                        </span>

                                        <span>
                                          {Math.round(
                                            Number(
                                              entry.fat ||
                                                0,
                                            ),
                                          )}g
                                        </span>

                                        <button
                                          type="button"
                                          aria-label={`Delete ${entry.name}`}
                                          onClick={() =>
                                            deleteFood(
                                              date,
                                              entry.id,
                                            )
                                          }
                                        >
                                          <Trash2
                                            size={14}
                                          />
                                        </button>

                                      </div>

                                    ),
                                  )}

                                </div>

                              )}

                            </section>
                          );
                        },
                      )}

                    </div>

                  )}

                </article>
              );
            },
          )}

        </section>

      )}

      {/* =====================================
          ADD FOOD MODAL
      ===================================== */}

      {showModal && (

        <div
          className="nutrition-page__modal-backdrop"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="nutrition-page__modal">

            <div className="nutrition-page__modal-header">

              <div>

                <span>
                  Nutrition Entry
                </span>

                <h2>
                  Add Food
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                aria-label="Close"
              >
                <X
                  size={18}
                />
              </button>

            </div>

            <form
              onSubmit={
                saveFood
              }
            >

              <div className="nutrition-page__form-grid">

                <label className="nutrition-page__field nutrition-page__field--full">

                  <span>
                    Food / Meal Name
                  </span>

                  <input
                    type="text"
                    placeholder="e.g. Chicken and rice"
                    value={
                      form.name
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'name',
                        event.target
                          .value,
                      )
                    }
                    autoFocus
                  />

                </label>

                <label className="nutrition-page__field">

                  <span>
                    Date
                  </span>

                  <input
                    type="date"
                    value={
                      form.date
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'date',
                        event.target
                          .value,
                      )
                    }
                    required
                  />

                </label>

                <label className="nutrition-page__field">

                  <span>
                    Meal
                  </span>

                  <select
                    value={
                      form.meal
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'meal',
                        event.target
                          .value,
                      )
                    }
                  >

                    {MEALS.map(
                      (meal) => (

                        <option
                          value={
                            meal
                          }
                          key={
                            meal
                          }
                        >
                          {meal}
                        </option>

                      ),
                    )}

                  </select>

                </label>

                <label className="nutrition-page__field">

                  <span>
                    Calories
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={
                      form.calories
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'calories',
                        event.target
                          .value,
                      )
                    }
                  />

                </label>

                <label className="nutrition-page__field">

                  <span>
                    Protein (g)
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={
                      form.protein
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'protein',
                        event.target
                          .value,
                      )
                    }
                  />

                </label>

                <label className="nutrition-page__field">

                  <span>
                    Carbs (g)
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={
                      form.carbs
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'carbs',
                        event.target
                          .value,
                      )
                    }
                  />

                </label>

                <label className="nutrition-page__field">

                  <span>
                    Fat (g)
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={
                      form.fat
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'fat',
                        event.target
                          .value,
                      )
                    }
                  />

                </label>

              </div>

              <div className="nutrition-page__modal-actions">

                <button
                  type="button"
                  className="button"
                  onClick={
                    closeModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="button button--primary"
                >
                  Add Food
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}
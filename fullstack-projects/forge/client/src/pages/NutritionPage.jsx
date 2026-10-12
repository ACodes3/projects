import {
  useEffect,
  useMemo,
  useState,
} from 'react';

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

import {
  createNutritionEntry,
  deleteNutritionEntry,
  getNutritionEntries,
  getNutritionGoals,
} from '../api/forgeApi.js';

import './NutritionPage.css';


const MEALS = [
  'Breakfast',
  'Lunch',
  'Snacks',
  'Dinner',
];


const EMPTY_GOALS = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};


/* =========================================
   API NORMALIZATION
========================================= */

function normalizeDate(value) {
  if (!value) {
    return '';
  }

  if (
    typeof value === 'string'
  ) {
    return value.slice(0, 10);
  }

  try {
    return new Date(value)
      .toISOString()
      .slice(0, 10);
  } catch {
    return '';
  }
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

    name:
      entry.name
      ?? '',

    meal:
      entry.meal
      ?? 'Breakfast',

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

    createdAt:
      entry.created_at
      ?? entry.createdAt
      ?? null,
  };
}


function extractEntries(
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


function groupEntriesByDate(
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

      if (!grouped[entry.date]) {
        grouped[entry.date] = [];
      }

      grouped[entry.date].push(
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


/* =========================================
   DATE HELPERS
========================================= */

function getToday() {
  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      '0',
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      '0',
    );

  return `${year}-${month}-${day}`;
}


function formatDate(
  dateString,
) {
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

function getTotals(
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


function getMealEntries(
  entries,
  meal,
) {
  return entries.filter(
    (entry) =>
      entry.meal === meal,
  );
}


function getMealIcon(
  meal,
) {
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


function hasNutritionGoals(
  goals,
) {
  return (
    goals.calories > 0
    || goals.protein > 0
    || goals.carbs > 0
    || goals.fat > 0
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
    (
      Number(value || 0)
      / target
    ) * 100,
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
      (
        Number(value || 0)
        / target
      ) * 100,
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
  const [
    logs,
    setLogs,
  ] = useState({});

  const [
    goals,
    setGoals,
  ] = useState(
    EMPTY_GOALS,
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
  ] = useState(
    () => createEmptyForm(),
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState('');


  const goalsConfigured =
    hasNutritionGoals(
      goals,
    );


  /* =========================================
     LOAD FROM API
  ========================================= */

  async function loadNutrition() {
    try {
      setLoading(true);
      setError('');

      const [
        entriesResponse,
        goalsResponse,
      ] = await Promise.all([
        getNutritionEntries(),
        getNutritionGoals(),
      ]);

      const entries =
        extractEntries(
          entriesResponse,
        );

      setLogs(
        groupEntriesByDate(
          entries,
        ),
      );

      setGoals(
        normalizeGoals(
          goalsResponse,
        ),
      );
    } catch (loadError) {
      console.error(
        'Failed to load nutrition:',
        loadError,
      );

      setError(
        loadError.message
        || 'Failed to load nutrition.',
      );
    } finally {
      setLoading(false);
    }
  }


  async function refreshEntries() {
    const response =
      await getNutritionEntries();

    const entries =
      extractEntries(
        response,
      );

    setLogs(
      groupEntriesByDate(
        entries,
      ),
    );
  }


  useEffect(() => {
    const timeoutId =
      setTimeout(() => {
        loadNutrition();
      }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);


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
            )
            && entries.length > 0,
        )
        .sort(
          (
            [dateA],
            [dateB],
          ) =>
            dateB.localeCompare(
              dateA,
            ),
        )
        .filter(
          (
            [
              date,
              entries,
            ],
          ) => {
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
              dateMatch
              || foodMatch
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
        logs[getToday()]
        || [];

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
            )
            && entries.length > 0,
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
    }, [
      logs,
    ]);


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

    setError('');

    setShowModal(
      true,
    );
  }


  function closeModal() {
    if (saving) {
      return;
    }

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
        [field]:
          value,
      }),
    );
  }


  /* =========================================
     SAVE FOOD TO API
  ========================================= */

  async function saveFood(
    event,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const name =
      form.name.trim();

    if (!name) {
      setError(
        'Enter a food or meal name.',
      );

      return;
    }

    const entry = {
      date:
        form.date,

      meal:
        form.meal,

      name,

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
    };

    try {
      setSaving(true);
      setError('');

      await createNutritionEntry(
        entry,
      );

      await refreshEntries();

      setExpandedDate(
        form.date,
      );

      setShowModal(
        false,
      );
    } catch (saveError) {
      console.error(
        'Failed to add food:',
        saveError,
      );

      setError(
        saveError.message
        || 'Failed to add food.',
      );
    } finally {
      setSaving(false);
    }
  }


  /* =========================================
     DELETE FOOD FROM API
  ========================================= */

  async function deleteFood(
    date,
    entryId,
  ) {
    const entries =
      logs[date]
      || [];

    const entry =
      entries.find(
        (item) =>
          item.id === entryId,
      );

    const confirmed =
      window.confirm(
        `Delete "${
          entry?.name
          || 'this food'
        }"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        entryId,
      );

      setError('');

      await deleteNutritionEntry(
        entryId,
      );

      const remaining =
        entries.filter(
          (item) =>
            item.id !==
            entryId,
        );

      setLogs(
        (current) => {
          const updated = {
            ...current,
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

          return updated;
        },
      );

      if (
        remaining.length === 0
        && expandedDate === date
      ) {
        setExpandedDate(
          null,
        );
      }
    } catch (deleteError) {
      console.error(
        'Failed to delete food:',
        deleteError,
      );

      setError(
        deleteError.message
        || 'Failed to delete food.',
      );
    } finally {
      setDeletingId(
        null,
      );
    }
  }


  /* =========================================
     RENDER
  ========================================= */

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
          disabled={
            loading
          }
        >
          <Plus size={16} />

          Add Food
        </button>

      </header>


      {/* =====================================
          ERROR
      ===================================== */}

      {error && (

        <section className="nutrition-page__no-goals">

          <X size={15} />

          <span>
            {error}
          </span>

        </section>

      )}


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
            {
              goals.calories
                ? `of ${goals.calories} kcal`
                : 'kcal logged'
            }
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
            {
              goals.protein
                ? `of ${goals.protein}g`
                : 'protein logged'
            }
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

            {goals.calories > 0 && (

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


            {goals.protein > 0 && (

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


            {goals.carbs > 0 && (

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


            {goals.fat > 0 && (

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
                event.target.value,
              )
            }
          />

        </div>

      </div>


      {/* =====================================
          HISTORY
      ===================================== */}

      {loading ? (

        <section className="panel nutrition-page__empty">

          <Apple
            size={28}
          />

          <h3>
            Loading nutrition
          </h3>

          <p>
            Loading your nutrition
            history from FORGE.
          </p>

        </section>

      ) : days.length === 0 ? (

        <section className="panel nutrition-page__empty">

          <Apple
            size={28}
          />

          <h3>
            {
              stats.trackedDays === 0
                ? 'No nutrition logged'
                : 'No matching entries'
            }
          </h3>

          <p>
            {
              stats.trackedDays === 0
                ? 'Start logging food and your nutrition days will appear here.'
                : 'Try a different search.'
            }
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
            (
              [
                date,
                entries,
              ],
            ) => {
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
                    ).length > 0,
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
                            {
                              date ===
                              getToday()
                                ? 'Today'
                                : `${entries.length} ${
                                    entries.length === 1
                                      ? 'food entry'
                                      : 'food entries'
                                  }`
                            }
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
                              totals.protein,
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
                              totals.carbs,
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
                              totals.fat,
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


                      <div className="nutrition-page__day-meta">

                        <span>
                          {mealCount}{' '}
                          {
                            mealCount === 1
                              ? 'meal'
                              : 'meals'
                          }{' '}
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

                            {goals.calories > 0 && (

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


                            {goals.protein > 0 && (

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


                            {goals.carbs > 0 && (

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


                            {goals.fat > 0 && (

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
                                      {
                                        mealEntries.length === 1
                                          ? 'item'
                                          : 'items'
                                      }
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

                              {mealEntries.length > 0 && (

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

                              {mealEntries.length === 0 ? (

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
                                              entry.calories
                                              || 0,
                                            ),
                                          )}
                                        </span>

                                        <span>
                                          {Math.round(
                                            Number(
                                              entry.protein
                                              || 0,
                                            ),
                                          )}g
                                        </span>

                                        <span>
                                          {Math.round(
                                            Number(
                                              entry.carbs
                                              || 0,
                                            ),
                                          )}g
                                        </span>

                                        <span>
                                          {Math.round(
                                            Number(
                                              entry.fat
                                              || 0,
                                            ),
                                          )}g
                                        </span>

                                        <button
                                          type="button"
                                          aria-label={`Delete ${entry.name}`}
                                          disabled={
                                            deletingId ===
                                            entry.id
                                          }
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
                disabled={
                  saving
                }
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
                        event.target.value,
                      )
                    }
                    autoFocus
                    disabled={
                      saving
                    }
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
                        event.target.value,
                      )
                    }
                    required
                    disabled={
                      saving
                    }
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
                        event.target.value,
                      )
                    }
                    disabled={
                      saving
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
                        event.target.value,
                      )
                    }
                    disabled={
                      saving
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
                        event.target.value,
                      )
                    }
                    disabled={
                      saving
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
                        event.target.value,
                      )
                    }
                    disabled={
                      saving
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
                        event.target.value,
                      )
                    }
                    disabled={
                      saving
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
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="button button--primary"
                  disabled={
                    saving
                  }
                >
                  {
                    saving
                      ? 'Adding...'
                      : 'Add Food'
                  }
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}
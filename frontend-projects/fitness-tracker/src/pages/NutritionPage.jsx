import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Plus,
  Search,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import './NutritionPage.css';

const STORAGE_KEY = 'forge:nutritionLogs';

const MEALS = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
];

/* =========================================
   DATE HELPERS
========================================= */

function getLocalDateString(date = new Date()) {
  const offset =
    date.getTimezoneOffset() *
    60000;

  return new Date(
    date.getTime() - offset,
  )
    .toISOString()
    .slice(0, 10);
}

function moveDate(
  dateString,
  amount,
) {
  const date = new Date(
    `${dateString}T12:00:00`,
  );

  date.setDate(
    date.getDate() + amount,
  );

  return getLocalDateString(date);
}

/* =========================================
   STORAGE
========================================= */

function loadNutritionLogs() {
  try {
    const stored =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!stored) {
      return {};
    }

    const parsed =
      JSON.parse(stored);

    return (
      parsed &&
      typeof parsed === 'object'
        ? parsed
        : {}
    );
  } catch {
    return {};
  }
}

/* =========================================
   EMPTY FORM
========================================= */

function createEmptyFood() {
  return {
    name: '',
    meal: 'Breakfast',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  };
}

/* =========================================
   NUTRITION PAGE
========================================= */

function NutritionPage() {
  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getLocalDateString(),
  );

  const [
    logs,
    setLogs,
  ] = useState(
    loadNutritionLogs,
  );

  const [
    showAddFood,
    setShowAddFood,
  ] = useState(false);

  const [
    foodForm,
    setFoodForm,
  ] = useState(
    createEmptyFood,
  );

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState('');

  const foods =
    useMemo(
      () => logs[selectedDate] ?? [],
      [
        logs,
        selectedDate,
      ],
    );

  /* =========================================
     TOTALS
  ========================================= */

  const totals =
    useMemo(() => {
      return foods.reduce(
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
    }, [foods]);

  /* =========================================
     FILTERED MEALS
  ========================================= */

  const foodsByMeal =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return MEALS.reduce(
        (
          result,
          meal,
        ) => {
          result[meal] =
            foods.filter(
              (food) =>
                food.meal ===
                  meal &&
                (
                  !query ||
                  food.name
                    .toLowerCase()
                    .includes(
                      query,
                    )
                ),
            );

          return result;
        },
        {},
      );
    }, [
      foods,
      search,
    ]);

  /* =========================================
     SAVE LOGS
  ========================================= */

  function saveLogs(nextLogs) {
    setLogs(nextLogs);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        nextLogs,
      ),
    );
  }

  /* =========================================
     ADD FOOD
  ========================================= */

  function handleAddFood() {
    const name =
      foodForm.name.trim();

    if (!name) {
      setError(
        'Enter a food name.',
      );
      return;
    }

    const calories =
      Number(
        foodForm.calories,
      );

    const protein =
      Number(
        foodForm.protein || 0,
      );

    const carbs =
      Number(
        foodForm.carbs || 0,
      );

    const fat =
      Number(
        foodForm.fat || 0,
      );

    if (
      !Number.isFinite(
        calories,
      ) ||
      calories < 0
    ) {
      setError(
        'Enter valid calories.',
      );
      return;
    }

    if (
      protein < 0 ||
      carbs < 0 ||
      fat < 0
    ) {
      setError(
        'Macros cannot be negative.',
      );
      return;
    }

    const food = {
      id:
        crypto.randomUUID(),

      name,

      meal:
        foodForm.meal,

      calories,
      protein,
      carbs,
      fat,

      createdAt:
        new Date().toISOString(),
    };

    const nextLogs = {
      ...logs,

      [selectedDate]: [
        ...(logs[
          selectedDate
        ] ?? []),

        food,
      ],
    };

    saveLogs(nextLogs);

    setFoodForm(
      createEmptyFood(),
    );

    setError('');
    setShowAddFood(false);
  }

  /* =========================================
     DELETE FOOD
  ========================================= */

  function deleteFood(foodId) {
    const updatedFoods =
      foods.filter(
        (food) =>
          food.id !== foodId,
      );

    const nextLogs = {
      ...logs,

      [selectedDate]:
        updatedFoods,
    };

    saveLogs(nextLogs);
  }

  /* =========================================
     OPEN MODAL
  ========================================= */

  function openFoodModal(
    meal = 'Breakfast',
  ) {
    setFoodForm({
      ...createEmptyFood(),
      meal,
    });

    setError('');
    setShowAddFood(true);
  }

  /* =========================================
     DATE LABEL
  ========================================= */

  const formattedDate =
    new Intl.DateTimeFormat(
      'en-US',
      {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      },
    ).format(
      new Date(
        `${selectedDate}T12:00:00`,
      ),
    );

  const isToday =
    selectedDate ===
    getLocalDateString();

  /* =========================================
     RENDER
  ========================================= */

  return (
    <main className="nutrition-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            Nutrition Log
          </span>

          <h1 className="page__title">
            Nutrition
          </h1>

          <p className="page__description">
            Record what you eat and
            track your daily intake.
          </p>

        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={() =>
            openFoodModal()
          }
        >
          <Plus size={16} />
          Add Food
        </button>

      </div>

      {/* =====================================
          DATE
      ===================================== */}

      <section className="nutrition-page__date-bar">

        <button
          type="button"
          aria-label="Previous day"
          onClick={() =>
            setSelectedDate(
              moveDate(
                selectedDate,
                -1,
              ),
            )
          }
        >
          <ChevronLeft
            size={18}
          />
        </button>

        <div>

          <strong>
            {isToday
              ? 'Today'
              : formattedDate}
          </strong>

          {isToday && (
            <span>
              {formattedDate}
            </span>
          )}

        </div>

        <button
          type="button"
          aria-label="Next day"
          onClick={() =>
            setSelectedDate(
              moveDate(
                selectedDate,
                1,
              ),
            )
          }
        >
          <ChevronRight
            size={18}
          />
        </button>

        <input
          type="date"
          value={selectedDate}
          onChange={(
            event,
          ) =>
            setSelectedDate(
              event.target.value,
            )
          }
        />

      </section>

      {/* =====================================
          TOTALS
      ===================================== */}

      <section className="nutrition-page__stats">

        <article className="nutrition-page__stat nutrition-page__stat--calories">

          <div>
            <Flame size={18} />
          </div>

          <span>
            Calories
          </span>

          <strong>
            {Math.round(
              totals.calories,
            ).toLocaleString()}
          </strong>

          <small>
            kcal
          </small>

        </article>

        <article className="nutrition-page__stat">

          <div>
            P
          </div>

          <span>
            Protein
          </span>

          <strong>
            {formatMacro(
              totals.protein,
            )}
          </strong>

          <small>g</small>

        </article>

        <article className="nutrition-page__stat">

          <div>
            C
          </div>

          <span>
            Carbs
          </span>

          <strong>
            {formatMacro(
              totals.carbs,
            )}
          </strong>

          <small>g</small>

        </article>

        <article className="nutrition-page__stat">

          <div>
            F
          </div>

          <span>
            Fat
          </span>

          <strong>
            {formatMacro(
              totals.fat,
            )}
          </strong>

          <small>g</small>

        </article>

      </section>

      {/* =====================================
          LOG HEADER
      ===================================== */}

      <div className="nutrition-page__log-header">

        <div>

          <h2>
            Food Log
          </h2>

          <p>
            {foods.length === 0
              ? 'Nothing recorded for this day.'
              : `${foods.length} ${
                  foods.length === 1
                    ? 'item'
                    : 'items'
                } recorded.`}
          </p>

        </div>

        <div className="nutrition-page__search">

          <Search
            size={15}
          />

          <input
            type="text"
            placeholder="Search today's food..."
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

      {/* =====================================
          EMPTY DAY
      ===================================== */}

      {foods.length === 0 && (
        <section className="panel nutrition-page__empty">

          <div>
            <Utensils
              size={27}
            />
          </div>

          <h3>
            No food logged
          </h3>

          <p>
            Add the food you ate and
            FORGE will calculate the
            totals for this day.
          </p>

          <button
            type="button"
            className="button button--primary"
            onClick={() =>
              openFoodModal()
            }
          >
            <Plus size={16} />
            Add First Food
          </button>

        </section>
      )}

      {/* =====================================
          MEALS
      ===================================== */}

      {foods.length > 0 && (
        <div className="nutrition-page__meals">

          {MEALS.map(
            (meal) => {
              const mealFoods =
                foodsByMeal[
                  meal
                ];

              const mealCalories =
                mealFoods.reduce(
                  (
                    total,
                    food,
                  ) =>
                    total +
                    Number(
                      food.calories ||
                        0,
                    ),
                  0,
                );

              return (
                <section
                  className="panel nutrition-page__meal"
                  key={meal}
                >

                  <div className="nutrition-page__meal-header">

                    <div>

                      <h3>
                        {meal}
                      </h3>

                      <span>
                        {Math.round(
                          mealCalories,
                        ).toLocaleString()}
                        {' kcal'}
                      </span>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openFoodModal(
                          meal,
                        )
                      }
                    >
                      <Plus
                        size={15}
                      />
                      Add
                    </button>

                  </div>

                  {mealFoods.length ===
                    0 ? (
                    <div className="nutrition-page__meal-empty">
                      No food logged.
                    </div>
                  ) : (
                    <div className="nutrition-page__food-list">

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

                      {mealFoods.map(
                        (food) => (
                          <div
                            className="nutrition-page__food"
                            key={
                              food.id
                            }
                          >

                            <strong>
                              {
                                food.name
                              }
                            </strong>

                            <span>
                              {Math.round(
                                food.calories,
                              )}
                              {' kcal'}
                            </span>

                            <span>
                              {formatMacro(
                                food.protein,
                              )}
                              g
                            </span>

                            <span>
                              {formatMacro(
                                food.carbs,
                              )}
                              g
                            </span>

                            <span>
                              {formatMacro(
                                food.fat,
                              )}
                              g
                            </span>

                            <button
                              type="button"
                              aria-label={`Delete ${food.name}`}
                              onClick={() =>
                                deleteFood(
                                  food.id,
                                )
                              }
                            >
                              <Trash2
                                size={
                                  16
                                }
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

      {/* =====================================
          ADD FOOD MODAL
      ===================================== */}

      {showAddFood && (
        <div
          className="nutrition-page__overlay"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowAddFood(
                false,
              );
            }
          }}
        >

          <section
            className="nutrition-page__modal"
            role="dialog"
            aria-modal="true"
            aria-label="Add food"
          >

            <div className="nutrition-page__modal-header">

              <div>

                <span>
                  Nutrition Log
                </span>

                <h2>
                  Add Food
                </h2>

              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={() =>
                  setShowAddFood(
                    false,
                  )
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="nutrition-page__form">

              <div className="nutrition-page__field nutrition-page__field--full">

                <label htmlFor="food-name">
                  Food Name
                </label>

                <input
                  id="food-name"
                  autoFocus
                  placeholder="e.g. Chicken breast"
                  value={
                    foodForm.name
                  }
                  onChange={(
                    event,
                  ) =>
                    setFoodForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        name:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                />

              </div>

              <div className="nutrition-page__field nutrition-page__field--full">

                <label htmlFor="food-meal">
                  Meal
                </label>

                <select
                  id="food-meal"
                  value={
                    foodForm.meal
                  }
                  onChange={(
                    event,
                  ) =>
                    setFoodForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        meal:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                >

                  {MEALS.map(
                    (meal) => (
                      <option
                        key={
                          meal
                        }
                        value={
                          meal
                        }
                      >
                        {meal}
                      </option>
                    ),
                  )}

                </select>

              </div>

              <div className="nutrition-page__field nutrition-page__field--full">

                <label htmlFor="food-calories">
                  Calories
                </label>

                <input
                  id="food-calories"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={
                    foodForm.calories
                  }
                  onChange={(
                    event,
                  ) =>
                    setFoodForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        calories:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                />

              </div>

              <div className="nutrition-page__field">

                <label htmlFor="food-protein">
                  Protein (g)
                </label>

                <input
                  id="food-protein"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={
                    foodForm.protein
                  }
                  onChange={(
                    event,
                  ) =>
                    setFoodForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        protein:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                />

              </div>

              <div className="nutrition-page__field">

                <label htmlFor="food-carbs">
                  Carbs (g)
                </label>

                <input
                  id="food-carbs"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={
                    foodForm.carbs
                  }
                  onChange={(
                    event,
                  ) =>
                    setFoodForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        carbs:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                />

              </div>

              <div className="nutrition-page__field">

                <label htmlFor="food-fat">
                  Fat (g)
                </label>

                <input
                  id="food-fat"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={
                    foodForm.fat
                  }
                  onChange={(
                    event,
                  ) =>
                    setFoodForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        fat:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                />

              </div>

            </div>

            {error && (
              <p className="nutrition-page__error">
                {error}
              </p>
            )}

            <div className="nutrition-page__modal-footer">

              <button
                type="button"
                className="button"
                onClick={() =>
                  setShowAddFood(
                    false,
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="button button--primary"
                onClick={
                  handleAddFood
                }
              >
                <Plus size={16} />
                Add Food
              </button>

            </div>

          </section>

        </div>
      )}

    </main>
  );
}

/* =========================================
   FORMATTERS
========================================= */

function formatMacro(value) {
  const number =
    Number(value || 0);

  return Number.isInteger(
    number,
  )
    ? number.toString()
    : number.toFixed(1);
}

export default NutritionPage;
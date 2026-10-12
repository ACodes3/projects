import {
  RotateCcw,
  Save,
  Target,
  Trash2,
} from 'lucide-react';

import {
  useEffect,
  useState,
} from 'react';

import {
  getNutritionGoals,
  saveNutritionGoals,
} from '../api/forgeApi.js';

import './SettingsPage.css';


/* =========================================
   LOCAL DATA

   All permanent FORGE data is now stored
   in PostgreSQL.

   Only the unfinished workout draft stays
   in localStorage intentionally.
========================================= */

const WORKOUT_DRAFT_KEY =
  'forge:workoutDraft';


/* =========================================
   GOALS
========================================= */

const EMPTY_GOALS = {
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
};


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
      raw.calories === null
      || raw.calories === undefined
        ? ''
        : String(
            raw.calories,
          ),

    protein:
      raw.protein === null
      || raw.protein === undefined
        ? ''
        : String(
            raw.protein,
          ),

    carbs:
      raw.carbs === null
      || raw.carbs === undefined
        ? ''
        : String(
            raw.carbs,
          ),

    fat:
      raw.fat === null
      || raw.fat === undefined
        ? ''
        : String(
            raw.fat,
          ),
  };
}


/* =========================================
   SETTINGS
========================================= */

export default function SettingsPage() {
  const [
    goals,
    setGoals,
  ] = useState(
    EMPTY_GOALS,
  );

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    loadingGoals,
    setLoadingGoals,
  ] = useState(true);

  const [
    savingGoals,
    setSavingGoals,
  ] = useState(false);


  /* =========================================
     LOAD GOALS
  ========================================= */

  async function loadGoals() {
    try {
      const response =
        await getNutritionGoals();

      setGoals(
        normalizeGoals(
          response,
        ),
      );
    } catch (error) {
      console.error(
        'Failed to load nutrition targets:',
        error,
      );

      setMessage(
        error.message
        || 'Failed to load nutrition targets.',
      );
    } finally {
      setLoadingGoals(
        false,
      );
    }
  }


  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadGoals();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);


  /* =========================================
     UPDATE GOAL
  ========================================= */

  function updateGoal(
    field,
    value,
  ) {
    if (
      value !== ''
      && Number(value) < 0
    ) {
      return;
    }

    setGoals(
      (current) => ({
        ...current,

        [field]:
          value,
      }),
    );

    setMessage('');
  }


  /* =========================================
     BUILD GOAL PAYLOAD
  ========================================= */

  function buildGoalsPayload() {
    const payload = {
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
    };

    for (
      const [
        key,
        value,
      ] of Object.entries(
        goals,
      )
    ) {
      if (
        value === ''
      ) {
        payload[key] =
          null;

        continue;
      }

      const number =
        Number(value);

      if (
        !Number.isFinite(
          number,
        )
        || number <= 0
      ) {
        throw new Error(
          'Nutrition targets must be positive numbers or left blank.',
        );
      }

      if (
        key === 'calories'
        && !Number.isInteger(
          number,
        )
      ) {
        throw new Error(
          'Calories must be a whole number.',
        );
      }

      payload[key] =
        number;
    }

    return payload;
  }


  /* =========================================
     SAVE GOALS
  ========================================= */

  async function saveGoals() {
    if (savingGoals) {
      return;
    }

    try {
      const payload =
        buildGoalsPayload();

      setSavingGoals(
        true,
      );

      setMessage('');

      const response =
        await saveNutritionGoals(
          payload,
        );

      setGoals(
        normalizeGoals(
          response,
        ),
      );

      setMessage(
        'Nutrition targets saved.',
      );
    } catch (error) {
      console.error(
        'Failed to save nutrition targets:',
        error,
      );

      setMessage(
        error.message
        || 'Failed to save nutrition targets.',
      );
    } finally {
      setSavingGoals(
        false,
      );
    }
  }


  /* =========================================
     CLEAR GOALS
  ========================================= */

  async function clearGoals() {
    const confirmed =
      window.confirm(
        'Clear all nutrition targets?',
      );

    if (!confirmed) {
      return;
    }

    try {
      setSavingGoals(
        true,
      );

      setMessage('');

      await saveNutritionGoals({
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
      });

      setGoals({
        ...EMPTY_GOALS,
      });

      setMessage(
        'Nutrition targets cleared.',
      );
    } catch (error) {
      console.error(
        'Failed to clear nutrition targets:',
        error,
      );

      setMessage(
        error.message
        || 'Failed to clear nutrition targets.',
      );
    } finally {
      setSavingGoals(
        false,
      );
    }
  }


  /* =========================================
     CLEAR WORKOUT DRAFT
  ========================================= */

  function clearWorkoutDraft() {
    const draft =
      localStorage.getItem(
        WORKOUT_DRAFT_KEY,
      );

    if (!draft) {
      setMessage(
        'There is no workout draft to clear.',
      );

      return;
    }

    const confirmed =
      window.confirm(
        'Clear the unfinished workout draft? This cannot be undone.',
      );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      WORKOUT_DRAFT_KEY,
    );

    setMessage(
      'Workout draft cleared.',
    );
  }


  /* =========================================
     RENDER
  ========================================= */

  return (
    <main className="settings-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            Preferences
          </span>

          <h1 className="page__title">
            Settings
          </h1>

          <p className="page__description">
            Configure your nutrition
            targets and manage your
            unfinished workout draft.
          </p>

        </div>

      </header>


      {/* =====================================
          MESSAGE
      ===================================== */}

      {message && (

        <div className="settings-page__message">
          {message}
        </div>

      )}


      {/* =====================================
          NUTRITION GOALS
      ===================================== */}

      <section className="panel settings-page__section">

        <div className="settings-page__section-heading">

          <div className="settings-page__section-icon">

            <Target
              size={18}
            />

          </div>


          <div>

            <h2>
              Nutrition Targets
            </h2>

            <p>
              Used to judge
              nutrition quality
              in your daily
              progress score.
            </p>

          </div>

        </div>


        <div className="settings-page__goal-note">

          {
            loadingGoals
              ? 'Loading your nutrition targets...'
              : 'Leave any target blank if you do not want FORGE to score that macro.'
          }

        </div>


        <div className="settings-page__goals">

          {/* CALORIES */}

          <label>

            <span>
              Calories
            </span>

            <div>

              <input
                type="number"
                min="1"
                step="1"
                placeholder="Not set"
                value={
                  goals.calories
                }
                disabled={
                  loadingGoals
                  || savingGoals
                }
                onChange={(
                  event,
                ) =>
                  updateGoal(
                    'calories',
                    event.target
                      .value,
                  )
                }
              />

              <small>
                kcal
              </small>

            </div>

          </label>


          {/* PROTEIN */}

          <label>

            <span>
              Protein
            </span>

            <div>

              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Not set"
                value={
                  goals.protein
                }
                disabled={
                  loadingGoals
                  || savingGoals
                }
                onChange={(
                  event,
                ) =>
                  updateGoal(
                    'protein',
                    event.target
                      .value,
                  )
                }
              />

              <small>
                g
              </small>

            </div>

          </label>


          {/* CARBS */}

          <label>

            <span>
              Carbohydrates
            </span>

            <div>

              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Not set"
                value={
                  goals.carbs
                }
                disabled={
                  loadingGoals
                  || savingGoals
                }
                onChange={(
                  event,
                ) =>
                  updateGoal(
                    'carbs',
                    event.target
                      .value,
                  )
                }
              />

              <small>
                g
              </small>

            </div>

          </label>


          {/* FAT */}

          <label>

            <span>
              Fat
            </span>

            <div>

              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Not set"
                value={
                  goals.fat
                }
                disabled={
                  loadingGoals
                  || savingGoals
                }
                onChange={(
                  event,
                ) =>
                  updateGoal(
                    'fat',
                    event.target
                      .value,
                  )
                }
              />

              <small>
                g
              </small>

            </div>

          </label>

        </div>


        <div className="settings-page__section-actions">

          <button
            type="button"
            className="button"
            onClick={
              clearGoals
            }
            disabled={
              loadingGoals
              || savingGoals
            }
          >
            <RotateCcw
              size={14}
            />

            Clear Targets
          </button>


          <button
            type="button"
            className="button button--primary"
            onClick={
              saveGoals
            }
            disabled={
              loadingGoals
              || savingGoals
            }
          >
            <Save
              size={14}
            />

            {
              savingGoals
                ? 'Saving...'
                : 'Save Targets'
            }
          </button>

        </div>

      </section>


      {/* =====================================
          WORKOUT DRAFT
      ===================================== */}

      <section className="panel settings-page__section">

        <div className="settings-page__section-heading">

          <div className="settings-page__section-icon settings-page__section-icon--danger">

            <Trash2
              size={18}
            />

          </div>


          <div>

            <h2>
              Workout Draft
            </h2>

            <p>
              Manage the unfinished
              workout session stored
              in this browser.
            </p>

          </div>

        </div>


        <div className="settings-page__data-list">

          <div>

            <div>

              <strong>
                Unfinished Workout
              </strong>

              <span>
                Automatically saved
                while logging a workout
              </span>

            </div>

            <button
              type="button"
              onClick={
                clearWorkoutDraft
              }
            >
              Clear
            </button>

          </div>

        </div>

      </section>


      {/* =====================================
          STORAGE INFO
      ===================================== */}

      <section className="panel settings-page__section settings-page__danger">

        <div>

          <strong>
            Persistent data is server-backed
          </strong>

          <span>
            Workouts, nutrition,
            progress, profile,
            rest days and nutrition
            targets are stored in
            PostgreSQL.
          </span>

        </div>

      </section>

    </main>
  );
}
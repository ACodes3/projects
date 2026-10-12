import {
  Download,
  RotateCcw,
  Save,
  Target,
  Trash2,
  Upload,
} from 'lucide-react';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  getNutritionGoals,
  saveNutritionGoals,
} from '../api/forgeApi.js';

import './SettingsPage.css';


/* =========================================
   REMAINING LOCAL DATA

   Workouts and nutrition are now stored
   in PostgreSQL.

   The workout draft deliberately remains
   local, and the other domains will be
   migrated in later steps.
========================================= */

const STORAGE_KEYS = {
  workoutDraft:
    'forge:workoutDraft',

  progress:
    'forge:progressEntries',

  profile:
    'forge:profile',

  restDays:
    'forge:restDays',
};


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
   STORAGE HELPERS
========================================= */

function readStorageValue(
  key,
) {
  const stored =
    localStorage.getItem(
      key,
    );

  if (stored === null) {
    return null;
  }

  try {
    return JSON.parse(
      stored,
    );
  } catch {
    return stored;
  }
}


function restoreValue(
  key,
  value,
) {
  if (
    value === undefined
    || value === null
  ) {
    localStorage.removeItem(
      key,
    );

    return;
  }

  localStorage.setItem(
    key,
    JSON.stringify(
      value,
    ),
  );
}


/* =========================================
   SETTINGS
========================================= */

export default function SettingsPage() {
  const fileInputRef =
    useRef(null);

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
      setLoadingGoals(true);
      setMessage('');

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
      setLoadingGoals(false);
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
     UPDATE GOAL FIELD
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
     SAVE GOALS TO API
  ========================================= */

  async function saveGoals() {
    if (savingGoals) {
      return;
    }

    try {
      const payload =
        buildGoalsPayload();

      setSavingGoals(true);
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
      setSavingGoals(false);
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
      setSavingGoals(true);
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
      setSavingGoals(false);
    }
  }


  /* =========================================
     EXPORT LOCAL DATA
  ========================================= */

  function exportBackup() {
    const backup = {
      version: 2,

      exportedAt:
        new Date()
          .toISOString(),

      scope:
        'local-data-only',

      data: {
        workoutDraft:
          readStorageValue(
            STORAGE_KEYS
              .workoutDraft,
          ),

        progress:
          readStorageValue(
            STORAGE_KEYS.progress,
          ),

        profile:
          readStorageValue(
            STORAGE_KEYS.profile,
          ),

        restDays:
          readStorageValue(
            STORAGE_KEYS.restDays,
          ),
      },
    };

    const blob =
      new Blob(
        [
          JSON.stringify(
            backup,
            null,
            2,
          ),
        ],
        {
          type:
            'application/json',
        },
      );

    const url =
      URL.createObjectURL(
        blob,
      );

    const link =
      document.createElement(
        'a',
      );

    const date =
      new Date()
        .toISOString()
        .slice(
          0,
          10,
        );

    link.href =
      url;

    link.download =
      `forge-local-backup-${date}.json`;

    document.body
      .appendChild(
        link,
      );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url,
    );

    setMessage(
      'Local data backup exported.',
    );
  }


  /* =========================================
     IMPORT LOCAL DATA
  ========================================= */

  function openImport() {
    fileInputRef.current
      ?.click();
  }


  function importBackup(
    event,
  ) {
    const file =
      event.target
        .files?.[0];

    event.target.value =
      '';

    if (!file) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload =
      () => {
        try {
          const backup =
            JSON.parse(
              reader.result,
            );

          const data =
            backup?.data;

          if (
            !data
            || typeof data
              !== 'object'
          ) {
            throw new Error(
              'Invalid backup.',
            );
          }

          const confirmed =
            window.confirm(
              'Restore this local FORGE backup? Existing local draft, progress, profile and rest-day data may be replaced.',
            );

          if (!confirmed) {
            return;
          }

          restoreValue(
            STORAGE_KEYS
              .workoutDraft,
            data.workoutDraft,
          );

          restoreValue(
            STORAGE_KEYS
              .progress,
            data.progress,
          );

          restoreValue(
            STORAGE_KEYS
              .profile,
            data.profile,
          );

          restoreValue(
            STORAGE_KEYS
              .restDays,
            data.restDays,
          );

          setMessage(
            'Local backup restored.',
          );
        } catch {
          setMessage(
            'That file is not a valid FORGE local backup.',
          );
        }
      };

    reader.readAsText(
      file,
    );
  }


  /* =========================================
     CLEAR LOCAL SECTION
  ========================================= */

  function clearSection(
    key,
    label,
  ) {
    const confirmed =
      window.confirm(
        `Clear all ${label}? This cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      key,
    );

    setMessage(
      `${label} cleared.`,
    );
  }


  /* =========================================
     CLEAR LOCAL DATA
  ========================================= */

  function clearAllLocalData() {
    const confirmed =
      window.confirm(
        'Clear all remaining local FORGE data? This removes the workout draft, local progress, profile and rest-day data. Database workouts, nutrition and nutrition targets will not be deleted.',
      );

    if (!confirmed) {
      return;
    }

    Object.values(
      STORAGE_KEYS,
    ).forEach(
      (key) => {
        localStorage.removeItem(
          key,
        );
      },
    );

    setMessage(
      'Local FORGE data cleared.',
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
            Set your nutrition
            targets and manage
            remaining local
            FORGE data.
          </p>

        </div>

      </header>


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

          {loadingGoals
            ? 'Loading your nutrition targets...'
            : 'Leave any target blank if you do not want FORGE to score that macro.'}

        </div>


        <div className="settings-page__goals">

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
          LOCAL BACKUP
      ===================================== */}

      <section className="panel settings-page__section">

        <div className="settings-page__section-heading">

          <div className="settings-page__section-icon">

            <Download
              size={18}
            />

          </div>


          <div>

            <h2>
              Local Backup & Restore
            </h2>

            <p>
              Export or restore
              data that has not
              yet been migrated
              to PostgreSQL.
            </p>

          </div>

        </div>


        <div className="settings-page__goal-note">
          Database workouts,
          nutrition entries and
          nutrition targets are
          not included here.
        </div>


        <div className="settings-page__backup-actions">

          <button
            type="button"
            className="button button--primary"
            onClick={
              exportBackup
            }
          >
            <Download
              size={15}
            />

            Export Local Backup
          </button>


          <button
            type="button"
            className="button"
            onClick={
              openImport
            }
          >
            <Upload
              size={15}
            />

            Restore Local Backup
          </button>


          <input
            ref={
              fileInputRef
            }
            type="file"
            accept=".json,application/json"
            hidden
            onChange={
              importBackup
            }
          />

        </div>

      </section>


      {/* =====================================
          LOCAL DATA MANAGEMENT
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
              Local Data Management
            </h2>

            <p>
              Remove individual
              pieces of data that
              are still stored in
              this browser.
            </p>

          </div>

        </div>


        <div className="settings-page__data-list">

          {/* WORKOUT DRAFT */}

          <div>

            <div>

              <strong>
                Workout Draft
              </strong>

              <span>
                Current unfinished
                workout session
              </span>

            </div>

            <button
              type="button"
              onClick={() =>
                clearSection(
                  STORAGE_KEYS
                    .workoutDraft,
                  'workout draft',
                )
              }
            >
              Clear
            </button>

          </div>


          {/* PROGRESS */}

          <div>

            <div>

              <strong>
                Progress
              </strong>

              <span>
                Weight and body
                measurements
              </span>

            </div>

            <button
              type="button"
              onClick={() =>
                clearSection(
                  STORAGE_KEYS
                    .progress,
                  'progress history',
                )
              }
            >
              Clear
            </button>

          </div>


          {/* REST DAYS */}

          <div>

            <div>

              <strong>
                Rest Days
              </strong>

              <span>
                Calendar recovery
                day history
              </span>

            </div>

            <button
              type="button"
              onClick={() =>
                clearSection(
                  STORAGE_KEYS
                    .restDays,
                  'rest days',
                )
              }
            >
              Clear
            </button>

          </div>


          {/* PROFILE */}

          <div>

            <div>

              <strong>
                Profile
              </strong>

              <span>
                Your local FORGE
                profile information
              </span>

            </div>

            <button
              type="button"
              onClick={() =>
                clearSection(
                  STORAGE_KEYS
                    .profile,
                  'profile data',
                )
              }
            >
              Clear
            </button>

          </div>

        </div>

      </section>


      {/* =====================================
          LOCAL DANGER ZONE
      ===================================== */}

      <section className="panel settings-page__section settings-page__danger">

        <div>

          <strong>
            Clear local FORGE data
          </strong>

          <span>
            Removes remaining
            browser-only data.
            PostgreSQL data is
            not affected.
          </span>

        </div>

        <button
          type="button"
          className="settings-page__danger-button"
          onClick={
            clearAllLocalData
          }
        >
          <Trash2
            size={14}
          />

          Clear Local Data
        </button>

      </section>

    </main>
  );
}
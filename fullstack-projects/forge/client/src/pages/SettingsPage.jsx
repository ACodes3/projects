import {
  Download,
  RotateCcw,
  Save,
  Target,
  Trash2,
  Upload,
} from 'lucide-react';

import {
  useRef,
  useState,
} from 'react';

import './SettingsPage.css';

const STORAGE_KEYS = {
  workouts: 'forge:workoutHistory',
  workoutDraft: 'forge:workoutDraft',
  nutrition: 'forge:nutritionLogs',
  progress: 'forge:progressEntries',
  profile: 'forge:profile',
  restDays: 'forge:restDays',
  nutritionGoals: 'forge:nutritionGoals',
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

function loadNutritionGoals() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(
        STORAGE_KEYS.nutritionGoals,
      ) || '{}',
    );

    return {
      calories:
        stored.calories ?? '',

      protein:
        stored.protein ?? '',

      carbs:
        stored.carbs ?? '',

      fat:
        stored.fat ?? '',
    };
  } catch {
    return EMPTY_GOALS;
  }
}

/* =========================================
   STORAGE HELPERS
========================================= */

function readStorageValue(key) {
  const stored =
    localStorage.getItem(key);

  if (stored === null) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return stored;
  }
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
    loadNutritionGoals,
  );

  const [
    message,
    setMessage,
  ] = useState('');

  /* =========================================
     GOALS
  ========================================= */

  function updateGoal(
    field,
    value,
  ) {
    if (
      value !== '' &&
      Number(value) < 0
    ) {
      return;
    }

    setGoals(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );

    setMessage('');
  }

  function saveGoals() {
    const cleaned = {};

    Object.entries(
      goals,
    ).forEach(
      ([key, value]) => {
        if (
          value === ''
        ) {
          return;
        }

        const number =
          Number(value);

        if (
          Number.isFinite(number) &&
          number >= 0
        ) {
          cleaned[key] =
            number;
        }
      },
    );

    localStorage.setItem(
      STORAGE_KEYS.nutritionGoals,
      JSON.stringify(cleaned),
    );

    setMessage(
      'Nutrition targets saved.',
    );
  }

  function clearGoals() {
    const confirmed =
      window.confirm(
        'Clear all nutrition targets?',
      );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      STORAGE_KEYS.nutritionGoals,
    );

    setGoals(
      EMPTY_GOALS,
    );

    setMessage(
      'Nutrition targets cleared.',
    );
  }

  /* =========================================
     EXPORT
  ========================================= */

  function exportBackup() {
    const backup = {
      version: 1,

      exportedAt:
        new Date().toISOString(),

      data: {
        workouts:
          readStorageValue(
            STORAGE_KEYS.workouts,
          ),

        workoutDraft:
          readStorageValue(
            STORAGE_KEYS.workoutDraft,
          ),

        nutrition:
          readStorageValue(
            STORAGE_KEYS.nutrition,
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

        nutritionGoals:
          readStorageValue(
            STORAGE_KEYS.nutritionGoals,
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
          type: 'application/json',
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
        .slice(0, 10);

    link.href = url;

    link.download =
      `forge-backup-${date}.json`;

    document.body.appendChild(
      link,
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url,
    );

    setMessage(
      'Backup exported.',
    );
  }

  /* =========================================
     IMPORT
  ========================================= */

  function openImport() {
    fileInputRef.current?.click();
  }

  function importBackup(event) {
    const file =
      event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      try {
        const backup =
          JSON.parse(
            reader.result,
          );

        const data =
          backup?.data;

        if (
          !data ||
          typeof data !==
            'object'
        ) {
          throw new Error(
            'Invalid backup.',
          );
        }

        const confirmed =
          window.confirm(
            'Restore this FORGE backup? Existing tracker data may be replaced.',
          );

        if (!confirmed) {
          return;
        }

        restoreValue(
          STORAGE_KEYS.workouts,
          data.workouts,
        );

        restoreValue(
          STORAGE_KEYS.workoutDraft,
          data.workoutDraft,
        );

        restoreValue(
          STORAGE_KEYS.nutrition,
          data.nutrition,
        );

        restoreValue(
          STORAGE_KEYS.progress,
          data.progress,
        );

        restoreValue(
          STORAGE_KEYS.profile,
          data.profile,
        );

        restoreValue(
          STORAGE_KEYS.restDays,
          data.restDays,
        );

        restoreValue(
          STORAGE_KEYS.nutritionGoals,
          data.nutritionGoals,
        );

        setGoals(
          loadNutritionGoals(),
        );

        setMessage(
          'Backup restored.',
        );
      } catch {
        setMessage(
          'That file is not a valid FORGE backup.',
        );
      }
    };

    reader.readAsText(
      file,
    );
  }

  function restoreValue(
    key,
    value,
  ) {
    if (
      value === undefined ||
      value === null
    ) {
      localStorage.removeItem(
        key,
      );

      return;
    }

    localStorage.setItem(
      key,
      JSON.stringify(value),
    );
  }

  /* =========================================
     CLEAR SECTION
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
     CLEAR EVERYTHING
  ========================================= */

  function clearAllData() {
    const confirmed =
      window.confirm(
        'Clear all FORGE tracker data? Workouts, nutrition, progress, profile, rest days and goals will be deleted.',
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

    setGoals(
      EMPTY_GOALS,
    );

    setMessage(
      'All FORGE data cleared.',
    );
  }

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
            your local FORGE data.
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
          Leave any target blank
          if you do not want FORGE
          to score that macro.
        </div>

        <div className="settings-page__goals">

          <label>

            <span>
              Calories
            </span>

            <div>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Not set"
                value={
                  goals.calories
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
                min="0"
                step="1"
                placeholder="Not set"
                value={
                  goals.protein
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
                min="0"
                step="1"
                placeholder="Not set"
                value={
                  goals.carbs
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
                min="0"
                step="1"
                placeholder="Not set"
                value={
                  goals.fat
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
          >
            <Save size={14} />

            Save Targets
          </button>

        </div>

      </section>

      {/* =====================================
          BACKUP
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
              Backup & Restore
            </h2>

            <p>
              Export all FORGE
              data to a JSON file
              or restore a
              previous backup.
            </p>

          </div>

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

            Export Backup
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

            Restore Backup
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
          CLEAR DATA
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
              Data Management
            </h2>

            <p>
              Remove individual
              parts of your
              tracker history.
            </p>

          </div>

        </div>

        <div className="settings-page__data-list">

          <div>

            <div>
              <strong>
                Workouts
              </strong>

              <span>
                Completed workouts
                and workout draft
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const confirmed =
                  window.confirm(
                    'Clear all workouts and the current workout draft?',
                  );

                if (!confirmed) {
                  return;
                }

                localStorage.removeItem(
                  STORAGE_KEYS.workouts,
                );

                localStorage.removeItem(
                  STORAGE_KEYS.workoutDraft,
                );

                setMessage(
                  'Workout data cleared.',
                );
              }}
            >
              Clear
            </button>

          </div>

          <div>

            <div>
              <strong>
                Nutrition
              </strong>

              <span>
                All food and meal
                history
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                clearSection(
                  STORAGE_KEYS.nutrition,
                  'nutrition history',
                )
              }
            >
              Clear
            </button>

          </div>

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
                  STORAGE_KEYS.progress,
                  'progress history',
                )
              }
            >
              Clear
            </button>

          </div>

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
                  STORAGE_KEYS.restDays,
                  'rest days',
                )
              }
            >
              Clear
            </button>

          </div>

          <div>

            <div>
              <strong>
                Profile
              </strong>

              <span>
                Your FORGE profile
                information
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                clearSection(
                  STORAGE_KEYS.profile,
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
          DANGER ZONE
      ===================================== */}

      <section className="panel settings-page__section settings-page__danger">

        <div>

          <strong>
            Clear all FORGE data
          </strong>

          <span>
            Permanently removes
            workouts, nutrition,
            progress, profile,
            rest days and targets.
          </span>

        </div>

        <button
          type="button"
          className="settings-page__danger-button"
          onClick={
            clearAllData
          }
        >
          <Trash2
            size={14}
          />

          Clear Everything
        </button>

      </section>

    </main>
  );
}
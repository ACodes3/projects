import {
  Download,
  FileCheck2,
  FolderOpen,
  HardDriveDownload,
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

   Permanent FORGE data is stored in SQLite.

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

  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [backupValidation, setBackupValidation] = useState(null);
  const [selectingBackup, setSelectingBackup] = useState(false);
  const [validatingBackup, setValidatingBackup] = useState(false);



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
     DATABASE BACKUP
  ========================================= */

  async function downloadBackup() {
    if (downloadingBackup) return;

    setDownloadingBackup(true);
    setMessage('Preparing your database backup...');

    let objectUrl;

    try {
      const apiBase = (
        import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      ).replace(/\/$/, '');

      const response = await fetch(`${apiBase}/backup/download`);

      if (!response.ok) {
        throw new Error('Could not download the database backup.');
      }

      const blob = await response.blob();
      if (!blob.size) {
        throw new Error('The downloaded backup was empty.');
      }

      objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toLocaleDateString('en-CA');

      link.href = objectUrl;
      link.download = `forge-backup-${date}.sqlite`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage('Backup download started. Keep the file somewhere safe.');
    } catch (error) {
      console.error('Failed to download database backup:', error);
      setMessage(error.message || 'Failed to download database backup.');
    } finally {
      if (objectUrl) {
        // Allow the browser to finish starting the download.
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      }
      setDownloadingBackup(false);
    }
  }


  /* =========================================
     SELECT & VALIDATE BACKUP (READ ONLY)
  ========================================= */

  async function selectBackup() {
    if (selectingBackup || validatingBackup) return;

    if (typeof window.forgeDesktop?.selectBackup !== 'function') {
      setMessage('Backup selection is available in the FORGE desktop app.');
      return;
    }

    setSelectingBackup(true);
    setMessage('');
    try {
      const selection = await window.forgeDesktop.selectBackup();
      if (!selection) return; // Cancel keeps previous selection.

      setSelectedBackup(selection.name);
      setBackupValidation(null);
      setMessage(`Selected backup: ${selection.name}`);
    } catch (error) {
      console.error('Failed to select backup:', error);
      setMessage(error.message || 'Could not select backup.');
    } finally {
      setSelectingBackup(false);
    }
  }

  async function validateBackup() {
    if (!selectedBackup || validatingBackup || selectingBackup) return;

    if (typeof window.forgeDesktop?.validateBackup !== 'function') {
      setMessage('Backup validation is available in the FORGE desktop app.');
      return;
    }

    setValidatingBackup(true);
    setBackupValidation(null);
    setMessage('Validating selected backup...');

    try {
      const result = await window.forgeDesktop.validateBackup();
      if (!result?.success || !result?.valid) {
        throw new Error(result?.message || 'Backup validation failed.');
      }

      setBackupValidation({
        exercises: result.exercises,
        workouts: result.workouts,
      });
      setMessage('Backup validated successfully. No data was changed.');
    } catch (error) {
      console.error('Failed to validate backup:', error);
      setMessage(error.message || 'Backup validation failed.');
    } finally {
      setValidatingBackup(false);
    }
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
          BACKUP & RESTORE
      ===================================== */}

      <section className="panel settings-page__section">
        <div className="settings-page__section-heading">
          <div className="settings-page__section-icon">
            <HardDriveDownload size={18} />
          </div>

          <div>
            <h2>Backup &amp; Restore</h2>
            <p>
              Download a complete copy of your local FORGE SQLite
              database, including workouts, exercises, nutrition,
              progress, and profile information.
            </p>
          </div>
        </div>

        <div className="settings-page__goal-note">
          Keep downloaded backups in a safe location. You can select and
          validate a backup here. Restoring data is not enabled yet.
        </div>

        <div className="settings-page__backup-actions">
          <button
            type="button"
            className="button button--primary"
            onClick={downloadBackup}
            disabled={downloadingBackup}
          >
            <Download size={15} />
            {downloadingBackup ? 'Preparing Backup...' : 'Download Backup'}
          </button>
          <button
            type="button"
            className="button"
            onClick={selectBackup}
            disabled={selectingBackup || validatingBackup}
          >
            <FolderOpen size={15} />
            {selectingBackup ? 'Selecting...' : 'Select Backup'}
          </button>
          <button
            type="button"
            className="button"
            onClick={validateBackup}
            disabled={!selectedBackup || selectingBackup || validatingBackup}
          >
            <FileCheck2 size={15} />
            {validatingBackup ? 'Validating...' : 'Validate Backup'}
          </button>
        </div>

        {selectedBackup && (
          <div className="settings-page__backup-result" aria-live="polite">
            <strong>Selected file</strong>
            <span>{selectedBackup}</span>
            {backupValidation ? (
              <p>
                Valid FORGE backup — {backupValidation.exercises} exercises,
                {' '}{backupValidation.workouts} workouts.
              </p>
            ) : (
              <p>Not validated yet. Your current database is unchanged.</p>
            )}
          </div>
        )}
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
            Your data is stored locally
          </strong>

          <span>
            Workouts, nutrition, progress, profile, rest days,
            exercise library, and nutrition targets are stored locally
            in SQLite. No internet connection is required to access
            your saved data.
          </span>

        </div>

      </section>

    </main>
  );
}
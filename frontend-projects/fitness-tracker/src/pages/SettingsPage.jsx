import {
  Database,
  Download,
  Dumbbell,
  HardDrive,
  Scale,
  ShieldCheck,
  Trash2,
  Upload,
  Utensils,
} from 'lucide-react';

import {
  useState,
} from 'react';

import './SettingsPage.css';

const WORKOUTS_KEY =
  'forge:workoutHistory';

const WORKOUT_DRAFT_KEY =
  'forge:workoutDraft';

const NUTRITION_KEY =
  'forge:nutritionLogs';

const PROGRESS_KEY =
  'forge:progressEntries';

/* =========================================
   STORAGE HELPERS
========================================= */

function readArray(key) {
  try {
    const stored =
      localStorage.getItem(key);

    if (!stored) {
      return [];
    }

    const parsed =
      JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function readObject(key) {
  try {
    const stored =
      localStorage.getItem(key);

    if (!stored) {
      return {};
    }

    const parsed =
      JSON.parse(stored);

    return (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
        ? parsed
        : {}
    );
  } catch {
    return {};
  }
}

/* =========================================
   SETTINGS PAGE
========================================= */

function SettingsPage() {
  const [
    ,
    setRevision,
  ] = useState(0);

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState('');

  /* =========================================
     STORAGE SUMMARY
  ========================================= */

  const workouts =
    readArray(
      WORKOUTS_KEY,
    );

  const progress =
    readArray(
      PROGRESS_KEY,
    );

  const nutrition =
    readObject(
      NUTRITION_KEY,
    );

  const nutritionDays =
    Object.keys(
      nutrition,
    ).length;

  const foodEntries =
    Object.values(
      nutrition,
    ).reduce(
      (
        total,
        day,
      ) =>
        total +
        (
          Array.isArray(day)
            ? day.length
            : 0
        ),
      0,
    );

  const summary = {
    workouts:
      workouts.length,

    measurements:
      progress.length,

    nutritionDays,

    foodEntries,
  };

  /* =========================================
     MESSAGE
  ========================================= */

  function showMessage(text) {
    setError('');
    setMessage(text);
  }

  function showError(text) {
    setMessage('');
    setError(text);
  }

  /* =========================================
     EXPORT BACKUP
  ========================================= */

  function exportBackup() {
    try {
      const backup = {
        app: 'FORGE',

        version: 1,

        exportedAt:
          new Date().toISOString(),

        data: {
          workouts:
            readArray(
              WORKOUTS_KEY,
            ),

          workoutDraft:
            localStorage.getItem(
              WORKOUT_DRAFT_KEY,
            )
              ? JSON.parse(
                  localStorage.getItem(
                    WORKOUT_DRAFT_KEY,
                  ),
                )
              : null,

          nutritionLogs:
            readObject(
              NUTRITION_KEY,
            ),

          progressEntries:
            readArray(
              PROGRESS_KEY,
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

      link.href = url;

      link.download =
        `forge-backup-${getLocalDateString()}.json`;

      document.body.appendChild(
        link,
      );

      link.click();

      link.remove();

      URL.revokeObjectURL(
        url,
      );

      showMessage(
        'Backup exported successfully.',
      );
    } catch {
      showError(
        'Could not export your backup.',
      );
    }
  }

  /* =========================================
     RESTORE BACKUP
  ========================================= */

  async function restoreBackup(
    event,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text =
        await file.text();

      const backup =
        JSON.parse(text);

      if (
        !backup ||
        backup.app !==
          'FORGE' ||
        !backup.data ||
        typeof backup.data !==
          'object'
      ) {
        throw new Error(
          'Invalid backup',
        );
      }

      const confirmed =
        window.confirm(
          'Restore this backup? Your current FORGE tracker data will be replaced.',
        );

      if (!confirmed) {
        return;
      }

      const workouts =
        Array.isArray(
          backup.data
            .workouts,
        )
          ? backup.data
              .workouts
          : [];

      const progress =
        Array.isArray(
          backup.data
            .progressEntries,
        )
          ? backup.data
              .progressEntries
          : [];

      const nutrition =
        backup.data
          .nutritionLogs &&
        typeof backup.data
          .nutritionLogs ===
          'object' &&
        !Array.isArray(
          backup.data
            .nutritionLogs,
        )
          ? backup.data
              .nutritionLogs
          : {};

      localStorage.setItem(
        WORKOUTS_KEY,
        JSON.stringify(
          workouts,
        ),
      );

      localStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify(
          progress,
        ),
      );

      localStorage.setItem(
        NUTRITION_KEY,
        JSON.stringify(
          nutrition,
        ),
      );

      if (
        backup.data
          .workoutDraft
      ) {
        localStorage.setItem(
          WORKOUT_DRAFT_KEY,
          JSON.stringify(
            backup.data
              .workoutDraft,
          ),
        );
      } else {
        localStorage.removeItem(
          WORKOUT_DRAFT_KEY,
        );
      }

      setRevision(
        (current) =>
          current + 1,
      );

      showMessage(
        'Backup restored successfully.',
      );
    } catch {
      showError(
        'That file is not a valid FORGE backup.',
      );
    } finally {
      event.target.value =
        '';
    }
  }

  /* =========================================
     CLEAR SECTION
  ========================================= */

  function clearSection(
    type,
  ) {
    const settings = {
      workouts: {
        message:
          'Delete all workout history? This cannot be undone unless you have a backup.',

        clear: () => {
          localStorage.removeItem(
            WORKOUTS_KEY,
          );

          localStorage.removeItem(
            WORKOUT_DRAFT_KEY,
          );
        },

        success:
          'Workout data cleared.',
      },

      nutrition: {
        message:
          'Delete all nutrition history? This cannot be undone unless you have a backup.',

        clear: () =>
          localStorage.removeItem(
            NUTRITION_KEY,
          ),

        success:
          'Nutrition data cleared.',
      },

      progress: {
        message:
          'Delete all body measurement history? This cannot be undone unless you have a backup.',

        clear: () =>
          localStorage.removeItem(
            PROGRESS_KEY,
          ),

        success:
          'Progress data cleared.',
      },
    };

    const selected =
      settings[type];

    if (!selected) {
      return;
    }

    const confirmed =
      window.confirm(
        selected.message,
      );

    if (!confirmed) {
      return;
    }

    selected.clear();

    setRevision(
      (current) =>
        current + 1,
    );

    showMessage(
      selected.success,
    );
  }

  /* =========================================
     CLEAR EVERYTHING
  ========================================= */

  function clearEverything() {
    const confirmed =
      window.confirm(
        'Delete all FORGE tracker data? Workout history, nutrition logs and body measurements will all be removed.',
      );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      WORKOUTS_KEY,
    );

    localStorage.removeItem(
      WORKOUT_DRAFT_KEY,
    );

    localStorage.removeItem(
      NUTRITION_KEY,
    );

    localStorage.removeItem(
      PROGRESS_KEY,
    );

    setRevision(
      (current) =>
        current + 1,
    );

    showMessage(
      'All FORGE tracker data has been cleared.',
    );
  }

  return (
    <main className="settings-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            Application
          </span>

          <h1 className="page__title">
            Settings
          </h1>

          <p className="page__description">
            Manage your FORGE data,
            backups and local storage.
          </p>

        </div>

      </div>

      {/* =====================================
          STORAGE SUMMARY
      ===================================== */}

      <div className="settings-page__section-heading">

        <div>

          <h2>
            Your Data
          </h2>

          <p>
            Data currently stored on
            this device.
          </p>

        </div>

      </div>

      <section className="settings-page__stats">

        <article className="settings-page__stat">

          <div>
            <Dumbbell
              size={18}
            />
          </div>

          <span>
            Workouts
          </span>

          <strong>
            {summary.workouts}
          </strong>

        </article>

        <article className="settings-page__stat">

          <div>
            <Utensils
              size={18}
            />
          </div>

          <span>
            Food Entries
          </span>

          <strong>
            {summary.foodEntries}
          </strong>

        </article>

        <article className="settings-page__stat">

          <div>
            <Scale
              size={18}
            />
          </div>

          <span>
            Measurements
          </span>

          <strong>
            {summary.measurements}
          </strong>

        </article>

        <article className="settings-page__stat">

          <div>
            <Database
              size={18}
            />
          </div>

          <span>
            Nutrition Days
          </span>

          <strong>
            {summary.nutritionDays}
          </strong>

        </article>

      </section>

      {/* =====================================
          BACKUP
      ===================================== */}

      <section className="panel settings-page__card">

        <div className="settings-page__card-icon">
          <HardDrive
            size={20}
          />
        </div>

        <div className="settings-page__card-content">

          <h3>
            Backup & Restore
          </h3>

          <p>
            Export your FORGE data to
            a JSON backup file or
            restore a previous backup.
          </p>

        </div>

        <div className="settings-page__actions">

          <button
            type="button"
            className="button"
            onClick={
              exportBackup
            }
          >
            <Download
              size={16}
            />
            Export Backup
          </button>

          <label
            htmlFor="forge-restore"
            className="button"
          >
            <Upload
              size={16}
            />
            Restore Backup
          </label>

          <input
            id="forge-restore"
            className="settings-page__file-input"
            type="file"
            accept=".json,application/json"
            onChange={
              restoreBackup
            }
          />

        </div>

      </section>

      {/* =====================================
          LOCAL STORAGE
      ===================================== */}

      <section className="panel settings-page__card">

        <div className="settings-page__card-icon">
          <ShieldCheck
            size={20}
          />
        </div>

        <div className="settings-page__card-content">

          <h3>
            Local Storage
          </h3>

          <p>
            Your workout, nutrition
            and progress data is stored
            locally in this browser.
          </p>

        </div>

        <div className="settings-page__storage-label">
          This Device
        </div>

      </section>

      {/* =====================================
          DATA MANAGEMENT
      ===================================== */}

      <div className="settings-page__section-heading settings-page__section-heading--danger">

        <div>

          <h2>
            Data Management
          </h2>

          <p>
            Permanently remove tracker
            records from this device.
          </p>

        </div>

      </div>

      <section className="panel settings-page__data">

        <div className="settings-page__data-row">

          <div>

            <strong>
              Workout History
            </strong>

            <span>
              {summary.workouts}{' '}
              logged{' '}
              {summary.workouts === 1
                ? 'workout'
                : 'workouts'}
            </span>

          </div>

          <button
            type="button"
            className="settings-page__delete"
            onClick={() =>
              clearSection(
                'workouts',
              )
            }
          >
            <Trash2
              size={15}
            />
            Clear
          </button>

        </div>

        <div className="settings-page__data-row">

          <div>

            <strong>
              Nutrition History
            </strong>

            <span>
              {summary.foodEntries}{' '}
              recorded food{' '}
              {summary.foodEntries === 1
                ? 'entry'
                : 'entries'}
            </span>

          </div>

          <button
            type="button"
            className="settings-page__delete"
            onClick={() =>
              clearSection(
                'nutrition',
              )
            }
          >
            <Trash2
              size={15}
            />
            Clear
          </button>

        </div>

        <div className="settings-page__data-row">

          <div>

            <strong>
              Body Measurements
            </strong>

            <span>
              {summary.measurements}{' '}
              recorded{' '}
              {summary.measurements === 1
                ? 'measurement'
                : 'measurements'}
            </span>

          </div>

          <button
            type="button"
            className="settings-page__delete"
            onClick={() =>
              clearSection(
                'progress',
              )
            }
          >
            <Trash2
              size={15}
            />
            Clear
          </button>

        </div>

      </section>

      {/* =====================================
          CLEAR EVERYTHING
      ===================================== */}

      <section className="panel settings-page__danger">

        <div>

          <strong>
            Clear All Tracker Data
          </strong>

          <p>
            Removes workouts,
            nutrition logs, workout
            drafts and body
            measurements.
          </p>

        </div>

        <button
          type="button"
          className="settings-page__danger-button"
          onClick={
            clearEverything
          }
        >
          <Trash2 size={16} />
          Clear Everything
        </button>

      </section>

      {/* =====================================
          STATUS
      ===================================== */}

      {message && (
        <div className="settings-page__message">
          {message}
        </div>
      )}

      {error && (
        <div className="settings-page__error">
          {error}
        </div>
      )}

    </main>
  );
}

/* =========================================
   DATE
========================================= */

function getLocalDateString() {
  const date =
    new Date();

  const offset =
    date.getTimezoneOffset() *
    60000;

  return new Date(
    date.getTime() - offset,
  )
    .toISOString()
    .slice(0, 10);
}

export default SettingsPage;
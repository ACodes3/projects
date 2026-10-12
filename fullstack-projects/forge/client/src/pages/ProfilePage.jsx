import {
  Activity,
  CalendarDays,
  Dumbbell,
  Pencil,
  Save,
  Scale,
  UserRound,
  X,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import './ProfilePage.css';

const PROFILE_KEY =
  'forge:profile';

const WORKOUTS_KEY =
  'forge:workoutHistory';

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
   PROFILE
========================================= */

function loadProfile() {
  const stored =
    readObject(PROFILE_KEY);

  return {
    name:
      stored.name ?? '',

    trainingFocus:
      stored.trainingFocus ?? '',

    height:
      stored.height ?? '',

    bio:
      stored.bio ?? '',
  };
}

/* =========================================
   PROFILE PAGE
========================================= */

function ProfilePage() {
  const [profile, setProfile] =
    useState(loadProfile);

  const [draft, setDraft] =
    useState(profile);

  const [editing, setEditing] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const workouts =
    useMemo(
      () =>
        readArray(
          WORKOUTS_KEY,
        ),
      [],
    );

  const nutrition =
    useMemo(
      () =>
        readObject(
          NUTRITION_KEY,
        ),
      [],
    );

  const progress =
    useMemo(
      () =>
        readArray(
          PROGRESS_KEY,
        ),
      [],
    );

  /* =========================================
     STATS
  ========================================= */

  const stats =
    useMemo(() => {
      const sortedProgress =
        [...progress].sort(
          (a, b) =>
            new Date(
              b.date ?? 0,
            ) -
            new Date(
              a.date ?? 0,
            ),
        );

      const latestWeight =
        sortedProgress[0]
          ?.weight ?? null;

      const totalVolume =
        workouts.reduce(
          (
            workoutTotal,
            workout,
          ) => {
            return (
              workoutTotal +
              getWorkoutVolume(
                workout,
              )
            );
          },
          0,
        );

      const trackedDates =
        new Set();

      workouts.forEach(
        (workout) => {
          if (workout.date) {
            trackedDates.add(
              workout.date,
            );
          }
        },
      );

      Object.keys(
        nutrition,
      ).forEach(
        (date) =>
          trackedDates.add(
            date,
          ),
      );

      progress.forEach(
        (entry) => {
          if (entry.date) {
            trackedDates.add(
              entry.date,
            );
          }
        },
      );

      return {
        workouts:
          workouts.length,

        currentWeight:
          latestWeight,

        totalVolume,

        trackedDays:
          trackedDates.size,
      };
    }, [
      workouts,
      nutrition,
      progress,
    ]);

  /* =========================================
     SAVE PROFILE
  ========================================= */

  function saveProfile() {
    const updated = {
      name:
        draft.name.trim(),

      trainingFocus:
        draft.trainingFocus.trim(),

      height:
        draft.height === ''
          ? ''
          : Number(
              draft.height,
            ),

      bio:
        draft.bio.trim(),
    };

    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify(
        updated,
      ),
    );

    setProfile(updated);
    setDraft(updated);
    setEditing(false);

    setMessage(
      'Profile updated.',
    );
  }

  /* =========================================
     CANCEL EDITING
  ========================================= */

  function cancelEditing() {
    setDraft(profile);
    setEditing(false);
    setMessage('');
  }

  /* =========================================
     INITIALS
  ========================================= */

  const initials =
    getInitials(
      profile.name,
    );

  return (
    <main className="profile-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            Personal Overview
          </span>

          <h1 className="page__title">
            Profile
          </h1>

          <p className="page__description">
            Your personal information
            and tracking summary.
          </p>

        </div>

        {!editing ? (
          <button
            type="button"
            className="button"
            onClick={() => {
              setDraft(profile);
              setEditing(true);
              setMessage('');
            }}
          >
            <Pencil size={15} />
            Edit Profile
          </button>
        ) : (
          <div className="profile-page__header-actions">

            <button
              type="button"
              className="button"
              onClick={
                cancelEditing
              }
            >
              <X size={15} />
              Cancel
            </button>

            <button
              type="button"
              className="button button--primary"
              onClick={
                saveProfile
              }
            >
              <Save size={15} />
              Save Profile
            </button>

          </div>
        )}

      </div>

      {/* =====================================
          PROFILE HERO
      ===================================== */}

      <section className="panel profile-page__hero">

        <div className="profile-page__avatar">

          {profile.name ? (
            <span>
              {initials}
            </span>
          ) : (
            <UserRound
              size={34}
            />
          )}

        </div>

        <div className="profile-page__identity">

          <span>
            FORGE Profile
          </span>

          <h2>
            {profile.name ||
              'Your Profile'}
          </h2>

          <p>
            {profile.trainingFocus ||
              'Add your training focus to personalize your profile.'}
          </p>

        </div>

        {profile.height && (
          <div className="profile-page__height">

            <span>
              Height
            </span>

            <strong>
              {formatNumber(
                profile.height,
              )}{' '}
              cm
            </strong>

          </div>
        )}

      </section>

      {/* =====================================
          TRACKING SUMMARY
      ===================================== */}

      <section className="profile-page__stats">

        <article className="profile-page__stat">

          <div>
            <Dumbbell
              size={18}
            />
          </div>

          <span>
            Workouts Logged
          </span>

          <strong>
            {stats.workouts}
          </strong>

        </article>

        <article className="profile-page__stat">

          <div>
            <Scale
              size={18}
            />
          </div>

          <span>
            Current Weight
          </span>

          <strong>
            {stats.currentWeight !==
            null
              ? `${formatNumber(
                  stats.currentWeight,
                )} kg`
              : '—'}
          </strong>

        </article>

        <article className="profile-page__stat">

          <div>
            <Activity
              size={18}
            />
          </div>

          <span>
            Total Volume
          </span>

          <strong>
            {formatVolume(
              stats.totalVolume,
            )}
          </strong>

        </article>

        <article className="profile-page__stat">

          <div>
            <CalendarDays
              size={18}
            />
          </div>

          <span>
            Days Tracked
          </span>

          <strong>
            {stats.trackedDays}
          </strong>

        </article>

      </section>

      {/* =====================================
          PROFILE INFORMATION
      ===================================== */}

      <div className="profile-page__section-header">

        <div>

          <h2>
            Profile Information
          </h2>

          <p>
            Personal details stored
            locally in FORGE.
          </p>

        </div>

      </div>

      <section className="panel profile-page__details">

        {editing ? (
          <div className="profile-page__form">

            <div className="profile-page__field">

              <label htmlFor="profile-name">
                Name
              </label>

              <input
                id="profile-name"
                type="text"
                placeholder="Your name"
                value={
                  draft.name
                }
                onChange={(
                  event,
                ) =>
                  setDraft(
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

            <div className="profile-page__field">

              <label htmlFor="profile-focus">
                Training Focus
              </label>

              <input
                id="profile-focus"
                type="text"
                placeholder="e.g. Strength & hypertrophy"
                value={
                  draft.trainingFocus
                }
                onChange={(
                  event,
                ) =>
                  setDraft(
                    (
                      current,
                    ) => ({
                      ...current,
                      trainingFocus:
                        event
                          .target
                          .value,
                    }),
                  )
                }
              />

            </div>

            <div className="profile-page__field">

              <label htmlFor="profile-height">
                Height (cm)
              </label>

              <input
                id="profile-height"
                type="number"
                min="0"
                step="0.1"
                placeholder="Optional"
                value={
                  draft.height
                }
                onChange={(
                  event,
                ) =>
                  setDraft(
                    (
                      current,
                    ) => ({
                      ...current,
                      height:
                        event
                          .target
                          .value,
                    }),
                  )
                }
              />

            </div>

            <div className="profile-page__field profile-page__field--full">

              <label htmlFor="profile-bio">
                Notes
              </label>

              <textarea
                id="profile-bio"
                rows="5"
                placeholder="Anything you want to keep on your profile..."
                value={
                  draft.bio
                }
                onChange={(
                  event,
                ) =>
                  setDraft(
                    (
                      current,
                    ) => ({
                      ...current,
                      bio:
                        event
                          .target
                          .value,
                    }),
                  )
                }
              />

            </div>

          </div>
        ) : (
          <div className="profile-page__info">

            <div className="profile-page__info-row">

              <span>
                Name
              </span>

              <strong>
                {profile.name ||
                  'Not set'}
              </strong>

            </div>

            <div className="profile-page__info-row">

              <span>
                Training Focus
              </span>

              <strong>
                {profile.trainingFocus ||
                  'Not set'}
              </strong>

            </div>

            <div className="profile-page__info-row">

              <span>
                Height
              </span>

              <strong>
                {profile.height
                  ? `${formatNumber(
                      profile.height,
                    )} cm`
                  : 'Not set'}
              </strong>

            </div>

            <div className="profile-page__bio">

              <span>
                Notes
              </span>

              <p>
                {profile.bio ||
                  'No notes added.'}
              </p>

            </div>

          </div>
        )}

      </section>

      {message && (
        <div className="profile-page__message">
          {message}
        </div>
      )}

    </main>
  );
}

/* =========================================
   HELPERS
========================================= */

function getInitials(name) {
  if (!name?.trim()) {
    return '';
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]
          ?.toUpperCase(),
    )
    .join('');
}

function getWorkoutVolume(
  workout,
) {
  return (
    workout.exercises?.reduce(
      (
        total,
        exercise,
      ) => {
        const volume =
          exercise.sets?.reduce(
            (
              setTotal,
              set,
            ) =>
              setTotal +
              (
                Number(
                  set.weight,
                ) || 0
              ) *
                (
                  Number(
                    set.reps,
                  ) || 0
                ),
            0,
          ) ?? 0;

        return total + volume;
      },
      0,
    ) ?? 0
  );
}

function formatNumber(value) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number,
    )
  ) {
    return '—';
  }

  return Number.isInteger(
    number,
  )
    ? number.toString()
    : number.toFixed(1);
}

function formatVolume(value) {
  const number =
    Number(value || 0);

  if (number >= 1000000) {
    return `${(
      number / 1000000
    ).toFixed(1)}m kg`;
  }

  if (number >= 1000) {
    return `${(
      number / 1000
    ).toFixed(1)}k kg`;
  }

  return `${Math.round(
    number,
  ).toLocaleString()} kg`;
}

export default ProfilePage;
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
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getNutritionEntries,
  getProfile,
  getProgressEntries,
  getWorkouts,
  saveProfile as saveProfileRequest,
} from '../api/forgeApi.js';

import './ProfilePage.css';


/* =========================================
   EMPTY PROFILE
========================================= */

const EMPTY_PROFILE = {
  name: '',
  trainingFocus: '',
  height: '',
  bio: '',
};


/* =========================================
   API NORMALIZATION
========================================= */

function normalizeProfile(
  response,
) {
  const raw =
    response?.profile
    ?? response?.data?.profile
    ?? response
    ?? {};

  return {
    name:
      raw.name
      ?? '',

    trainingFocus:
      raw.trainingFocus
      ?? raw.training_focus
      ?? '',

    height:
      raw.height
      ?? raw.height_cm
      ?? '',

    bio:
      raw.bio
      ?? '',
  };
}


function extractProgressEntries(
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
      response?.progressEntries,
    )
  ) {
    return response.progressEntries;
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


function normalizeProgressEntry(
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

    weight:
      normalizeNumber(
        entry.weight_kg
        ?? entry.weight,
      ),
  };
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
  };
}


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


function normalizeNumber(
  value,
) {
  if (
    value === null
    || value === undefined
    || value === ''
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number,
  )
    ? number
    : null;
}


/* =========================================
   PROFILE PAGE
========================================= */

function ProfilePage() {
  const [
    profile,
    setProfile,
  ] = useState(
    EMPTY_PROFILE,
  );

  const [
    draft,
    setDraft,
  ] = useState(
    EMPTY_PROFILE,
  );

  const [
    workouts,
    setWorkouts,
  ] = useState([]);

  const [
    nutrition,
    setNutrition,
  ] = useState([]);

  const [
    progress,
    setProgress,
  ] = useState([]);

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);


  /* =========================================
     LOAD PROFILE + TRACKING DATA
  ========================================= */

  async function loadProfilePage() {
    try {
      const [
        profileResponse,
        workoutsResponse,
        nutritionResponse,
        progressResponse,
      ] = await Promise.all([
        getProfile(),
        getWorkouts(),
        getNutritionEntries(),
        getProgressEntries(),
      ]);

      const normalizedProfile =
        normalizeProfile(
          profileResponse,
        );

      const normalizedProgress =
        extractProgressEntries(
          progressResponse,
        ).map(
          normalizeProgressEntry,
        );

      const normalizedNutrition =
        extractNutritionEntries(
          nutritionResponse,
        ).map(
          normalizeNutritionEntry,
        );

      setProfile(
        normalizedProfile,
      );

      setDraft(
        normalizedProfile,
      );

      setWorkouts(
        Array.isArray(
          workoutsResponse,
        )
          ? workoutsResponse
          : [],
      );

      setNutrition(
        normalizedNutrition,
      );

      setProgress(
        normalizedProgress,
      );
    } catch (error) {
      console.error(
        'Failed to load profile:',
        error,
      );

      setMessage(
        error.message
        || 'Failed to load profile.',
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    const timeoutId =
      setTimeout(() => {
        loadProfilePage();
      }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);


  /* =========================================
     STATS
  ========================================= */

  const stats =
    useMemo(() => {
      const sortedProgress = [
        ...progress,
      ].sort(
        (a, b) =>
          new Date(
            `${b.date || '1970-01-01'}T12:00:00`,
          )
          - new Date(
            `${a.date || '1970-01-01'}T12:00:00`,
          ),
      );

      const latestWeightEntry =
        sortedProgress.find(
          (entry) =>
            entry.weight !== null
            && entry.weight !==
              undefined,
        );

      const latestWeight =
        latestWeightEntry
          ?.weight
        ?? null;

      const totalVolume =
        workouts.reduce(
          (
            workoutTotal,
            workout,
          ) => {
            return (
              workoutTotal
              + getWorkoutVolume(
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

      nutrition.forEach(
        (entry) => {
          if (entry.date) {
            trackedDates.add(
              entry.date,
            );
          }
        },
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

  async function handleSaveProfile() {
    if (saving) {
      return;
    }

    const trimmedName =
      draft.name.trim();

    const trimmedFocus =
      draft.trainingFocus.trim();

    const trimmedBio =
      draft.bio.trim();

    let height =
      null;

    if (
      draft.height !== ''
      && draft.height !== null
      && draft.height !==
        undefined
    ) {
      height =
        Number(
          draft.height,
        );

      if (
        !Number.isFinite(
          height,
        )
        || height <= 0
      ) {
        setMessage(
          'Height must be a positive number.',
        );

        return;
      }
    }

    const updated = {
      name:
        trimmedName,

      trainingFocus:
        trimmedFocus,

      height,

      bio:
        trimmedBio,
    };

    try {
      setSaving(true);
      setMessage('');

      const response =
        await saveProfileRequest(
          updated,
        );

      const savedProfile =
        normalizeProfile(
          response,
        );

      setProfile(
        savedProfile,
      );

      setDraft(
        savedProfile,
      );

      setEditing(
        false,
      );

      setMessage(
        'Profile updated.',
      );
    } catch (error) {
      console.error(
        'Failed to save profile:',
        error,
      );

      setMessage(
        error.message
        || 'Failed to save profile.',
      );
    } finally {
      setSaving(false);
    }
  }


  /* =========================================
     CANCEL EDITING
  ========================================= */

  function cancelEditing() {
    setDraft(
      profile,
    );

    setEditing(
      false,
    );

    setMessage('');
  }


  /* =========================================
     INITIALS
  ========================================= */

  const initials =
    getInitials(
      profile.name,
    );


  /* =========================================
     RENDER
  ========================================= */

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
            disabled={
              loading
            }
            onClick={() => {
              setDraft(
                profile,
              );

              setEditing(
                true,
              );

              setMessage('');
            }}
          >
            <Pencil
              size={15}
            />

            Edit Profile
          </button>

        ) : (

          <div className="profile-page__header-actions">

            <button
              type="button"
              className="button"
              disabled={
                saving
              }
              onClick={
                cancelEditing
              }
            >
              <X
                size={15}
              />

              Cancel
            </button>

            <button
              type="button"
              className="button button--primary"
              disabled={
                saving
              }
              onClick={
                handleSaveProfile
              }
            >
              <Save
                size={15}
              />

              {
                saving
                  ? 'Saving...'
                  : 'Save Profile'
              }
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
            {
              profile.name
              || 'Your Profile'
            }
          </h2>

          <p>
            {
              profile.trainingFocus
              || 'Add your training focus to personalize your profile.'
            }
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
            {
              stats.workouts
            }
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
            {
              stats.currentWeight !==
              null
                ? `${formatNumber(
                    stats.currentWeight,
                  )} kg`
                : '—'
            }
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
            {
              stats.trackedDays
            }
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
            in your FORGE database.
          </p>

        </div>

      </div>


      <section className="panel profile-page__details">

        {loading ? (

          <div className="profile-page__info">

            <div className="profile-page__info-row">

              <span>
                Profile
              </span>

              <strong>
                Loading...
              </strong>

            </div>

          </div>

        ) : editing ? (

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
                disabled={
                  saving
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
                disabled={
                  saving
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
                min="0.1"
                step="0.1"
                placeholder="Optional"
                value={
                  draft.height
                  ?? ''
                }
                disabled={
                  saving
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
                disabled={
                  saving
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
                {
                  profile.name
                  || 'Not set'
                }
              </strong>

            </div>


            <div className="profile-page__info-row">

              <span>
                Training Focus
              </span>

              <strong>
                {
                  profile.trainingFocus
                  || 'Not set'
                }
              </strong>

            </div>


            <div className="profile-page__info-row">

              <span>
                Height
              </span>

              <strong>
                {
                  profile.height
                    ? `${formatNumber(
                        profile.height,
                      )} cm`
                    : 'Not set'
                }
              </strong>

            </div>


            <div className="profile-page__bio">

              <span>
                Notes
              </span>

              <p>
                {
                  profile.bio
                  || 'No notes added.'
                }
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

function getInitials(
  name,
) {
  if (
    !name?.trim()
  ) {
    return '';
  }

  return name
    .trim()
    .split(
      /\s+/,
    )
    .slice(
      0,
      2,
    )
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
        if (
          exercise.trackingMode
          === 'time'
        ) {
          return total;
        }

        const volume =
          exercise.sets?.reduce(
            (
              setTotal,
              set,
            ) =>
              setTotal
              + (
                Number(
                  set.weight,
                ) || 0
              )
              * (
                Number(
                  set.reps,
                ) || 0
              ),
            0,
          ) ?? 0;

        return (
          total
          + volume
        );
      },
      0,
    ) ?? 0
  );
}


function formatNumber(
  value,
) {
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


function formatVolume(
  value,
) {
  const number =
    Number(
      value || 0,
    );

  if (
    number >= 1000000
  ) {
    return `${
      (
        number / 1000000
      ).toFixed(1)
    }m kg`;
  }

  if (
    number >= 1000
  ) {
    return `${
      (
        number / 1000
      ).toFixed(1)
    }k kg`;
  }

  return `${
    Math.round(
      number,
    ).toLocaleString()
  } kg`;
}


export default ProfilePage;
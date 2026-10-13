
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Pencil,
  RefreshCw,
  Save,
  Scale,
  UserRound,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRef } from "react";

import {
  getNutritionEntries,
  getProfile,
  getProgressEntries,
  getWorkouts,
  saveProfile as saveProfileRequest,
} from "../api/forgeApi.js";

import "./ProfilePage.css";

/* =========================================
   CONSTANTS
========================================= */

const EMPTY_PROFILE = {
  name: "",
  trainingFocus: "",
  height: "",
  bio: "",
};

/* =========================================
   PROFILE NORMALIZATION
========================================= */

function normalizeProfile(response) {
  const raw =
    response?.profile ??
    response?.data?.profile ??
    response ??
    {};

  return {
    name: String(raw.name ?? ""),

    trainingFocus: String(
      raw.trainingFocus ??
      raw.training_focus ??
      ""
    ),

    height:
      raw.height ??
      raw.height_cm ??
      "",

    bio: String(raw.bio ?? ""),
  };
}

/* =========================================
   ARRAY EXTRACTION
========================================= */

function extractEntries(
  response,
  possibleKeys = []
) {
  if (Array.isArray(response)) {
    return response;
  }

  for (const key of possibleKeys) {
    if (Array.isArray(response?.[key])) {
      return response[key];
    }
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

/* =========================================
   VALUE NORMALIZATION
========================================= */

function normalizeDate(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function normalizeNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function normalizeProgressEntry(entry) {
  return {
    id: entry.id,

    date: normalizeDate(
      entry.entry_date ??
      entry.date
    ),

    weight: normalizeNumber(
      entry.weight_kg ??
      entry.weight
    ),
  };
}

function normalizeNutritionEntry(entry) {
  return {
    id: entry.id,

    date: normalizeDate(
      entry.entry_date ??
      entry.date
    ),
  };
}

/* =========================================
   FORMATTERS
========================================= */

function getInitials(name) {
  if (!name?.trim()) {
    return "";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part[0]?.toUpperCase()
    )
    .join("");
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return Number.isInteger(number)
    ? number.toString()
    : number.toFixed(1);
}

function formatVolume(value) {
  const number = Number(value || 0);

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
    number
  ).toLocaleString()} kg`;
}

/* =========================================
   WORKOUT VOLUME
========================================= */

function getWorkoutVolume(workout) {
  return (
    workout.exercises?.reduce(
      (total, exercise) => {
        if (
          exercise.trackingMode ===
          "time"
        ) {
          return total;
        }

        const volume =
          exercise.sets?.reduce(
            (setTotal, set) => {
              const weight =
                Number(set.weight) || 0;

              const reps =
                Number(set.reps) || 0;

              return (
                setTotal +
                weight * reps
              );
            },
            0
          ) ?? 0;

        return total + volume;
      },
      0
    ) ?? 0
  );
}

/* =========================================
   PROFILE PAGE
========================================= */

export default function ProfilePage() {
  /* =====================================
     PROFILE STATE
  ===================================== */

  const [
    profile,
    setProfile,
  ] = useState({ ...EMPTY_PROFILE });

  const [
    draft,
    setDraft,
  ] = useState({ ...EMPTY_PROFILE });

  /*
    This state controls whether the
    editable fields are displayed.

    Clicking Edit Profile changes
    this state directly.
  */

  const [
    editing,
    setEditing,
  ] = useState(false);

  /* =====================================
     TRACKING DATA
  ===================================== */

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

  /* =====================================
     LOADING / SAVING STATE
  ===================================== */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    profileError,
    setProfileError,
  ] = useState("");

  const [
    statsError,
    setStatsError,
  ] = useState("");

  const [
    formError,
    setFormError,
  ] = useState("");

  /* =====================================
     TOAST STATE
  ===================================== */

  const [
    toast,
    setToast,
  ] = useState(null);

  const showToast = useCallback(
    (type, title, message) => {
      setToast({
        type,
        title,
        message,
        id: Date.now(),
      });
    },
    []
  );

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = setTimeout(
      () => setToast(null),
      3500
    );

    return () => {
      clearTimeout(timeout);
    };
  }, [toast]);

  /* =====================================
     LOAD PROFILE
  ===================================== */

  const loadProfileData =
    useCallback(async () => {
      try {
        const response =
          await getProfile();

        const normalized =
          normalizeProfile(response);

        setProfile(normalized);
        setProfileError("");

        return normalized;
      } catch (error) {
        console.error(
          "Failed to load profile:",
          error
        );

        setProfileError(
          error.message ||
            "Failed to load profile."
        );

        return null;
      }
    }, []);

  /* =====================================
     LOAD TRACKING STATISTICS
  ===================================== */

  const loadTrackingData =
    useCallback(async () => {
      const results =
        await Promise.allSettled([
          getWorkouts(),
          getNutritionEntries(),
          getProgressEntries(),
        ]);

      let failures = 0;

      const [
        workoutsResult,
        nutritionResult,
        progressResult,
      ] = results;

      if (
        workoutsResult.status ===
        "fulfilled"
      ) {
        setWorkouts(
          extractEntries(
            workoutsResult.value,
            ["workouts"]
          )
        );
      } else {
        failures += 1;
      }

      if (
        nutritionResult.status ===
        "fulfilled"
      ) {
        setNutrition(
          extractEntries(
            nutritionResult.value,
            [
              "entries",
              "nutritionEntries",
            ]
          ).map(
            normalizeNutritionEntry
          )
        );
      } else {
        failures += 1;
      }

      if (
        progressResult.status ===
        "fulfilled"
      ) {
        setProgress(
          extractEntries(
            progressResult.value,
            [
              "entries",
              "progressEntries",
            ]
          ).map(
            normalizeProgressEntry
          )
        );
      } else {
        failures += 1;
      }

      setStatsError(
        failures > 0
          ? "Some tracking statistics could not be loaded. Use Refresh to try again."
          : ""
      );
    }, []);

  /* =====================================
     INITIAL DATA LOAD
  ===================================== */

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        await Promise.all([
          loadProfileData(),
          loadTrackingData(),
        ]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [
    loadProfileData,
    loadTrackingData,
  ]);

  /* =====================================
     REFRESH PAGE DATA
  ===================================== */

  async function refreshPage() {
    if (
      refreshing ||
      saving ||
      editing
    ) {
      return;
    }

    try {
      setRefreshing(true);

      await Promise.all([
        loadProfileData(),
        loadTrackingData(),
      ]);
    } catch (error) {
      showToast(
        "error",
        "Refresh failed",
        error.message ||
          "Unable to refresh profile."
      );
    } finally {
      setRefreshing(false);
    }
  }

  /* =====================================
     PROFILE STATISTICS
  ===================================== */

  const stats = useMemo(() => {
    const sortedProgress = [
      ...progress,
    ].sort(
      (a, b) =>
        (b.date || "").localeCompare(
          a.date || ""
        )
    );

    const latestWeightEntry =
      sortedProgress.find(
        (entry) =>
          entry.weight !== null &&
          entry.weight !== undefined
      );

    const totalVolume =
      workouts.reduce(
        (total, workout) =>
          total +
          getWorkoutVolume(workout),
        0
      );

    const trackedDates = new Set();

    workouts.forEach((workout) => {
      const date = normalizeDate(
        workout.date ??
        workout.workout_date
      );

      if (date) {
        trackedDates.add(date);
      }
    });

    nutrition.forEach((entry) => {
      if (entry.date) {
        trackedDates.add(
          entry.date
        );
      }
    });

    progress.forEach((entry) => {
      if (entry.date) {
        trackedDates.add(
          entry.date
        );
      }
    });

    return {
      workouts: workouts.length,

      currentWeight:
        latestWeightEntry?.weight ??
        null,

      totalVolume,

      trackedDays:
        trackedDates.size,
    };
  }, [
    workouts,
    nutrition,
    progress,
  ]);

  /* =====================================
     OPEN EDIT PROFILE

     IMPORTANT:
     This function does not save.
     It only opens the editable fields.
  ===================================== */

  const editButtonRef = useRef(null);
  const modalRef = useRef(null);
  const nameInputRef = useRef(null);
  const savingRef = useRef(saving);

  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  function startEditing() {
    if (saving) {
      return;
    }

    setDraft({
      name: profile.name ?? "",

      trainingFocus:
        profile.trainingFocus ?? "",

      height:
        profile.height ?? "",

      bio: profile.bio ?? "",
    });

    setFormError("");
    setToast(null);

    /*
      Do not display a toast here.
      The user has not saved anything.
    */

    setEditing(true);
  }

  /* =====================================
     CANCEL EDITING
  ===================================== */

  const cancelEditing = useCallback(() => {
    if (saving) {
      return;
    }

    setDraft({
      ...profile,
    });

    setFormError("");
    setEditing(false);
  }, [profile, saving]);

  // The modal is mounted outside the page so global layouts cannot
  // clip it. Keep focus inside the dialog and restore it on close.
  useEffect(() => {
    if (!editing) return undefined;

    const previousOverflow = document.body.style.overflow;
    const editButton = editButtonRef.current;
    document.body.style.overflow = "hidden";
    nameInputRef.current?.focus();

    function handleModalKeyDown(event) {
      if (event.key === "Escape" && !savingRef.current) {
        event.preventDefault();
        cancelEditing();
      }
      if (event.key !== "Tab" || !modalRef.current) return;
      const elements = Array.from(
        modalRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleModalKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleModalKeyDown);
      editButton?.focus();
    };
  }, [cancelEditing, editing]);

  /* =====================================
     UPDATE FORM FIELDS
  ===================================== */

  function updateDraft(
    field,
    value
  ) {
    setDraft(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

    if (formError) {
      setFormError("");
    }
  }

  /* =====================================
     SAVE PROFILE

     Only this function can produce
     the Profile updated success toast.
  ===================================== */

  async function handleSaveProfile(
    event
  ) {
    event.preventDefault();

    if (
      saving ||
      !editing
    ) {
      return;
    }

    const name =
      draft.name.trim();

    const trainingFocus =
      draft.trainingFocus.trim();

    const bio =
      draft.bio.trim();

    let height = null;

    if (
      draft.height !== "" &&
      draft.height !== null &&
      draft.height !== undefined
    ) {
      height = Number(
        draft.height
      );

      if (
        !Number.isFinite(height) ||
        height <= 0
      ) {
        setFormError(
          "Height must be a positive number."
        );

        return;
      }
    }

    const updated = {
      name,
      trainingFocus,
      height,
      bio,
    };

    try {
      setSaving(true);
      setFormError("");

      await saveProfileRequest(
        updated
      );

      /*
        Read back the saved profile
        from PostgreSQL.

        This confirms the values
        displayed are server values,
        not merely local draft data.
      */

      const verifyResponse =
        await getProfile();

      const savedProfile =
        normalizeProfile(
          verifyResponse
        );

      setProfile(savedProfile);
      setDraft(savedProfile);

      setEditing(false);
      setProfileError("");

      showToast(
        "success",
        "Profile updated",
        "Your profile changes were saved successfully."
      );
    } catch (error) {
      console.error(
        "Failed to save profile:",
        error
      );

      const message =
        error.message ||
        "Failed to save profile.";

      setFormError(message);

      showToast(
        "error",
        "Save failed",
        message
      );

      /*
        Keep the form open when
        the save fails.
      */
    } finally {
      setSaving(false);
    }
  }

  /* =====================================
     PROFILE INITIALS
  ===================================== */

  const initials = getInitials(
    profile.name
  );

  /* =====================================
     RENDER
  ===================================== */

  return (
    <>
    <main className="profile-page">

      {/* ===================================
          TOAST
      =================================== */}

      {toast && (
        <div
          key={toast.id}
          className={`profile-page__toast profile-page__toast--${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <div className="profile-page__toast-icon">
            {toast.type ===
            "success" ? (
              <CheckCircle2
                size={18}
              />
            ) : (
              <AlertCircle
                size={18}
              />
            )}
          </div>

          <div className="profile-page__toast-copy">
            <strong>
              {toast.title}
            </strong>

            <span>
              {toast.message}
            </span>
          </div>

          <button
            type="button"
            className="profile-page__toast-close"
            aria-label="Dismiss notification"
            onClick={() =>
              setToast(null)
            }
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ===================================
          HEADER
      =================================== */}

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

        {/* =================================
            HEADER BUTTONS
        ================================= */}

        <div className="profile-page__header-actions">

          <button
            type="button"
            className="button"
            disabled={loading || refreshing || saving || editing}
            onClick={refreshPage}
          >
            <RefreshCw size={15} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            ref={editButtonRef}
            type="button"
            className="button"
            disabled={loading || refreshing || saving || editing || Boolean(profileError)}
            onClick={startEditing}
          >
            <Pencil size={15} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* ===================================
          PROFILE LOAD ERROR
      =================================== */}

      {profileError && (
        <div
          className="profile-page__error"
          role="alert"
        >
          <AlertCircle size={16} />

          <span>
            {profileError}
          </span>
        </div>
      )}

      {/* ===================================
          STATS ERROR
      =================================== */}

      {statsError && (
        <div
          className="profile-page__warning"
          role="status"
        >
          <AlertCircle size={16} />

          <span>
            {statsError}
          </span>
        </div>
      )}

      {/* ===================================
          PROFILE HERO
      =================================== */}

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
              "Your Profile"}
          </h2>

          <p>
            {profile.trainingFocus ||
              "Add your training focus to personalize your profile."}
          </p>
        </div>

        {profile.height !== "" &&
          profile.height !== null &&
          profile.height !== undefined && (
            <div className="profile-page__height">
              <span>
                Height
              </span>

              <strong>
                {formatNumber(
                  profile.height
                )}{" "}
                cm
              </strong>
            </div>
          )}
      </section>

      {/* ===================================
          PROFILE STATS
      =================================== */}

      <section className="profile-page__stats">
        <article className="profile-page__stat">
          <div>
            <Dumbbell size={18} />
          </div>

          <span>
            Workouts Logged
          </span>

          <strong>
            {loading
              ? "—"
              : stats.workouts}
          </strong>
        </article>

        <article className="profile-page__stat">
          <div>
            <Scale size={18} />
          </div>

          <span>
            Current Weight
          </span>

          <strong>
            {loading
              ? "—"
              : stats.currentWeight !==
                  null
                ? `${formatNumber(
                    stats.currentWeight
                  )} kg`
                : "—"}
          </strong>
        </article>

        <article className="profile-page__stat">
          <div>
            <Activity size={18} />
          </div>

          <span>
            Total Volume
          </span>

          <strong>
            {loading
              ? "—"
              : formatVolume(
                  stats.totalVolume
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
            {loading
              ? "—"
              : stats.trackedDays}
          </strong>
        </article>
      </section>

      {/* ===================================
          PROFILE INFORMATION HEADING
      =================================== */}

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

      {/* ===================================
          PROFILE DETAILS
      =================================== */}

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
        ) : (

          /* =================================
             READ-ONLY PROFILE
          ================================= */

          <div className="profile-page__info">

            <div className="profile-page__info-row">
              <span>
                Name
              </span>

              <strong>
                {profile.name ||
                  "Not set"}
              </strong>
            </div>

            <div className="profile-page__info-row">
              <span>
                Training Focus
              </span>

              <strong>
                {profile.trainingFocus ||
                  "Not set"}
              </strong>
            </div>

            <div className="profile-page__info-row">
              <span>
                Height
              </span>

              <strong>
                {profile.height !== "" &&
                profile.height !== null &&
                profile.height !== undefined
                  ? `${formatNumber(
                      profile.height
                    )} cm`
                  : "Not set"}
              </strong>
            </div>

            <div className="profile-page__bio">
              <span>
                Notes
              </span>

              <p>
                {profile.bio ||
                  "No notes added."}
              </p>
            </div>
          </div>
        )}
      </section>
    </main>

    {editing && createPortal(
      <div
        className="profile-page__modal-backdrop"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) cancelEditing();
        }}
      >
        <section
          ref={modalRef}
          className="profile-page__modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-edit-title"
        >
          <div className="profile-page__modal-header">
            <div>
              <span className="profile-page__modal-eyebrow">FORGE Profile</span>
              <h2 id="profile-edit-title">Edit Profile</h2>
              <p>Update your personal details below.</p>
            </div>
            <button
              type="button"
              className="profile-page__modal-close"
              aria-label="Close edit profile"
              onClick={cancelEditing}
              disabled={saving}
            ><X size={20} /></button>
          </div>
          <form
            id="forge-profile-form"
            className="profile-page__form"
            onSubmit={handleSaveProfile}
          >

            {/* NAME */}

            <div className="profile-page__field">
              <label htmlFor="profile-name">
                Name
              </label>

              <input
                ref={nameInputRef}
                id="profile-name"
                type="text"
                maxLength={150}
                placeholder="Your name"
                value={draft.name}
                disabled={saving}
                onChange={(event) =>
                  updateDraft(
                    "name",
                    event.target.value
                  )
                }
              />
            </div>

            {/* TRAINING FOCUS */}

            <div className="profile-page__field">
              <label htmlFor="profile-focus">
                Training Focus
              </label>

              <input
                id="profile-focus"
                type="text"
                maxLength={150}
                placeholder="e.g. Strength & hypertrophy"
                value={
                  draft.trainingFocus
                }
                disabled={saving}
                onChange={(event) =>
                  updateDraft(
                    "trainingFocus",
                    event.target.value
                  )
                }
              />
            </div>

            {/* HEIGHT */}

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
                  draft.height ?? ""
                }
                disabled={saving}
                onChange={(event) =>
                  updateDraft(
                    "height",
                    event.target.value
                  )
                }
              />
            </div>

            {/* NOTES */}

            <div className="profile-page__field profile-page__field--full">
              <label htmlFor="profile-bio">
                Notes
              </label>

              <textarea
                id="profile-bio"
                rows={5}
                maxLength={2000}
                placeholder="Anything you want to keep on your profile..."
                value={draft.bio}
                disabled={saving}
                onChange={(event) =>
                  updateDraft(
                    "bio",
                    event.target.value
                  )
                }
              />
            </div>

            {/* VALIDATION ERROR */}

            {formError && (
              <div
                className="profile-page__form-error profile-page__field--full"
                role="alert"
              >
                <AlertCircle size={16} />

                <span>
                  {formError}
                </span>
              </div>
            )}
          </form>
          <div className="profile-page__modal-actions">
            <button type="button" className="button" onClick={cancelEditing} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="forge-profile-form" className="button button--primary" disabled={saving}>
              <Save size={15} /> {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </section>
      </div>,
      document.body
    )}
    </>
  );
}

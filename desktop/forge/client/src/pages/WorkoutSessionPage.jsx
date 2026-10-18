
import {
  ArrowLeft,
  Clock3,
  Dumbbell,
  Link as LinkIcon,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  createWorkout,
  getExercises,
  getWorkoutById,
  updateWorkout,
} from "../api/forgeApi.js";

import "./WorkoutSessionPage.css";

/* =========================================
   CONSTANTS
========================================= */

const DRAFT_KEY = "forge:workoutDraft";

/* =========================================
   HELPERS
========================================= */

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function getToday() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createEmptySet() {
  return {
    id: createId(),
    weight: "",
    reps: "",
    durationSeconds: "",
  };
}

/*
  Normalizes workout exercises already
  stored in a workout or local draft.
*/

function normalizeWorkoutExercise(exercise) {
  return {
    id: exercise.id || createId(),

    exerciseId:
      exercise.exerciseId ??
      exercise.exercise_id ??
      null,

    name:
      exercise.name ??
      exercise.exercise_name ??
      "Exercise",

    trackingMode:
      exercise.trackingMode ??
      exercise.tracking_mode ??
      "reps",

    sets:
      Array.isArray(exercise.sets) &&
      exercise.sets.length > 0
        ? exercise.sets.map((set) => ({
            id: set.id || createId(),

            weight:
              set.weight_kg ??
              set.weight ??
              "",

            reps:
              set.reps ?? "",

            durationSeconds:
              set.duration_seconds ??
              set.durationSeconds ??
              "",
          }))
        : [createEmptySet()],
  };
}

/*
  Normalizes exercises returned by
  GET /api/exercises.

  Backend uses:
  primary_muscle, exercise_type.

  Workout picker uses:
  muscle, type.
*/

function normalizeLibraryExercise(exercise) {
  return {
    id: exercise.id,
    name: exercise.name ?? "",

    muscle:
      exercise.primary_muscle ??
      exercise.muscle ??
      "",

    equipment:
      exercise.equipment ?? "",

    type:
      exercise.exercise_type ??
      exercise.type ??
      "",
  };
}

/* =========================================
   DRAFT STORAGE
========================================= */

function loadDraft() {
  try {
    const stored = localStorage.getItem(
      DRAFT_KEY
    );

    if (!stored) return null;

    const parsed = JSON.parse(stored);

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      return null;
    }

    return {
      name: parsed.name || "",

      date:
        parsed.date || getToday(),

      youtubeUrl:
        parsed.youtubeUrl || "",

      notes:
        parsed.notes || "",

      exercises:
        Array.isArray(parsed.exercises)
          ? parsed.exercises.map(
              normalizeWorkoutExercise
            )
          : [],
    };
  } catch {
    return null;
  }
}

/* =========================================
   FORMAT DURATION
========================================= */

function formatDuration(seconds) {
  const total = Math.max(
    0,
    Math.round(Number(seconds) || 0)
  );

  const minutes = Math.floor(total / 60);
  const remaining = total % 60;

  if (minutes === 0) {
    return `${remaining}s`;
  }

  return `${minutes}:${String(
    remaining
  ).padStart(2, "0")}`;
}

/* =========================================
   WORKOUT SESSION PAGE
========================================= */

export default function WorkoutSessionPage() {
  const navigate = useNavigate();

  const { id: workoutId } = useParams();

  const isEditMode = Boolean(workoutId);

  const storedDraft = useMemo(
    () => (
      isEditMode ? null : loadDraft()
    ),
    [isEditMode]
  );

  /* =====================================
     WORKOUT STATE
  ===================================== */

  const [
    workoutName,
    setWorkoutName,
  ] = useState(
    storedDraft?.name || ""
  );

  const [
    workoutDate,
    setWorkoutDate,
  ] = useState(
    storedDraft?.date || getToday()
  );

  const [
    youtubeUrl,
    setYoutubeUrl,
  ] = useState(
    storedDraft?.youtubeUrl || ""
  );

  const [
    notes,
    setNotes,
  ] = useState(
    storedDraft?.notes || ""
  );

  const [
    workoutExercises,
    setWorkoutExercises,
  ] = useState(
    storedDraft?.exercises || []
  );

  /* =====================================
     EXERCISE LIBRARY STATE
  ===================================== */

  const [
    libraryExercises,
    setLibraryExercises,
  ] = useState([]);

  const [
    loadingLibrary,
    setLoadingLibrary,
  ] = useState(false);

  const [
    libraryError,
    setLibraryError,
  ] = useState("");

  const [
    showExerciseModal,
    setShowExerciseModal,
  ] = useState(false);

  const [
    exerciseSearch,
    setExerciseSearch,
  ] = useState("");

  const [
    customExerciseName,
    setCustomExerciseName,
  ] = useState("");

  /* =====================================
     REQUEST STATE
  ===================================== */

  const [
    error,
    setError,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    loadingWorkout,
    setLoadingWorkout,
  ] = useState(isEditMode);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    initialSnapshot,
    setInitialSnapshot,
  ] = useState(null);

  /* =====================================
     LOAD EXERCISES FROM POSTGRESQL
  ===================================== */

  const loadExerciseLibrary = useCallback(
    async () => {
      try {
        setLoadingLibrary(true);
        setLibraryError("");

        const response =
          await getExercises();

        const rawExercises =
          Array.isArray(response)
            ? response
            : Array.isArray(
                response?.exercises
              )
              ? response.exercises
              : [];

        const normalized =
          rawExercises.map(
            normalizeLibraryExercise
          );

        normalized.sort(
          (a, b) =>
            a.name.localeCompare(
              b.name
            )
        );

        setLibraryExercises(normalized);
      } catch (fetchError) {
        console.error(
          "Failed to load exercise library:",
          fetchError
        );

        setLibraryError(
          fetchError.message ||
            "Failed to load exercises."
        );
      } finally {
        setLoadingLibrary(false);
      }
    },
    []
  );

  /* =====================================
     OPEN / CLOSE EXERCISE PICKER
  ===================================== */

  function openExerciseModal() {
    if (saving) return;

    setExerciseSearch("");
    setCustomExerciseName("");
    setLibraryError("");
    setShowExerciseModal(true);
    loadExerciseLibrary();
  }

  function closeExerciseModal() {
    setShowExerciseModal(false);
    setExerciseSearch("");
    setCustomExerciseName("");
  }

  /* =====================================
     LOAD EXISTING WORKOUT
  ===================================== */

  useEffect(() => {
    if (!isEditMode) {
      return undefined;
    }

    let active = true;

    async function loadExistingWorkout() {
      try {
        const workout =
          await getWorkoutById(workoutId);

        if (!active) return;

        const loaded = {
          name: workout.name || "",

          date: String(
            workout.date || ""
          ).slice(0, 10),

          youtubeUrl:
            workout.youtubeUrl || "",

          notes:
            workout.notes || "",

          exercises:
            (
              workout.exercises || []
            ).map(
              normalizeWorkoutExercise
            ),
        };

        setWorkoutName(loaded.name);
        setWorkoutDate(loaded.date);
        setYoutubeUrl(loaded.youtubeUrl);
        setNotes(loaded.notes);

        setWorkoutExercises(
          loaded.exercises
        );

        setInitialSnapshot(
          JSON.stringify(loaded)
        );
      } catch (fetchError) {
        if (!active) return;

        console.error(
          "Failed to load workout:",
          fetchError
        );

        setLoadError(
          fetchError.message ||
            "Unable to load workout."
        );
      } finally {
        if (active) {
          setLoadingWorkout(false);
        }
      }
    }

    loadExistingWorkout();

    return () => {
      active = false;
    };
  }, [
    isEditMode,
    workoutId,
  ]);

  /* =====================================
     AUTO-SAVE CREATE DRAFT
  ===================================== */

  useEffect(() => {
    if (isEditMode) return;

    const draft = {
      name: workoutName,
      date: workoutDate,
      youtubeUrl,
      notes,
      exercises: workoutExercises,
    };

    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify(draft)
      );
    } catch (storageError) {
      console.warn(
        "Unable to save workout draft:",
        storageError
      );
    }
  }, [
    isEditMode,
    workoutName,
    workoutDate,
    youtubeUrl,
    notes,
    workoutExercises,
  ]);

  /* =====================================
     FILTER EXERCISE LIBRARY
  ===================================== */

  const filteredExercises = useMemo(
    () => {
      const query = exerciseSearch
        .trim()
        .toLowerCase();

      if (!query) {
        return libraryExercises;
      }

      return libraryExercises.filter(
        (exercise) =>
          exercise.name
            .toLowerCase()
            .includes(query) ||

          exercise.muscle
            .toLowerCase()
            .includes(query) ||

          exercise.equipment
            .toLowerCase()
            .includes(query) ||

          exercise.type
            .toLowerCase()
            .includes(query)
      );
    },
    [
      exerciseSearch,
      libraryExercises,
    ]
  );

  /* =====================================
     WORKOUT TOTALS
  ===================================== */

  const workoutTotals = useMemo(
    () => {
      let repSets = 0;
      let timedIntervals = 0;
      let totalTime = 0;

      workoutExercises.forEach(
        (exercise) => {
          const mode =
            exercise.trackingMode ||
            "reps";

          if (mode === "time") {
            timedIntervals +=
              exercise.sets.length;

            totalTime +=
              exercise.sets.reduce(
                (total, set) =>
                  total +
                  Number(
                    set.durationSeconds ||
                      0
                  ),
                0
              );
          } else {
            repSets +=
              exercise.sets.length;
          }
        }
      );

      return {
        exerciseCount:
          workoutExercises.length,

        repSets,
        timedIntervals,
        totalTime,
      };
    },
    [workoutExercises]
  );

  /* =====================================
     ADD EXERCISE TO WORKOUT
  ===================================== */

  function addExercise(exercise) {
    const next = {
      id: createId(),

      /*
        IMPORTANT:
        Keep the actual PostgreSQL
        exercise ID for library exercises.
      */

      exerciseId:
        exercise.id ?? null,

      name: exercise.name,

      trackingMode: "reps",

      sets: [createEmptySet()],
    };

    setWorkoutExercises(
      (current) => [
        ...current,
        next,
      ]
    );

    closeExerciseModal();

    setError("");
  }

  /* =====================================
     ONE-OFF CUSTOM EXERCISE

     This remains available for workouts.

     It does NOT create a record in the
     exercise library.

     To create a reusable exercise,
     use the Exercise Library page.
  ===================================== */

  function addCustomExercise() {
    const name =
      customExerciseName.trim();

    if (!name) return;

    addExercise({
      id: null,
      name,
    });
  }

  /* =====================================
     REMOVE EXERCISE
  ===================================== */

  function removeExercise(exerciseId) {
    setWorkoutExercises(
      (current) =>
        current.filter(
          (exercise) =>
            exercise.id !== exerciseId
        )
    );
  }

  /* =====================================
     CHANGE TRACKING MODE
  ===================================== */

  function changeTrackingMode(
    exerciseId,
    mode
  ) {
    setWorkoutExercises(
      (current) =>
        current.map(
          (exercise) =>
            exercise.id === exerciseId
              ? {
                  ...exercise,
                  trackingMode: mode,
                }
              : exercise
        )
    );
  }

  /* =====================================
     ADD SET OR INTERVAL
  ===================================== */

  function addSet(exerciseId) {
    setWorkoutExercises(
      (current) =>
        current.map(
          (exercise) =>
            exercise.id === exerciseId
              ? {
                  ...exercise,
                  sets: [
                    ...exercise.sets,
                    createEmptySet(),
                  ],
                }
              : exercise
        )
    );
  }

  /* =====================================
     REMOVE SET OR INTERVAL
  ===================================== */

  function removeSet(
    exerciseId,
    setId
  ) {
    setWorkoutExercises(
      (current) =>
        current.map(
          (exercise) => {
            if (
              exercise.id !==
              exerciseId
            ) {
              return exercise;
            }

            const remaining =
              exercise.sets.filter(
                (set) =>
                  set.id !== setId
              );

            return {
              ...exercise,

              sets:
                remaining.length > 0
                  ? remaining
                  : [createEmptySet()],
            };
          }
        )
    );
  }

  /* =====================================
     UPDATE SET FIELD
  ===================================== */

  function updateSet(
    exerciseId,
    setId,
    field,
    value
  ) {
    setWorkoutExercises(
      (current) =>
        current.map(
          (exercise) =>
            exercise.id === exerciseId
              ? {
                  ...exercise,

                  sets:
                    exercise.sets.map(
                      (set) =>
                        set.id === setId
                          ? {
                              ...set,
                              [field]: value,
                            }
                          : set
                    ),
                }
              : exercise
        )
    );
  }

  /* =====================================
     VALIDATE WORKOUT
  ===================================== */

  function validateWorkout() {
    if (!workoutName.trim()) {
      return "Give the workout a name.";
    }

    if (!workoutDate) {
      return "Choose a workout date.";
    }

    if (
      workoutExercises.length === 0
    ) {
      return "Add at least one exercise.";
    }

    if (youtubeUrl.trim()) {
      try {
        const url = new URL(
          youtubeUrl.trim()
        );

        if (
          url.protocol !== "http:" &&
          url.protocol !== "https:"
        ) {
          return "Enter a valid workout URL.";
        }
      } catch {
        return "Enter a valid workout URL.";
      }
    }

    for (
      const exercise of
      workoutExercises
    ) {
      const mode =
        exercise.trackingMode ||
        "reps";

      if (
        exercise.sets.length === 0
      ) {
        return (
          `${exercise.name} needs at least ` +
          `one ${
            mode === "time"
              ? "interval"
              : "set"
          }.`
        );
      }

      for (const set of exercise.sets) {
        const weight =
          set.weight === ""
            ? 0
            : Number(set.weight);

        if (
          !Number.isFinite(weight) ||
          weight < 0
        ) {
          return (
            `Check the weight entered ` +
            `for ${exercise.name}.`
          );
        }

        if (mode === "time") {
          const seconds = Number(
            set.durationSeconds
          );

          if (
            !Number.isInteger(seconds) ||
            seconds <= 0
          ) {
            return (
              `Enter a valid time for ` +
              `every interval in ${exercise.name}.`
            );
          }
        } else {
          const reps = Number(
            set.reps
          );

          if (
            !Number.isInteger(reps) ||
            reps <= 0
          ) {
            return (
              `Enter valid reps for ` +
              `every set in ${exercise.name}.`
            );
          }
        }
      }
    }

    return "";
  }

  /* =====================================
     SAVE WORKOUT

     CREATE: POST /api/workouts
     UPDATE: PUT /api/workouts/:id
  ===================================== */

  async function saveWorkout() {
    if (
      saving ||
      loadingWorkout ||
      loadError
    ) {
      return;
    }

    const validationError =
      validateWorkout();

    if (validationError) {
      setError(validationError);
      return;
    }

    const cleanedExercises =
      workoutExercises.map(
        (exercise) => {
          const mode =
            exercise.trackingMode ||
            "reps";

          return {
            /*
              Existing library exercises
              now retain their real ID.
            */

            exerciseId:
              exercise.exerciseId ??
              null,

            name:
              exercise.name.trim(),

            trackingMode: mode,

            sets:
              exercise.sets.map(
                (set) => ({
                  weight:
                    set.weight === ""
                      ? 0
                      : Number(
                          set.weight
                        ),

                  reps:
                    mode === "reps"
                      ? Number(
                          set.reps
                        )
                      : null,

                  durationSeconds:
                    mode === "time"
                      ? Number(
                          set.durationSeconds
                        )
                      : null,
                })
              ),
          };
        }
      );

    const workout = {
      name: workoutName.trim(),
      date: workoutDate,
      youtubeUrl:
        youtubeUrl.trim(),
      notes: notes.trim(),
      exercises:
        cleanedExercises,
    };

    try {
      setSaving(true);
      setError("");

      if (isEditMode) {
        await updateWorkout(
          workoutId,
          workout
        );

        navigate("/workouts", {
          replace: true,

          state: {
            workoutToast: {
              type: "success",

              title:
                "Workout updated",

              message:
                `"${workout.name}" was ` +
                "updated successfully.",
            },
          },
        });
      } else {
        await createWorkout(
          workout
        );

        localStorage.removeItem(
          DRAFT_KEY
        );

        navigate("/workouts", {
          replace: true,

          state: {
            workoutToast: {
              type: "success",

              title:
                "Workout saved",

              message:
                `"${workout.name}" was ` +
                "added successfully.",
            },
          },
        });
      }
    } catch (saveError) {
      console.error(
        "Failed to save workout:",
        saveError
      );

      setError(
        saveError.message ||
          "Failed to save workout."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================
     DISCARD / CANCEL
  ===================================== */

  function discardWorkout() {
    if (saving) return;

    if (isEditMode) {
      const snapshot =
        JSON.stringify({
          name: workoutName,
          date: workoutDate,
          youtubeUrl,
          notes,
          exercises:
            workoutExercises,
        });

      if (
        initialSnapshot &&
        snapshot !==
          initialSnapshot
      ) {
        const confirmed =
          window.confirm(
            "Discard your changes to this workout?"
          );

        if (!confirmed) return;
      }

      navigate("/workouts");
      return;
    }

    const hasContent =
      workoutName.trim() ||
      youtubeUrl.trim() ||
      notes.trim() ||
      workoutExercises.length > 0;

    if (
      hasContent &&
      !window.confirm(
        "Discard this workout draft?"
      )
    ) {
      return;
    }

    localStorage.removeItem(
      DRAFT_KEY
    );

    navigate("/workouts");
  }

  /* =====================================
     LOADING EXISTING WORKOUT
  ===================================== */

  if (loadingWorkout) {
    return (
      <main className="workout-session-page">
        <div className="panel workout-session-page__empty">
          <Dumbbell size={28} />

          <h3>Loading workout</h3>

          <p>
            Loading your saved workout
            from FORGE.
          </p>
        </div>
      </main>
    );
  }

  /* =====================================
     WORKOUT LOAD ERROR
  ===================================== */

  if (loadError) {
    return (
      <main className="workout-session-page">
        <div className="workout-session-page__error">
          {loadError}
        </div>

        <button
          type="button"
          className="button"
          onClick={() =>
            navigate("/workouts")
          }
        >
          Back to Workouts
        </button>
      </main>
    );
  }

  /* =====================================
     RENDER
  ===================================== */

  return (
    <main className="workout-session-page">

      {/* ===================================
          HEADER
      =================================== */}

      <header className="workout-session-page__header">
        <div>
          <Link
            to="/workouts"
            className="workout-session-page__back"
          >
            <ArrowLeft size={15} />
            Workouts
          </Link>

          <span className="page__eyebrow">
            Training Log
          </span>

          <h1 className="page__title">
            {isEditMode
              ? "Edit Workout"
              : "Log Workout"}
          </h1>

          <p className="page__description">
            {isEditMode
              ? "Update your recorded workout, exercises, sets, and timed intervals."
              : "Record traditional sets and reps, timed intervals, or both in the same workout."}
          </p>
        </div>

        <div className="workout-session-page__header-actions">
          <button
            type="button"
            className="button"
            onClick={discardWorkout}
            disabled={saving}
          >
            {isEditMode
              ? "Cancel"
              : "Discard"}
          </button>

          <button
            type="button"
            className="button button--primary"
            onClick={saveWorkout}
            disabled={saving}
          >
            <Save size={15} />

            {saving
              ? "Saving..."
              : isEditMode
                ? "Save Changes"
                : "Save Workout"}
          </button>
        </div>
      </header>

      {/* ===================================
          ERROR
      =================================== */}

      {error && (
        <div
          className="workout-session-page__error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ===================================
          WORKOUT INFORMATION
      =================================== */}

      <section className="panel workout-session-page__info">
        <div className="workout-session-page__section-heading">
          <div>
            <span>Workout</span>
            <h2>Session Details</h2>
          </div>
        </div>

        <div className="workout-session-page__info-grid">

          {/* WORKOUT NAME */}

          <label className="workout-session-page__field workout-session-page__field--name">
            <span>
              Workout Name
            </span>

            <input
              type="text"
              maxLength={150}
              value={workoutName}
              placeholder="e.g. Caroline Girvan — Iron Day 12"
              onChange={(event) => {
                setWorkoutName(
                  event.target.value
                );
                setError("");
              }}
            />
          </label>

          {/* WORKOUT DATE */}

          <label className="workout-session-page__field">
            <span>Date</span>

            <input
              type="date"
              value={workoutDate}
              onChange={(event) => {
                setWorkoutDate(
                  event.target.value
                );
                setError("");
              }}
            />
          </label>

          {/* YOUTUBE URL */}

          <label className="workout-session-page__field workout-session-page__field--youtube">
            <span>
              YouTube Workout
            </span>

            <div className="workout-session-page__url-input">
              <LinkIcon size={15} />

              <input
                type="url"
                value={youtubeUrl}
                placeholder="https://youtube.com/watch?v=..."
                onChange={(event) => {
                  setYoutubeUrl(
                    event.target.value
                  );
                  setError("");
                }}
              />
            </div>
          </label>

          {/* WORKOUT NOTES */}

          <label className="workout-session-page__field workout-session-page__notes-field">
            <span>
              Workout Notes
            </span>

            <textarea
              rows={3}
              value={notes}
              placeholder="Optional notes about this session..."
              onChange={(event) => {
                setNotes(
                  event.target.value
                );
                setError("");
              }}
            />
          </label>
        </div>

        {youtubeUrl && (
          <a
            className="workout-session-page__youtube-preview"
            href={youtubeUrl}
            target="_blank"
            rel="noreferrer"
          >
            <LinkIcon size={14} />
            Open workout video
          </a>
        )}
      </section>

      {/* ===================================
          WORKOUT SUMMARY
      =================================== */}

      <section className="workout-session-page__summary">
        <article>
          <span>Exercises</span>
          <strong>
            {workoutTotals.exerciseCount}
          </strong>
        </article>

        <article>
          <span>Rep Sets</span>
          <strong>
            {workoutTotals.repSets}
          </strong>
        </article>

        <article>
          <span>Timed Intervals</span>
          <strong>
            {workoutTotals.timedIntervals}
          </strong>
        </article>

        <article>
          <span>Time Under Tension</span>
          <strong>
            {formatDuration(
              workoutTotals.totalTime
            )}
          </strong>
        </article>
      </section>

      {/* ===================================
          EXERCISES HEADING
      =================================== */}

      <div className="workout-session-page__exercises-heading">
        <div>
          <h2>Exercises</h2>

          <p>
            Choose how each exercise
            should be tracked.
          </p>
        </div>

        <button
          type="button"
          className="button"
          onClick={openExerciseModal}
          disabled={saving}
        >
          <Plus size={15} />
          Add Exercise
        </button>
      </div>

      {/* ===================================
          EMPTY EXERCISE STATE
      =================================== */}

      {workoutExercises.length === 0 ? (
        <section className="panel workout-session-page__empty">
          <Dumbbell size={28} />

          <h3>No exercises yet</h3>

          <p>
            Add exercises from your
            library, then choose reps
            or timed intervals for each.
          </p>

          <button
            type="button"
            className="button button--primary"
            onClick={openExerciseModal}
          >
            <Plus size={15} />
            Add Exercise
          </button>
        </section>
      ) : (
        <section className="workout-session-page__exercises">
          {workoutExercises.map(
            (exercise, exerciseIndex) => {
              const mode =
                exercise.trackingMode ||
                "reps";

              const totalTime =
                exercise.sets.reduce(
                  (total, set) =>
                    total +
                    Number(
                      set.durationSeconds ||
                        0
                    ),
                  0
                );

              return (
                <article
                  className="panel workout-session-page__exercise"
                  key={exercise.id}
                >

                  {/* EXERCISE HEADER */}

                  <div className="workout-session-page__exercise-header">
                    <div className="workout-session-page__exercise-number">
                      {exerciseIndex + 1}
                    </div>

                    <div className="workout-session-page__exercise-name">
                      <h3>
                        {exercise.name}
                      </h3>

                      <span>
                        {mode === "time"
                          ? `${exercise.sets.length} timed ${
                              exercise.sets.length === 1
                                ? "interval"
                                : "intervals"
                            }`
                          : `${exercise.sets.length} ${
                              exercise.sets.length === 1
                                ? "set"
                                : "sets"
                            }`}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="workout-session-page__remove-exercise"
                      aria-label={`Remove ${exercise.name}`}
                      onClick={() =>
                        removeExercise(
                          exercise.id
                        )
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* TRACKING MODE */}

                  <div className="workout-session-page__mode">
                    <span className="workout-session-page__mode-label">
                      Tracking
                    </span>

                    <div className="workout-session-page__mode-options">
                      <button
                        type="button"
                        className={
                          mode === "reps"
                            ? "workout-session-page__mode-button workout-session-page__mode-button--active"
                            : "workout-session-page__mode-button"
                        }
                        onClick={() =>
                          changeTrackingMode(
                            exercise.id,
                            "reps"
                          )
                        }
                      >
                        <Dumbbell size={14} />
                        Weight &amp; Reps
                      </button>

                      <button
                        type="button"
                        className={
                          mode === "time"
                            ? "workout-session-page__mode-button workout-session-page__mode-button--active"
                            : "workout-session-page__mode-button"
                        }
                        onClick={() =>
                          changeTrackingMode(
                            exercise.id,
                            "time"
                          )
                        }
                      >
                        <Clock3 size={14} />
                        Time
                      </button>
                    </div>

                    {mode === "time" && (
                      <span className="workout-session-page__exercise-time">
                        TUT
                        <strong>
                          {formatDuration(totalTime)}
                        </strong>
                      </span>
                    )}
                  </div>

                  {/* WEIGHT & REPS */}

                  {mode === "reps" && (
                    <div className="workout-session-page__sets">
                      <div className="workout-session-page__set-heading workout-session-page__set-heading--reps">
                        <span>Set</span>
                        <span>Weight (kg)</span>
                        <span>Reps</span>
                        <span />
                      </div>

                      {exercise.sets.map(
                        (set, setIndex) => (
                          <div
                            className="workout-session-page__set workout-session-page__set--reps"
                            key={set.id}
                          >
                            <strong>
                              {setIndex + 1}
                            </strong>

                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              placeholder="0"
                              aria-label={`Weight for ${exercise.name} set ${setIndex + 1}`}
                              value={set.weight}
                              onChange={(event) =>
                                updateSet(
                                  exercise.id,
                                  set.id,
                                  "weight",
                                  event.target.value
                                )
                              }
                            />

                            <input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="0"
                              aria-label={`Reps for ${exercise.name} set ${setIndex + 1}`}
                              value={set.reps}
                              onChange={(event) =>
                                updateSet(
                                  exercise.id,
                                  set.id,
                                  "reps",
                                  event.target.value
                                )
                              }
                            />

                            <button
                              type="button"
                              aria-label="Remove set"
                              onClick={() =>
                                removeSet(
                                  exercise.id,
                                  set.id
                                )
                              }
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* TIMED INTERVALS */}

                  {mode === "time" && (
                    <div className="workout-session-page__sets">
                      <div className="workout-session-page__set-heading workout-session-page__set-heading--time">
                        <span>Interval</span>
                        <span>Weight (kg)</span>
                        <span>Time (sec)</span>
                        <span />
                      </div>

                      {exercise.sets.map(
                        (set, setIndex) => (
                          <div
                            className="workout-session-page__set workout-session-page__set--time"
                            key={set.id}
                          >
                            <strong>
                              {setIndex + 1}
                            </strong>

                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              placeholder="Optional"
                              aria-label={`Weight for ${exercise.name} interval ${setIndex + 1}`}
                              value={set.weight}
                              onChange={(event) =>
                                updateSet(
                                  exercise.id,
                                  set.id,
                                  "weight",
                                  event.target.value
                                )
                              }
                            />

                            <div className="workout-session-page__time-input">
                              <Clock3 size={14} />

                              <input
                                type="number"
                                min="1"
                                step="1"
                                placeholder="40"
                                aria-label={`Seconds for ${exercise.name} interval ${setIndex + 1}`}
                                value={
                                  set.durationSeconds
                                }
                                onChange={(event) =>
                                  updateSet(
                                    exercise.id,
                                    set.id,
                                    "durationSeconds",
                                    event.target.value
                                  )
                                }
                              />
                            </div>

                            <button
                              type="button"
                              aria-label="Remove interval"
                              onClick={() =>
                                removeSet(
                                  exercise.id,
                                  set.id
                                )
                              }
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* ADD SET / INTERVAL */}

                  <button
                    type="button"
                    className="workout-session-page__add-set"
                    onClick={() =>
                      addSet(exercise.id)
                    }
                  >
                    <Plus size={14} />

                    {mode === "time"
                      ? "Add Interval"
                      : "Add Set"}
                  </button>
                </article>
              );
            }
          )}
        </section>
      )}

      {/* ===================================
          BOTTOM ACTIONS
      =================================== */}

      {workoutExercises.length > 0 && (
        <div className="workout-session-page__bottom-actions">
          <button
            type="button"
            className="button"
            onClick={openExerciseModal}
            disabled={saving}
          >
            <Plus size={15} />
            Add Exercise
          </button>

          <button
            type="button"
            className="button button--primary"
            onClick={saveWorkout}
            disabled={saving}
          >
            <Save size={15} />

            {saving
              ? "Saving..."
              : isEditMode
                ? "Save Changes"
                : "Save Workout"}
          </button>
        </div>
      )}

      {/* ===================================
          EXERCISE PICKER MODAL
      =================================== */}

      {showExerciseModal && (
        <div
          className="workout-session-page__modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeExerciseModal();
            }
          }}
        >
          <div
            className="workout-session-page__modal"
            role="dialog"
            aria-modal="true"
            aria-label="Add Exercise"
          >
            {/* MODAL HEADER */}

            <div className="workout-session-page__modal-header">
              <div>
                <span>
                  Workout Exercise
                </span>

                <h2>
                  Add Exercise
                </h2>
              </div>

              <button
                type="button"
                onClick={closeExerciseModal}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* SEARCH */}

            <div className="workout-session-page__modal-search">
              <Search size={15} />

              <input
                type="search"
                value={exerciseSearch}
                placeholder="Search exercise library..."
                aria-label="Search exercise library"
                onChange={(event) =>
                  setExerciseSearch(
                    event.target.value
                  )
                }
              />
            </div>

            {/* CUSTOM EXERCISE */}

            <div className="workout-session-page__custom">
              <div>
                <strong>
                  One-off exercise
                </strong>

                <span>
                  Add an exercise to this workout
                  without saving it to the library.
                </span>
              </div>

              <div className="workout-session-page__custom-form">
                <input
                  type="text"
                  maxLength={150}
                  placeholder="Exercise name"
                  value={customExerciseName}
                  onChange={(event) =>
                    setCustomExerciseName(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      event.preventDefault();
                      addCustomExercise();
                    }
                  }}
                />

                <button
                  type="button"
                  className="button"
                  onClick={addCustomExercise}
                  disabled={
                    !customExerciseName.trim()
                  }
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
            </div>

            {/* EXERCISE LIBRARY */}

            <div className="workout-session-page__library">
              {loadingLibrary ? (
                <div className="workout-session-page__library-empty">
                  Loading exercises from FORGE...
                </div>
              ) : libraryError ? (
                <div
                  className="workout-session-page__library-empty"
                  role="alert"
                >
                  {libraryError}
                </div>
              ) : filteredExercises.length === 0 ? (
                <div className="workout-session-page__library-empty">
                  {exerciseSearch.trim()
                    ? "No exercises match your search."
                    : "No exercises in the library yet."}
                </div>
              ) : (
                filteredExercises.map(
                  (exercise) => (
                    <button
                      type="button"
                      className="workout-session-page__library-item"
                      key={exercise.id}
                      onClick={() =>
                        addExercise(
                          exercise
                        )
                      }
                    >
                      <div>
                        <strong>
                          {exercise.name}
                        </strong>

                        <span>
                          {exercise.muscle}

                          {exercise.equipment
                            ? ` · ${exercise.equipment}`
                            : ""}
                        </span>
                      </div>

                      <Plus size={15} />
                    </button>
                  )
                )
              )}

              {/* RETRY / REFRESH */}

              <button
                type="button"
                className="workout-session-page__add-set"
                onClick={loadExerciseLibrary}
                disabled={loadingLibrary}
                style={{
                  alignSelf: "center",
                  marginTop: 12,
                }}
              >
                <RefreshCw size={13} />

                {loadingLibrary
                  ? "Loading..."
                  : "Refresh Library"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

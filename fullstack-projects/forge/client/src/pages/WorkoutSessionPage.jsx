import {
  ArrowLeft,
  Clock3,
  Dumbbell,
  Link as LinkIcon,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import {
  createWorkout,
  getWorkoutById,
  updateWorkout,
} from "../api/forgeApi.js";

import { exercises } from "../data/exercises";

import "./WorkoutSessionPage.css";

/* =========================================
   CONSTANTS
========================================= */

const DRAFT_KEY = "forge:workoutDraft";

/* =========================================
   HELPERS
========================================= */

function createId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

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

function normalizeExercise(exercise) {
  return {
    id: exercise.id || createId(),

    exerciseId: exercise.exerciseId ?? null,

    name: exercise.name || "Exercise",

    trackingMode: exercise.trackingMode || "reps",

    sets:
      Array.isArray(exercise.sets) && exercise.sets.length > 0
        ? exercise.sets.map((set) => ({
            id: set.id || createId(),
            weight: set.weight ?? "",
            reps: set.reps ?? "",
            durationSeconds: set.durationSeconds ?? "",
          }))
        : [createEmptySet()],
  };
}

function loadDraft() {
  try {
    const stored = localStorage.getItem(DRAFT_KEY);

    if (!stored) return null;

    const parsed = JSON.parse(stored);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      name: parsed.name || "",
      date: parsed.date || getToday(),
      youtubeUrl: parsed.youtubeUrl || "",
      notes: parsed.notes || "",

      exercises: Array.isArray(parsed.exercises)
        ? parsed.exercises.map(normalizeExercise)
        : [],
    };
  } catch {
    return null;
  }
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));

  const minutes = Math.floor(total / 60);
  const remaining = total % 60;

  if (minutes === 0) {
    return `${remaining}s`;
  }

  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

/* =========================================
   PAGE
========================================= */

export default function WorkoutSessionPage() {
  const navigate = useNavigate();

  const { id: workoutId } = useParams();

  const isEditMode = Boolean(workoutId);

  const storedDraft = useMemo(
    () => (isEditMode ? null : loadDraft()),
    [isEditMode],
  );

  /* =========================================
     WORKOUT STATE
  ========================================= */

  const [workoutName, setWorkoutName] = useState(storedDraft?.name || "");

  const [workoutDate, setWorkoutDate] = useState(
    storedDraft?.date || getToday(),
  );

  const [youtubeUrl, setYoutubeUrl] = useState(storedDraft?.youtubeUrl || "");

  const [notes, setNotes] = useState(storedDraft?.notes || "");

  const [workoutExercises, setWorkoutExercises] = useState(
    storedDraft?.exercises || [],
  );

  /* =========================================
     MODAL STATE
  ========================================= */

  const [showExerciseModal, setShowExerciseModal] = useState(false);

  const [exerciseSearch, setExerciseSearch] = useState("");

  const [customExerciseName, setCustomExerciseName] = useState("");

  /* =========================================
     REQUEST STATE
  ========================================= */

  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);

  const [loadingWorkout, setLoadingWorkout] = useState(isEditMode);

  const [loadError, setLoadError] = useState("");

  const [initialSnapshot, setInitialSnapshot] = useState(null);

  /* =========================================
     LOAD WORKOUT FOR EDITING
  ========================================= */

  useEffect(() => {
    if (!isEditMode) {
      return undefined;
    }

    let active = true;

    async function loadExistingWorkout() {
      try {
        const workout = await getWorkoutById(workoutId);

        if (!active) return;

        const loaded = {
          name: workout.name || "",

          date: String(workout.date || "").slice(0, 10),

          youtubeUrl: workout.youtubeUrl || "",

          notes: workout.notes || "",

          exercises: (workout.exercises || []).map(normalizeExercise),
        };

        setWorkoutName(loaded.name);
        setWorkoutDate(loaded.date);
        setYoutubeUrl(loaded.youtubeUrl);
        setNotes(loaded.notes);

        setWorkoutExercises(loaded.exercises);

        setInitialSnapshot(JSON.stringify(loaded));
      } catch (loadError) {
        if (!active) return;

        console.error("Failed to load workout:", loadError);

        setLoadError(loadError.message || "Unable to load workout.");
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
  }, [isEditMode, workoutId]);

  /* =========================================
     AUTO-SAVE CREATE DRAFT

     Edit mode does not overwrite the
     new-workout draft.
  ========================================= */

  useEffect(() => {
    if (isEditMode) return;

    const draft = {
      name: workoutName,
      date: workoutDate,
      youtubeUrl,
      notes,
      exercises: workoutExercises,
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [
    isEditMode,
    workoutName,
    workoutDate,
    youtubeUrl,
    notes,
    workoutExercises,
  ]);

  /* =========================================
     FILTER EXERCISE LIBRARY
  ========================================= */

  const filteredExercises = useMemo(() => {
    const query = exerciseSearch.trim().toLowerCase();

    if (!query) return exercises;

    return exercises.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(query) ||
        exercise.muscle?.toLowerCase().includes(query) ||
        exercise.equipment?.toLowerCase().includes(query),
    );
  }, [exerciseSearch]);

  /* =========================================
     WORKOUT TOTALS
  ========================================= */

  const workoutTotals = useMemo(() => {
    let repSets = 0;
    let timedIntervals = 0;
    let totalTime = 0;

    workoutExercises.forEach((exercise) => {
      const mode = exercise.trackingMode || "reps";

      if (mode === "time") {
        timedIntervals += exercise.sets.length;

        totalTime += exercise.sets.reduce(
          (total, set) => total + Number(set.durationSeconds || 0),
          0,
        );
      } else {
        repSets += exercise.sets.length;
      }
    });

    return {
      exerciseCount: workoutExercises.length,

      repSets,
      timedIntervals,
      totalTime,
    };
  }, [workoutExercises]);

  /* =========================================
     ADD EXERCISE
  ========================================= */

  function addExercise(exercise) {
    const next = {
      id: createId(),

      exerciseId: null,

      name: exercise.name,

      trackingMode: "reps",

      sets: [createEmptySet()],
    };

    setWorkoutExercises((current) => [...current, next]);

    setShowExerciseModal(false);
    setExerciseSearch("");
    setCustomExerciseName("");
    setError("");
  }

  function addCustomExercise() {
    const name = customExerciseName.trim();

    if (!name) return;

    addExercise({ name });
  }

  /* =========================================
     REMOVE EXERCISE
  ========================================= */

  function removeExercise(exerciseId) {
    setWorkoutExercises((current) =>
      current.filter((exercise) => exercise.id !== exerciseId),
    );
  }

  /* =========================================
     CHANGE TRACKING MODE
  ========================================= */

  function changeTrackingMode(exerciseId, mode) {
    setWorkoutExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              trackingMode: mode,
            }
          : exercise,
      ),
    );
  }

  /* =========================================
     ADD SET / INTERVAL
  ========================================= */

  function addSet(exerciseId) {
    setWorkoutExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,

              sets: [...exercise.sets, createEmptySet()],
            }
          : exercise,
      ),
    );
  }

  /* =========================================
     REMOVE SET / INTERVAL
  ========================================= */

  function removeSet(exerciseId, setId) {
    setWorkoutExercises((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        const remaining = exercise.sets.filter((set) => set.id !== setId);

        return {
          ...exercise,

          sets: remaining.length > 0 ? remaining : [createEmptySet()],
        };
      }),
    );
  }

  /* =========================================
     UPDATE SET FIELD
  ========================================= */

  function updateSet(exerciseId, setId, field, value) {
    setWorkoutExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,

              sets: exercise.sets.map((set) =>
                set.id === setId
                  ? {
                      ...set,
                      [field]: value,
                    }
                  : set,
              ),
            }
          : exercise,
      ),
    );
  }

  /* =========================================
     VALIDATION
  ========================================= */

  function validateWorkout() {
    if (!workoutName.trim()) {
      return "Give the workout a name.";
    }

    if (!workoutDate) {
      return "Choose a workout date.";
    }

    if (workoutExercises.length === 0) {
      return "Add at least one exercise.";
    }

    if (youtubeUrl.trim()) {
      try {
        const url = new URL(youtubeUrl.trim());

        if (url.protocol !== "http:" && url.protocol !== "https:") {
          return "Enter a valid workout URL.";
        }
      } catch {
        return "Enter a valid workout URL.";
      }
    }

    for (const exercise of workoutExercises) {
      const mode = exercise.trackingMode || "reps";

      if (exercise.sets.length === 0) {
        return `${exercise.name} needs at least one ${
          mode === "time" ? "interval" : "set"
        }.`;
      }

      for (const set of exercise.sets) {
        const weight = set.weight === "" ? 0 : Number(set.weight);

        if (!Number.isFinite(weight) || weight < 0) {
          return `Check the weight entered for ${exercise.name}.`;
        }

        if (mode === "time") {
          const seconds = Number(set.durationSeconds);

          if (!Number.isInteger(seconds) || seconds <= 0) {
            return `Enter a valid time for every interval in ${exercise.name}.`;
          }
        } else {
          const reps = Number(set.reps);

          if (!Number.isInteger(reps) || reps <= 0) {
            return `Enter valid reps for every set in ${exercise.name}.`;
          }
        }
      }
    }

    return "";
  }

  /* =========================================
     SAVE WORKOUT

     CREATE: POST /api/workouts
     UPDATE: PUT /api/workouts/:id
  ========================================= */

  async function saveWorkout() {
    if (saving || loadingWorkout || loadError) {
      return;
    }

    const validationError = validateWorkout();

    if (validationError) {
      setError(validationError);
      return;
    }

    const cleanedExercises = workoutExercises.map((exercise) => {
      const mode = exercise.trackingMode || "reps";

      return {
        exerciseId: exercise.exerciseId ?? null,

        name: exercise.name.trim(),

        trackingMode: mode,

        sets: exercise.sets.map((set) => ({
          weight: set.weight === "" ? 0 : Number(set.weight),

          reps: mode === "reps" ? Number(set.reps) : null,

          durationSeconds: mode === "time" ? Number(set.durationSeconds) : null,
        })),
      };
    });

    const workout = {
      name: workoutName.trim(),
      date: workoutDate,

      youtubeUrl: youtubeUrl.trim(),

      notes: notes.trim(),

      exercises: cleanedExercises,
    };

    try {
      setSaving(true);
      setError("");

      if (isEditMode) {
        await updateWorkout(workoutId, workout);

        navigate("/workouts", {
          replace: true,
          state: {
            workoutToast: {
              type: "success",
              title: "Workout updated",
              message: `"${workout.name}" was updated successfully.`,
            },
          },
        });
      } else {
        await createWorkout(workout);

        localStorage.removeItem(DRAFT_KEY);

        navigate("/workouts", {
          replace: true,
          state: {
            workoutToast: {
              type: "success",
              title: "Workout saved",
              message: `"${workout.name}" was added successfully.`,
            },
          },
        });
      }
    } catch (saveError) {
      console.error("Failed to save workout:", saveError);

      setError(saveError.message || "Failed to save workout.");
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     DISCARD / CANCEL
  ========================================= */

  function discardWorkout() {
    if (saving) return;

    if (isEditMode) {
      const snapshot = JSON.stringify({
        name: workoutName,
        date: workoutDate,
        youtubeUrl,
        notes,
        exercises: workoutExercises,
      });

      if (initialSnapshot && snapshot !== initialSnapshot) {
        const confirmed = window.confirm(
          "Discard your changes to this workout?",
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

    if (hasContent && !window.confirm("Discard this workout draft?")) {
      return;
    }

    localStorage.removeItem(DRAFT_KEY);

    navigate("/workouts");
  }

  /* =========================================
     LOADING AND ERROR STATES
  ========================================= */

  if (loadingWorkout) {
    return (
      <main className="workout-session-page">
        <div className="panel workout-session-page__empty">
          <Dumbbell size={28} />

          <h3>Loading workout</h3>

          <p>Loading your saved workout from FORGE.</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="workout-session-page">
        <div className="workout-session-page__error">{loadError}</div>

        <button
          type="button"
          className="button"
          onClick={() => navigate("/workouts")}
        >
          Back to Workouts
        </button>
      </main>
    );
  }

  /* =========================================
     RENDER
  ========================================= */

  return (
    <main className="workout-session-page">
      {/* =====================================
          HEADER
      ===================================== */}

      <header className="workout-session-page__header">
        <div>
          <Link to="/workouts" className="workout-session-page__back">
            <ArrowLeft size={15} />
            Workouts
          </Link>

          <span className="page__eyebrow">Training Log</span>

          <h1 className="page__title">
            {isEditMode ? "Edit Workout" : "Log Workout"}
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
            {isEditMode ? "Cancel" : "Discard"}
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

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div className="workout-session-page__error" role="alert">
          {error}
        </div>
      )}

      {/* =====================================
          WORKOUT INFORMATION
      ===================================== */}

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
            <span>Workout Name</span>

            <input
              type="text"
              maxLength={150}
              value={workoutName}
              placeholder="e.g. Caroline Girvan — Iron Day 12"
              onChange={(event) => {
                setWorkoutName(event.target.value);

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
                setWorkoutDate(event.target.value);

                setError("");
              }}
            />
          </label>

          {/* YOUTUBE URL */}

          <label className="workout-session-page__field workout-session-page__field--youtube">
            <span>YouTube Workout</span>

            <div className="workout-session-page__url-input">
              <LinkIcon size={15} />

              <input
                type="url"
                value={youtubeUrl}
                placeholder="https://youtube.com/watch?v=..."
                onChange={(event) => {
                  setYoutubeUrl(event.target.value);

                  setError("");
                }}
              />
            </div>
          </label>

          {/* NOTES */}

          <label className="workout-session-page__field workout-session-page__notes-field">
            <span>Workout Notes</span>

            <textarea
              rows={3}
              value={notes}
              placeholder="Optional notes about this session..."
              onChange={(event) => {
                setNotes(event.target.value);
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

      {/* =====================================
          WORKOUT SUMMARY
      ===================================== */}

      <section className="workout-session-page__summary">
        <article>
          <span>Exercises</span>

          <strong>{workoutTotals.exerciseCount}</strong>
        </article>

        <article>
          <span>Rep Sets</span>

          <strong>{workoutTotals.repSets}</strong>
        </article>

        <article>
          <span>Timed Intervals</span>

          <strong>{workoutTotals.timedIntervals}</strong>
        </article>

        <article>
          <span>Time Under Tension</span>

          <strong>{formatDuration(workoutTotals.totalTime)}</strong>
        </article>
      </section>

      {/* =====================================
          EXERCISES HEADER
      ===================================== */}

      <div className="workout-session-page__exercises-heading">
        <div>
          <h2>Exercises</h2>

          <p>Choose how each exercise should be tracked.</p>
        </div>

        <button
          type="button"
          className="button"
          onClick={() => setShowExerciseModal(true)}
        >
          <Plus size={15} />
          Add Exercise
        </button>
      </div>

      {/* =====================================
          EMPTY EXERCISE STATE
      ===================================== */}

      {workoutExercises.length === 0 ? (
        <section className="panel workout-session-page__empty">
          <Dumbbell size={28} />

          <h3>No exercises yet</h3>

          <p>
            Add the exercises from your workout, then choose reps or timed
            intervals for each one.
          </p>

          <button
            type="button"
            className="button button--primary"
            onClick={() => setShowExerciseModal(true)}
          >
            <Plus size={15} />
            Add Exercise
          </button>
        </section>
      ) : (
        /* ===================================
           EXERCISE LIST
        =================================== */

        <section className="workout-session-page__exercises">
          {workoutExercises.map((exercise, exerciseIndex) => {
            const mode = exercise.trackingMode || "reps";

            const totalTime = exercise.sets.reduce(
              (total, set) => total + Number(set.durationSeconds || 0),
              0,
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
                    <h3>{exercise.name}</h3>

                    <span>
                      {mode === "time"
                        ? `${exercise.sets.length} timed ${
                            exercise.sets.length === 1
                              ? "interval"
                              : "intervals"
                          }`
                        : `${exercise.sets.length} ${
                            exercise.sets.length === 1 ? "set" : "sets"
                          }`}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="workout-session-page__remove-exercise"
                    aria-label={`Remove ${exercise.name}`}
                    onClick={() => removeExercise(exercise.id)}
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
                      onClick={() => changeTrackingMode(exercise.id, "reps")}
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
                      onClick={() => changeTrackingMode(exercise.id, "time")}
                    >
                      <Clock3 size={14} />
                      Time
                    </button>
                  </div>

                  {mode === "time" && (
                    <span className="workout-session-page__exercise-time">
                      TUT <strong>{formatDuration(totalTime)}</strong>
                    </span>
                  )}
                </div>

                {/* REP SETS */}

                {mode === "reps" && (
                  <div className="workout-session-page__sets">
                    <div className="workout-session-page__set-heading workout-session-page__set-heading--reps">
                      <span>Set</span>
                      <span>Weight (kg)</span>
                      <span>Reps</span>
                      <span />
                    </div>

                    {exercise.sets.map((set, setIndex) => (
                      <div
                        className="workout-session-page__set workout-session-page__set--reps"
                        key={set.id}
                      >
                        <strong>{setIndex + 1}</strong>

                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="0"
                          value={set.weight}
                          onChange={(event) =>
                            updateSet(
                              exercise.id,
                              set.id,
                              "weight",
                              event.target.value,
                            )
                          }
                        />

                        <input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="0"
                          value={set.reps}
                          onChange={(event) =>
                            updateSet(
                              exercise.id,
                              set.id,
                              "reps",
                              event.target.value,
                            )
                          }
                        />

                        <button
                          type="button"
                          aria-label="Remove set"
                          onClick={() => removeSet(exercise.id, set.id)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
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

                    {exercise.sets.map((set, setIndex) => (
                      <div
                        className="workout-session-page__set workout-session-page__set--time"
                        key={set.id}
                      >
                        <strong>{setIndex + 1}</strong>

                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="Optional"
                          value={set.weight}
                          onChange={(event) =>
                            updateSet(
                              exercise.id,
                              set.id,
                              "weight",
                              event.target.value,
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
                            value={set.durationSeconds}
                            onChange={(event) =>
                              updateSet(
                                exercise.id,
                                set.id,
                                "durationSeconds",
                                event.target.value,
                              )
                            }
                          />
                        </div>

                        <button
                          type="button"
                          aria-label="Remove interval"
                          onClick={() => removeSet(exercise.id, set.id)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ADD SET / INTERVAL */}

                <button
                  type="button"
                  className="workout-session-page__add-set"
                  onClick={() => addSet(exercise.id)}
                >
                  <Plus size={14} />

                  {mode === "time" ? "Add Interval" : "Add Set"}
                </button>
              </article>
            );
          })}
        </section>
      )}

      {/* =====================================
          BOTTOM ACTIONS
      ===================================== */}

      {workoutExercises.length > 0 && (
        <div className="workout-session-page__bottom-actions">
          <button
            type="button"
            className="button"
            onClick={() => setShowExerciseModal(true)}
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

      {/* =====================================
          EXERCISE MODAL
      ===================================== */}

      {showExerciseModal && (
        <div
          className="workout-session-page__modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowExerciseModal(false);
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
                <span>Workout Exercise</span>
                <h2>Add Exercise</h2>
              </div>

              <button
                type="button"
                onClick={() => setShowExerciseModal(false)}
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
                onChange={(event) => setExerciseSearch(event.target.value)}
              />
            </div>

            {/* CUSTOM EXERCISE */}

            <div className="workout-session-page__custom">
              <div>
                <strong>Custom exercise</strong>

                <span>Add something that is not in the library.</span>
              </div>

              <div className="workout-session-page__custom-form">
                <input
                  type="text"
                  maxLength={150}
                  placeholder="Exercise name"
                  value={customExerciseName}
                  onChange={(event) =>
                    setCustomExerciseName(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCustomExercise();
                    }
                  }}
                />

                <button
                  type="button"
                  className="button"
                  onClick={addCustomExercise}
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
            </div>

            {/* EXERCISE LIBRARY */}

            <div className="workout-session-page__library">
              {filteredExercises.length === 0 ? (
                <div className="workout-session-page__library-empty">
                  No exercises found.
                </div>
              ) : (
                filteredExercises.map((exercise) => (
                  <button
                    type="button"
                    className="workout-session-page__library-item"
                    key={exercise.id}
                    onClick={() => addExercise(exercise)}
                  >
                    <div>
                      <strong>{exercise.name}</strong>

                      <span>
                        {exercise.muscle}

                        {exercise.equipment ? ` · ${exercise.equipment}` : ""}
                      </span>
                    </div>

                    <Plus size={15} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

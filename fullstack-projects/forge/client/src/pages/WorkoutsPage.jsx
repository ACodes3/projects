import {
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Dumbbell,
  Info,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import {
  deleteWorkout as deleteWorkoutRequest,
  getWorkouts,
} from "../api/forgeApi.js";

import "./WorkoutsPage.css";

/* =========================================

   CONSTANTS

\========================================= */

const NEW_WORKOUT_TOAST_WINDOW = 7000;

/* =========================================

   DATE HELPERS

\========================================= */

function parseDate(date) {
  if (!date) {
    return 0;
  }

  const timestamp = new Date(`${date}T12:00:00`).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDate(date) {
  if (!date) {
    return "Unknown date";
  }

  return new Date(`${date}T12:00:00`).toLocaleDateString(
    "en-US",

    {
      day: "numeric",

      month: "long",

      year: "numeric",
    },
  );
}

function getWeekRange() {
  const start = new Date();

  const day = start.getDay();

  start.setDate(start.getDate() - ((day + 6) % 7));

  start.setHours(
    0,

    0,

    0,

    0,
  );

  const end = new Date(start);

  end.setDate(end.getDate() + 7);

  return {
    start: start.getTime(),

    end: end.getTime(),
  };
}

/* =========================================

   WORKOUT HELPERS

\========================================= */

function getTrackingMode(exercise) {
  return exercise.trackingMode || "reps";
}

function getRepSetCount(workout) {
  return (workout.exercises || []).reduce(
    (
      total,

      exercise,
    ) => {
      if (getTrackingMode(exercise) !== "reps") {
        return total;
      }

      return total + (exercise.sets || []).length;
    },

    0,
  );
}

function getTimedIntervalCount(workout) {
  return (workout.exercises || []).reduce(
    (
      total,

      exercise,
    ) => {
      if (getTrackingMode(exercise) !== "time") {
        return total;
      }

      return total + (exercise.sets || []).length;
    },

    0,
  );
}

function getWorkoutTUT(workout) {
  return (workout.exercises || []).reduce(
    (
      total,

      exercise,
    ) => {
      if (getTrackingMode(exercise) !== "time") {
        return total;
      }

      return (
        total +
        (exercise.sets || []).reduce(
          (
            exerciseTotal,

            set,
          ) => exerciseTotal + Number(set.durationSeconds || 0),

          0,
        )
      );
    },

    0,
  );
}

function getWorkoutVolume(workout) {
  return (workout.exercises || []).reduce(
    (
      total,

      exercise,
    ) => {
      if (getTrackingMode(exercise) !== "reps") {
        return total;
      }

      return (
        total +
        (exercise.sets || []).reduce(
          (
            setTotal,

            set,
          ) => setTotal + Number(set.weight || 0) * Number(set.reps || 0),

          0,
        )
      );
    },

    0,
  );
}

function formatVolume(volume) {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k kg`;
  }

  return `${Math.round(volume)} kg`;
}

function formatDuration(seconds) {
  const total = Math.max(
    0,

    Math.round(Number(seconds) || 0),
  );

  const hours = Math.floor(total / 3600);

  const minutes = Math.floor((total % 3600) / 60);

  const remainingSeconds = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(
      2,

      "0",
    )}:${String(remainingSeconds).padStart(
      2,

      "0",
    )}`;
  }

  if (minutes > 0) {
    return `${minutes}:${String(remainingSeconds).padStart(
      2,

      "0",
    )}`;
  }

  return `${remainingSeconds}s`;
}

function formatWeight(weight) {
  const value = Number(weight || 0);

  if (value <= 0) {
    return "—";
  }

  return `${value} kg`;
}

/* =========================================

   NEW WORKOUT DETECTION

\========================================= */

function getNewestWorkout(workouts) {
  if (!Array.isArray(workouts) || workouts.length === 0) {
    return null;
  }

  return workouts.reduce(
    (
      newest,

      workout,
    ) => {
      if (!newest) {
        return workout;
      }

      const newestTime = new Date(newest.createdAt || 0).getTime();

      const workoutTime = new Date(workout.createdAt || 0).getTime();

      return workoutTime > newestTime ? workout : newest;
    },

    null,
  );
}

function wasJustCreated(workout) {
  if (!workout?.createdAt) {
    return false;
  }

  const createdAt = new Date(workout.createdAt).getTime();

  if (!Number.isFinite(createdAt)) {
    return false;
  }

  const difference = Date.now() - createdAt;

  return difference >= 0 && difference <= NEW_WORKOUT_TOAST_WINDOW;
}

/* =========================================

   PAGE

\========================================= */

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState([]);

  const [search, setSearch] = useState("");

  const [expandedId, setExpandedId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [toast, setToast] = useState(null);

  /* =========================================

     LOAD WORKOUTS FROM API

  ========================================= */

  async function loadWorkoutHistory() {
    try {
      setLoading(true);

      setError("");

      const data = await getWorkouts();

      const workoutData = Array.isArray(data) ? data : [];

      setWorkouts(workoutData);

      /*

       * A newly-created workout comes

       * back from PostgreSQL with its

       * createdAt timestamp.

       *

       * If it was created only a few

       * seconds ago, this page was most

       * likely reached immediately after

       * Save Workout.

       */

      const newestWorkout = getNewestWorkout(workoutData);

      if (wasJustCreated(newestWorkout)) {
        setToast({
          type: "success",

          title: "Workout saved",

          message: newestWorkout?.name
            ? `"${newestWorkout.name}" was added successfully.`
            : "Your workout was added successfully.",
        });
      }
    } catch (loadError) {
      console.error(
        "Failed to load workouts:",

        loadError,
      );

      setError(loadError.message || "Failed to load workouts.");

      setToast({
        type: "error",
        title: "Could not load workouts",
        message: loadError.message || "Failed to load workouts.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const loadTimeout = setTimeout(
      () => {
        loadWorkoutHistory();
      },

      0,
    );

    return () => {
      clearTimeout(loadTimeout);
    };
  }, []);

  /* =========================================

     TOAST

  ========================================= */

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = setTimeout(
      () => {
        setToast(null);
      },

      3200,
    );

    return () => {
      clearTimeout(timeout);
    };
  }, [toast]);

  /* =========================================

     DELETE MODAL BEHAVIOUR

  ========================================= */

  useEffect(() => {
    if (!deleteTarget) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape" && deletingId === null) {
        setDeleteTarget(null);
      }
    }

    document.body.style.overflow = "hidden";

    window.addEventListener(
      "keydown",

      handleKeyDown,
    );

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener(
        "keydown",

        handleKeyDown,
      );
    };
  }, [deleteTarget, deletingId]);

  /* =========================================

     SORT + FILTER

  ========================================= */

  const sortedWorkouts = useMemo(() => {
    const query = search

      .trim()

      .toLowerCase();

    return [...workouts]

      .sort(
        (
          a,

          b,
        ) => {
          const dateDifference = parseDate(b.date) - parseDate(a.date);

          if (dateDifference !== 0) {
            return dateDifference;
          }

          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        },
      )

      .filter((workout) => {
        if (!query) {
          return true;
        }

        const nameMatch = (workout.name || "")

          .toLowerCase()

          .includes(query);

        const exerciseMatch = (workout.exercises || []).some((exercise) =>
          (exercise.name || "")

            .toLowerCase()

            .includes(query),
        );

        return nameMatch || exerciseMatch;
      });
  }, [workouts, search]);

  /* =========================================

     STATS

  ========================================= */

  const stats = useMemo(() => {
    const week = getWeekRange();

    return {
      thisWeek: workouts.filter((workout) => {
        const date = parseDate(workout.date);

        return date >= week.start && date < week.end;
      }).length,

      total: workouts.length,

      volume: workouts.reduce(
        (
          total,

          workout,
        ) => total + getWorkoutVolume(workout),

        0,
      ),

      tut: workouts.reduce(
        (
          total,

          workout,
        ) => total + getWorkoutTUT(workout),

        0,
      ),
    };
  }, [workouts]);

  /* =========================================

     DELETE

  ========================================= */

  function requestDeleteWorkout(workout) {
    if (deletingId !== null) {
      return;
    }

    setError("");

    setDeleteTarget(workout);
  }

  function closeDeleteModal() {
    if (deletingId !== null) {
      return;
    }

    setDeleteTarget(null);

    setError("");

    setToast({
      type: "info",
      title: "Deletion canceled",
      message: "Your workout was not deleted.",
    });
  }

  async function handleDeleteWorkout() {
    if (!deleteTarget) {
      return;
    }

    const id = deleteTarget.id;

    try {
      setDeletingId(id);

      setError("");

      await deleteWorkoutRequest(id);

      setWorkouts((currentWorkouts) =>
        currentWorkouts.filter((item) => item.id !== id),
      );

      if (expandedId === id) {
        setExpandedId(null);
      }

      setDeleteTarget(null);

      setToast({
        type: "success",
        title: "Workout deleted",
        message: deleteTarget.name
          ? `"${deleteTarget.name}" was deleted successfully.`
          : "Your workout was deleted successfully.",
      });
    } catch (deleteError) {
      console.error(
        "Failed to delete workout:",

        deleteError,
      );

      setError(deleteError.message || "Failed to delete workout.");

      setToast({
        type: "error",
        title: "Could not delete workout",
        message: deleteError.message || "Failed to delete workout.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  /* =========================================

     RENDER

  ========================================= */

  return (
    <main className="workouts-page">
      {/* =====================================

          SUCCESS / ERROR / INFO TOAST

      ===================================== */}

      {toast && (
        <div
          className={`workouts-page__toast workouts-page__toast--${toast.type || "success"}`}
          role={toast.type === "error" ? "alert" : "status"}
          aria-live={toast.type === "error" ? "assertive" : "polite"}
        >
          <div className="workouts-page__toast-icon">
            {toast.type === "error" ? (
              <AlertCircle size={18} />
            ) : toast.type === "info" ? (
              <Info size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
          </div>

          <div className="workouts-page__toast-copy">
            <strong>{toast.title}</strong>

            <span>{toast.message}</span>
          </div>

          <button
            type="button"
            className="workouts-page__toast-close"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* =====================================

          HEADER

      ===================================== */}

      <header className="page__header">
        <div className="page__header-text">
          <span className="page__eyebrow">Training Log</span>

          <h1 className="page__title">Workouts</h1>

          <p className="page__description">
            Your completed training sessions, including traditional lifting and
            timed workouts.
          </p>
        </div>

        <Link to="/workouts/session" className="button button--primary">
          <Plus size={16} />
          Log Workout
        </Link>
      </header>

      {/* =====================================

          API ERROR

      ===================================== */}

      {error && !deleteTarget && (
        <div className="panel workouts-page__empty">
          <Dumbbell size={28} />

          <h3>Something went wrong</h3>

          <p>{error}</p>

          <button
            type="button"
            className="button button--primary"
            onClick={loadWorkoutHistory}
          >
            Try Again
          </button>
        </div>
      )}

      {/* =====================================

          LOADING

      ===================================== */}

      {loading ? (
        <div className="panel workouts-page__empty">
          <Dumbbell size={28} />

          <h3>Loading workouts</h3>

          <p>Loading your training history from FORGE.</p>
        </div>
      ) : (
        <>
          {/* =================================

              STATS

          ================================= */}

          <section className="workouts-page__stats">
            <article className="workouts-page__stat">
              <span>This Week</span>

              <strong>{stats.thisWeek}</strong>

              <small>workouts</small>
            </article>

            <article className="workouts-page__stat">
              <span>Total Workouts</span>

              <strong>{stats.total}</strong>

              <small>sessions</small>
            </article>

            <article className="workouts-page__stat">
              <span>Rep Volume</span>

              <strong>{formatVolume(stats.volume)}</strong>

              <small>weight × reps</small>
            </article>

            <article className="workouts-page__stat">
              <span>Time Under Tension</span>

              <strong>{formatDuration(stats.tut)}</strong>

              <small>timed work</small>
            </article>
          </section>

          {/* =================================

              HISTORY HEADER

          ================================= */}

          <div className="workouts-page__section-header">
            <div>
              <h2>Workout History</h2>

              <p>
                {workouts.length} completed{" "}
                {workouts.length === 1 ? "workout" : "workouts"}
              </p>
            </div>

            <div className="workouts-page__search">
              <Search size={16} />

              <input
                type="search"
                placeholder="Search workouts..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {/* =================================

              EMPTY

          ================================= */}

          {sortedWorkouts.length === 0 ? (
            <div className="panel workouts-page__empty">
              <Dumbbell size={28} />

              <h3>
                {workouts.length === 0
                  ? "No workouts logged"
                  : "No matching workouts"}
              </h3>

              <p>
                {workouts.length === 0
                  ? "Log a completed workout to start building your history."
                  : "Try a different search term."}
              </p>

              {workouts.length === 0 && (
                <Link to="/workouts/session" className="button button--primary">
                  <Plus size={15} />
                  Log Workout
                </Link>
              )}
            </div>
          ) : (
            /* ===============================

               WORKOUT HISTORY

            =============================== */

            <section className="workouts-page__history">
              {sortedWorkouts.map((workout) => {
                const expanded = expandedId === workout.id;

                const exerciseCount = workout.exercises?.length || 0;

                const repSets = getRepSetCount(workout);

                const timedIntervals = getTimedIntervalCount(workout);

                const volume = getWorkoutVolume(workout);

                const tut = getWorkoutTUT(workout);

                return (
                  <article
                    className="panel workouts-page__workout"
                    key={workout.id}
                  >
                    {/* =====================

                          WORKOUT SUMMARY

                      ===================== */}

                    <div className="workouts-page__workout-summary">
                      <button
                        type="button"
                        className="workouts-page__workout-toggle"
                        aria-expanded={expanded}
                        onClick={() =>
                          setExpandedId(expanded ? null : workout.id)
                        }
                      >
                        <div className="workouts-page__workout-icon">
                          <Dumbbell size={19} />
                        </div>

                        <div className="workouts-page__workout-main">
                          <h3>{workout.name || "Workout"}</h3>

                          <span className="workouts-page__workout-date">
                            <CalendarDays size={13} />

                            {formatDate(workout.date)}
                          </span>

                          <div className="workouts-page__workout-meta">
                            <span>
                              {exerciseCount}{" "}
                              {exerciseCount === 1 ? "exercise" : "exercises"}
                            </span>

                            {repSets > 0 && (
                              <span>
                                {repSets} {repSets === 1 ? "set" : "sets"}
                              </span>
                            )}

                            {timedIntervals > 0 && (
                              <span>
                                <Clock3 size={11} />
                                {timedIntervals}{" "}
                                {timedIntervals === 1
                                  ? "interval"
                                  : "intervals"}
                              </span>
                            )}

                            {volume > 0 && <span>{formatVolume(volume)}</span>}

                            {tut > 0 && (
                              <span>
                                <Clock3 size={11} />
                                {formatDuration(tut)} TUT
                              </span>
                            )}
                          </div>
                        </div>

                        {expanded ? (
                          <ChevronUp size={19} />
                        ) : (
                          <ChevronDown size={19} />
                        )}
                      </button>

                      <button
                        type="button"
                        className="workouts-page__delete"
                        aria-label={`Delete ${workout.name || "workout"}`}
                        disabled={deletingId === workout.id}
                        onClick={() => requestDeleteWorkout(workout)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* =====================

                          DETAILS

                      ===================== */}

                    {expanded && (
                      <div className="workouts-page__workout-details">
                        <div className="workouts-page__details-heading">
                          <div>
                            <h4>Workout Details</h4>

                            <span>
                              {exerciseCount}{" "}
                              {exerciseCount === 1 ? "exercise" : "exercises"}{" "}
                              recorded
                            </span>
                          </div>

                          {workout.youtubeUrl && (
                            <a
                              href={workout.youtubeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="button workouts-page__video-link"
                            >
                              <ExternalLink size={14} />
                              Workout Video
                            </a>
                          )}
                        </div>

                        {/* =================

                              EXERCISES

                          ================= */}

                        {(workout.exercises || []).map(
                          (
                            exercise,

                            exerciseIndex,
                          ) => {
                            const mode = getTrackingMode(exercise);

                            const exerciseTUT =
                              mode === "time"
                                ? (exercise.sets || []).reduce(
                                    (
                                      total,

                                      set,
                                    ) =>
                                      total + Number(set.durationSeconds || 0),

                                    0,
                                  )
                                : 0;

                            return (
                              <div
                                className="workouts-page__exercise"
                                key={exercise.id || exerciseIndex}
                              >
                                {/* EXERCISE HEADER */}

                                <div className="workouts-page__exercise-header">
                                  <span>{exerciseIndex + 1}</span>

                                  <strong>{exercise.name}</strong>

                                  <small>
                                    {mode === "time"
                                      ? `${
                                          (exercise.sets || []).length
                                        } intervals · ${formatDuration(
                                          exerciseTUT,
                                        )} TUT`
                                      : `${(exercise.sets || []).length} sets`}
                                  </small>
                                </div>

                                {/* =================

                                      REP SETS

                                  ================= */}

                                {mode === "reps" && (
                                  <div className="workouts-page__sets">
                                    <div className="workouts-page__set-heading">
                                      <span>Set</span>

                                      <span>Weight</span>

                                      <span>Reps</span>
                                    </div>

                                    {(exercise.sets || []).map(
                                      (
                                        set,

                                        setIndex,
                                      ) => (
                                        <div
                                          className="workouts-page__set"
                                          key={set.id || setIndex}
                                        >
                                          <span>{setIndex + 1}</span>

                                          <strong>
                                            {formatWeight(set.weight)}
                                          </strong>

                                          <strong>{set.reps ?? "—"}</strong>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}

                                {/* =================

                                      TIMED INTERVALS

                                  ================= */}

                                {mode === "time" && (
                                  <div className="workouts-page__sets">
                                    <div className="workouts-page__set-heading">
                                      <span>Interval</span>

                                      <span>Weight</span>

                                      <span>Time</span>
                                    </div>

                                    {(exercise.sets || []).map(
                                      (
                                        set,

                                        setIndex,
                                      ) => (
                                        <div
                                          className="workouts-page__set"
                                          key={set.id || setIndex}
                                        >
                                          <span>{setIndex + 1}</span>

                                          <strong>
                                            {formatWeight(set.weight)}
                                          </strong>

                                          <strong>
                                            {formatDuration(
                                              set.durationSeconds,
                                            )}
                                          </strong>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}

      {/* =====================================

          DELETE CONFIRMATION MODAL

      ===================================== */}

      {deleteTarget && (
        <div
          className="workouts-page__modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteModal();
            }
          }}
        >
          <div
            className="workouts-page__delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-workout-title"
          >
            <button
              type="button"
              className="workouts-page__modal-close"
              aria-label="Close delete confirmation"
              disabled={deletingId !== null}
              onClick={closeDeleteModal}
            >
              <X size={17} />
            </button>

            <div className="workouts-page__delete-modal-icon">
              <Trash2 size={20} />
            </div>

            <div className="workouts-page__delete-modal-copy">
              <span>Delete Workout</span>

              <h2 id="delete-workout-title">Delete this workout?</h2>

              <p>
                <strong>{deleteTarget.name || "Workout"}</strong> will be
                permanently deleted. This action cannot be undone.
              </p>

              {error && (
                <div className="workouts-page__delete-modal-error">{error}</div>
              )}
            </div>

            <div className="workouts-page__delete-modal-actions">
              <button
                type="button"
                className="button"
                disabled={deletingId !== null}
                onClick={closeDeleteModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="button workouts-page__delete-confirm"
                disabled={deletingId !== null}
                onClick={handleDeleteWorkout}
              >
                <Trash2 size={15} />

                {deletingId !== null ? "Deleting..." : "Delete Workout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

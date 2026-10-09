import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

import './WorkoutsPage.css';

const STORAGE_KEY = 'forge:workoutHistory';

function loadWorkouts() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function parseDate(date) {
  if (!date) return 0;

  const timestamp = new Date(`${date}T12:00:00`).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDate(date) {
  if (!date) return 'Unknown date';

  return new Date(`${date}T12:00:00`).toLocaleDateString(
    'en-US',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
}

function getSetCount(workout) {
  return (workout.exercises || []).reduce(
    (total, exercise) => total + (exercise.sets?.length || 0),
    0
  );
}

function getVolume(workout) {
  return (workout.exercises || []).reduce(
    (total, exercise) => {
      return (
        total +
        (exercise.sets || []).reduce(
          (sum, set) =>
            sum +
            Number(set.weight || 0) *
              Number(set.reps || 0),
          0
        )
      );
    },
    0
  );
}

function formatVolume(volume) {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k kg`;
  }

  return `${Math.round(volume)} kg`;
}

function getWeekStart() {
  const date = new Date();
  const day = date.getDay();

  date.setDate(date.getDate() - ((day + 6) % 7));
  date.setHours(0, 0, 0, 0);

  return date.getTime();
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState(loadWorkouts);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const sortedWorkouts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...workouts]
      .sort((a, b) => {
        const dateDifference =
          parseDate(b.date) - parseDate(a.date);

        if (dateDifference !== 0) return dateDifference;

        return new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0);
      })
      .filter((workout) => {
        if (!query) return true;

        return (
          (workout.name || '').toLowerCase().includes(query) ||
          (workout.exercises || []).some((exercise) =>
            (exercise.name || '').toLowerCase().includes(query)
          )
        );
      });
  }, [workouts, search]);

  const stats = useMemo(() => {
    const weekStart = getWeekStart();

    return {
      total: workouts.length,
      thisWeek: workouts.filter(
        (workout) =>
          parseDate(workout.date) >= weekStart
      ).length,
      sets: workouts.reduce(
        (total, workout) => total + getSetCount(workout),
        0
      ),
      volume: workouts.reduce(
        (total, workout) => total + getVolume(workout),
        0
      ),
    };
  }, [workouts]);

  function deleteWorkout(id) {
    const workout = workouts.find((item) => item.id === id);

    if (
      !window.confirm(
        `Delete "${workout?.name || 'Workout'}"? This cannot be undone.`
      )
    ) {
      return;
    }

    const updated = workouts.filter((item) => item.id !== id);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setWorkouts(updated);

    if (expandedId === id) {
      setExpandedId(null);
    }
  }

  return (
    <main className="workouts-page">
      <header className="page__header">
        <div className="page__header-text">
          <span className="page__eyebrow">Training Log</span>

          <h1 className="page__title">Workouts</h1>

          <p className="page__description">
            Your completed training sessions, organized by workout.
          </p>
        </div>

        <Link
          to="/workouts/session"
          className="button button--primary"
        >
          <Plus size={16} />
          Log Workout
        </Link>
      </header>

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
          <span>Total Sets</span>
          <strong>{stats.sets}</strong>
          <small>logged</small>
        </article>

        <article className="workouts-page__stat">
          <span>Total Volume</span>
          <strong>{formatVolume(stats.volume)}</strong>
          <small>lifted</small>
        </article>
      </section>

      <div className="workouts-page__section-header">
        <div>
          <h2>Workout History</h2>
          <p>
            {workouts.length} completed{' '}
            {workouts.length === 1 ? 'workout' : 'workouts'}
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

      {sortedWorkouts.length === 0 ? (
        <div className="panel workouts-page__empty">
          <Dumbbell size={28} />

          <h3>
            {workouts.length === 0
              ? 'No workouts logged'
              : 'No matching workouts'}
          </h3>

          <p>
            {workouts.length === 0
              ? 'Log a completed workout to start building your history.'
              : 'Try a different search term.'}
          </p>

          {workouts.length === 0 && (
            <Link
              to="/workouts/session"
              className="button button--primary"
            >
              <Plus size={15} />
              Log Workout
            </Link>
          )}
        </div>
      ) : (
        <section className="workouts-page__history">
          {sortedWorkouts.map((workout) => {
            const expanded = expandedId === workout.id;
            const exerciseCount = workout.exercises?.length || 0;
            const setCount = getSetCount(workout);
            const volume = getVolume(workout);

            return (
              <article
                className="panel workouts-page__workout"
                key={workout.id}
              >
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
                      <h3>{workout.name || 'Workout'}</h3>

                      <span className="workouts-page__workout-date">
                        <CalendarDays size={13} />
                        {formatDate(workout.date)}
                      </span>

                      <div className="workouts-page__workout-meta">
                        <span>
                          {exerciseCount} exercises
                        </span>
                        <span>{setCount} sets</span>
                        <span>{formatVolume(volume)}</span>
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
                    aria-label={`Delete ${workout.name || 'workout'}`}
                    onClick={() => deleteWorkout(workout.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {expanded && (
                  <div className="workouts-page__workout-details">
                    <div className="workouts-page__details-heading">
                      <h4>Workout Details</h4>
                      <span>{exerciseCount} exercises recorded</span>
                    </div>

                    {(workout.exercises || []).map(
                      (exercise, exerciseIndex) => (
                        <div
                          className="workouts-page__exercise"
                          key={exercise.id || exerciseIndex}
                        >
                          <div className="workouts-page__exercise-header">
                            <span>{exerciseIndex + 1}</span>
                            <strong>{exercise.name}</strong>
                            <small>
                              {exercise.sets?.length || 0} sets
                            </small>
                          </div>

                          <div className="workouts-page__sets">
                            <div className="workouts-page__set-heading">
                              <span>Set</span>
                              <span>Weight</span>
                              <span>Reps</span>
                            </div>

                            {(exercise.sets || []).map(
                              (set, setIndex) => (
                                <div
                                  className="workouts-page__set"
                                  key={set.id || setIndex}
                                >
                                  <span>{setIndex + 1}</span>
                                  <strong>
                                    {Number(set.weight || 0)} kg
                                  </strong>
                                  <strong>
                                    {Number(set.reps || 0)}
                                  </strong>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
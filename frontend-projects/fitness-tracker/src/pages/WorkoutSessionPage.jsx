
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Save,
  Search,
  Trash2,
  Dumbbell,
  X,
} from 'lucide-react';

import { exercises } from '../data/exercises';
import './WorkoutSessionPage.css';

const HISTORY_KEY = 'forge:workoutHistory';
const DRAFT_KEY = 'forge:workoutDraft';

const localDate = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 10);
};

const newId = () => crypto.randomUUID();

const emptySet = () => ({
  id: newId(),
  weight: '',
  reps: '',
});

const initialWorkout = () => ({
  name: '',
  date: localDate(),
  exercises: [],
});

function WorkoutSessionPage() {
  const navigate = useNavigate();

  const [workout, setWorkout] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? JSON.parse(saved) : initialWorkout();
    } catch {
      return initialWorkout();
    }
  });

  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(workout));
  }, [workout]);

  const matchingExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(search.toLowerCase())
  );

  function addExercise(name, exerciseId = null) {
    setWorkout((current) => ({
      ...current,
      exercises: [
        ...current.exercises,
        {
          id: newId(),
          exerciseId,
          name,
          sets: [emptySet()],
        },
      ],
    }));

    setShowExercisePicker(false);
    setSearch('');
    setCustomName('');
    setError('');
  }

  function updateSet(exerciseId, setId, field, value) {
    setWorkout((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId
                  ? { ...set, [field]: value }
                  : set
              ),
            }
          : exercise
      ),
    }));
  }

  function addSet(exerciseId) {
    setWorkout((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, sets: [...exercise.sets, emptySet()] }
          : exercise
      ),
    }));
  }

  function removeSet(exerciseId, setId) {
    setWorkout((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.filter((set) => set.id !== setId),
            }
          : exercise
      ),
    }));
  }

  function removeExercise(exerciseId) {
    setWorkout((current) => ({
      ...current,
      exercises: current.exercises.filter(
        (exercise) => exercise.id !== exerciseId
      ),
    }));
  }

  function saveWorkout() {
    const name = workout.name.trim();

    if (!name) {
      setError('Enter a workout name.');
      return;
    }

    if (!workout.date) {
      setError('Choose a workout date.');
      return;
    }

    if (workout.exercises.length === 0) {
      setError('Add at least one exercise.');
      return;
    }

    const hasInvalidSets = workout.exercises.some(
      (exercise) =>
        exercise.sets.length === 0 ||
        exercise.sets.some(
          (set) =>
            set.weight === '' ||
            set.reps === '' ||
            !Number.isFinite(Number(set.weight)) ||
            !Number.isInteger(Number(set.reps)) ||
            Number(set.weight) < 0 ||
            Number(set.reps) <= 0
        )
    );

    if (hasInvalidSets) {
      setError('Every set needs a valid weight and a positive whole-number rep count.');
      return;
    }

    const savedWorkout = {
      id: newId(),
      name,
      date: workout.date,
      createdAt: new Date().toISOString(),
      exercises: workout.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => ({
          ...set,
          weight: Number(set.weight),
          reps: Number(set.reps),
        })),
      })),
    };

    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const updated = [savedWorkout, ...(Array.isArray(history) ? history : [])];

      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      localStorage.removeItem(DRAFT_KEY);
      navigate('/workouts');
    } catch {
      setError('Could not save the workout. Check your browser storage.');
    }
  }

  return (
    <main className="workout-session">
      <div className="workout-session__header">
        <div>
          <Link to="/workouts" className="workout-session__back">
            <ArrowLeft size={16} /> Back to Workouts
          </Link>
          <span className="page__eyebrow">Training Log</span>
          <h1 className="page__title">Log Workout</h1>
          <p className="page__description">
            Record the exercises, weights and reps you performed.
          </p>
        </div>
        <button type="button" className="button button--primary" onClick={saveWorkout}>
          <Save size={16} /> Save Workout
        </button>
      </div>

      <section className="panel workout-session__information">
        <div className="workout-session__field">
          <label htmlFor="workout-name">Workout Name</label>
          <input
            id="workout-name"
            placeholder="e.g. Chest & Triceps"
            value={workout.name}
            onChange={(event) =>
              setWorkout({ ...workout, name: event.target.value })
            }
          />
        </div>

        <div className="workout-session__field">
          <label htmlFor="workout-date">Date</label>
          <input
            id="workout-date"
            type="date"
            value={workout.date}
            onChange={(event) =>
              setWorkout({ ...workout, date: event.target.value })
            }
          />
        </div>
      </section>

      <div className="workout-session__section-header">
        <div>
          <h2>Exercises</h2>
          <p>Add the exercises you completed during this workout.</p>
        </div>
        <button
          type="button"
          className="button"
          onClick={() => setShowExercisePicker(true)}
        >
          <Plus size={16} /> Add Exercise
        </button>
      </div>

      {workout.exercises.length === 0 && (
        <div className="panel workout-session__empty">
          <Dumbbell size={28} />
          <h3>No exercises added</h3>
          <p>Choose an exercise from the library or enter your own.</p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => setShowExercisePicker(true)}
          >
            <Plus size={16} /> Add First Exercise
          </button>
        </div>
      )}

      <div className="workout-session__exercise-list">
        {workout.exercises.map((exercise, exerciseIndex) => (
          <article className="panel workout-session__exercise" key={exercise.id}>
            <div className="workout-session__exercise-header">
              <div className="workout-session__exercise-number">
                {exerciseIndex + 1}
              </div>
              <div className="workout-session__exercise-title">
                <strong>{exercise.name}</strong>
                <span>{exercise.sets.length} sets</span>
              </div>
              <button
                type="button"
                className="workout-session__remove"
                aria-label={`Remove ${exercise.name}`}
                onClick={() => removeExercise(exercise.id)}
              >
                <Trash2 size={17} />
              </button>
            </div>

            <div className="workout-session__set-heading">
              <span>Set</span>
              <span>Weight (kg)</span>
              <span>Reps</span>
              <span />
            </div>

            <div className="workout-session__sets">
              {exercise.sets.map((set, setIndex) => (
                <div className="workout-session__set" key={set.id}>
                  <span className="workout-session__set-number">
                    {setIndex + 1}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    aria-label={`Set ${setIndex + 1} weight`}
                    value={set.weight}
                    onChange={(event) =>
                      updateSet(exercise.id, set.id, 'weight', event.target.value)
                    }
                  />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="0"
                    aria-label={`Set ${setIndex + 1} reps`}
                    value={set.reps}
                    onChange={(event) =>
                      updateSet(exercise.id, set.id, 'reps', event.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="workout-session__remove"
                    aria-label={`Remove set ${setIndex + 1}`}
                    onClick={() => removeSet(exercise.id, set.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="workout-session__exercise-footer">
              <button type="button" onClick={() => addSet(exercise.id)}>
                <Plus size={15} /> Add Set
              </button>
            </div>
          </article>
        ))}
      </div>

      {error && <p className="workout-session__error" role="alert">{error}</p>}

      <div className="workout-session__bottom">
        <span>{workout.exercises.length} exercises added</span>
        <button type="button" className="button button--primary" onClick={saveWorkout}>
          <Save size={16} /> Save Workout
        </button>
      </div>

      {showExercisePicker && (
        <div
          className="workout-session__overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowExercisePicker(false);
            }
          }}
        >
          <section className="workout-session__picker" role="dialog" aria-modal="true" aria-label="Add exercise">
            <div className="workout-session__picker-header">
              <h2>Add Exercise</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowExercisePicker(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="workout-session__picker-search">
              <Search size={17} />
              <input
                autoFocus
                placeholder="Search exercises..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="workout-session__picker-list">
              {matchingExercises.map((exercise) => (
                <button
                  type="button"
                  key={exercise.id}
                  onClick={() => addExercise(exercise.name, exercise.id)}
                >
                  <Dumbbell size={17} />
                  <span>{exercise.name}</span>
                  <small>{exercise.muscle}</small>
                  <Plus size={16} />
                </button>
              ))}
              {matchingExercises.length === 0 && (
                <p className="workout-session__picker-empty">No matching exercises.</p>
              )}
            </div>

            <div className="workout-session__custom">
              <label htmlFor="custom-exercise">Custom exercise</label>
              <div>
                <input
                  id="custom-exercise"
                  placeholder="Enter exercise name"
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                />
                <button
                  type="button"
                  className="button button--primary"
                  disabled={!customName.trim()}
                  onClick={() => addExercise(customName.trim())}
                >
                  <Plus size={15} /> Add
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default WorkoutSessionPage;

import {
  Dumbbell,
  Search,
  SlidersHorizontal,
  Target,
  RotateCcw,
  Layers3,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import {
  exercises,
  muscleGroups,
  equipmentTypes,
  exerciseTypes,
} from '../data/exercises';

import './LibraryPage.css';

function LibraryPage() {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [equipmentFilter, setEquipmentFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [selectedExercise, setSelectedExercise] = useState(
    exercises[0],
  );

  /* =========================================
     FILTERED EXERCISES
  ========================================= */

  const filteredExercises = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return exercises.filter((exercise) => {
      const matchesSearch =
        !normalizedSearch ||
        exercise.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        exercise.muscle
          .toLowerCase()
          .includes(normalizedSearch) ||
        exercise.equipment
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesMuscle =
        muscleFilter === 'All' ||
        exercise.muscle === muscleFilter;

      const matchesEquipment =
        equipmentFilter === 'All' ||
        exercise.equipment === equipmentFilter;

      const matchesType =
        typeFilter === 'All' ||
        exercise.type === typeFilter;

      return (
        matchesSearch &&
        matchesMuscle &&
        matchesEquipment &&
        matchesType
      );
    });
  }, [
    search,
    muscleFilter,
    equipmentFilter,
    typeFilter,
  ]);

  const filtersActive =
    search !== '' ||
    muscleFilter !== 'All' ||
    equipmentFilter !== 'All' ||
    typeFilter !== 'All';

  function resetFilters() {
    setSearch('');
    setMuscleFilter('All');
    setEquipmentFilter('All');
    setTypeFilter('All');
  }

  return (
    <main className="library-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            Exercise Database
          </span>

          <h1 className="page__title">
            Library
          </h1>

          <p className="page__description">
            Browse exercises used to build routines and log workouts.
          </p>

        </div>

        <div className="library-page__count">

          <Dumbbell size={16} />

          <div>
            <strong>
              {exercises.length}
            </strong>

            <span>
              Exercises
            </span>
          </div>

        </div>

      </div>

      {/* =====================================
          FILTERS
      ===================================== */}

      <section className="library-page__filters">

        <div className="library-page__search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>

        <div className="library-page__filter">

          <span>
            Muscle
          </span>

          <select
            value={muscleFilter}
            onChange={(event) =>
              setMuscleFilter(event.target.value)
            }
          >
            {muscleGroups.map((muscle) => (
              <option
                key={muscle}
                value={muscle}
              >
                {muscle}
              </option>
            ))}
          </select>

        </div>

        <div className="library-page__filter">

          <span>
            Equipment
          </span>

          <select
            value={equipmentFilter}
            onChange={(event) =>
              setEquipmentFilter(event.target.value)
            }
          >
            {equipmentTypes.map((equipment) => (
              <option
                key={equipment}
                value={equipment}
              >
                {equipment}
              </option>
            ))}
          </select>

        </div>

        <div className="library-page__filter">

          <span>
            Type
          </span>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
          >
            {exerciseTypes.map((type) => (
              <option
                key={type}
                value={type}
              >
                {type}
              </option>
            ))}
          </select>

        </div>

        <button
          type="button"
          className="library-page__reset"
          onClick={resetFilters}
          disabled={!filtersActive}
        >
          <RotateCcw size={15} />
          Reset
        </button>

      </section>

      {/* =====================================
          RESULTS SUMMARY
      ===================================== */}

      <div className="library-page__results-header">

        <div>

          <SlidersHorizontal size={15} />

          <span>
            Showing
            {' '}
            <strong>
              {filteredExercises.length}
            </strong>
            {' '}
            of
            {' '}
            {exercises.length}
            {' '}
            exercises
          </span>

        </div>

      </div>

      {/* =====================================
          MAIN GRID
      ===================================== */}

      <section className="library-page__layout">

        {/* EXERCISE LIST */}

        <article className="panel library-page__list-panel">

          <div className="panel__header">

            <div>
              <span>Database</span>
              <h2>Exercises</h2>
            </div>

            <Dumbbell size={17} />

          </div>

          <div className="library-page__exercise-list">

            {filteredExercises.length > 0 ? (
              filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  className={
                    selectedExercise?.id === exercise.id
                      ? 'library-page__exercise library-page__exercise--selected'
                      : 'library-page__exercise'
                  }
                  onClick={() =>
                    setSelectedExercise(exercise)
                  }
                >

                  <div className="library-page__exercise-icon">
                    <Dumbbell size={17} />
                  </div>

                  <div className="library-page__exercise-main">

                    <strong>
                      {exercise.name}
                    </strong>

                    <span>
                      {exercise.muscle}
                    </span>

                  </div>

                  <div className="library-page__exercise-meta">

                    <span>
                      {exercise.equipment}
                    </span>

                    <small>
                      {exercise.type}
                    </small>

                  </div>

                </button>
              ))
            ) : (
              <div className="library-page__empty">

                <Search size={24} />

                <strong>
                  No exercises found
                </strong>

                <p>
                  Try changing your search or filters.
                </p>

                <button
                  type="button"
                  className="button"
                  onClick={resetFilters}
                >
                  Reset Filters
                </button>

              </div>
            )}

          </div>

        </article>

        {/* EXERCISE DETAILS */}

        <aside className="panel library-page__details">

          <div className="panel__header">

            <div>
              <span>Exercise Profile</span>
              <h2>Details</h2>
            </div>

            <Target size={17} />

          </div>

          {selectedExercise && (
            <div className="library-page__details-content">

              <div className="library-page__details-icon">
                <Dumbbell
                  size={27}
                  strokeWidth={1.6}
                />
              </div>

              <span className="library-page__details-eyebrow">
                {selectedExercise.muscle}
              </span>

              <h2>
                {selectedExercise.name}
              </h2>

              <div className="library-page__details-tags">

                <span>
                  {selectedExercise.equipment}
                </span>

                <span>
                  {selectedExercise.type}
                </span>

              </div>

              <div className="library-page__details-section">

                <div className="library-page__details-heading">

                  <Target size={15} />

                  <span>
                    Primary Muscle
                  </span>

                </div>

                <strong>
                  {selectedExercise.muscle}
                </strong>

              </div>

              <div className="library-page__details-section">

                <div className="library-page__details-heading">

                  <Layers3 size={15} />

                  <span>
                    Secondary Muscles
                  </span>

                </div>

                {selectedExercise.secondaryMuscles.length > 0 ? (
                  <div className="library-page__secondary">

                    {selectedExercise.secondaryMuscles.map(
                      (muscle) => (
                        <span key={muscle}>
                          {muscle}
                        </span>
                      ),
                    )}

                  </div>
                ) : (
                  <p>
                    No major secondary muscles listed.
                  </p>
                )}

              </div>

              <div className="library-page__details-section">

                <span className="library-page__details-label">
                  Equipment
                </span>

                <strong>
                  {selectedExercise.equipment}
                </strong>

              </div>

              <div className="library-page__details-section">

                <span className="library-page__details-label">
                  Movement Type
                </span>

                <strong>
                  {selectedExercise.type}
                </strong>

              </div>

            </div>
          )}

        </aside>

      </section>

    </main>
  );
}

export default LibraryPage;
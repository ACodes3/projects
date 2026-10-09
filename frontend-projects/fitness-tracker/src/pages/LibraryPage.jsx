import {
  ChevronRight,
  Dumbbell,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import {
  equipmentTypes,
  exercises,
  exerciseTypes,
  muscleGroups,
} from '../data/exercises';

import './LibraryPage.css';

/* =========================================
   EXERCISE LIBRARY
========================================= */

function LibraryPage() {
  const [search, setSearch] =
    useState('');

  const [muscle, setMuscle] =
    useState('All');

  const [equipment, setEquipment] =
    useState('All');

  const [type, setType] =
    useState('All');

  const [
    selectedExercise,
    setSelectedExercise,
  ] = useState(null);

  /* =========================================
     FILTER
  ========================================= */

  const filteredExercises =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return exercises.filter(
        (exercise) => {
          const matchesSearch =
            !query ||
            exercise.name
              .toLowerCase()
              .includes(query) ||
            exercise.muscle
              .toLowerCase()
              .includes(query) ||
            exercise.secondaryMuscles
              ?.some((item) =>
                item
                  .toLowerCase()
                  .includes(query),
              );

          const matchesMuscle =
            muscle === 'All' ||
            exercise.muscle ===
              muscle ||
            exercise.secondaryMuscles
              ?.includes(muscle);

          const matchesEquipment =
            equipment === 'All' ||
            exercise.equipment ===
              equipment;

          const matchesType =
            type === 'All' ||
            exercise.type === type;

          return (
            matchesSearch &&
            matchesMuscle &&
            matchesEquipment &&
            matchesType
          );
        },
      );
    }, [
      search,
      muscle,
      equipment,
      type,
    ]);

  const filtersActive =
    search ||
    muscle !== 'All' ||
    equipment !== 'All' ||
    type !== 'All';

  /* =========================================
     RESET
  ========================================= */

  function resetFilters() {
    setSearch('');
    setMuscle('All');
    setEquipment('All');
    setType('All');
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
            Exercise Library
          </h1>

          <p className="page__description">
            Browse the exercises
            available when logging
            your workouts.
          </p>

        </div>

      </div>

      {/* =====================================
          SEARCH + FILTERS
      ===================================== */}

      <section className="panel library-page__filters">

        <div className="library-page__search">

          <Search size={16} />

          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
          />

          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() =>
                setSearch('')
              }
            >
              <X size={15} />
            </button>
          )}

        </div>

        <div className="library-page__filter">

          <label htmlFor="muscle-filter">
            Muscle
          </label>

          <select
            id="muscle-filter"
            value={muscle}
            onChange={(event) =>
              setMuscle(
                event.target.value,
              )
            }
          >
            {muscleGroups.map(
              (item) => (
                <option
                  value={item}
                  key={item}
                >
                  {item}
                </option>
              ),
            )}
          </select>

        </div>

        <div className="library-page__filter">

          <label htmlFor="equipment-filter">
            Equipment
          </label>

          <select
            id="equipment-filter"
            value={equipment}
            onChange={(event) =>
              setEquipment(
                event.target.value,
              )
            }
          >
            {equipmentTypes.map(
              (item) => (
                <option
                  value={item}
                  key={item}
                >
                  {item}
                </option>
              ),
            )}
          </select>

        </div>

        <div className="library-page__filter">

          <label htmlFor="type-filter">
            Type
          </label>

          <select
            id="type-filter"
            value={type}
            onChange={(event) =>
              setType(
                event.target.value,
              )
            }
          >
            {exerciseTypes.map(
              (item) => (
                <option
                  value={item}
                  key={item}
                >
                  {item}
                </option>
              ),
            )}
          </select>

        </div>

        <button
          type="button"
          className="library-page__reset"
          disabled={!filtersActive}
          onClick={resetFilters}
        >
          <RotateCcw size={15} />
          Reset
        </button>

      </section>

      {/* =====================================
          RESULT HEADER
      ===================================== */}

      <div className="library-page__section-header">

        <div>

          <h2>
            Exercises
          </h2>

          <p>
            {filteredExercises.length}{' '}
            {filteredExercises.length ===
            1
              ? 'exercise'
              : 'exercises'}{' '}
            found.
          </p>

        </div>

      </div>

      {/* =====================================
          CONTENT
      ===================================== */}

      <div className="library-page__layout">

        {/* ===================================
            EXERCISE LIST
        =================================== */}

        <section className="panel library-page__list">

          {filteredExercises.length ===
          0 ? (
            <div className="library-page__empty">

              <Search size={26} />

              <h3>
                No exercises found
              </h3>

              <p>
                Try changing your
                search or filters.
              </p>

              <button
                type="button"
                className="button"
                onClick={
                  resetFilters
                }
              >
                <RotateCcw
                  size={15}
                />
                Reset Filters
              </button>

            </div>
          ) : (
            filteredExercises.map(
              (exercise) => {
                const selected =
                  selectedExercise?.id ===
                  exercise.id;

                return (
                  <button
                    type="button"
                    className={`library-page__exercise ${
                      selected
                        ? 'library-page__exercise--selected'
                        : ''
                    }`}
                    key={
                      exercise.id
                    }
                    onClick={() =>
                      setSelectedExercise(
                        exercise,
                      )
                    }
                  >

                    <div className="library-page__exercise-icon">
                      <Dumbbell
                        size={17}
                      />
                    </div>

                    <div className="library-page__exercise-main">

                      <strong>
                        {
                          exercise.name
                        }
                      </strong>

                      <span>
                        {
                          exercise.muscle
                        }
                        {' · '}
                        {
                          exercise.equipment
                        }
                      </span>

                    </div>

                    <span className="library-page__exercise-type">
                      {exercise.type}
                    </span>

                    <ChevronRight
                      size={16}
                    />

                  </button>
                );
              },
            )
          )}

        </section>

        {/* ===================================
            DETAILS
        =================================== */}

        <aside className="panel library-page__details">

          {!selectedExercise ? (
            <div className="library-page__details-empty">

              <div>
                <Dumbbell
                  size={25}
                />
              </div>

              <h3>
                Select an exercise
              </h3>

              <p>
                Choose an exercise
                from the list to view
                its details.
              </p>

            </div>
          ) : (
            <>
              <div className="library-page__details-header">

                <div className="library-page__details-icon">
                  <Dumbbell
                    size={21}
                  />
                </div>

                <div>

                  <span>
                    {
                      selectedExercise.type
                    }
                  </span>

                  <h2>
                    {
                      selectedExercise.name
                    }
                  </h2>

                </div>

              </div>

              <div className="library-page__details-body">

                <div className="library-page__detail">

                  <span>
                    Primary Muscle
                  </span>

                  <strong>
                    {
                      selectedExercise.muscle
                    }
                  </strong>

                </div>

                <div className="library-page__detail">

                  <span>
                    Equipment
                  </span>

                  <strong>
                    {
                      selectedExercise.equipment
                    }
                  </strong>

                </div>

                <div className="library-page__detail">

                  <span>
                    Exercise Type
                  </span>

                  <strong>
                    {
                      selectedExercise.type
                    }
                  </strong>

                </div>

                <div className="library-page__secondary">

                  <span>
                    Secondary Muscles
                  </span>

                  {selectedExercise
                    .secondaryMuscles
                    ?.length ? (
                    <div>
                      {selectedExercise.secondaryMuscles.map(
                        (
                          item,
                        ) => (
                          <span
                            key={
                              item
                            }
                          >
                            {item}
                          </span>
                        ),
                      )}
                    </div>
                  ) : (
                    <p>
                      No secondary
                      muscles listed.
                    </p>
                  )}

                </div>

              </div>
            </>
          )}

        </aside>

      </div>

    </main>
  );
}

export default LibraryPage;
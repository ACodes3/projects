
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  equipmentTypes,
  exerciseTypes,
  muscleGroups,
} from "../data/exercises";

import {
  createExercise,
  deleteExercise,
  getExercises,
  updateExercise,
} from "../api/forgeApi.js";

import "./LibraryPage.css";

/* =========================================
   HELPERS
========================================= */

function normalizeExercise(exercise) {
  let secondary =
    exercise.secondary_muscles ??
    exercise.secondaryMuscles ??
    [];

  if (typeof secondary === "string") {
    secondary = secondary
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return {
    id: exercise.id,
    name: exercise.name ?? "",
    muscle:
      exercise.muscle ??
      exercise.primary_muscle ??
      "",
    equipment: exercise.equipment ?? "",
    type:
      exercise.type ??
      exercise.exercise_type ??
      "",
    secondaryMuscles: Array.isArray(secondary)
      ? secondary
      : [],
  };
}

function extractExercises(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.exercises)) {
    return response.exercises;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

function createEmptyForm() {
  return {
    name: "",
    muscle: "",
    equipment: "",
    type: "",
    secondaryMuscles: [],
  };
}

function getOptions(options) {
  return options.filter(
    (item) => item !== "All"
  );
}

/* =========================================
   LIBRARY PAGE
========================================= */

export default function LibraryPage() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const [type, setType] = useState("All");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(createEmptyForm);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState(null);

  /* =========================================
     API LOAD
  ========================================= */

  const loadExercises = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getExercises();

      const normalized = extractExercises(
        response
      ).map(normalizeExercise);

      setExercises(
        normalized.sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
    } catch (loadError) {
      console.error(
        "Failed to load exercises:",
        loadError
      );

      setError(
        loadError.message ||
          "Failed to load exercise library."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadExercises();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadExercises]);

  /* =========================================
     TOAST
  ========================================= */

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timeout);
  }, [toast]);

  function showToast(type, title, message) {
    setToast({
      type,
      title,
      message,
    });
  }

  /* =========================================
     SELECTED EXERCISE
  ========================================= */

  const selectedExercise = useMemo(
    () =>
      exercises.find(
        (exercise) => exercise.id === selectedId
      ) ?? null,
    [exercises, selectedId]
  );

  /* =========================================
     FILTER EXERCISES
  ========================================= */

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const secondary =
        exercise.secondaryMuscles ?? [];

      const matchesSearch =
        !query ||
        exercise.name.toLowerCase().includes(query) ||
        exercise.muscle
          .toLowerCase()
          .includes(query) ||
        exercise.equipment
          .toLowerCase()
          .includes(query) ||
        exercise.type
          .toLowerCase()
          .includes(query) ||
        secondary.some((item) =>
          item.toLowerCase().includes(query)
        );

      const matchesMuscle =
        muscle === "All" ||
        exercise.muscle === muscle ||
        secondary.includes(muscle);

      const matchesEquipment =
        equipment === "All" ||
        exercise.equipment === equipment;

      const matchesType =
        type === "All" ||
        exercise.type === type;

      return (
        matchesSearch &&
        matchesMuscle &&
        matchesEquipment &&
        matchesType
      );
    });
  }, [
    exercises,
    search,
    muscle,
    equipment,
    type,
  ]);

  // Paginate the filtered results, not the full exercise library.
  const PAGE_SIZE = 20;
  const pageCount = Math.max(1, Math.ceil(filteredExercises.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleExercises = filteredExercises.slice(pageStart, pageStart + PAGE_SIZE);

  const filtersActive =
    search !== "" ||
    muscle !== "All" ||
    equipment !== "All" ||
    type !== "All";

  function resetFilters() {
    setSearch("");
    setMuscle("All");
    setEquipment("All");
    setType("All");
    setPage(1);
  }

  /* =========================================
     FORM ACTIONS
  ========================================= */

  function openAddModal() {
    setEditingId(null);
    setForm(createEmptyForm());
    setFormError("");
    setShowForm(true);
  }

  function openEditModal() {
    if (!selectedExercise) return;

    setEditingId(selectedExercise.id);

    setForm({
      name: selectedExercise.name,
      muscle: selectedExercise.muscle,
      equipment: selectedExercise.equipment,
      type: selectedExercise.type,
      secondaryMuscles: [
        ...selectedExercise.secondaryMuscles,
      ],
    });

    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setFormError("");
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (formError) {
      setFormError("");
    }
  }

  function toggleSecondaryMuscle(value) {
    setForm((current) => ({
      ...current,
      secondaryMuscles:
        current.secondaryMuscles.includes(value)
          ? current.secondaryMuscles.filter(
              (item) => item !== value
            )
          : [
              ...current.secondaryMuscles,
              value,
            ],
    }));
  }

  /* =========================================
     CREATE / UPDATE
  ========================================= */

  async function saveExercise(event) {
    event.preventDefault();

    if (saving) return;

    const name = form.name.trim();

    if (!name) {
      setFormError("Enter an exercise name.");
      return;
    }

    if (!form.muscle) {
      setFormError(
        "Select a primary muscle group."
      );
      return;
    }

    if (!form.equipment) {
      setFormError(
        "Select the exercise equipment."
      );
      return;
    }

    if (!form.type) {
      setFormError("Select an exercise type.");
      return;
    }

    const payload = {
      name,
      muscle: form.muscle,
      equipment: form.equipment,
      type: form.type,
      secondaryMuscles:
        form.secondaryMuscles.filter(
          (item) => item !== form.muscle
        ),
    };

    const wasEditing = editingId !== null;

    try {
      setSaving(true);
      setFormError("");

      const response = wasEditing
        ? await updateExercise(
            editingId,
            payload
          )
        : await createExercise(payload);

      const savedExercise =
        response?.exercise ??
        response?.data?.exercise ??
        response;

      const savedId =
        savedExercise?.id ??
        (wasEditing ? editingId : null);

      setShowForm(false);
      setEditingId(null);
      setForm(createEmptyForm());

      if (savedId !== null) {
        setSelectedId(savedId);
      }

      showToast(
        "success",
        wasEditing
          ? "Exercise updated"
          : "Exercise added",
        wasEditing
          ? `${name} was updated successfully.`
          : `${name} was added to your library.`
      );

      await loadExercises();
    } catch (saveError) {
      console.error(
        "Failed to save exercise:",
        saveError
      );

      setFormError(
        saveError.message ||
          "Failed to save exercise."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     DELETE CONFIRMATION
  ========================================= */

  function openDeleteModal() {
    if (!selectedExercise) return;

    setDeleteTarget(selectedExercise);
    setError("");
  }

  function closeDeleteModal() {
    if (deleting) return;

    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    const target = deleteTarget;

    try {
      setDeleting(true);
      setError("");

      await deleteExercise(target.id);

      setExercises((current) =>
        current.filter(
          (exercise) => exercise.id !== target.id
        )
      );

      setSelectedId((current) =>
        current === target.id
          ? null
          : current
      );

      setDeleteTarget(null);

      showToast(
        "success",
        "Exercise deleted",
        `${target.name} was removed from the library.`
      );
    } catch (deleteError) {
      console.error(
        "Failed to delete exercise:",
        deleteError
      );

      setError(
        deleteError.message ||
          "Failed to delete exercise."
      );
    } finally {
      setDeleting(false);
    }
  }

  /* =========================================
     RENDER
  ========================================= */

  return (
    <main className="library-page">
      {/* =====================================
          TOAST
      ===================================== */}

      {toast && (
        <div
          className={`library-page__toast library-page__toast--${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <div className="library-page__toast-icon">
            {toast.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
          </div>

          <div className="library-page__toast-copy">
            <strong>{toast.title}</strong>
            <span>{toast.message}</span>
          </div>

          <button
            type="button"
            className="library-page__toast-close"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* =====================================
          PAGE HEADER
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
            Browse, add, and manage exercises
            available when logging workouts.
          </p>
        </div>

        <button
          type="button"
          className="button library-page__add"
          onClick={openAddModal}
        >
          <Plus size={16} />
          Add Exercise
        </button>
      </div>

      {/* =====================================
          PAGE ERROR
      ===================================== */}

      {error && !deleteTarget && (
        <p
          className="library-page__error"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* =====================================
          SEARCH + FILTERS
      ===================================== */}

      <section className="panel library-page__filters">
        <div className="library-page__search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search exercises..."
            aria-label="Search exercises"
            value={search}
            onChange={(event) =>
              { setSearch(event.target.value); setPage(1); }
            }
          />

          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => { setSearch(""); setPage(1); }}
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
              { setMuscle(event.target.value); setPage(1); }
            }
          >
            {muscleGroups.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
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
              { setEquipment(event.target.value); setPage(1); }
            }
          >
            {equipmentTypes.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
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
              { setType(event.target.value); setPage(1); }
            }
          >
            {exerciseTypes.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
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
          RESULTS HEADER
      ===================================== */}

      <div className="library-page__section-header">
        <div>
          <h2>Exercises</h2>

          <p>
            {filteredExercises.length}{" "}
            {filteredExercises.length === 1
              ? "exercise"
              : "exercises"}{" "}
            found.
          </p>
        </div>

        <button
          type="button"
          className="library-page__refresh"
          onClick={loadExercises}
          disabled={loading}
        >
          <RotateCcw size={14} />
          Refresh
        </button>
      </div>

      {/* =====================================
          LIBRARY LAYOUT
      ===================================== */}

      <div className="library-page__layout">
        {/* ===================================
            EXERCISE LIST
        =================================== */}

        <section className="panel library-page__list">
          {loading ? (
            <div className="library-page__empty">
              <Dumbbell size={26} />

              <h3>Loading exercises</h3>

              <p>
                Fetching the exercise library.
              </p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="library-page__empty">
              <Search size={26} />

              <h3>No exercises found</h3>

              <p>
                Try changing your search or filters,
                or add a new exercise.
              </p>

              <button
                type="button"
                className="button"
                onClick={resetFilters}
              >
                <RotateCcw size={15} />
                Reset Filters
              </button>
            </div>
          ) : (
            visibleExercises.map((exercise) => {
              const selected =
                selectedId === exercise.id;

              return (
                <button
                  type="button"
                  className={`library-page__exercise ${
                    selected
                      ? "library-page__exercise--selected"
                      : ""
                  }`}
                  key={exercise.id}
                  onClick={() =>
                    setSelectedId(exercise.id)
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
                      {" · "}
                      {exercise.equipment}
                    </span>
                  </div>

                  <span className="library-page__exercise-type">
                    {exercise.type}
                  </span>

                  <ChevronRight size={16} />
                </button>
              );
            })
          )}
          {!loading && filteredExercises.length > 0 && (
            <nav className="library-page__pagination" aria-label="Exercise pages">
              <span className="library-page__pagination-summary">
                Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredExercises.length)} of {filteredExercises.length}
              </span>
              <div className="library-page__pagination-actions">
                <button
                  type="button"
                  className="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <span className="library-page__pagination-number">
                  Page {currentPage} of {pageCount}
                </span>
                <button
                  type="button"
                  className="button"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </nav>
          )}
        </section>

        {/* ===================================
            EXERCISE DETAILS
        =================================== */}

        <aside className="panel library-page__details">
          {!selectedExercise ? (
            <div className="library-page__details-empty">
              <div>
                <Dumbbell size={25} />
              </div>

              <h3>Select an exercise</h3>

              <p>
                Choose an exercise from the list
                to view or manage its details.
              </p>
            </div>
          ) : (
            <>
              <div className="library-page__details-header">
                <div className="library-page__details-icon">
                  <Dumbbell size={21} />
                </div>

                <div>
                  <span>
                    {selectedExercise.type}
                  </span>

                  <h2>
                    {selectedExercise.name}
                  </h2>
                </div>
              </div>

              <div className="library-page__details-body">
                <div className="library-page__detail">
                  <span>
                    Primary Muscle
                  </span>

                  <strong>
                    {selectedExercise.muscle}
                  </strong>
                </div>

                <div className="library-page__detail">
                  <span>Equipment</span>

                  <strong>
                    {selectedExercise.equipment}
                  </strong>
                </div>

                <div className="library-page__detail">
                  <span>Exercise Type</span>

                  <strong>
                    {selectedExercise.type}
                  </strong>
                </div>

                <div className="library-page__secondary">
                  <span>
                    Secondary Muscles
                  </span>

                  {selectedExercise.secondaryMuscles
                    .length > 0 ? (
                    <div>
                      {selectedExercise.secondaryMuscles.map(
                        (item) => (
                          <span key={item}>
                            {item}
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <p>
                      No secondary muscles listed.
                    </p>
                  )}
                </div>

                <div className="library-page__details-actions">
                  <button
                    type="button"
                    className="button library-page__edit-button"
                    onClick={openEditModal}
                  >
                    <Pencil size={15} />
                    Edit Exercise
                  </button>

                  <button
                    type="button"
                    className="button library-page__delete-button"
                    onClick={openDeleteModal}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* =====================================
          ADD / EDIT EXERCISE MODAL
      ===================================== */}

      {showForm && (
        <div
          className="library-page__overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <section
            className="library-page__modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              editingId !== null
                ? "Edit exercise"
                : "Add exercise"
            }
          >
            <div className="library-page__modal-header">
              <div>
                <span>
                  Exercise Library
                </span>

                <h2>
                  {editingId !== null
                    ? "Edit Exercise"
                    : "Add Exercise"}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close"
                disabled={saving}
                onClick={closeForm}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveExercise}>
              <div className="library-page__form">
                <div className="library-page__field library-page__field--full">
                  <label htmlFor="exercise-name">
                    Exercise Name
                  </label>

                  <input
                    id="exercise-name"
                    type="text"
                    placeholder="e.g. Incline Dumbbell Press"
                    value={form.name}
                    maxLength={120}
                    required
                    disabled={saving}
                    onChange={(event) =>
                      updateForm(
                        "name",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="library-page__field">
                  <label htmlFor="exercise-muscle">
                    Primary Muscle
                  </label>

                  <select
                    id="exercise-muscle"
                    value={form.muscle}
                    required
                    disabled={saving}
                    onChange={(event) =>
                      updateForm(
                        "muscle",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select muscle
                    </option>

                    {getOptions(muscleGroups).map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="library-page__field">
                  <label htmlFor="exercise-equipment">
                    Equipment
                  </label>

                  <select
                    id="exercise-equipment"
                    value={form.equipment}
                    required
                    disabled={saving}
                    onChange={(event) =>
                      updateForm(
                        "equipment",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select equipment
                    </option>

                    {getOptions(equipmentTypes).map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="library-page__field library-page__field--full">
                  <label htmlFor="exercise-type">
                    Exercise Type
                  </label>

                  <select
                    id="exercise-type"
                    value={form.type}
                    required
                    disabled={saving}
                    onChange={(event) =>
                      updateForm(
                        "type",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select type
                    </option>

                    {getOptions(exerciseTypes).map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="library-page__field library-page__field--full">
                  <label>
                    Secondary Muscles
                    <span className="library-page__optional">
                      (optional)
                    </span>
                  </label>

                  <div className="library-page__checkboxes">
                    {getOptions(muscleGroups)
                      .filter(
                        (item) =>
                          item !== form.muscle
                      )
                      .map((item) => (
                        <label
                          className="library-page__checkbox"
                          key={item}
                        >
                          <input
                            type="checkbox"
                            checked={form.secondaryMuscles.includes(
                              item
                            )}
                            disabled={saving}
                            onChange={() =>
                              toggleSecondaryMuscle(
                                item
                              )
                            }
                          />

                          <span>{item}</span>
                        </label>
                      ))}
                  </div>
                </div>
              </div>

              {formError && (
                <p
                  className="library-page__form-error"
                  role="alert"
                >
                  {formError}
                </p>
              )}

              <div className="library-page__modal-footer">
                <button
                  type="button"
                  className="button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="button button--primary"
                  disabled={saving}
                >
                  {editingId !== null ? (
                    <Pencil size={16} />
                  ) : (
                    <Plus size={16} />
                  )}

                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Save Changes"
                      : "Add Exercise"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* =====================================
          DELETE CONFIRMATION MODAL
      ===================================== */}

      {deleteTarget && (
        <div
          className="library-page__overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeDeleteModal();
            }
          }}
        >
          <section
            className="library-page__modal library-page__confirm"
            role="dialog"
            aria-modal="true"
            aria-label="Delete exercise"
          >
            <div className="library-page__modal-header">
              <div>
                <span>
                  Delete Exercise
                </span>

                <h2>
                  Delete this exercise?
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close"
                disabled={deleting}
                onClick={closeDeleteModal}
              >
                <X size={20} />
              </button>
            </div>

            <div className="library-page__confirm-body">
              <div className="library-page__confirm-icon">
                <Trash2 size={21} />
              </div>

              <p>
                Are you sure you want to delete{" "}
                <strong>
                  {deleteTarget.name}
                </strong>
                ?
              </p>

              <span>
                This action removes the exercise
                from your library. Historical
                workouts should remain intact.
              </span>
            </div>

            {error && (
              <p
                className="library-page__form-error"
                role="alert"
              >
                {error}
              </p>
            )}

            <div className="library-page__modal-footer">
              <button
                type="button"
                className="button"
                disabled={deleting}
                onClick={closeDeleteModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="button library-page__danger"
                disabled={deleting}
                onClick={confirmDelete}
              >
                <Trash2 size={16} />

                {deleting
                  ? "Deleting..."
                  : "Delete Exercise"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

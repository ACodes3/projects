
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Pencil,
  Plus,
  Scale,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createProgressEntry,
  deleteProgressEntry,
  getProgressEntries,
  updateProgressEntry,
} from "../api/forgeApi.js";

import "./ProgressPage.css";

/* =========================================
   HELPERS
========================================= */

function getLocalDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 10);
}

function normalizeDate(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toISOString().slice(0, 10);
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

  return Number.isFinite(number) ? number : null;
}

function normalizeEntry(entry) {
  return {
    id: entry.id,

    date: normalizeDate(
      entry.entry_date ?? entry.date
    ),

    weight: normalizeNumber(
      entry.weight_kg ?? entry.weight
    ),

    bodyFat: normalizeNumber(
      entry.body_fat_percent ?? entry.bodyFat
    ),

    waist: normalizeNumber(
      entry.waist_cm ?? entry.waist
    ),

    chest: normalizeNumber(
      entry.chest_cm ?? entry.chest
    ),

    arms: normalizeNumber(
      entry.arms_cm ?? entry.arms
    ),

    thighs: normalizeNumber(
      entry.thighs_cm ?? entry.thighs
    ),

    notes: entry.notes ?? "",

    createdAt:
      entry.created_at ?? entry.createdAt ?? null,
  };
}

function extractEntries(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.entries)) {
    return response.entries;
  }

  if (Array.isArray(response?.progressEntries)) {
    return response.progressEntries;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    const dateDifference = b.date.localeCompare(a.date);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return (
      new Date(b.createdAt || 0) -
      new Date(a.createdAt || 0)
    );
  });
}

function createEmptyEntry() {
  return {
    date: getLocalDateString(),
    weight: "",
    bodyFat: "",
    waist: "",
    chest: "",
    arms: "",
    thighs: "",
    notes: "",
  };
}

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(1);
}

function formatDate(value) {
  if (!value) return "Unknown";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

/* =========================================
   FORM FIELDS
========================================= */

const MEASUREMENT_FIELDS = [
  {
    name: "weight",
    label: "Weight (kg)",
    placeholder: "e.g. 82.4",
    step: "0.1",
  },
  {
    name: "bodyFat",
    label: "Body Fat (%)",
    placeholder: "Optional",
    step: "0.1",
    max: "100",
  },
  {
    name: "waist",
    label: "Waist (cm)",
    placeholder: "Optional",
    step: "0.1",
  },
  {
    name: "chest",
    label: "Chest (cm)",
    placeholder: "Optional",
    step: "0.1",
  },
  {
    name: "arms",
    label: "Arms (cm)",
    placeholder: "Optional",
    step: "0.1",
  },
  {
    name: "thighs",
    label: "Thighs (cm)",
    placeholder: "Optional",
    step: "0.1",
  },
];

/* =========================================
   PROGRESS PAGE
========================================= */

export default function ProgressPage() {
  const [entries, setEntries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState(createEmptyEntry);

  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  /* =========================================
     TOAST AUTO DISMISS
  ========================================= */

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timeoutId);
  }, [toast]);

  function showToast(type, title, message) {
    setToast({
      type,
      title,
      message,
    });
  }

  /* =========================================
     LOAD ENTRIES
  ========================================= */

  async function refreshEntries() {
    const response = await getProgressEntries();

    const normalized = extractEntries(response).map(
      normalizeEntry
    );

    setEntries(sortEntries(normalized));
  }

  useEffect(() => {
    let active = true;

    async function loadProgress() {
      try {
        const response = await getProgressEntries();

        if (!active) return;

        setEntries(
          sortEntries(
            extractEntries(response).map(normalizeEntry)
          )
        );
      } catch (loadError) {
        if (!active) return;

        console.error(
          "Failed to load progress:",
          loadError
        );

        setError(
          loadError.message ||
            "Failed to load progress."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProgress();

    return () => {
      active = false;
    };
  }, []);

  /* =========================================
     STATISTICS
  ========================================= */

  const stats = useMemo(() => {
    const entriesWithWeight = entries.filter(
      (entry) => entry.weight !== null
    );

    const latestWeight =
      entriesWithWeight[0]?.weight ?? null;

    const previousWeight =
      entriesWithWeight[1]?.weight ?? null;

    const latestBodyFat =
      entries.find((entry) => entry.bodyFat !== null)
        ?.bodyFat ?? null;

    const weightChange =
      latestWeight !== null &&
      previousWeight !== null
        ? latestWeight - previousWeight
        : null;

    return {
      latestWeight,
      latestBodyFat,
      weightChange,
      totalEntries: entries.length,
    };
  }, [entries]);

  /* =========================================
     CREATE MODAL
  ========================================= */

  function openAddModal() {
    setEditingId(null);
    setForm(createEmptyEntry());
    setError("");
    setShowModal(true);
  }

  /* =========================================
     EDIT MODAL
  ========================================= */

  function openEditModal(entry) {
    setEditingId(entry.id);

    setForm({
      date: entry.date,
      weight: entry.weight ?? "",
      bodyFat: entry.bodyFat ?? "",
      waist: entry.waist ?? "",
      chest: entry.chest ?? "",
      arms: entry.arms ?? "",
      thighs: entry.thighs ?? "",
      notes: entry.notes ?? "",
    });

    setError("");
    setShowModal(true);
  }

  /* =========================================
     CLOSE MODAL
  ========================================= */

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setError("");
  }

  /* =========================================
     UPDATE FORM
  ========================================= */

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  }

  /* =========================================
     VALIDATE FORM
  ========================================= */

  function validateForm() {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(form.date) ||
      Number.isNaN(
        new Date(`${form.date}T12:00:00`).getTime()
      )
    ) {
      return {
        error: "Choose a valid date.",
        values: null,
      };
    }

    const values = {};

    for (const field of MEASUREMENT_FIELDS) {
      const raw = String(form[field.name] ?? "").trim();

      const value = raw === "" ? null : Number(raw);

      if (value !== null) {
        if (!Number.isFinite(value)) {
          return {
            error: `Enter a valid number for ${field.label}.`,
            values: null,
          };
        }

        if (field.name === "bodyFat") {
          if (value < 0 || value > 100) {
            return {
              error:
                "Body fat must be between 0 and 100%.",
              values: null,
            };
          }
        } else if (value <= 0) {
          return {
            error:
              "Weight and measurements must be positive numbers.",
            values: null,
          };
        }
      }

      values[field.name] = value;
    }

    const hasMeasurement = MEASUREMENT_FIELDS.some(
      (field) => values[field.name] !== null
    );

    if (!hasMeasurement && !form.notes.trim()) {
      return {
        error:
          "Enter at least one measurement or a note.",
        values: null,
      };
    }

    return {
      error: "",
      values,
    };
  }

  /* =========================================
     CREATE / UPDATE ENTRY
  ========================================= */

  async function saveEntry(event) {
    event?.preventDefault();

    if (saving) return;

    const validation = validateForm();

    if (validation.error) {
      setError(validation.error);
      return;
    }

    const payload = {
      date: form.date,
      ...validation.values,
      notes: form.notes.trim(),
    };

    const wasEditing = editingId !== null;

    try {
      setSaving(true);
      setError("");

      if (wasEditing) {
        await updateProgressEntry(editingId, payload);
      } else {
        await createProgressEntry(payload);
      }

      setShowModal(false);
      setEditingId(null);
      setForm(createEmptyEntry());

      showToast(
        "success",
        wasEditing
          ? "Measurement updated"
          : "Measurement added",
        wasEditing
          ? "Your progress entry was updated successfully."
          : "Your progress entry was saved successfully."
      );

      try {
        await refreshEntries();
      } catch (refreshError) {
        console.error(
          "Failed to refresh progress:",
          refreshError
        );

        setError(
          "Measurement saved, but the history could not be refreshed."
        );
      }
    } catch (saveError) {
      console.error(
        "Failed to save progress entry:",
        saveError
      );

      setError(
        saveError.message ||
          "Failed to save measurement."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     DELETE CONFIRMATION
  ========================================= */

  function openDeleteModal(entry) {
    setDeleteTarget(entry);
    setError("");
  }

  function closeDeleteModal() {
    if (deletingId !== null) return;

    setDeleteTarget(null);
    setError("");
  }

  /* =========================================
     DELETE ENTRY
  ========================================= */

  async function deleteEntry() {
    if (!deleteTarget || deletingId !== null) {
      return;
    }

    const target = deleteTarget;

    try {
      setDeletingId(target.id);
      setError("");

      await deleteProgressEntry(target.id);

      setEntries((current) =>
        current.filter((entry) => entry.id !== target.id)
      );

      setDeleteTarget(null);

      showToast(
        "success",
        "Measurement deleted",
        "Your progress entry was deleted successfully."
      );
    } catch (deleteError) {
      console.error(
        "Failed to delete measurement:",
        deleteError
      );

      setError(
        deleteError.message ||
          "Failed to delete measurement."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* =========================================
     RENDER
  ========================================= */

  return (
    <main className="progress-page">
      {/* =====================================
          TOAST
      ===================================== */}

      {toast && (
        <div
          className={`progress-page__toast progress-page__toast--${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <div className="progress-page__toast-icon">
            {toast.type === "success" ? (
              <CheckCircle2 size={19} />
            ) : (
              <AlertCircle size={19} />
            )}
          </div>

          <div className="progress-page__toast-copy">
            <strong>{toast.title}</strong>
            <span>{toast.message}</span>
          </div>

          <button
            type="button"
            className="progress-page__toast-close"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="page__header">
        <div className="page__header-text">
          <span className="page__eyebrow">
            Body Tracking
          </span>

          <h1 className="page__title">
            Progress
          </h1>

          <p className="page__description">
            Record your body weight and measurements
            over time.
          </p>
        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={openAddModal}
          disabled={loading}
        >
          <Plus size={16} />
          Add Measurement
        </button>
      </header>

      {/* =====================================
          PAGE ERROR
      ===================================== */}

      {error && !showModal && !deleteTarget && (
        <p className="progress-page__error" role="alert">
          {error}
        </p>
      )}

      {/* =====================================
          SUMMARY STATS
      ===================================== */}

      <section className="progress-page__stats">
        <article className="progress-page__stat">
          <div>
            <Scale size={18} />
          </div>

          <span>Current Weight</span>

          <strong>
            {formatNumber(stats.latestWeight)}
          </strong>

          <small>
            {stats.latestWeight !== null ? "kg" : ""}
          </small>
        </article>

        <article className="progress-page__stat">
          <div>
            {stats.weightChange !== null &&
            stats.weightChange > 0 ? (
              <TrendingUp size={18} />
            ) : (
              <TrendingDown size={18} />
            )}
          </div>

          <span>Weight Change</span>

          <strong>
            {stats.weightChange !== null
              ? `${
                  stats.weightChange > 0 ? "+" : ""
                }${formatNumber(stats.weightChange)}`
              : "—"}
          </strong>

          <small>
            {stats.weightChange !== null ? "kg" : ""}
          </small>
        </article>

        <article className="progress-page__stat">
          <div>
            <Activity size={18} />
          </div>

          <span>Body Fat</span>

          <strong>
            {formatNumber(stats.latestBodyFat)}
          </strong>

          <small>
            {stats.latestBodyFat !== null ? "%" : ""}
          </small>
        </article>

        <article className="progress-page__stat">
          <div>
            <CalendarDays size={18} />
          </div>

          <span>Entries</span>

          <strong>{stats.totalEntries}</strong>

          <small />
        </article>
      </section>

      {/* =====================================
          HISTORY HEADING
      ===================================== */}

      <div className="progress-page__section-header">
        <div>
          <h2>Measurement History</h2>

          <p>
            Your recorded body measurements.
          </p>
        </div>
      </div>

      {/* =====================================
          LOADING
      ===================================== */}

      {loading && (
        <section className="panel progress-page__empty">
          <div>
            <Scale size={28} />
          </div>

          <h3>Loading measurements</h3>

          <p>
            Loading your progress history from FORGE.
          </p>
        </section>
      )}

      {/* =====================================
          EMPTY STATE
      ===================================== */}

      {!loading && entries.length === 0 && (
        <section className="panel progress-page__empty">
          <div>
            <Scale size={28} />
          </div>

          <h3>No measurements yet</h3>

          <p>
            Add your current weight or another measurement
            to start tracking your progress.
          </p>

          <button
            type="button"
            className="button button--primary"
            onClick={openAddModal}
          >
            <Plus size={16} />
            Add First Measurement
          </button>
        </section>
      )}

      {/* =====================================
          HISTORY TABLE
      ===================================== */}

      {!loading && entries.length > 0 && (
        <section className="panel progress-page__history">
          <div className="progress-page__table-heading">
            <span>Date</span>
            <span>Weight</span>
            <span>Body Fat</span>
            <span>Waist</span>
            <span>Chest</span>
            <span>Notes</span>
            <span>Actions</span>
          </div>

          <div className="progress-page__entries">
            {entries.map((entry) => (
              <article
                className="progress-page__entry"
                key={entry.id}
              >
                <div className="progress-page__entry-date">
                  <strong>
                    {formatDate(entry.date)}
                  </strong>
                </div>

                <span>
                  {entry.weight !== null
                    ? `${formatNumber(entry.weight)} kg`
                    : "—"}
                </span>

                <span>
                  {entry.bodyFat !== null
                    ? `${formatNumber(entry.bodyFat)}%`
                    : "—"}
                </span>

                <span>
                  {entry.waist !== null
                    ? `${formatNumber(entry.waist)} cm`
                    : "—"}
                </span>

                <span>
                  {entry.chest !== null
                    ? `${formatNumber(entry.chest)} cm`
                    : "—"}
                </span>

                <span
                  className="progress-page__notes"
                  title={entry.notes}
                >
                  {entry.notes || "—"}
                </span>

                {/* EDIT + DELETE */}

                <div className="progress-page__actions">
                  <button
                    type="button"
                    className="progress-page__edit"
                    aria-label={`Edit measurement from ${formatDate(
                      entry.date
                    )}`}
                    title="Edit measurement"
                    onClick={() => openEditModal(entry)}
                    disabled={saving || deletingId !== null}
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    className="progress-page__delete"
                    aria-label={`Delete measurement from ${formatDate(
                      entry.date
                    )}`}
                    title="Delete measurement"
                    onClick={() => openDeleteModal(entry)}
                    disabled={saving || deletingId !== null}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* =====================================
          ADD / EDIT MODAL
      ===================================== */}

      {showModal && (
        <div
          className="progress-page__overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            className="progress-page__modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              editingId !== null
                ? "Edit measurement"
                : "Add measurement"
            }
          >
            {/* MODAL HEADER */}

            <div className="progress-page__modal-header">
              <div>
                <span>Body Tracking</span>

                <h2>
                  {editingId !== null
                    ? "Edit Measurement"
                    : "Add Measurement"}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={saveEntry}>
              <div className="progress-page__form">
                <div className="progress-page__field">
                  <label htmlFor="progress-date">
                    Date
                  </label>

                  <input
                    id="progress-date"
                    type="date"
                    value={form.date}
                    disabled={saving}
                    onChange={(event) =>
                      updateForm(
                        "date",
                        event.target.value
                      )
                    }
                  />
                </div>

                {MEASUREMENT_FIELDS.map((field) => (
                  <div
                    className="progress-page__field"
                    key={field.name}
                  >
                    <label htmlFor={`progress-${field.name}`}>
                      {field.label}
                    </label>

                    <input
                      id={`progress-${field.name}`}
                      type="number"
                      min="0"
                      max={field.max}
                      step={field.step}
                      placeholder={field.placeholder}
                      value={form[field.name]}
                      disabled={saving}
                      onChange={(event) =>
                        updateForm(
                          field.name,
                          event.target.value
                        )
                      }
                    />
                  </div>
                ))}

                <div className="progress-page__field progress-page__field--full">
                  <label htmlFor="progress-notes">
                    Notes
                  </label>

                  <textarea
                    id="progress-notes"
                    rows={4}
                    placeholder="Optional notes..."
                    value={form.notes}
                    disabled={saving}
                    onChange={(event) =>
                      updateForm(
                        "notes",
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>

              {/* FORM ERROR */}

              {error && (
                <p
                  className="progress-page__error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {/* FORM ACTIONS */}

              <div className="progress-page__modal-footer">
                <button
                  type="button"
                  className="button"
                  disabled={saving}
                  onClick={closeModal}
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
                      : "Save Measurement"}
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
          className="progress-page__overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeDeleteModal();
            }
          }}
        >
          <section
            className="progress-page__modal progress-page__confirm"
            role="dialog"
            aria-modal="true"
            aria-label="Delete measurement"
          >
            <div className="progress-page__modal-header">
              <div>
                <span>Delete Entry</span>
                <h2>Delete this measurement?</h2>
              </div>

              <button
                type="button"
                aria-label="Close"
                disabled={deletingId !== null}
                onClick={closeDeleteModal}
              >
                <X size={20} />
              </button>
            </div>

            <p>
              This measurement from{" "}
              <strong>
                {formatDate(deleteTarget.date)}
              </strong>{" "}
              will be permanently deleted.
            </p>

            {error && (
              <p
                className="progress-page__error"
                role="alert"
              >
                {error}
              </p>
            )}

            <div className="progress-page__modal-footer">
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
                className="button progress-page__danger"
                disabled={deletingId !== null}
                onClick={deleteEntry}
              >
                <Trash2 size={16} />

                {deletingId !== null
                  ? "Deleting..."
                  : "Delete Measurement"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Apple,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coffee,
  Cookie,
  Pencil,
  Plus,
  Search,
  Target,
  Trash2,
  Utensils,
  X,
} from "lucide-react";

import {
  createNutritionEntry,
  deleteNutritionEntry,
  getNutritionEntries,
  getNutritionGoals,
  saveNutritionGoals,
  updateNutritionEntry,
} from "../api/forgeApi.js";

import "./NutritionPage.css";

const MEALS = ["Breakfast", "Lunch", "Snacks", "Dinner"];

const EMPTY_GOALS = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

function today() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function normalizeEntry(entry) {
  return {
    id: entry.id,
    date: String(entry.entry_date ?? entry.date ?? "").slice(0, 10),
    meal: entry.meal ?? "Breakfast",
    name: entry.name ?? "",
    calories: Number(entry.calories ?? 0),
    protein: Number(entry.protein_g ?? entry.protein ?? 0),
    carbs: Number(entry.carbs_g ?? entry.carbs ?? 0),
    fat: Number(entry.fat_g ?? entry.fat ?? 0),
  };
}

function entriesFrom(response) {
  const data = Array.isArray(response)
    ? response
    : (response?.entries ?? response?.nutritionEntries ?? response?.data ?? []);

  return Array.isArray(data) ? data.map(normalizeEntry) : [];
}

function goalsFrom(response) {
  const data =
    response?.goals ??
    response?.nutritionGoals ??
    response?.data?.goals ??
    response ??
    {};

  return {
    calories: Number(data.calories ?? 0),
    protein: Number(data.protein_g ?? data.protein ?? 0),
    carbs: Number(data.carbs_g ?? data.carbs ?? 0),
    fat: Number(data.fat_g ?? data.fat ?? 0),
  };
}

function groupByDay(entries) {
  return entries.reduce((groups, entry) => {
    if (!entry.date) return groups;
    (groups[entry.date] ??= []).push(entry);
    return groups;
  }, {});
}

function totals(entries) {
  return entries.reduce(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      protein: sum.protein + item.protein,
      carbs: sum.carbs + item.carbs,
      fat: sum.fat + item.fat,
    }),
    { ...EMPTY_GOALS },
  );
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function blankForm(date = today(), meal = "Breakfast") {
  return {
    date,
    meal,
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  };
}

function mealIcon(meal) {
  if (meal === "Breakfast") return Coffee;
  if (meal === "Snacks") return Cookie;
  return Utensils;
}

export default function NutritionPage() {
  const [logs, setLogs] = useState({});
  const [goals, setGoals] = useState(EMPTY_GOALS);

  const [expandedDate, setExpandedDate] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Food form
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => blankForm());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Food and day deletion
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDayTarget, setDeleteDayTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Daily targets editor
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [goalsForm, setGoalsForm] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [goalsError, setGoalsError] = useState("");
  const [savingGoals, setSavingGoals] = useState(false);

  // Notifications
  const [toast, setToast] = useState(null);

  // ============================================================
  // DATA LOADING
  // ============================================================

  async function reloadEntries() {
    const response = await getNutritionEntries();
    setLogs(groupByDay(entriesFrom(response)));
  }

  useEffect(() => {
    let active = true;

    Promise.all([getNutritionEntries(), getNutritionGoals()])
      .then(([entries, nutritionGoals]) => {
        if (!active) return;

        setLogs(groupByDay(entriesFrom(entries)));
        setGoals(goalsFrom(nutritionGoals));
      })
      .catch((error) => {
        if (active) {
          setPageError(error.message || "Could not load nutrition data.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!modalOpen && !deleteTarget && !deleteDayTarget && !goalsModalOpen) {
      return undefined;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [modalOpen, deleteTarget, deleteDayTarget, goalsModalOpen]);

  // ============================================================
  // CALCULATIONS
  // ============================================================

  const allEntries = useMemo(() => Object.values(logs).flat(), [logs]);

  const todayTotals = useMemo(() => totals(logs[today()] ?? []), [logs]);

  const filteredDays = useMemo(() => {
    const term = search.trim().toLowerCase();

    return Object.entries(logs)
      .filter(([, entries]) => entries.length > 0)
      .sort(([a], [b]) => b.localeCompare(a))
      .filter(
        ([date, entries]) =>
          !term ||
          formatDate(date).toLowerCase().includes(term) ||
          entries.some((entry) => entry.name.toLowerCase().includes(term)),
      );
  }, [logs, search]);

  const hasGoals = Object.values(goals).some((value) => value > 0);

  const targets = [
    ["Calories", "calories", "kcal"],
    ["Protein", "protein", "g"],
    ["Carbs", "carbs", "g"],
    ["Fat", "fat", "g"],
  ]
    .filter(([, key]) => goals[key] > 0)
    .map(([label, key, unit]) => ({
      label,
      key,
      unit,
      target: goals[key],
    }));

  // ============================================================
  // DAILY TARGETS
  // ============================================================

  function openGoalsModal() {
    setGoalsForm({
      calories: String(goals.calories),
      protein: String(goals.protein),
      carbs: String(goals.carbs),
      fat: String(goals.fat),
    });

    setGoalsError("");
    setGoalsModalOpen(true);
  }

  function updateGoalField(field, value) {
    setGoalsForm((current) => ({
      ...current,
      [field]: value,
    }));

    setGoalsError("");
  }

  async function handleSaveGoals(event) {
    event.preventDefault();
    if (savingGoals) return;

    const updatedGoals = {};

    for (const key of ["calories", "protein", "carbs", "fat"]) {
      const value = goalsForm[key] === "" ? 0 : Number(goalsForm[key]);

      if (
        !Number.isFinite(value) ||
        value < 0 ||
        (key === "calories" && !Number.isInteger(value))
      ) {
        setGoalsError(`Enter a valid non-negative ${key} target.`);
        return;
      }

      updatedGoals[key] = value;
    }

    try {
      setSavingGoals(true);
      setGoalsError("");

      const response = await saveNutritionGoals(updatedGoals);

      setGoals(response?.goals ? goalsFrom(response) : updatedGoals);

      setGoalsModalOpen(false);

      setToast({
        type: "success",
        title: "Daily targets updated",
        message: "Your nutrition targets were saved successfully.",
      });
    } catch (error) {
      setGoalsError(error.message || "Could not save nutrition targets.");
    } finally {
      setSavingGoals(false);
    }
  }

  // ============================================================
  // FOOD FORM
  // ============================================================

  function openAdd(date = today(), meal = "Breakfast") {
    setEditingId(null);
    setForm(blankForm(date, meal));
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(entry) {
    setEditingId(entry.id);

    setForm({
      date: entry.date,
      meal: entry.meal,
      name: entry.name,
      calories: String(entry.calories),
      protein: String(entry.protein),
      carbs: String(entry.carbs),
      fat: String(entry.fat),
    });

    setFormError("");
    setModalOpen(true);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFormError("");
  }

  function validateForm() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      return "Select a valid date.";
    }

    if (!MEALS.includes(form.meal)) {
      return "Select a valid meal.";
    }

    if (!form.name.trim()) {
      return "Enter a food name.";
    }

    if (form.name.trim().length > 200) {
      return "Food name must be 200 characters or less.";
    }

    for (const field of ["calories", "protein", "carbs", "fat"]) {
      const value = form[field] === "" ? 0 : Number(form[field]);

      if (
        !Number.isFinite(value) ||
        value < 0 ||
        (field === "calories" && !Number.isInteger(value))
      ) {
        return `Enter a valid non-negative ${field} value.`;
      }
    }

    return "";
  }

  async function saveFood(event) {
    event.preventDefault();
    if (saving) return;

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      date: form.date,
      meal: form.meal,
      name: form.name.trim(),
      calories: Number(form.calories || 0),
      protein: Number(form.protein || 0),
      carbs: Number(form.carbs || 0),
      fat: Number(form.fat || 0),
    };

    const wasEditing = editingId !== null;

    try {
      setSaving(true);
      setFormError("");
      setPageError("");

      if (wasEditing) {
        await updateNutritionEntry(editingId, payload);
      } else {
        await createNutritionEntry(payload);
      }

      setModalOpen(false);
      setEditingId(null);
      setExpandedDate(payload.date);
      setSearch("");

      setToast({
        type: "success",
        title: wasEditing ? "Food updated" : "Food added",
        message: `"${payload.name}" was ${
          wasEditing ? "updated" : "added"
        } successfully.`,
      });

      try {
        await reloadEntries();
      } catch (error) {
        setPageError(
          `Saved, but could not refresh nutrition: ${error.message}`,
        );
      }
    } catch (error) {
      setFormError(error.message || "Could not save food.");
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // DELETE SINGLE FOOD
  // ============================================================

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    const item = deleteTarget;

    try {
      setDeleting(true);
      setPageError("");

      await deleteNutritionEntry(item.id);

      setLogs((current) => {
        const next = { ...current };

        const remaining = (next[item.date] ?? []).filter(
          (entry) => entry.id !== item.id,
        );

        if (remaining.length) {
          next[item.date] = remaining;
        } else {
          delete next[item.date];
        }

        return next;
      });

      setDeleteTarget(null);

      setToast({
        type: "success",
        title: "Food deleted",
        message: `"${item.name}" was deleted.`,
      });
    } catch (error) {
      setPageError(error.message || "Could not delete food.");

      setDeleteTarget(null);

      setToast({
        type: "error",
        title: "Delete failed",
        message: error.message || "Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  }

  // ============================================================
  // DELETE ENTIRE NUTRITION DAY
  // ============================================================

  async function confirmDeleteDay() {
    if (!deleteDayTarget || deleting) return;

    const date = deleteDayTarget;
    const entries = logs[date] ?? [];

    if (!entries.length) {
      setDeleteDayTarget(null);
      return;
    }

    setDeleting(true);
    setPageError("");

    try {
      // Delete all entries belonging to the selected date.
      for (const entry of entries) {
        await deleteNutritionEntry(entry.id);
      }

      setLogs((current) => {
        const next = { ...current };
        delete next[date];
        return next;
      });

      if (expandedDate === date) {
        setExpandedDate(null);
      }

      setDeleteDayTarget(null);

      setToast({
        type: "success",
        title: "Nutrition day deleted",
        message: `All ${entries.length} food entries for ${formatDate(
          date,
        )} were deleted.`,
      });
    } catch (error) {
      // Refresh in case some entries were deleted.
      try {
        await reloadEntries();
      } catch (refreshError) {
        setPageError(
          `Deletion failed and refresh failed: ${refreshError.message}`,
        );
      }

      setDeleteDayTarget(null);

      setToast({
        type: "error",
        title: "Could not delete entire day",
        message: `Some entries may have been removed. ${
          error.message || "Please try again."
        }`,
      });
    } finally {
      setDeleting(false);
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="nutrition-page">
      {/* NOTIFICATIONS */}

      {toast && (
        <div
          className={`nutrition-page__toast nutrition-page__toast--${toast.type}`}
          role={toast.type === "error" ? "alert" : "status"}
        >
          <div className="nutrition-page__toast-icon">
            {toast.type === "error" ? (
              <AlertCircle size={19} />
            ) : (
              <CheckCircle2 size={19} />
            )}
          </div>

          <div className="nutrition-page__toast-copy">
            <strong>{toast.title}</strong>
            <span>{toast.message}</span>
          </div>

          <button
            type="button"
            className="nutrition-page__toast-close"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* PAGE HEADER */}

      <header className="page__header">
        <div className="page__header-text">
          <span className="page__eyebrow">Nutrition Log</span>

          <h1 className="page__title">Nutrition</h1>

          <p className="page__description">
            Track each day, meal and food entry against your personal nutrition
            targets.
          </p>
        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={() => openAdd()}
          disabled={loading}
        >
          <Plus size={16} />
          Add Food
        </button>
      </header>

      {/* PAGE ERROR */}

      {pageError && (
        <div className="nutrition-page__error" role="alert">
          {pageError}
        </div>
      )}

      {/* STATISTICS */}

      <section className="nutrition-page__stats">
        {[
          [
            "Calories Today",
            Math.round(todayTotals.calories),
            goals.calories ? `of ${goals.calories} kcal` : "kcal logged",
          ],
          [
            "Protein Today",
            `${Math.round(todayTotals.protein)}g`,
            goals.protein ? `of ${goals.protein}g` : "protein logged",
          ],
          ["Tracked Days", Object.keys(logs).length, "days logged"],
          ["Food Entries", allEntries.length, "total"],
        ].map(([label, value, helper]) => (
          <article className="nutrition-page__stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{helper}</small>
          </article>
        ))}
      </section>

      {/* DAILY TARGETS CARD */}

      <section className="panel nutrition-page__goals">
        <div className="nutrition-page__goals-heading">
          <div className="nutrition-page__goals-icon">
            <Target size={17} />
          </div>

          <div>
            <h2>Daily Targets</h2>
            <p>Manage your daily calorie and macro goals.</p>
          </div>
        </div>

        <div className="nutrition-page__goals-actions">
          {hasGoals ? (
            <div className="nutrition-page__goal-values">
              {targets.map((target) => (
                <div key={target.key}>
                  <strong>
                    {target.target}
                    {target.unit === "g" ? "g" : ""}
                  </strong>
                  <span>
                    {target.unit === "kcal"
                      ? "kcal"
                      : target.label.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="nutrition-page__goals-empty-text">
              No daily targets configured.
            </span>
          )}

          <button
            type="button"
            className="button nutrition-page__edit-targets"
            onClick={openGoalsModal}
            disabled={loading}
          >
            <Pencil size={15} />
            {hasGoals ? "Edit Targets" : "Set Targets"}
          </button>
        </div>
      </section>

      {/* NUTRITION HISTORY HEADER */}

      <div className="nutrition-page__section-header">
        <div>
          <h2>Nutrition History</h2>
          <p>Open a day to see meals, foods and target progress.</p>
        </div>

        <div className="nutrition-page__search">
          <Search size={15} />
          <input
            type="search"
            placeholder="Search days or foods..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {/* LOADING / EMPTY STATES */}

      {loading ? (
        <section className="panel nutrition-page__empty">
          <Apple size={28} />
          <h3>Loading nutrition</h3>
          <p>Loading your nutrition history from FORGE.</p>
        </section>
      ) : filteredDays.length === 0 ? (
        <section className="panel nutrition-page__empty">
          <Apple size={28} />

          <h3>
            {allEntries.length ? "No matching entries" : "No nutrition logged"}
          </h3>

          <p>
            {allEntries.length
              ? "Try a different search."
              : "Start logging food and your nutrition days will appear here."}
          </p>

          {!allEntries.length && (
            <button
              type="button"
              className="button button--primary"
              onClick={() => openAdd()}
            >
              <Plus size={15} />
              Add Food
            </button>
          )}
        </section>
      ) : (
        <section className="nutrition-page__days">
          {filteredDays.map(([date, entries]) => {
            const expanded = expandedDate === date;
            const daily = totals(entries);

            const mealCount = MEALS.filter((meal) =>
              entries.some((entry) => entry.meal === meal),
            ).length;

            return (
              <article className="panel nutrition-page__day" key={date}>
                {/* DAY SUMMARY */}

                <div className="nutrition-page__day-summary">
                  <button
                    type="button"
                    className="nutrition-page__day-toggle"
                    aria-expanded={expanded}
                    onClick={() => setExpandedDate(expanded ? null : date)}
                  >
                    <div className="nutrition-page__day-icon">
                      <CalendarDays size={19} />
                    </div>

                    <div className="nutrition-page__day-main">
                      <div className="nutrition-page__day-heading">
                        <div>
                          <h3>{formatDate(date)}</h3>
                          <span>
                            {date === today()
                              ? "Today"
                              : `${entries.length} food ${
                                  entries.length === 1 ? "entry" : "entries"
                                }`}
                          </span>
                        </div>
                      </div>

                      <div className="nutrition-page__day-macros">
                        {[
                          ["calories", "kcal"],
                          ["protein", "protein"],
                          ["carbs", "carbs"],
                          ["fat", "fat"],
                        ].map(([key, label]) => (
                          <div key={key}>
                            <strong>
                              {Math.round(daily[key])}
                              {key === "calories" ? "" : "g"}
                            </strong>

                            <span>
                              {goals[key]
                                ? `/ ${goals[key]}${
                                    key === "calories" ? " kcal" : `g ${label}`
                                  }`
                                : label}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="nutrition-page__day-meta">
                        <span>
                          {mealCount} {mealCount === 1 ? "meal" : "meals"}{" "}
                          logged
                        </span>
                      </div>
                    </div>

                    {expanded ? (
                      <ChevronUp size={19} />
                    ) : (
                      <ChevronDown size={19} />
                    )}
                  </button>

                  {/* DELETE DAY BUTTON */}

                  <button
                    type="button"
                    className="nutrition-page__day-delete"
                    title={`Delete all food entries for ${formatDate(date)}`}
                    aria-label={`Delete nutrition day ${formatDate(date)}`}
                    disabled={deleting}
                    onClick={() => setDeleteDayTarget(date)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                {/* EXPANDED DAY */}

                {expanded && (
                  <div className="nutrition-page__day-details">
                    {/* DAILY TARGET PROGRESS */}

                    {hasGoals && (
                      <section className="nutrition-page__target-progress">
                        <div className="nutrition-page__target-progress-heading">
                          <div>
                            <span>Daily Targets</span>
                            <h4>Nutrition Progress</h4>
                          </div>

                          <Target size={16} />
                        </div>

                        <div className="nutrition-page__target-list">
                          {targets.map(({ label, key, target, unit }) => {
                            const percent = Math.round(
                              (daily[key] / target) * 100,
                            );

                            return (
                              <div className="nutrition-page__target" key={key}>
                                <div className="nutrition-page__target-heading">
                                  <span>{label}</span>

                                  <strong>
                                    {Math.round(daily[key])}
                                    {unit === "g" ? "g" : ""}
                                    {" / "}
                                    {target}
                                    {unit}
                                  </strong>

                                  <small>{percent}%</small>
                                </div>

                                <div className="nutrition-page__target-bar">
                                  <span
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.max(0, percent),
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {/* MEALS */}

                    {MEALS.map((meal) => {
                      const mealEntries = entries.filter(
                        (entry) => entry.meal === meal,
                      );

                      const mealTotal = totals(mealEntries);
                      const MealIcon = mealIcon(meal);

                      return (
                        <section className="nutrition-page__meal" key={meal}>
                          <div className="nutrition-page__meal-header">
                            <div className="nutrition-page__meal-title">
                              <div className="nutrition-page__meal-icon">
                                <MealIcon size={16} />
                              </div>

                              <div>
                                <h4>{meal}</h4>
                                <span>
                                  {mealEntries.length}{" "}
                                  {mealEntries.length === 1 ? "item" : "items"}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="nutrition-page__meal-add"
                              onClick={() => openAdd(date, meal)}
                            >
                              <Plus size={14} />
                              Add Food
                            </button>
                          </div>

                          {/* MEAL TOTALS */}

                          {mealEntries.length > 0 && (
                            <div className="nutrition-page__meal-totals">
                              {[
                                ["calories", "kcal"],
                                ["protein", "protein"],
                                ["carbs", "carbs"],
                                ["fat", "fat"],
                              ].map(([key, label]) => (
                                <span key={key}>
                                  <strong>
                                    {Math.round(mealTotal[key])}
                                    {key === "calories" ? "" : "g"}
                                  </strong>{" "}
                                  {label}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* FOOD TABLE */}

                          {!mealEntries.length ? (
                            <div className="nutrition-page__meal-empty">
                              No food logged for this meal.
                            </div>
                          ) : (
                            <div className="nutrition-page__foods">
                              <div className="nutrition-page__food-heading">
                                <span>Food</span>
                                <span>Calories</span>
                                <span>Protein</span>
                                <span>Carbs</span>
                                <span>Fat</span>
                                <span>Actions</span>
                              </div>

                              {mealEntries.map((entry) => (
                                <div
                                  className="nutrition-page__food"
                                  key={entry.id}
                                >
                                  <strong title={entry.name}>
                                    {entry.name}
                                  </strong>

                                  <span>{Math.round(entry.calories)}</span>

                                  <span>{Math.round(entry.protein)}g</span>

                                  <span>{Math.round(entry.carbs)}g</span>

                                  <span>{Math.round(entry.fat)}g</span>

                                  <div className="nutrition-page__food-actions">
                                    <button
                                      type="button"
                                      className="nutrition-page__food-edit"
                                      title="Edit food"
                                      aria-label={`Edit ${entry.name}`}
                                      onClick={() => openEdit(entry)}
                                    >
                                      <Pencil size={14} />
                                    </button>

                                    <button
                                      type="button"
                                      className="nutrition-page__food-delete"
                                      title="Delete food"
                                      aria-label={`Delete ${entry.name}`}
                                      onClick={() => setDeleteTarget(entry)}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* ======================================================
          DAILY TARGETS EDIT MODAL
      ====================================================== */}

      {goalsModalOpen && (
        <div
          className="nutrition-page__modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingGoals) {
              setGoalsModalOpen(false);
            }
          }}
        >
          <div
            className="nutrition-page__modal nutrition-page__goals-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nutrition-goals-title"
          >
            <div className="nutrition-page__modal-header">
              <div>
                <span>Nutrition Goals</span>
                <h2 id="nutrition-goals-title">Edit Daily Targets</h2>
              </div>

              <button
                type="button"
                aria-label="Close"
                disabled={savingGoals}
                onClick={() => setGoalsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGoals}>
              {goalsError && (
                <div className="nutrition-page__form-error" role="alert">
                  {goalsError}
                </div>
              )}

              <div className="nutrition-page__form-grid">
                {[
                  ["calories", "Calories (kcal)", "1"],
                  ["protein", "Protein (g)", "0.01"],
                  ["carbs", "Carbs (g)", "0.01"],
                  ["fat", "Fat (g)", "0.01"],
                ].map(([field, label, step]) => (
                  <label className="nutrition-page__field" key={field}>
                    <span>{label}</span>

                    <input
                      type="number"
                      min="0"
                      step={step}
                      required
                      value={goalsForm[field]}
                      disabled={savingGoals}
                      onChange={(event) =>
                        updateGoalField(field, event.target.value)
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="nutrition-page__modal-actions">
                <button
                  type="button"
                  className="button"
                  disabled={savingGoals}
                  onClick={() => setGoalsModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="button button--primary"
                  disabled={savingGoals}
                >
                  {savingGoals ? "Saving..." : "Save Targets"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          ADD / EDIT FOOD MODAL
      ====================================================== */}

      {modalOpen && (
        <div
          className="nutrition-page__modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false);
            }
          }}
        >
          <div
            className="nutrition-page__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nutrition-modal-title"
          >
            <div className="nutrition-page__modal-header">
              <div>
                <span>Nutrition Entry</span>

                <h2 id="nutrition-modal-title">
                  {editingId !== null ? "Edit Food" : "Add Food"}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close"
                disabled={saving}
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveFood}>
              {formError && (
                <div className="nutrition-page__form-error" role="alert">
                  {formError}
                </div>
              )}

              <div className="nutrition-page__form-grid">
                <label className="nutrition-page__field nutrition-page__field--full">
                  <span>Food / Meal Name</span>

                  <input
                    type="text"
                    maxLength={200}
                    required
                    autoFocus
                    placeholder="e.g. Chicken and rice"
                    value={form.name}
                    disabled={saving}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                  />
                </label>

                <label className="nutrition-page__field">
                  <span>Date</span>

                  <input
                    type="date"
                    required
                    value={form.date}
                    disabled={saving}
                    onChange={(event) =>
                      updateField("date", event.target.value)
                    }
                  />
                </label>

                <label className="nutrition-page__field">
                  <span>Meal</span>

                  <select
                    value={form.meal}
                    disabled={saving}
                    onChange={(event) =>
                      updateField("meal", event.target.value)
                    }
                  >
                    {MEALS.map((meal) => (
                      <option key={meal} value={meal}>
                        {meal}
                      </option>
                    ))}
                  </select>
                </label>

                {[
                  ["calories", "Calories", "1"],
                  ["protein", "Protein (g)", "0.01"],
                  ["carbs", "Carbs (g)", "0.01"],
                  ["fat", "Fat (g)", "0.01"],
                ].map(([field, label, step]) => (
                  <label className="nutrition-page__field" key={field}>
                    <span>{label}</span>

                    <input
                      type="number"
                      min="0"
                      step={step}
                      placeholder="0"
                      value={form[field]}
                      disabled={saving}
                      onChange={(event) =>
                        updateField(field, event.target.value)
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="nutrition-page__modal-actions">
                <button
                  type="button"
                  className="button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="button button--primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Save Changes"
                      : "Add Food"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          DELETE SINGLE FOOD MODAL
      ====================================================== */}

      {deleteTarget && (
        <div
          className="nutrition-page__modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            className="nutrition-page__modal nutrition-page__delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nutrition-delete-title"
          >
            <div className="nutrition-page__modal-header">
              <div>
                <span>Delete Food</span>
                <h2 id="nutrition-delete-title">Delete this entry?</h2>
              </div>

              <button
                type="button"
                aria-label="Close"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="nutrition-page__delete-body">
              <p>
                <strong>{deleteTarget.name}</strong> will be permanently
                deleted. This cannot be undone.
              </p>

              <div className="nutrition-page__modal-actions">
                <button
                  type="button"
                  className="button"
                  disabled={deleting}
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="button nutrition-page__delete-confirm"
                  disabled={deleting}
                  onClick={confirmDelete}
                >
                  <Trash2 size={15} />

                  {deleting ? "Deleting..." : "Delete Food"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          DELETE ENTIRE DAY MODAL
      ====================================================== */}

      {deleteDayTarget && (
        <div
          className="nutrition-page__modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteDayTarget(null);
            }
          }}
        >
          <div
            className="nutrition-page__modal nutrition-page__delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nutrition-delete-day-title"
          >
            <div className="nutrition-page__modal-header">
              <div>
                <span>Delete Nutrition Day</span>

                <h2 id="nutrition-delete-day-title">Delete this entire day?</h2>
              </div>

              <button
                type="button"
                aria-label="Close"
                disabled={deleting}
                onClick={() => setDeleteDayTarget(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="nutrition-page__delete-body">
              <p>
                All <strong>{(logs[deleteDayTarget] ?? []).length}</strong> food
                entries from <strong>{formatDate(deleteDayTarget)}</strong> will
                be permanently deleted, including all meals logged that day.
                This cannot be undone.
              </p>

              <div className="nutrition-page__modal-actions">
                <button
                  type="button"
                  className="button"
                  disabled={deleting}
                  onClick={() => setDeleteDayTarget(null)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="button nutrition-page__delete-confirm"
                  disabled={deleting}
                  onClick={confirmDeleteDay}
                >
                  <Trash2 size={15} />

                  {deleting ? "Deleting..." : "Delete Entire Day"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

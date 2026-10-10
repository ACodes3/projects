import { useEffect, useState } from "react";
import "../../assets/styles/modal.css";
import Toast from "../Toast/Toast";

const API_URL = import.meta.env.VITE_API_URL;

const EditModal = ({ isOpen, onClose, workoutId, onUpdate }) => {
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState({
    name: "",
    type: "Strength",
    date: "",
    duration_min: "",
    notes: "",
    exercises: [],
  });

  // ✅ Load workout details when modal opens
  useEffect(() => {
    if (!isOpen || !workoutId) return;

    const fetchWorkout = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_URL}/workouts/details/${workoutId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch workout");

        const base = data[0];
        setWorkout({
          name: base.name,
          type: base.type,
          date: new Date(base.date).toLocaleDateString("en-CA"),
          duration_min: base.workout_duration_min || "", // ✅ updated key
          notes: base.notes || "",
          exercises: data.map((ex) => ({
            exercise_name: ex.exercise_name || "",
            sets: ex.sets || "",
            reps: ex.reps || "",
            weight_kg: ex.weight_kg || "",
            duration_min: ex.exercise_duration_min || "", // ✅ updated key
          })),
        });
      } catch (err) {
        console.error("❌ Error fetching workout:", err);
        setToast({
          type: "error",
          title: "Load Failed",
          message: err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [isOpen, workoutId]);

  // ✅ Auto hide toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setWorkout({ ...workout, [e.target.name]: e.target.value });
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...workout.exercises];
    updated[index][field] = value;
    setWorkout({ ...workout, exercises: updated });
  };

  const addExercise = () => {
    setWorkout({
      ...workout,
      exercises: [
        ...workout.exercises,
        {
          exercise_name: "",
          sets: "",
          reps: "",
          weight_kg: "",
          duration_min: "",
        },
      ],
    });
  };

  const removeExercise = (i) => {
    const updated = workout.exercises.filter((_, idx) => idx !== i);
    setWorkout({ ...workout, exercises: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/workouts/${workoutId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(workout),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update workout");

      setToast({
        type: "success",
        title: "Workout Updated",
        message: "Your workout changes have been saved successfully!",
      });

      setTimeout(() => {
        onUpdate(); // refresh parent list
        onClose();
      }, 1200);
    } catch (err) {
      console.error("❌ Error updating workout:", err);
      setToast({
        type: "error",
        title: "Update Failed",
        message: err.message,
      });
    }
  };

  const renderExerciseFields = () =>
    workout.exercises.map((ex, i) => (
      <div key={i} className="exercise-row">
        <input
          type="text"
          placeholder="Exercise Name"
          value={ex.exercise_name}
          onChange={(e) =>
            handleExerciseChange(i, "exercise_name", e.target.value)
          }
          required
        />

        {workout.type === "Strength" ? (
          <>
            <input
              type="number"
              placeholder="Sets"
              value={ex.sets}
              onChange={(e) => handleExerciseChange(i, "sets", e.target.value)}
            />
            <input
              type="number"
              placeholder="Reps"
              value={ex.reps}
              onChange={(e) => handleExerciseChange(i, "reps", e.target.value)}
            />
            <input
              type="number"
              placeholder="Weight (kg)"
              value={ex.weight_kg}
              onChange={(e) =>
                handleExerciseChange(i, "weight_kg", e.target.value)
              }
            />
          </>
        ) : (
          <input
            type="number"
            placeholder="Duration (min)"
            value={ex.duration_min}
            onChange={(e) =>
              handleExerciseChange(i, "duration_min", e.target.value)
            }
          />
        )}

        {i > 0 && (
          <button
            type="button"
            className="remove-ex-btn"
            onClick={() => removeExercise(i)}
          >
            ✕
          </button>
        )}
      </div>
    ));

  return (
    <div className="modal-overlay" onClick={onClose}>
      {toast && (
        <div className="toast-wrapper">
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
          />
        </div>
      )}

      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <h2 className="modal-title">Edit Workout</h2>

        {loading ? (
          <p>Loading workout...</p>
        ) : (
          <form className="modal-form" onSubmit={handleSubmit}>
            <label>
              Workout Name
              <input
                type="text"
                name="name"
                value={workout.name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Type
              <select
                name="type"
                value={workout.type}
                onChange={handleChange}
                required
              >
                <option value="Strength">Strength</option>
                <option value="Cardio">Cardio</option>
                <option value="Yoga">Yoga</option>
                <option value="Flexibility">Flexibility</option>
              </select>
            </label>

            <label>
              Date
              <input
                type="date"
                name="date"
                value={workout.date}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Duration (optional)
              <input
                type="number"
                name="duration_min"
                value={workout.duration_min}
                onChange={handleChange}
                placeholder="e.g. 45"
              />
            </label>

            <label>
              Notes
              <textarea
                name="notes"
                value={workout.notes}
                onChange={handleChange}
                rows="3"
              />
            </label>

            <div className="exercise-section">
              <h4>Exercises</h4>
              {renderExerciseFields()}
              <button
                type="button"
                className="add-ex-btn"
                onClick={addExercise}
              >
                + Add Exercise
              </button>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn save">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditModal;

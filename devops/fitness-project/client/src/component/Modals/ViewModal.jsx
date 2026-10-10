import { useEffect, useState } from "react";
import { FaClock, FaDumbbell, FaStickyNote, FaTimes } from "react-icons/fa";
import "../../assets/styles/modal.css";

const API_URL = import.meta.env.VITE_API_URL;

const ViewModal = ({ isOpen, onClose, workoutId }) => {
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState(null);
  const [error, setError] = useState(null);

  // ✅ Fetch workout details from backend
  useEffect(() => {
    if (!isOpen || !workoutId) return;

    const fetchWorkout = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_URL}/workouts/details/${workoutId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load workout");
        setWorkout(data);
      } catch (err) {
        console.error("❌ Error fetching workout:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [isOpen, workoutId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content view-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        {loading ? (
          <p>Loading workout details...</p>
        ) : error ? (
          <p className="error-text">Error: {error}</p>
        ) : (
          <>
            <h2 className="modal-title">{workout[0]?.name || "Workout"}</h2>

            <div className="view-details">
              <p>
                <FaDumbbell className="view-icon" />{" "}
                <strong>Type:</strong> {workout[0]?.type}
              </p>
              <p>
                <FaClock className="view-icon" />{" "}
                <strong>Date:</strong>{" "}
                {new Date(workout[0]?.date).toLocaleDateString()}
              </p>
              {workout[0]?.duration_min && (
                <p>
                  <FaClock className="view-icon" />{" "}
                  <strong>Duration:</strong> {workout[0]?.duration_min} min
                </p>
              )}
              {workout[0]?.notes && (
                <p>
                  <FaStickyNote className="view-icon" />{" "}
                  <strong>Notes:</strong> {workout[0]?.notes}
                </p>
              )}
            </div>

            <div className="exercise-section">
              <h3>Exercises</h3>
              {workout.some((w) => w.exercise_name) ? (
                <table className="exercise-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Sets</th>
                      <th>Reps</th>
                      <th>Weight (kg)</th>
                      <th>Duration (min)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workout.map((ex, idx) => (
                      <tr key={idx}>
                        <td>{ex.exercise_name || "-"}</td>
                        <td>{ex.sets || "-"}</td>
                        <td>{ex.reps || "-"}</td>
                        <td>{ex.weight_kg || "-"}</td>
                        <td>{ex.duration_min || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No exercises logged for this workout.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewModal;

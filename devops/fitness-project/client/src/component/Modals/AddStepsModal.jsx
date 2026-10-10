import { useState } from "react";
import "../../assets/styles/modal.css";
import Toast from "../Toast/Toast";

const API_URL = import.meta.env.VITE_API_URL;

const AddStepsModal = ({ isOpen, onClose, onAdd }) => {
  const [form, setForm] = useState({
    step_date: new Date().toISOString().split("T")[0],
    steps_count: "",
    distance_km: "",
    calories_burned: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  if (!isOpen) return null;

  // Auto-hide toast
  if (toast) {
    setTimeout(() => setToast(null), 2500);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      if (!storedUser || !token) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch(
        `${API_URL}/steps/${storedUser.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add steps");

      setToast({
        type: "success",
        title: "Steps Added",
        message: "Your steps were logged successfully!",
      });

      setForm({
        step_date: new Date().toISOString().split("T")[0],
        steps_count: "",
        distance_km: "",
        calories_burned: "",
      });

      onAdd && onAdd(data.newSteps);
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error("Add steps failed:", err);
      setToast({
        type: "error",
        title: "Add Failed",
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      {toast && (
        <div className="toast-wrapper">
          <Toast type={toast.type} title={toast.title} message={toast.message} />
        </div>
      )}

      <div className="modal-content">
        <h2 className="modal-title">Add Daily Steps</h2>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Date
            <input
              type="date"
              name="step_date"
              value={form.step_date}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Steps Count
            <input
              type="number"
              name="steps_count"
              value={form.steps_count}
              onChange={handleChange}
              placeholder="e.g. 8500"
              required
            />
          </label>
          <label>
            Distance (km)
            <input
              type="number"
              name="distance_km"
              value={form.distance_km}
              onChange={handleChange}
              step="0.01"
              placeholder="e.g. 6.8"
            />
          </label>
          <label>
            Calories Burned
            <input
              type="number"
              name="calories_burned"
              value={form.calories_burned}
              onChange={handleChange}
              step="0.01"
              placeholder="e.g. 340"
            />
          </label>

          <div className="modal-actions">
            <button type="submit" className="btn save-btn" disabled={loading}>
              {loading ? "Saving..." : "Add Steps"}
            </button>
            <button
              type="button"
              className="btn cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStepsModal;

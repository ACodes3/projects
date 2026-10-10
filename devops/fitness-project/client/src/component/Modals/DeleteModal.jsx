import { useState } from "react";
import "../../assets/styles/modal.css";
import Toast from "../Toast/Toast";

const API_URL = import.meta.env.VITE_API_URL;

const DeleteModal = ({ isOpen, onClose, workoutId, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/workouts/${workoutId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete workout");

      setToast({
        type: "success",
        title: "Workout Deleted",
        message: "The workout has been removed successfully.",
      });

      // Delay to show toast before closing
      setTimeout(() => {
        onDelete(); // Refresh the workout list
        onClose();
      }, 1000);
    } catch (err) {
      console.error("❌ Error deleting workout:", err);
      setToast({
        type: "error",
        title: "Delete Failed",
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-hide toast
  if (toast) {
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      {toast && (
        <div className="toast-wrapper">
          <Toast type={toast.type} title={toast.title} message={toast.message} />
        </div>
      )}

      <div
        className="modal-content small"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">Delete Workout</h2>
        <p>Are you sure you want to delete this workout? This action cannot be undone.</p>

        <div className="modal-actions">
          <button
            type="button"
            className="btn cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn delete"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;

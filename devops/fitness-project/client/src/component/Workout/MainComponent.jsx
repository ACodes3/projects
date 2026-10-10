import { useEffect, useState } from "react";
import { FaEdit, FaEye, FaTrashAlt } from "react-icons/fa";
import "../../assets/styles/workout.css";
import AddStepsModal from "../Modals/AddStepsModal";
import DeleteModal from "../Modals/DeleteModal";
import EditModal from "../Modals/EditModal";
import Modal from "../Modals/Modal";
import ViewModal from "../Modals/ViewModal";

const API_URL = import.meta.env.VITE_API_URL;

const Workout = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingWorkout, setDeletingWorkout] = useState(null);
  const [isAddStepsOpen, setIsAddStepsOpen] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const itemsPerPage = 25;

  // Fetch workouts from backend
  const fetchWorkouts = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      if (!storedUser || !token) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch(
        `${API_URL}/workouts/${storedUser.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to fetch workouts");

      // Sort newest first
      const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setWorkouts(sorted);
      console.log("Fetched workout data:", data);
    } catch (err) {
      console.error("Error loading workouts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(workouts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = workouts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleView = (id) => {
    setSelectedWorkout(id);
    setIsViewModalOpen(true);
  };
  const handleEdit = (id) => {
    setEditingWorkout(id);
    setIsEditModalOpen(true);
  };
  const handleDelete = (id) => {
    setDeletingWorkout(id);
    setIsDeleteModalOpen(true);
  };

  const handleAddWorkout = (newWorkout) => {
    console.log("✅ New Workout Added:", newWorkout);
    setWorkouts((prev) => [newWorkout, ...prev]); // prepend new
  };

  if (loading) return <p>Loading workouts...</p>;
  if (error) return <p className="error-text">Error: {error}</p>;

  return (
    <div className="workout-container">
      <div className="workout-header">
        <h2 className="workout-title">Latest Workouts</h2>
        <div className="workout-top-buttons">
          <button
            className="add-workout-button"
            onClick={() => setIsModalOpen(true)}
          >
            Add Workout
          </button>
          <button
            className="add-workout-button"
            onClick={() => setIsAddStepsOpen(true)}
          >
            Add Steps
          </button>
        </div>
      </div>

      <table className="workout-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Workout Name</th>
            <th>Type</th>
            <th>Duration</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((workout, index) => (
            <tr key={workout.id}>
              <td>{startIndex + index + 1}</td>
              <td>{new Date(workout.date).toLocaleDateString()}</td>
              <td>{workout.name}</td>
              <td>{workout.type}</td>
              <td>{workout.duration_min} min</td>
              <td>
                <button
                  className="icon-button view"
                  title="View Details"
                  onClick={() => handleView(workout.id)}
                >
                  <FaEye />
                </button>
                <button
                  className="icon-button edit"
                  title="Edit Workout"
                  onClick={() => handleEdit(workout.id)}
                >
                  <FaEdit />
                </button>
                <button
                  className="icon-button delete"
                  title="Delete Workout"
                  onClick={() => handleDelete(workout.id)}
                >
                  <FaTrashAlt />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddWorkout}
      />
      <ViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        workoutId={selectedWorkout}
      />
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        workoutId={editingWorkout}
        onUpdate={fetchWorkouts}
      />
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        workoutId={deletingWorkout}
        onDelete={fetchWorkouts}
      />
      <AddStepsModal
        isOpen={isAddStepsOpen}
        onClose={() => setIsAddStepsOpen(false)}
        onAdd={() => console.log("Steps added!")}
      />

      {/* Pagination Controls */}
      <div className="pagination">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Workout;

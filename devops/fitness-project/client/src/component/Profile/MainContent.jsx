import { useEffect, useState } from "react";
import "../../assets/styles/profile.css";
import Toast from "../Toast/Toast";

const API_URL = import.meta.env.VITE_API_URL;

const MainContent = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");

        if (!storedUser || !token) {
          window.location.href = "/login";
          return;
        }

        const res = await fetch(
          `${API_URL}/profile/${storedUser.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch profile");

        setUser(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setToast({
          type: "error",
          title: "Load Failed",
          message: err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const calculateBMI = (weight, height) => {
    if (!weight || !height) return "-";
    const h = height / 100;
    return (weight / (h * h)).toFixed(1);
  };

  const handleEditToggle = () => setIsEditing(true);
  const handleCancel = () => setIsEditing(false);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const res = await fetch(
        `${API_URL}/profile/${storedUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(user),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");

      setToast({
        type: "success",
        title: "Profile Updated",
        message: "Your profile has been saved successfully!",
      });

      setIsEditing(false);
    } catch (err) {
      setToast({
        type: "error",
        title: "Save Failed",
        message: err.message,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: name === "weight_kg" || name === "height_cm" ? Number(value) : value,
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="profile-container">
      {toast && (
        <div className="toast-wrapper">
          <Toast type={toast.type} title={toast.title} message={toast.message} />
        </div>
      )}

      {/* Header */}
      <div className="profile-header">
        <div className="avatar-wrapper">
          <img
            src={user.avatar_url || "https://i.pravatar.cc/150"}
            alt="User Avatar"
            className="profile-avatar"
          />
        </div>
        <div>
          <h2>{user.name}</h2>
          <p>{user.role}</p>
          <p className="joined-date">
            Member since{" "}
            {new Date(user.joined_at).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Account Details */}
      <div className="profile-info-card">
        <h3>Account Details</h3>
        <form className="profile-form two-column-grid">
          <label>
            Full Name
            <input
              type="text"
              name="name"
              value={user.name || ""}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={user.email || ""}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </label>
          <label>
            Fitness Level
            <input
              type="text"
              name="role"
              value={user.role || ""}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </label>
          <label>
            Location
            <input
              type="text"
              name="location"
              value={user.location || ""}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </label>
        </form>
      </div>

      {/* Fitness Info */}
      <div className="profile-info-card">
        <h3>Fitness Information</h3>
        <form className="profile-form two-column-grid">
          <label>
            Weight (kg)
            <input
              type="number"
              name="weight_kg"
              value={user.weight_kg || ""}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </label>
          <label>
            Height (cm)
            <input
              type="number"
              name="height_cm"
              value={user.height_cm || ""}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </label>
          <label>
            BMI
            <input
              type="text"
              value={calculateBMI(user.weight_kg, user.height_cm)}
              disabled
              readOnly
            />
          </label>
          <label>
            Goal
            <input
              type="text"
              name="goal"
              value={user.goal || ""}
              disabled={!isEditing}
              onChange={handleChange}
            />
          </label>
        </form>
      </div>

      {/* Buttons */}
      <div className="profile-actions">
        {isEditing ? (
          <>
            <button className="btn save-btn" onClick={handleSave}>
              Save Changes
            </button>
            <button className="btn cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </>
        ) : (
          <button className="btn edit-btn" onClick={handleEditToggle}>
            Edit Profile
          </button>
        )}
        <button className="btn logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default MainContent;

import { useEffect, useState } from "react";
import "../../assets/styles/body.css";
import "../../assets/styles/settings.css";
import { applyTheme } from "../../utils/theme";
import Toast from "../Toast/Toast"; // ✅ Import toast

const API_URL = import.meta.env.VITE_API_URL;

const MainComponent = () => {
  const [settings, setSettings] = useState({
    username: "",
    email: "",
    language: "English",
    theme: "Light",
    emailAlerts: true,
    smsNotifications: false,
  });

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null); // ✅ Toast state

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");

        if (!storedUser || !token) {
          window.location.href = "/login";
          return;
        }

        const res = await fetch(
          `${API_URL}/settings/${storedUser.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();

        if (res.ok && data) {
          setSettings({
            username: storedUser.name,
            email: storedUser.email,
            language:
              data.language === "en"
                ? "English"
                : data.language === "es"
                ? "Spanish"
                : data.language === "fr"
                ? "French"
                : "English",
            theme:
              data.theme?.toLowerCase() === "dark"
                ? "Dark"
                : data.theme?.toLowerCase() === "system"
                ? "System Default"
                : "Light",
            emailAlerts: data.notifications?.emailAlerts ?? true,
            smsNotifications: data.notifications?.smsNotifications ?? false,
          });

          applyTheme(data.theme || "Light");
        } else {
          throw new Error(data.error || "Failed to fetch settings");
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        setToast({
          type: "error",
          title: "Load Failed",
          message: err.message || "Could not fetch settings",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setSettings((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (name === "theme") {
      applyTheme(newValue);
    }
  };

  const handleSave = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_URL}/settings/${storedUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            theme: settings.theme,
            language: settings.language,
            notifications: {
              emailAlerts: settings.emailAlerts,
              smsNotifications: settings.smsNotifications,
            },
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      setToast({
        type: "success",
        title: "Settings Updated",
        message: "Your preferences were saved successfully!",
      });

      setIsEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
      setToast({
        type: "error",
        title: "Save Failed",
        message: err.message,
      });
    }
  };

  if (loading) return <p>Loading settings...</p>;

  return (
    <div className="settings-container">
      {/* ✅ Toast Display */}
      {toast && (
        <div className="toast-wrapper">
          <Toast type={toast.type} title={toast.title} message={toast.message} />
        </div>
      )}

      <h2 className="settings-title">Settings</h2>

      {/* Account Settings */}
      <section className="settings-section">
        <h3>Account Information</h3>
        <div className="form-grid">
          <label>
            Username
            <input type="text" name="username" value={settings.username} disabled />
          </label>
          <label>
            Email
            <input type="email" name="email" value={settings.email} disabled />
          </label>
        </div>
      </section>

      {/* Preferences */}
      <section className="settings-section">
        <h3>Preferences</h3>
        <div className="form-grid">
          <label>
            Language
            <select
              name="language"
              value={settings.language}
              onChange={handleChange}
              disabled={!isEditing}
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </label>
          <label>
            Theme
            <select
              name="theme"
              value={settings.theme}
              onChange={handleChange}
              disabled={!isEditing}
            >
              <option>Light</option>
              <option>Dark</option>
              <option>System Default</option>
            </select>
          </label>
        </div>
      </section>

      {/* Notifications */}
      <section className="settings-section">
        <h3>Notifications</h3>
        <div className="toggle-group">
          <label className="toggle">
            <input
              type="checkbox"
              name="emailAlerts"
              checked={settings.emailAlerts}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <span className="slider"></span>
            Email Alerts
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              name="smsNotifications"
              checked={settings.smsNotifications}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <span className="slider"></span>
            SMS Notifications
          </label>
        </div>
      </section>

      {/* Buttons */}
      <div className="settings-actions">
        {isEditing ? (
          <>
            <button className="btn save-btn" onClick={handleSave}>
              Save Changes
            </button>
            <button
              className="btn cancel-btn"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <button className="btn save-btn" onClick={() => setIsEditing(true)}>
            Edit Settings
          </button>
        )}
      </div>
    </div>
  );
};

export default MainComponent;

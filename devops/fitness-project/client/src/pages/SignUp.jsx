import { useState } from "react";
import "../assets/styles/login.css";
import Toast from "../component/Toast/Toast";

const API_URL = import.meta.env.VITE_API_URL;

const Signup = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    weight_kg: "",
    height_cm: "",
    goal: "",
    role: "",
    location: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setToast({
        type: "warning",
        title: "Missing Information",
        message: "Please fill out all fields before continuing.",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setToast({
        type: "error",
        title: "Password Mismatch",
        message: "Passwords do not match.",
      });
      return;
    }

    setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/users/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      // ✅ Save user + token
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setToast({
        type: "success",
        title: "Signup Successful",
        message: "Welcome to your fitness journey!",
      });

      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      console.error("Signup failed:", err);
      setToast({
        type: "error",
        title: "Signup Failed",
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {toast && (
        <div className="toast-wrapper">
          <Toast type={toast.type} title={toast.title} message={toast.message} />
        </div>
      )}

      <form
        className="login-form"
        onSubmit={step === 1 ? handleNext : handleSubmit}
      >
        <h2 className="login-title">
          {step === 1 ? "Create Account" : "Your Fitness Profile"}
        </h2>
        <p className="step-indicator">Step {step} of 2</p>

        {step === 1 ? (
          <>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
              />
            </div>

            <button type="submit" className="login-button">
              Next →
            </button>

            <p className="signup-text">
              Already have an account? <a href="/login">Log in</a>
            </p>
          </>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="weight_kg">Weight (kg)</label>
              <input
                type="number"
                id="weight_kg"
                name="weight_kg"
                value={form.weight_kg}
                onChange={handleChange}
                placeholder="e.g. 70"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="height_cm">Height (cm)</label>
              <input
                type="number"
                id="height_cm"
                name="height_cm"
                value={form.height_cm}
                onChange={handleChange}
                placeholder="e.g. 175"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="goal">Fitness Goal</label>
              <select
                id="goal"
                name="goal"
                value={form.goal}
                onChange={handleChange}
                required
              >
                <option value="">Select a goal</option>
                <option value="Lose Weight">Lose Weight</option>
                <option value="Build Muscle">Build Muscle</option>
                <option value="Improve Endurance">Improve Endurance</option>
                <option value="Stay Fit">Stay Fit</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="role">Fitness Level</label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="">Select level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. New York, USA"
                required
              />
            </div>

            <div className="button-group">
              <button type="button" className="btn cancel-btn" onClick={handleBack}>
                ← Back
              </button>
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Creating..." : "Sign Up"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default Signup;

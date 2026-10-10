import { useState } from "react";
import "../assets/styles/login.css";
import Toast from "../component/Toast/Toast";

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save token and user in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Show success toast
      setToast({
        type: "success",
        title: "Welcome!",
        message: `Hello, ${data.user.name}. Redirecting...`,
      });

      // Redirect after short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      // Show error toast
      setToast({
        type: "error",
        title: "Login Failed",
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Toast */}
      {toast && (
        <div className="toast-wrapper">
          <Toast type={toast.type} title={toast.title} message={toast.message} />
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-title">Login</h2>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="signup-text">
          Don’t have an account? <a href="/sign-up">Sign up</a>
        </p>
      </form>
    </div>
  );
};

export default Login;

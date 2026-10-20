import { useState } from "react";
import {
  Snowflake,
  User,
  LockKeyhole,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

import { authApi } from "../services/api";
import "./LoginPage.css";

function LoginPage({ onLogin }) {
  const [identity, setIdentity] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (status !== "idle") return;

    if (!identity.trim() || !accessKey) {
      setError("Enter your Imperial ID and access key.");
      return;
    }

    setError("");
    setStatus("verifying");

    try {
      const response = await authApi.login(identity.trim(), accessKey);

      if (!response?.success || !response?.data?.user) {
        throw new Error("Authentication failed.");
      }

      setStatus("accepted");

      // Only navigate after the backend confirms login.
      onLogin?.(response.data.user);
    } catch (err) {
      setError(err?.message || "Unable to contact the Imperial network.");
      setStatus("idle");
    }
  };

  const buttonText = {
    idle: "Enter the Palace",
    verifying: "Verifying Clearance...",
    accepted: "Clearance Accepted",
  };

  return (
    <main className="login-page">
      {/* BACKGROUND IMAGE */}
      <div className="login-page__background">
        <img src="/images/bg-image.png" alt="" draggable="false" />

        <div className="login-page__background-shade" />
        <div className="login-page__background-vignette" />
      </div>

      {/* SNOW */}
      <div className="login-page__snow login-page__snow--one" />
      <div className="login-page__snow login-page__snow--two" />

      {/* TOP BAR */}
      <header className="login-page__topbar">
        <div className="login-page__brand">
          <span className="login-page__brand-symbol">
            <Snowflake size={27} strokeWidth={1.35} />
          </span>

          <div>
            <strong>Crown of Winter</strong>
            <span>Winter Palace</span>
          </div>
        </div>

        <div className="login-page__network">
          <span className="login-page__network-dot" />

          <span>Cryo Network // Online</span>
        </div>
      </header>

      {/* MAIN */}
      <section className="login-page__hero">
        <div className="login-page__content">
          <span className="login-page__eyebrow">By Order of Her Majesty</span>

          <h1>
            Winter
            <span>Palace</span>
          </h1>

          <h2>Imperial Command</h2>

          <div className="login-page__ornament">
            <span />
            <Snowflake size={13} strokeWidth={1} />
            <span />
          </div>

          <p className="login-page__description">
            Enter the restricted command network of the Crown of Snezhnaya.
            Imperial clearance is required beyond this point.
          </p>

          {/* LOGIN PANEL */}
          <form className="login-page__form" onSubmit={handleSubmit}>
            <div className="login-page__form-decoration">
              <span />
              <Snowflake size={15} strokeWidth={1} />
              <span />
            </div>

            <label className="login-page__field">
              <span className="login-page__field-label">
                <User size={13} />
                Imperial ID
              </span>

              <input
                type="text"
                value={identity}
                onChange={(event) => setIdentity(event.target.value)}
                disabled={status !== "idle"}
                placeholder="Username or email"
                autoComplete="username"
                required
              />
            </label>

            <label className="login-page__field">
              <span className="login-page__field-label">
                <LockKeyhole size={13} />
                Access Key
              </span>

              <div className="login-page__password">
                <input
                  type={showPassword ? "text" : "password"}
                  value={accessKey}
                  onChange={(event) => setAccessKey(event.target.value)}
                  disabled={status !== "idle"}
                  placeholder="Enter access key"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="login-page__password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            {error && (
              <p
                role="alert"
                aria-live="polite"
                style={{
                  color: "#ffb4b4",
                  fontSize: "0.85rem",
                  textAlign: "center",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className={`login-page__submit ${
                status === "accepted" ? "login-page__submit--accepted" : ""
              }`}
              disabled={status !== "idle"}
            >
              <span>{buttonText[status]}</span>

              {status === "idle" && <ArrowRight size={17} />}

              {status === "verifying" && (
                <Snowflake className="login-page__spinner" size={17} />
              )}

              {status === "accepted" && <Snowflake size={17} />}
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="login-page__footer">
        <span>Property of the Crown of Snezhnaya</span>

        <span className="login-page__footer-center">
          <Snowflake size={10} />
          Authorized Personnel Only
          <Snowflake size={10} />
        </span>

        <span>Winter Palace // 01</span>
      </footer>
    </main>
  );
}

export default LoginPage;

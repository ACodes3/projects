import {
  LayoutDashboard,
  Crown,
  Castle,
  Map,
  Users,
  FileText,
  Gem,
  Archive,
  Settings,
  Snowflake,
  ArrowLeftRight,
} from "lucide-react";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { authApi } from "../services/api";
import { accessApi } from "../services/accessApi";

import "./AppShell.css";

const navigation = [
  {
    label: "Imperial Command",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "The Tsaritsa",
    path: "/tsaritsa",
    icon: Crown,
  },
  {
    label: "Palace",
    path: "/palace",
    icon: Castle,
  },
  {
    label: "War Table",
    path: "/war-table",
    icon: Map,
  },
  {
    label: "Harbingers",
    path: "/harbingers",
    icon: Users,
  },
  {
    label: "Intelligence",
    path: "/intelligence",
    icon: FileText,
  },
  {
    label: "Project: Gnoses",
    path: "/gnoses",
    icon: Gem,
  },
  {
    label: "Relic Vault",
    path: "/relic-vault",
    icon: Archive,
  },
];

function AppShell({ user, onLogout }) {
  const navigate = useNavigate();
  const { worldId } = useParams();
  const worldBase = worldId ? `/worlds/${worldId}` : "/worlds";
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const [identity, setIdentity] = useState({
    worldId: null,
    status: "loading",
    character: null,
    message: "",
  });

  useEffect(() => {
    let cancelled = false;

    if (!worldId)
      return () => {
        cancelled = true;
      };

    accessApi
      .getMyPermissions(worldId)
      .then((response) => {
        if (cancelled) return;
        setIdentity({
          worldId,
          status: "ready",
          character: response?.data?.character ?? null,
          message: "",
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setIdentity({
          worldId,
          status: error?.status === 403 ? "unassigned" : "error",
          character: null,
          message: error?.message || "Could not load character identity.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [worldId]);

  const currentIdentity =
    identity.worldId === worldId
      ? identity
      : { status: "loading", character: null, message: "" };

  const roleNames = {
    SOVEREIGN: "Sovereign",
    HARBINGER: "Fatui Harbinger",
    AGENT: "Fatui Agent",
    DIRECTOR: "Director",
    INTELLIGENCE_OFFICER: "Intelligence Officer",
    PALACE_ADMIN: "Palace Administrator",
    PALACE_STAFF: "Palace Staff",
    RESEARCH_DIRECTOR: "Research Director",
    RESEARCHER: "Researcher",
  };
  const roleLabel = currentIdentity.character?.roles
    ?.map((code) => roleNames[code] || code)
    .join(" · ");

  async function handleLogout() {
    if (loggingOut) return;

    setLogoutError("");
    setLoggingOut(true);

    try {
      await authApi.logout();
      onLogout();
      navigate("/", { replace: true });
    } catch (error) {
      setLogoutError(error?.message || "Could not sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="app-shell__brand">
          <Snowflake size={28} strokeWidth={1.3} />

          <div>
            <strong>Crown of Winter</strong>
            <span>Winter Palace</span>
          </div>
        </div>

        <nav className="app-shell__nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={`${worldBase}${item.path}`}
                className={({ isActive }) =>
                  `app-shell__nav-item ${
                    isActive ? "app-shell__nav-item--active" : ""
                  }`
                }
              >
                <Icon size={17} strokeWidth={1.4} />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="app-shell__sidebar-bottom">
          <NavLink to="/worlds" className="app-shell__nav-item">
            <ArrowLeftRight size={17} strokeWidth={1.4} />
            <span>Switch World</span>
          </NavLink>

          <NavLink
            to={`${worldBase}/system`}
            className={({ isActive }) =>
              `app-shell__nav-item ${
                isActive ? "app-shell__nav-item--active" : ""
              }`
            }
          >
            <Settings size={17} strokeWidth={1.4} />

            <span>System</span>
          </NavLink>

          <button
            type="button"
            className="app-shell__nav-item"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              textAlign: "left",
              cursor: loggingOut ? "wait" : "pointer",
            }}
          >
            <LogOut size={17} strokeWidth={1.4} />
            <span>{loggingOut ? "Signing Out..." : "Sign Out"}</span>
          </button>

          {logoutError && (
            <p
              role="alert"
              style={{
                color: "#ffb4b4",
                fontSize: "0.8rem",
                padding: "0 1rem",
              }}
            >
              {logoutError}
            </p>
          )}
        </div>
      </aside>

      <section className="app-shell__main">
        <header className="app-shell__topbar">
          <div className="app-shell__topbar-heading">
            <span className="app-shell__topbar-label">Imperial Network</span>
            <strong>Winter Palace Command</strong>
          </div>

          <div className="app-shell__topbar-right">
            <div className="app-shell__identity" aria-live="polite">
              <div className="app-shell__identity-icon">
                <Crown size={19} strokeWidth={1.3} />
              </div>

              <div className="app-shell__identity-info">
                {currentIdentity.status === "loading" && (
                  <span>Verifying character identity...</span>
                )}

                {currentIdentity.status === "ready" &&
                  currentIdentity.character && (
                    <>
                      <strong>{currentIdentity.character.name}</strong>
                      <span>
                        {[roleLabel, user?.username]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </>
                  )}

                {currentIdentity.status === "ready" &&
                  !currentIdentity.character && (
                    <span>Character identity unavailable</span>
                  )}

                {currentIdentity.status === "unassigned" && (
                  <>
                    <strong>Awaiting Character Assignment</strong>
                    {user?.username && <span>{user.username}</span>}
                  </>
                )}

                {currentIdentity.status === "error" && (
                  <>
                    <strong>Character identity unavailable</strong>
                    {user?.username && <span>{user.username}</span>}
                  </>
                )}
              </div>
            </div>

            <div className="app-shell__status">
              <span className="app-shell__status-dot" />
              Cryo Network // Online
            </div>
          </div>
        </header>

        <div className="app-shell__content">
          <Outlet />
        </div>
      </section>
    </div>
  );
}

export default AppShell;

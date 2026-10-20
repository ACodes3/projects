import { useCallback, useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";

import { authApi } from "./services/api";
import { worldApi } from "./services/worldApi";

import LoginPage from "./pages/LoginPage";
import WorldSelectionPage from "./pages/WorldSelectionPage";
import DashboardPage from "./pages/DashboardPage";
import TsaritsaPage from "./pages/TsaritsaPage";
import PalacePage from "./pages/PalacePage";
import WarTablePage from "./pages/WarTablePage";
import HarbingersPage from "./pages/HarbingersPage";
import IntelligencePage from "./pages/IntelligencePage";
import GnosesPage from "./pages/GnosesPage";
import RelicVaultPage from "./pages/RelicVaultPage";
import SystemPage from "./pages/SystemPage";

import ThroneChamberPage from "./pages/palace/ThroneChamberPage";
import WarChamberPage from "./pages/palace/WarChamberPage";
import HarbingerHallPage from "./pages/palace/HarbingerHallPage";
import ImperialArchivesPage from "./pages/palace/ImperialArchivesPage";
import RelicVaultChamberPage from "./pages/palace/RelicVaultChamberPage";
import CryoLaboratoryPage from "./pages/palace/CryoLaboratoryPage";
import GnosisChamberPage from "./pages/palace/GnosisChamberPage";
import RoyalRecordsPage from "./pages/palace/RoyalRecordsPage";

import AppShell from "./components/AppShell";

function AuthLoading({ message = "Verifying Imperial Clearance..." }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#091321",
        color: "#dceaf5",
        fontFamily: "inherit",
        textAlign: "center",
      }}
    >
      <div>
        <h2>Crown of Winter</h2>
        <p>{message}</p>
      </div>
    </main>
  );
}

function ProtectedRoute({ user, checkingSession }) {
  if (checkingSession) return <AuthLoading />;
  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
}

function LoginRoute({ user, checkingSession, onLogin }) {
  const navigate = useNavigate();

  if (checkingSession) return <AuthLoading />;
  if (user) return <Navigate to="/worlds" replace />;

  return (
    <LoginPage
      onLogin={(authenticatedUser) => {
        onLogin(authenticatedUser);
        navigate("/worlds", { replace: true });
      }}
    />
  );
}

function WorldSelectionRoute() {
  const navigate = useNavigate();

  return (
    <WorldSelectionPage
      onSelectWorld={(world) => {
        if (!world?.id) return;
        navigate(`/worlds/${encodeURIComponent(world.id)}/dashboard`);
      }}
    />
  );
}

// A world URL is accessible only after the backend confirms active membership.
function WorldGuard() {
  const { worldId } = useParams();
  const [state, setState] = useState({
    status: "loading",
    error: "",
    requestKey: null,
  });
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${worldId}:${attempt}`;

  useEffect(() => {
    let active = true;

    worldApi
      .getById(worldId)
      .then((response) => {
        if (!active) return;
        if (response?.data?.world) {
          setState({ status: "ready", error: "", requestKey });
        } else {
          setState({
            status: "error",
            error: "Invalid world response.",
            requestKey,
          });
        }
      })
      .catch((error) => {
        if (!active) return;
        if (
          error?.status === 401 ||
          error?.status === 403 ||
          error?.status === 404
        ) {
          setState({ status: "unavailable", error: "", requestKey });
        } else {
          setState({
            status: "error",
            error: error?.message || "Unable to load world.",
            requestKey,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [worldId, attempt, requestKey]);

  if (state.status === "loading" || state.requestKey !== requestKey) {
    return <AuthLoading message="Verifying World Membership..." />;
  }
  if (state.status === "unavailable") {
    return <Navigate to="/worlds" replace />;
  }
  if (state.status === "error") {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#091321",
          color: "#dceaf5",
          textAlign: "center",
        }}
      >
        <div>
          <h2>World Unavailable</h2>
          <p role="alert">{state.error}</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>
            Try Again
          </button>
        </div>
      </main>
    );
  }
  return <Outlet />;
}

function ShellRoute({ user, onLogout }) {
  return <AppShell user={user} onLogout={onLogout} />;
}

function PalaceRoutes() {
  return (
    <>
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="tsaritsa" element={<TsaritsaPage />} />
      <Route path="palace" element={<PalacePage />} />
      <Route path="war-table" element={<WarTablePage />} />
      <Route path="harbingers" element={<HarbingersPage />} />
      <Route path="intelligence" element={<IntelligencePage />} />
      <Route path="gnoses" element={<GnosesPage />} />
      <Route path="relic-vault" element={<RelicVaultPage />} />
      <Route path="system" element={<SystemPage />} />
      <Route path="palace/throne" element={<ThroneChamberPage />} />
      <Route path="palace/war" element={<WarChamberPage />} />
      <Route path="palace/harbingers" element={<HarbingerHallPage />} />
      <Route path="palace/archives" element={<ImperialArchivesPage />} />
      <Route path="palace/relic-vault" element={<RelicVaultChamberPage />} />
      <Route path="palace/cryo-laboratory" element={<CryoLaboratoryPage />} />
      <Route path="palace/gnosis" element={<GnosisChamberPage />} />
      <Route path="palace/royal-records" element={<RoyalRecordsPage />} />
    </>
  );
}

function AppRoutes() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const checkId = useRef(0);

  const verifySession = useCallback(async () => {
    const id = ++checkId.current;
    setCheckingSession(true);
    try {
      const response = await authApi.me();
      if (id === checkId.current) setUser(response?.data?.user ?? null);
    } catch {
      if (id === checkId.current) setUser(null);
    } finally {
      if (id === checkId.current) setCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(verifySession, 0);
    return () => clearTimeout(timeoutId);
  }, [location.key, verifySession]);

  useEffect(() => {
    function handlePageShow(event) {
      if (event.persisted) verifySession();
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [verifySession]);

  function handleLogin(authenticatedUser) {
    ++checkId.current;
    setUser(authenticatedUser);
    setCheckingSession(false);
  }

  function handleLogout() {
    ++checkId.current;
    setUser(null);
    setCheckingSession(false);
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LoginRoute
            user={user}
            checkingSession={checkingSession}
            onLogin={handleLogin}
          />
        }
      />
      <Route
        element={
          <ProtectedRoute user={user} checkingSession={checkingSession} />
        }
      >
        <Route path="/worlds" element={<WorldSelectionRoute />} />

        <Route path="/worlds/:worldId" element={<WorldGuard />}>
          <Route element={<ShellRoute user={user} onLogout={handleLogout} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            {PalaceRoutes()}
          </Route>
        </Route>

      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

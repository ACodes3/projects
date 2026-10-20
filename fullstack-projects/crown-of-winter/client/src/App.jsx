import { useCallback, useEffect, useRef, useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { authApi } from "./services/api";

import LoginPage from "./pages/LoginPage";
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

function AuthLoading() {
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
        <p>Verifying Imperial Clearance...</p>
      </div>
    </main>
  );
}

function ProtectedRoute({ user, checkingSession, onLogout }) {
  if (checkingSession) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <AppShell user={user} onLogout={onLogout} />;
}

function LoginRoute({ user, checkingSession, onLogin }) {
  const navigate = useNavigate();

  if (checkingSession) {
    return <AuthLoading />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <LoginPage
      onLogin={(authenticatedUser) => {
        onLogin(authenticatedUser);
        navigate("/dashboard", { replace: true });
      }}
    />
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
      if (id === checkId.current) {
        setUser(response?.data?.user ?? null);
      }
    } catch {
      if (id === checkId.current) {
        setUser(null);
      }
    } finally {
      if (id === checkId.current) {
        setCheckingSession(false);
      }
    }
  }, []);

  // Revalidate on initial load and browser history navigation.
  useEffect(() => {
    const timer = window.setTimeout(verifySession, 0);
    return () => window.clearTimeout(timer);
  }, [location.key, verifySession]);

  // Browsers may restore an earlier page from their back-forward cache.
  useEffect(() => {
    function handlePageShow(event) {
      if (event.persisted) {
        verifySession();
      }
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
    // Invalidate any earlier /me response that might arrive after logout.
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
          <ProtectedRoute
            user={user}
            checkingSession={checkingSession}
            onLogout={handleLogout}
          />
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tsaritsa" element={<TsaritsaPage />} />
        <Route path="/palace" element={<PalacePage />} />
        <Route path="/war-table" element={<WarTablePage />} />
        <Route path="/harbingers" element={<HarbingersPage />} />
        <Route path="/intelligence" element={<IntelligencePage />} />
        <Route path="/gnoses" element={<GnosesPage />} />
        <Route path="/relic-vault" element={<RelicVaultPage />} />
        <Route path="/system" element={<SystemPage />} />

        <Route path="/palace/throne" element={<ThroneChamberPage />} />
        <Route path="/palace/war" element={<WarChamberPage />} />
        <Route path="/palace/harbingers" element={<HarbingerHallPage />} />
        <Route path="/palace/archives" element={<ImperialArchivesPage />} />
        <Route path="/palace/relic-vault" element={<RelicVaultChamberPage />} />
        <Route
          path="/palace/cryo-laboratory"
          element={<CryoLaboratoryPage />}
        />
        <Route path="/palace/gnosis" element={<GnosisChamberPage />} />
        <Route path="/palace/royal-records" element={<RoyalRecordsPage />} />
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


import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import AppShell from './components/AppShell';

import CalendarPage from './pages/CalendarPage';
import DashboardPage from './pages/DashboardPage';
import LibraryPage from './pages/LibraryPage';
import NutritionPage from './pages/NutritionPage';
import ProfilePage from './pages/ProfilePage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import StartPage from './pages/StartPage';
import WorkoutSessionPage from './pages/WorkoutSessionPage';
import WorkoutsPage from './pages/WorkoutsPage';

/* =========================================
   ENTRY GUARD
========================================= */

function RequireEntry() {
  const entered =
    sessionStorage.getItem(
      'forge:entered',
    ) === 'true';

  if (!entered) {
    return (
      <Navigate
        to="/start"
        replace
      />
    );
  }

  return <AppShell />;
}

/* =========================================
   APP
========================================= */

export default function App() {
  return (
    <Routes>

      {/* ===================================
          START PAGE
      =================================== */}

      <Route
        path="/start"
        element={<StartPage />}
      />

      {/* ===================================
          FORGE APP
      =================================== */}

      <Route element={<RequireEntry />}>

        <Route
          path="/"
          element={<DashboardPage />}
        />

        <Route
          path="/workouts"
          element={<WorkoutsPage />}
        />

        <Route
          path="/workouts/session"
          element={<WorkoutSessionPage />}
        />

        <Route
          path="/workouts/:id/edit"
          element={<WorkoutSessionPage />}
        />

        <Route
          path="/nutrition"
          element={<NutritionPage />}
        />

        <Route
          path="/calendar"
          element={<CalendarPage />}
        />

        <Route
          path="/progress"
          element={<ProgressPage />}
        />

        <Route
          path="/library"
          element={<LibraryPage />}
        />

        <Route
          path="/profile"
          element={<ProfilePage />}
        />

        <Route
          path="/settings"
          element={<SettingsPage />}
        />

      </Route>

      {/* ===================================
          FALLBACK
      =================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/start"
            replace
          />
        }
      />

    </Routes>
  );
}

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import AppShell from './components/AppShell';

import DashboardPage from './pages/DashboardPage';

/* =========================================
   TEMPORARY PLACEHOLDER PAGES

   We will replace these one by one with
   proper page components as we build them.
========================================= */

function WorkoutsPage() {
  return (
    <main className="page">

      <div className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            Training
          </span>

          <h1 className="page__title">
            Workouts
          </h1>

          <p className="page__description">
            Build routines, track exercises and log your sessions.
          </p>

        </div>

      </div>

    </main>
  );
}

function NutritionPage() {
  return (
    <main className="page">

      <div className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            Daily Intake
          </span>

          <h1 className="page__title">
            Nutrition
          </h1>

          <p className="page__description">
            Track calories, protein, carbohydrates and fats.
          </p>

        </div>

      </div>

    </main>
  );
}

function ProgressPage() {
  return (
    <main className="page">

      <div className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            Performance
          </span>

          <h1 className="page__title">
            Progress
          </h1>

          <p className="page__description">
            Follow changes in body weight, strength and training volume.
          </p>

        </div>

      </div>

    </main>
  );
}

function LibraryPage() {
  return (
    <main className="page">

      <div className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            Database
          </span>

          <h1 className="page__title">
            Library
          </h1>

          <p className="page__description">
            Manage reusable exercises and foods.
          </p>

        </div>

      </div>

    </main>
  );
}

function SettingsPage() {
  return (
    <main className="page">

      <div className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            Preferences
          </span>

          <h1 className="page__title">
            Settings
          </h1>

          <p className="page__description">
            Configure your goals, units and nutrition targets.
          </p>

        </div>

      </div>

    </main>
  );
}

/* =========================================
   APP
========================================= */

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route element={<AppShell />}>

          <Route
            path="/"
            element={<DashboardPage />}
          />

          <Route
            path="/workouts"
            element={<WorkoutsPage />}
          />

          <Route
            path="/nutrition"
            element={<NutritionPage />}
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
            path="/settings"
            element={<SettingsPage />}
          />

        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
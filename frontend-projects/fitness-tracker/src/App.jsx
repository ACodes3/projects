import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/AppShell";

import DashboardPage from "./pages/DashboardPage";
import LibraryPage from "./pages/LibraryPage";
import WorkoutsPage from "./pages/WorkoutsPage";
import WorkoutSessionPage from "./pages/WorkoutSessionPage";
import NutritionPage from './pages/NutritionPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';


/* =========================================
   APP
========================================= */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />

          <Route path="/workouts" element={<WorkoutsPage />} />

          <Route path="/workouts/session" element={<WorkoutSessionPage />} />

          <Route path="/nutrition" element={<NutritionPage />} />

          <Route path="/progress" element={<ProgressPage />} />

          <Route path="/library" element={<LibraryPage />} />

          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

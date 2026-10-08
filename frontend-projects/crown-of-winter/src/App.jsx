import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TsaritsaPage from './pages/TsaritsaPage';
import PalacePage from './pages/PalacePage';
import WarTablePage from './pages/WarTablePage';
import HarbingersPage from './pages/HarbingersPage';
import IntelligencePage from './pages/IntelligencePage';
import GnosesPage from './pages/GnosesPage';
import RelicVaultPage from './pages/RelicVaultPage';
import AppShell from './components/AppShell';

function LoginRoute() {
  const navigate = useNavigate();

  return (
    <LoginPage
      onLogin={() => navigate('/dashboard')}
    />
  );
}

function PlaceholderPage({ title }) {
  return (
    <div
      style={{
        minHeight: '100%',
        display: 'grid',
        placeItems: 'center',
        color: '#dceef7',
        fontFamily: 'Georgia, serif',
        letterSpacing: '0.08em',
      }}
    >
      {title}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<LoginRoute />}
        />

        <Route element={<AppShell />}>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/tsaritsa"
            element={<TsaritsaPage />}
          />

          <Route
            path="/palace"
            element={<PalacePage />}
          />

          <Route
            path="/war-table"
            element={<WarTablePage />}
          />

          <Route
            path="/harbingers"
            element={<HarbingersPage />}
          />

          <Route
            path="/intelligence"
            element={<IntelligencePage />}
          />

          <Route
            path="/gnoses"
            element={<GnosesPage />}
          />

          <Route
            path="/relic-vault"
            element={<RelicVaultPage />}
          />

          <Route
            path="/system"
            element={<PlaceholderPage title="System" />}
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
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
            element={<PlaceholderPage title="Palace of Ice" />}
          />

          <Route
            path="/war-table"
            element={<PlaceholderPage title="War Table" />}
          />

          <Route
            path="/harbingers"
            element={<PlaceholderPage title="Eleven Harbingers" />}
          />

          <Route
            path="/intelligence"
            element={<PlaceholderPage title="Intelligence Archive" />}
          />

          <Route
            path="/gnoses"
            element={<PlaceholderPage title="Project: Gnoses" />}
          />

          <Route
            path="/relic-vault"
            element={<PlaceholderPage title="Imperial Relic Vault" />}
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
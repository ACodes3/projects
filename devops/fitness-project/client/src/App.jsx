import { useEffect } from 'react'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './assets/styles/body.css'
import ProtectedRoute from './component/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Signup from './pages/SignUp'
import Workout from './pages/Workout'
import { applyTheme } from './utils/theme'

const API_URL = import.meta.env.VITE_API_URL;

function App() {

  // Apply stored theme ASAP
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    applyTheme(storedTheme);
  }, []);

  // After login, sync theme from server settings (if available)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");
    if (!token || !userRaw) return;

    const user = (() => {
      try { return JSON.parse(userRaw); } catch { return null; }
    })();
    if (!user?.id) return;

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${API_URL}/settings/${user.id}` , {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.theme) {
          applyTheme(data.theme);
        }
      } catch (_) {
        // ignore fetch errors on boot
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<Signup />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/workouts" element={<ProtectedRoute><Workout /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </Router>
  )
}

export default App

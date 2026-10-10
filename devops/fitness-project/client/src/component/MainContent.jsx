import { useEffect, useState } from "react";
import {
  FaCalendarCheck,
  FaDumbbell,
  FaRegHandPaper,
  FaWalking
} from "react-icons/fa";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "../assets/styles/mainContent.css";

const API_URL = import.meta.env.VITE_API_URL;

const MainContent = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [user, setUser] = useState(null);

  // ✅ Load user once, not every render
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);

  // ✅ Fetch dashboard once when component mounts
  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(
          `${API_URL}/dashboard/${user.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch dashboard");

        const data = await res.json();
        setDashboard(data);
      } catch (err) {
        console.error("❌ Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]); // ✅ runs once, after user is loaded

  if (loading) return <p className="loading-text">Loading dashboard...</p>;
  if (!dashboard) return <p className="error-text">Failed to load dashboard.</p>;

  return (
    <main className="main-content">
      <h2 className="welcome-text">
        Welcome back, {user?.name} <FaRegHandPaper className="wave-icon" />
      </h2>

      {/* === DASHBOARD CARDS === */}
      <div className="dashboard-cards">
        <div className="card">
          <div className="card-icon workout">
            <FaDumbbell />
          </div>
          <div className="card-text">
            <h3>Total Workouts this Month</h3>
            <p>{dashboard.totalWorkouts}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-icon steps">
            <FaWalking />
          </div>
          <div className="card-text">
            <h3>Total Steps this Month</h3>
            <p>{dashboard.totalSteps?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-icon active">
            <FaCalendarCheck />
          </div>
          <div className="card-text">
            <h3>Active Days this Month</h3>
            <p>{dashboard.activeDays}</p>
          </div>
        </div>
      </div>

      {/* === WORKOUT TREND CHART === */}
      <div className="chart-section">
        <h3>Workouts per Month (Year Overview)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dashboard.monthlyData}>
            <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="workouts"
              stroke="#65b89d"
              strokeWidth={3}
              dot={{ r: 5, fill: "#65b89d" }}
              activeDot={{ r: 7, stroke: "#0d3b2e", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
};

export default MainContent;

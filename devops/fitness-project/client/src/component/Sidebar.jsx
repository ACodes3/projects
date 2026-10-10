import { FaCog, FaDumbbell, FaHome } from "react-icons/fa";
import { NavLink, useLocation } from "react-router-dom";
import "../assets/styles/sidebar.css";
import logo from "../assets/workout.png";

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="MyApp Logo" className="sidebar-logo" />
        <h2 className="sidebar-title">Another Fitness App</h2>
      </div>

      <ul className="sidebar-menu">
        <li className={location.pathname === "/" ? "active" : ""}>
          <NavLink to="/" className="sidebar-link">
            <FaHome className="menu-icon" />
            <span>Dashboard</span>
          </NavLink>
        </li>

        <li className={location.pathname === "/workouts" ? "active" : ""}>
          <NavLink to="/workouts" className="sidebar-link">
            <FaDumbbell className="menu-icon" />
            <span>Workouts</span>
          </NavLink>
        </li>

        <li className={location.pathname === "/settings" ? "active" : ""}>
          <NavLink to="/settings" className="sidebar-link">
            <FaCog className="menu-icon" />
            <span>Settings</span>
          </NavLink>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;

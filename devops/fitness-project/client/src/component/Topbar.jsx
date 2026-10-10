import { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../assets/styles/topbar.css";
import userIcon from "../assets/user-account.png";
import Toast from "../component/Toast/Toast";

const Topbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load user info from localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Show success toast
    setToast({
      type: "success",
      title: "Logged Out",
      message: "You’ve been successfully logged out.",
    });

    // Redirect after a short delay
    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="toast-wrapper">
          <Toast type={toast.type} title={toast.title} message={toast.message} />
        </div>
      )}

      <header className="topbar">
        <h1 className="topbar-title">Dashboard</h1>

        <div className="topbar-profile" ref={dropdownRef}>
          <div className="profile-info" onClick={toggleDropdown}>
            <img src={userIcon} alt="User" className="profile-img" />
            <span className="profile-name">
              {user ? `Hello, ${user.name}` : "Hello, User"}
              <FaChevronDown
                className={`dropdown-icon ${isOpen ? "open" : ""}`}
              />
            </span>
          </div>

          {isOpen && (
            <div className="dropdown-menu">
              <button onClick={handleProfile}>
                <FaUserCircle className="dropdown-icon-left" />
                Profile
              </button>
              <button onClick={handleLogout}>
                <FaSignOutAlt className="dropdown-icon-left" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Topbar;

import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <NavLink
        to="/"
        className="navbar__logo"
      >
        KIMETSU ARCHIVE
      </NavLink>

      <nav className="navbar__links">
        <NavLink
          to="/slayers"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          SLAYERS
        </NavLink>

        <NavLink
          to="/demons"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          DEMONS
        </NavLink>

        <NavLink
          to="/breathing"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          BREATHING
        </NavLink>

        <NavLink
          to="/blood-arts"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          BLOOD ARTS
        </NavLink>
      </nav>
    </header>
  );
}

export default Navbar;
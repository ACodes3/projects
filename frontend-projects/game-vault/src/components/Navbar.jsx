import {
  Heart,
  ShoppingCart,
  MessageSquare
} from "lucide-react";

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__left">
        <h1 className="navbar__logo">
          GAME VAULT
        </h1>

        <nav className="navbar__nav">
          <button>HOME</button>
          <button>STORE</button>
          <button>COMMUNITY</button>

          <button className="active">
            LIBRARY
          </button>
        </nav>
      </div>

      <div className="navbar__right">
        <div className="navbar__icons">
          <button className="navbar-icon-button">
            <Heart size={15} fill="currentColor" />
          </button>

          <button className="navbar-icon-button">
            <ShoppingCart size={15} />
          </button>

          <button className="navbar-icon-button">
            <MessageSquare size={15} fill="currentColor" />
          </button>
        </div>

        <div className="navbar__profile">
          <span className="profile-name">
            Robot_Android1999
          </span>

          <div className="profile-avatar-wrapper">
            <img
              src="/images/avatar.jpg"
              alt="User avatar"
              className="profile-avatar"
            />

            <span className="profile-status" />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
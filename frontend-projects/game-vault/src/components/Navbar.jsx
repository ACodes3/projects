function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__left">
        <h1 className="navbar__logo">GAME VAULT</h1>

        <nav className="navbar__nav">
          <button>STORE</button>
          <button className="active">LIBRARY</button>
          <button>COMMUNITY</button>
        </nav>
      </div>

      <div className="navbar__profile">
        <span className="profile-status"></span>

        <div className="profile-avatar">
          GV
        </div>

        <span>Player</span>
      </div>
    </header>
  );
}

export default Navbar;
function GameDetails({ game }) {
  if (!game) {
    return (
      <section className="game-details empty-state">
        <h2>Select a game</h2>
        <p>Choose a game from your library.</p>
      </section>
    );
  }

  return (
    <section className="game-details">

      <div className="game-hero">

        <img
          className="game-hero__cover"
          src={game.image}
          alt={game.title}
        />

        <div className="game-hero__info">

          <div className="game-title-row">
            <h2>{game.title}</h2>

            <button className="favorite-button">
              ☆
            </button>
          </div>

          <p className="game-developer">
            {game.developer}
          </p>

          <div className="game-stats">
            <div>
              <span>Rating</span>
              <strong>★ {game.rating}</strong>
            </div>

            <div>
              <span>Released</span>
              <strong>{game.releaseYear}</strong>
            </div>
          </div>

          <div className="game-genres">
            {game.genre.map((genre) => (
              <span key={genre}>
                {genre}
              </span>
            ))}
          </div>

          <button className="primary-button">
            ▶ PLAY
          </button>

        </div>
      </div>

      <nav className="game-tabs">
        <button className="active">
          Overview
        </button>

        <button>Game Info</button>
        <button>Achievements</button>
        <button>Notes</button>
      </nav>

      <div className="game-content-grid">

        <div className="content-panel">
          <h3>About this game</h3>

          <p>
            {game.description}
          </p>
        </div>

        <div className="content-panel">
          <h3>Platforms</h3>

          <div className="platform-list">
            {game.platforms.map((platform) => (
              <span key={platform}>
                {platform}
              </span>
            ))}
          </div>
        </div>

        <div className="content-panel large">
          <div className="panel-heading">
            <h3>Your Activity</h3>

            <span>Recently played</span>
          </div>

          <div className="activity-placeholder">
            <div>
              <strong>0 hours</strong>
              <span>Play time</span>
            </div>

            <div>
              <strong>0 / 50</strong>
              <span>Achievements</span>
            </div>

            <div>
              <strong>—</strong>
              <span>Last played</span>
            </div>
          </div>
        </div>

      </div>

    </section>
  );
}

export default GameDetails;
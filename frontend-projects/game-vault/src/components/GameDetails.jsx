import {
  Settings,
  Trophy,
  Star
} from "lucide-react";

import { useNavigate } from "react-router-dom";

function GameDetails({ game }) {
  const navigate = useNavigate();

  if (!game) {
    return (
      <section className="game-details empty-state">
        <div>
          <h2>Select a game</h2>
          <p>
            Choose a game from your library.
          </p>
        </div>
      </section>
    );
  }

  const achievementPercentage =
    game.achievements.total > 0
      ? Math.round(
          (
            game.achievements.unlocked /
            game.achievements.total
          ) * 100
        )
      : 0;

  const playingFriends = [
    {
      id: 1,
      name: "Alex",
      image:
        "https://placehold.co/80x80/596b47/ffffff?text=A"
    },
    {
      id: 2,
      name: "Marcus",
      image:
        "https://placehold.co/80x80/3f5366/ffffff?text=M"
    },
    {
      id: 3,
      name: "John",
      image:
        "https://placehold.co/80x80/536475/ffffff?text=J"
    },
    {
      id: 4,
      name: "Sara",
      image:
        "https://placehold.co/80x80/744b5b/ffffff?text=S"
    }
  ];

  const recentFriends = [
    {
      id: 5,
      name: "Nova",
      image:
        "https://placehold.co/80x80/bb3de0/ffffff?text=N"
    },
    {
      id: 6,
      name: "David",
      image:
        "https://placehold.co/80x80/416f8d/ffffff?text=D"
    },
    {
      id: 7,
      name: "Emma",
      image:
        "https://placehold.co/80x80/625e73/ffffff?text=E"
    },
    {
      id: 8,
      name: "Mia",
      image:
        "https://placehold.co/80x80/684552/ffffff?text=M"
    }
  ];

  const lockedAchievements = [
    "⚡",
    "☠",
    "♛",
    "★",
    "⚔"
  ];

  const handlePlay = () => {
    navigate(`/play/${game.id}`);
  };

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

            <button
              className="favorite-button"
              aria-label="Favorite"
            >
              <Star
                size={22}
                fill={
                  game.favorite
                    ? "currentColor"
                    : "none"
                }
              />
            </button>
          </div>

          <div className="play-info">
            <div>
              <span>You've played</span>
              <strong>
                {game.playTime}
              </strong>
            </div>

            <div>
              <span>Last played</span>
              <strong>
                {game.lastPlayed}
              </strong>
            </div>
          </div>

          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={handlePlay}
            >
              <span>▶</span>
              PLAY
            </button>

            <button className="settings-button">
              <Settings size={17} />
            </button>
          </div>
        </div>
      </div>

      <nav className="game-tabs">
        <button className="active">
          Store Page
        </button>

        <button>News</button>
        <button>Game Info</button>
        <button>Reviews</button>
        <button>Community</button>
        <button>Support</button>
      </nav>

      <div className="game-dashboard">
        <div className="game-dashboard__main">
          <article className="panel addon-panel">
            <h3>
              Available Add-ons
            </h3>

            <div className="addon-card">
              <img
                src={game.addon.image}
                alt={game.addon.title}
              />

              <div className="addon-card__content">
                <h4>
                  {game.addon.title}
                </h4>

                <p>
                  {game.addon.description}
                </p>

                <div className="addon-card__footer">
                  <strong>
                    {game.addon.price}
                  </strong>

                  <button>
                    BUY NOW
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article className="panel update-panel">
            <div className="panel-heading">
              <h3>
                New Update{" "}
                {game.update.version}
              </h3>

              <span>
                {game.update.date}
              </span>
            </div>

            <ul>
              {game.update.notes.map(
                (note) => (
                  <li key={note}>
                    {note}
                  </li>
                )
              )}
            </ul>
          </article>
        </div>

        <aside className="game-dashboard__side">
          <article className="panel friends-panel">
            <h3>
              Friends Who Play
            </h3>

            <div className="friends-group">
              <span className="friends-label">
                Playing
              </span>

              <div className="friends-row">
                {playingFriends.map(
                  (friend) => (
                    <div
                      className="friend-avatar friend-avatar--online"
                      key={friend.id}
                      title={friend.name}
                    >
                      <img
                        src={friend.image}
                        alt={friend.name}
                      />
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="friends-group">
              <span className="friends-label">
                Played Recently
              </span>

              <div className="friends-row">
                {recentFriends.map(
                  (friend) => (
                    <div
                      className="friend-avatar"
                      key={friend.id}
                      title={friend.name}
                    >
                      <img
                        src={friend.image}
                        alt={friend.name}
                      />
                    </div>
                  )
                )}

                <div className="friends-more">
                  +2
                </div>
              </div>
            </div>
          </article>

          <article className="panel achievements-panel">
            <div className="panel-heading">
              <h3>
                Achievement Progress
              </h3>

              <span className="achievement-count">
                {game.achievements.unlocked}/
                {game.achievements.total}
              </span>
            </div>

            <div className="achievement-score">
              <Trophy size={17} />

              <strong>
                {achievementPercentage}%
              </strong>
            </div>

            <div className="achievement-bar">
              <div
                className="achievement-bar__fill"
                style={{
                  width: `${achievementPercentage}%`
                }}
              />
            </div>

            <div className="locked-section">
              <p>
                Locked Achievements
              </p>

              <div className="locked-achievements">
                {lockedAchievements.map(
                  (achievement, index) => (
                    <div
                      className="achievement-icon"
                      key={index}
                    >
                      {achievement}
                    </div>
                  )
                )}

                <div className="achievement-more">
                  +51
                </div>
              </div>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

export default GameDetails;
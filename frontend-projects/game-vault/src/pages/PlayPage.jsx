import { useState } from "react";

import {
  ArrowLeft,
  Play,
  Settings,
  Clock,
  Gamepad2,
  Monitor,
  Trophy
} from "lucide-react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import "./PlayPage.css";

function PlayPage({ games }) {
  const navigate = useNavigate();
  const { gameId } = useParams();

  const [isLaunching, setIsLaunching] =
    useState(false);

  const game = games.find(
    (game) =>
      game.id === Number(gameId)
  );

  if (!game) {
    return (
      <div className="play-page-error">
        <h1>Game not found</h1>

        <button
          onClick={() => navigate("/")}
        >
          Back to Library
        </button>
      </div>
    );
  }

  const achievementPercentage =
    Math.round(
      (
        game.achievements.unlocked /
        game.achievements.total
      ) * 100
    );

  const handleLaunch = () => {
    setIsLaunching(true);

    setTimeout(() => {
      setIsLaunching(false);
    }, 2500);
  };

  return (
    <main className="play-page">
      <div
        className="play-page__background"
        style={{
          backgroundImage:
            `url(${game.image})`
        }}
      />

      <div className="play-page__overlay" />

      <header className="play-header">
        <button
          className="play-back"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={20} />

          <span>
            LIBRARY
          </span>
        </button>

        <span className="play-header__brand">
          GAME VAULT
        </span>
      </header>

      <section className="play-content">
        <div className="play-content__image">
          <img
            src={game.image}
            alt={game.title}
          />
        </div>

        <div className="play-content__info">
          <span className="play-status">
            <span />
            {game.status}
          </span>

          <h1>
            {game.title}
          </h1>

          <p className="play-developer">
            {game.developer}
          </p>

          <p className="play-description">
            {game.description}
          </p>

          <div className="play-tags">
            {game.genre.map(
              (genre) => (
                <span key={genre}>
                  {genre}
                </span>
              )
            )}
          </div>

          <div className="play-actions">
            <button
              className="launch-button"
              onClick={handleLaunch}
              disabled={isLaunching}
            >
              <Play
                size={20}
                fill="currentColor"
              />

              {isLaunching
                ? "LAUNCHING..."
                : "LAUNCH GAME"}
            </button>

            <button className="launch-settings">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </section>

      <section className="play-stats">
        <div className="play-stat">
          <div className="play-stat__icon">
            <Clock size={21} />
          </div>

          <div>
            <span>
              Play time
            </span>

            <strong>
              {game.playTime}
            </strong>
          </div>
        </div>

        <div className="play-stat">
          <div className="play-stat__icon">
            <Gamepad2 size={21} />
          </div>

          <div>
            <span>
              Last played
            </span>

            <strong>
              {game.lastPlayed}
            </strong>
          </div>
        </div>

        <div className="play-stat">
          <div className="play-stat__icon">
            <Trophy size={21} />
          </div>

          <div>
            <span>
              Achievements
            </span>

            <strong>
              {achievementPercentage}%
            </strong>
          </div>
        </div>

        <div className="play-stat">
          <div className="play-stat__icon">
            <Monitor size={21} />
          </div>

          <div>
            <span>
              Platform
            </span>

            <strong>
              {game.platforms[0]}
            </strong>
          </div>
        </div>
      </section>

      {isLaunching && (
        <div className="launch-overlay">
          <div className="launch-modal">
            <div className="launch-spinner" />

            <img
              src={game.image}
              alt=""
            />

            <h2>
              Launching {game.title}
            </h2>

            <p>
              Preparing game files...
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

export default PlayPage;
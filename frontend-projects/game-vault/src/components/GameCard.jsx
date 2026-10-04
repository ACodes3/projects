function GameCard({ game }) {
  return (
    <article className="game-card">
      <img
        className="game-card__image"
        src={game.image}
        alt={game.title}
      />

      <div className="game-card__content">
        <h2 className="game-card__title">
          {game.title}
        </h2>

        <p className="game-card__developer">
          {game.developer}
        </p>

        <p className="game-card__genres">
          {game.genre.join(" • ")}
        </p>

        <div className="game-card__meta">
          <span>⭐ {game.rating}</span>
          <span>{game.releaseYear}</span>
        </div>
      </div>
    </article>
  );
}

export default GameCard;
function GameListItem({ game, selectedGame, onSelect }) {
  const isSelected = selectedGame?.id === game.id;

  return (
    <button
      className={`game-list-item ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(game)}
    >
      <img src={game.image} alt="" />

      <div>
        <span className="game-list-item__title">
          {game.title}
        </span>

        <span className="game-list-item__developer">
          {game.developer}
        </span>
      </div>
    </button>
  );
}

export default GameListItem;
function GameListItem({
  game,
  selectedGame,
  onSelect
}) {
  const isSelected =
    selectedGame?.id === game.id;

  return (
    <button
      className={`game-list-item ${
        isSelected ? "selected" : ""
      }`}
      onClick={() => onSelect(game)}
    >
      <img
        src={game.thumbnail || game.image}
        alt=""
      />

      <span className="game-list-item__title">
        {game.title}
      </span>
    </button>
  );
}

export default GameListItem;
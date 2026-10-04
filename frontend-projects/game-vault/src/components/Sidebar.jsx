import GameListItem from "./GameListItem";

function Sidebar({
  games,
  selectedGame,
  onSelectGame
}) {
  return (
    <aside className="sidebar">

      <div className="sidebar__search">
        <input
          type="text"
          placeholder="Search my games..."
        />

        <button>⌕</button>
      </div>

      <div className="sidebar__section">
        <div className="sidebar__heading">
          <span>★</span>
          <span>My Games</span>

          <span className="sidebar__count">
            {games.length}
          </span>
        </div>

        <div className="game-list">
          {games.map((game) => (
            <GameListItem
              key={game.id}
              game={game}
              selectedGame={selectedGame}
              onSelect={onSelectGame}
            />
          ))}
        </div>
      </div>

    </aside>
  );
}

export default Sidebar;
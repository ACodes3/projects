import GameListItem from "./GameListItem";

function Sidebar({
  games = [],
  allGames = [],
  selectedGame,
  onSelectGame
}) {
  const favoriteGames = games.filter(
    (game) => game.favorite
  );

  const totalFavoriteGames = allGames.filter(
    (game) => game.favorite
  ).length;

  return (
    <aside className="sidebar">
      <section className="sidebar-section">
        <div className="sidebar-section__header">
          <div className="sidebar-section__title">
            <span>★</span>
            <span>Favorite</span>
          </div>

          <div className="sidebar-section__meta">
            <span className="sidebar-count">
              {totalFavoriteGames}
            </span>

            <span>⌃</span>
          </div>
        </div>

        <div className="sidebar-games">
          {favoriteGames.length > 0 ? (
            favoriteGames.map((game) => (
              <GameListItem
                key={game.id}
                game={game}
                selectedGame={selectedGame}
                onSelect={onSelectGame}
              />
            ))
          ) : (
            <p className="sidebar-empty">
              No favorites found
            </p>
          )}
        </div>
      </section>

      <section className="sidebar-section sidebar-section--grow">
        <div className="sidebar-section__header">
          <div className="sidebar-section__title">
            <span>☷</span>
            <span>All Games</span>
          </div>

          <div className="sidebar-section__meta">
            <span className="sidebar-count">
              {allGames.length}
            </span>

            <span>⌃</span>
          </div>
        </div>

        <div className="sidebar-games sidebar-games--scroll">
          {games.length > 0 ? (
            games.map((game) => (
              <GameListItem
                key={game.id}
                game={game}
                selectedGame={selectedGame}
                onSelect={onSelectGame}
              />
            ))
          ) : (
            <p className="sidebar-empty">
              No games found
            </p>
          )}
        </div>
      </section>
    </aside>
  );
}

export default Sidebar;
import { useState } from "react";
import {
  Star,
  List,
  ChevronUp,
  ChevronDown
} from "lucide-react";

import GameListItem from "./GameListItem";

function Sidebar({
  games = [],
  allGames = [],
  selectedGame,
  onSelectGame
}) {
  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [allGamesOpen, setAllGamesOpen] = useState(true);

  const favoriteGames = games.filter(
    (game) => game.favorite
  );

  const totalFavoriteGames = allGames.filter(
    (game) => game.favorite
  ).length;

  return (
    <aside className="sidebar">
      <section className="sidebar-section">
        <button
          className="sidebar-section__header"
          onClick={() =>
            setFavoritesOpen(
              (current) => !current
            )
          }
        >
          <div className="sidebar-section__title">
            <Star
              size={15}
              fill="currentColor"
            />

            <span>Favorite</span>
          </div>

          <div className="sidebar-section__meta">
            <span className="sidebar-count">
              {totalFavoriteGames}
            </span>

            {favoritesOpen ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </div>
        </button>

        {favoritesOpen && (
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
        )}
      </section>

      <section className="sidebar-section sidebar-section--grow">
        <button
          className="sidebar-section__header"
          onClick={() =>
            setAllGamesOpen(
              (current) => !current
            )
          }
        >
          <div className="sidebar-section__title">
            <List size={15} />

            <span>All Games</span>
          </div>

          <div className="sidebar-section__meta">
            <span className="sidebar-count">
              {allGames.length}
            </span>

            {allGamesOpen ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </div>
        </button>

        {allGamesOpen && (
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
        )}
      </section>
    </aside>
  );
}

export default Sidebar;
import { useEffect, useState } from "react";
import {
  Routes,
  Route
} from "react-router-dom";

import {
  SlidersHorizontal,
  List,
  Grid2X2
} from "lucide-react";

import { getGames } from "./services/gameService";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import GameDetails from "./components/GameDetails";
import PlayPage from "./pages/PlayPage";

function App() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await getGames();

        setGames(data);

        if (data.length > 0) {
          setSelectedGame(data[0]);
        }
      } catch (error) {
        console.error(error);
        setError("Could not load games.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  const filteredGames = games.filter((game) =>
    game.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="status-screen">
        Loading library...
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-screen">
        {error}
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="app">
            <Navbar />

            <div className="library-toolbar">
              <div className="library-toolbar__left">
                <div className="toolbar-search">
                  <input
                    type="text"
                    placeholder="Search my games..."
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                  />
                </div>

                <button className="toolbar-button">
                  <SlidersHorizontal size={16} />
                </button>

                <button className="toolbar-button active">
                  <List size={17} />
                </button>

                <button className="toolbar-button">
                  <Grid2X2 size={16} />
                </button>
              </div>

              <button className="activate-button">
                ACTIVATE KEY
              </button>
            </div>

            <main className="library-layout">
              <Sidebar
                games={filteredGames}
                allGames={games}
                selectedGame={selectedGame}
                onSelectGame={setSelectedGame}
              />

              <GameDetails
                game={selectedGame}
              />
            </main>
          </div>
        }
      />

      <Route
        path="/play/:gameId"
        element={
          <PlayPage games={games} />
        }
      />
    </Routes>
  );
}

export default App;
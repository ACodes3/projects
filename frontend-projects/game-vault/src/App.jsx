import { useEffect, useState } from "react";
import { getGames } from "./services/gameService";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import GameDetails from "./components/GameDetails";

function App() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await getGames();

        setGames(data);

        // Automatically select first game
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
    <div className="app">

      <div className="launcher">

        <Navbar />

        <main className="launcher__content">

          <Sidebar
            games={games}
            selectedGame={selectedGame}
            onSelectGame={setSelectedGame}
          />

          <GameDetails game={selectedGame} />

        </main>

      </div>

    </div>
  );
}

export default App;
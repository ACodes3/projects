import { useEffect, useState } from "react";

import { getGames } from "../services/gameService";
import PlayPage from "./PlayPage";

function PlayPageWrapper() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await getGames();

        setGames(data);
      } catch (error) {
        console.error(error);

        setError(
          "Could not load game."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (isLoading) {
    return (
      <div className="status-screen">
        Loading game...
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
    <PlayPage games={games} />
  );
}

export default PlayPageWrapper;
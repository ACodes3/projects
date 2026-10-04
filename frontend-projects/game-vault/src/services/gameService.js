import axios from "axios";

export const getGames = async () => {
  const response = await axios.get(
    "/data/games.json"
  );

  return response.data;
};
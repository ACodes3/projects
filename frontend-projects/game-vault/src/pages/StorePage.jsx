import { useEffect, useState } from "react";

import {
  Search,
  ShoppingCart
} from "lucide-react";

import Navbar from "../components/Navbar";
import { getGames } from "../services/gameService";

function StorePage() {
  const [games, setGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await getGames();
        setGames(data);
      } catch (error) {
        console.error(error);
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
        Loading store...
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />

      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px",
          background: "#151d30"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "24px"
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "28px"
              }}
            >
              Store
            </h1>

            <p
              style={{
                margin: "6px 0 0",
                color: "#8d99b0"
              }}
            >
              Discover new games.
            </p>
          </div>

          <div
            style={{
              position: "relative"
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "11px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#7f8ca5"
              }}
            />

            <input
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search store..."
              style={{
                width: "260px",
                height: "36px",
                padding:
                  "0 12px 0 35px",
                border:
                  "1px solid #485670",
                borderRadius: "4px",
                outline: "none",
                background: "#202a42",
                color: "#fff"
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "18px"
          }}
        >
          {filteredGames.map((game) => (
            <article
              key={game.id}
              style={{
                overflow: "hidden",
                borderRadius: "8px",
                background: "#202a43",
                border:
                  "1px solid rgba(255,255,255,.04)"
              }}
            >
              <img
                src={game.image}
                alt={game.title}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  display: "block"
                }}
              />

              <div
                style={{
                  padding: "16px"
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "18px"
                  }}
                >
                  {game.title}
                </h2>

                <p
                  style={{
                    margin: "6px 0",
                    color: "#8794aa",
                    fontSize: "13px"
                  }}
                >
                  {game.developer}
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    margin: "12px 0"
                  }}
                >
                  {game.genre.map((genre) => (
                    <span
                      key={genre}
                      style={{
                        padding:
                          "5px 8px",
                        borderRadius: "4px",
                        background: "#2b3652",
                        color: "#aeb8ca",
                        fontSize: "11px"
                      }}
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center"
                  }}
                >
                  <strong>
                    {game.addon?.price ||
                      "$29.99"}
                  </strong>

                  <button
                    style={{
                      width: "36px",
                      height: "36px",
                      display: "grid",
                      placeItems: "center",
                      border: "none",
                      borderRadius: "4px",
                      background: "#3488ef",
                      color: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    <ShoppingCart size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

export default StorePage;
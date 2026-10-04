import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Play,
  Clock,
  Trophy,
  ChevronRight
} from "lucide-react";

import Navbar from "../components/Navbar";
import { getGames } from "../services/gameService";

function HomePage() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

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

  if (isLoading) {
    return (
      <div className="status-screen">
        Loading home...
      </div>
    );
  }

  const featuredGame = games[0];

  const recentGames = games.slice(0, 4);

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
        {featuredGame && (
          <section
            style={{
              position: "relative",
              minHeight: "360px",
              overflow: "hidden",
              borderRadius: "12px",
              marginBottom: "28px"
            }}
          >
            <img
              src={featuredGame.image}
              alt={featuredGame.title}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg, rgba(10,16,28,.95) 0%, rgba(10,16,28,.75) 45%, rgba(10,16,28,.25) 100%)"
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 1,
                maxWidth: "560px",
                padding: "48px"
              }}
            >
              <span
                style={{
                  color: "#7caeff",
                  fontSize: "13px",
                  fontWeight: 700
                }}
              >
                FEATURED GAME
              </span>

              <h1
                style={{
                  margin: "10px 0 12px",
                  fontSize: "48px"
                }}
              >
                {featuredGame.title}
              </h1>

              <p
                style={{
                  color: "#aeb8c9",
                  lineHeight: 1.6,
                  fontSize: "15px"
                }}
              >
                {featuredGame.description}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "24px"
                }}
              >
                <button
                  className="primary-button"
                  onClick={() =>
                    navigate(
                      `/play/${featuredGame.id}`
                    )
                  }
                >
                  <Play
                    size={16}
                    fill="currentColor"
                  />
                  PLAY NOW
                </button>

                <button
                  className="settings-button"
                  onClick={() =>
                    navigate("/library")
                  }
                  style={{
                    width: "auto",
                    padding: "0 18px"
                  }}
                >
                  VIEW LIBRARY
                </button>
              </div>
            </div>
          </section>
        )}

        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px"
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "20px"
              }}
            >
              Continue Playing
            </h2>

            <button
              onClick={() =>
                navigate("/library")
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                border: "none",
                background: "transparent",
                color: "#8ea0bc",
                cursor: "pointer"
              }}
            >
              View Library
              <ChevronRight size={16} />
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px"
            }}
          >
            {recentGames.map((game) => {
              const percent = Math.round(
                (game.achievements.unlocked /
                  game.achievements.total) *
                  100
              );

              return (
                <article
                  key={game.id}
                  onClick={() =>
                    navigate(`/play/${game.id}`)
                  }
                  style={{
                    overflow: "hidden",
                    borderRadius: "8px",
                    background: "#202a43",
                    cursor: "pointer",
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
                      padding: "14px"
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 10px",
                        fontSize: "16px"
                      }}
                    >
                      {game.title}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        color: "#8e9bb3",
                        fontSize: "12px"
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px"
                        }}
                      >
                        <Clock size={14} />
                        {game.playTime}
                      </span>

                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px"
                        }}
                      >
                        <Trophy size={14} />
                        {percent}%
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
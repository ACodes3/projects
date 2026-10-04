import { useEffect, useState } from "react";

import {
  MessageSquare,
  Heart,
  Users
} from "lucide-react";

import Navbar from "../components/Navbar";
import { getGames } from "../services/gameService";

function CommunityPage() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] =
    useState(true);

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
        Loading community...
      </div>
    );
  }

  const posts = games.slice(0, 5).map(
    (game, index) => ({
      id: game.id,
      user: [
        "NovaRunner",
        "AshWalker",
        "VoidSignal",
        "CloudCaptain",
        "MoonFox"
      ][index],
      game: game.title,
      text: [
        "Finally finished the campaign. That final mission was incredible.",
        "Found a hidden area I completely missed on my first run.",
        "Anyone else trying the new difficulty mode?",
        "The latest update made the combat feel much better.",
        "This game has some of the best environments I've seen."
      ][index],
      likes: 12 + index * 7,
      comments: 3 + index * 2,
      image: game.image
    })
  );

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
            marginBottom: "24px"
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "28px"
            }}
          >
            Community
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: "#8d99b0"
            }}
          >
            See what players are talking about.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) 280px",
            gap: "18px"
          }}
        >
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px"
            }}
          >
            {posts.map((post) => (
              <article
                key={post.id}
                style={{
                  padding: "18px",
                  borderRadius: "8px",
                  background: "#202a43",
                  border:
                    "1px solid rgba(255,255,255,.04)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "12px"
                  }}
                >
                  <img
                    src={post.image}
                    alt={post.game}
                    style={{
                      width: "46px",
                      height: "46px",
                      objectFit: "cover",
                      borderRadius: "6px"
                    }}
                  />

                  <div>
                    <strong>
                      {post.user}
                    </strong>

                    <p
                      style={{
                        margin: "3px 0 0",
                        color: "#7f8da6",
                        fontSize: "12px"
                      }}
                    >
                      playing {post.game}
                    </p>
                  </div>
                </div>

                <p
                  style={{
                    color: "#c1c8d5",
                    lineHeight: 1.6,
                    margin:
                      "16px 0"
                  }}
                >
                  {post.text}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "18px",
                    color: "#8794aa",
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
                    <Heart size={14} />
                    {post.likes}
                  </span>

                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px"
                    }}
                  >
                    <MessageSquare size={14} />
                    {post.comments}
                  </span>
                </div>
              </article>
            ))}
          </section>

          <aside>
            <div
              style={{
                padding: "18px",
                borderRadius: "8px",
                background: "#202a43",
                border:
                  "1px solid rgba(255,255,255,.04)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "14px"
                }}
              >
                <Users size={18} />

                <h3
                  style={{
                    margin: 0
                  }}
                >
                  Online Friends
                </h3>
              </div>

              {[
                "NovaRunner",
                "AshWalker",
                "MoonFox",
                "RiftHunter"
              ].map((friend) => (
                <div
                  key={friend}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    padding:
                      "9px 0",
                    borderBottom:
                      "1px solid rgba(255,255,255,.04)"
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius:
                        "50%",
                      background:
                        "#48dfb5"
                    }}
                  />

                  <span>
                    {friend}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default CommunityPage;
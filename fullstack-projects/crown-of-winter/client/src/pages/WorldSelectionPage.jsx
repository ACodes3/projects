
import { useEffect, useState } from "react";
import {
  Crown,
  Globe2,
  Plus,
  Snowflake,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import { worldApi } from "../services/worldApi";

import "./WorldSelectionPage.css";

function WorldSelectionPage({ onSelectWorld }) {
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [mode, setMode] = useState("singleplayer");

  const [error, setError] = useState("");

  async function loadWorlds() {
    try {
      setLoading(true);
      setError("");

      const response = await worldApi.list();

      setWorlds(response.data.worlds);
    } catch (err) {
      setError(err.message || "Failed to load worlds.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    worldApi
      .list()
      .then((response) => {
        if (!cancelled) {
          setWorlds(response.data.worlds);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load worlds.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(event) {
    event.preventDefault();

    if (creating) return;

    const cleanName = name.trim();

    if (cleanName.length < 3 || cleanName.length > 100) {
      setError("World name must be between 3 and 100 characters.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await worldApi.create(cleanName, mode);

      const createdWorld = response.data.world;

      setWorlds((current) => [createdWorld, ...current]);
      setName("");

      onSelectWorld?.(createdWorld);
    } catch (err) {
      setError(err.message || "Failed to create world.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="world-selection">
      <div className="world-selection__container">

        <header className="world-selection__header">
          <Snowflake size={32} strokeWidth={1.2} />

          <span>Winter Palace • Imperial Gateway</span>

          <h1>Select Your World</h1>

          <p>
            Every kingdom begins with a crown.
            Choose an existing world or establish a new reign.
          </p>
        </header>

        {error && (
          <div className="world-selection__error" role="alert">
            {error}
          </div>
        )}

        <section className="world-selection__section">
          <div className="world-selection__section-heading">
            <div>
              <span>Imperial Records</span>
              <h2>Your Worlds</h2>
            </div>

            <button
              type="button"
              onClick={loadWorlds}
              disabled={loading}
              className="world-selection__refresh"
              aria-label="Refresh worlds"
            >
              <RefreshCw size={17} />
            </button>
          </div>

          {loading ? (
            <p className="world-selection__message">
              Retrieving imperial records...
            </p>
          ) : worlds.length === 0 ? (
            <div className="world-selection__empty">
              <Globe2 size={30} strokeWidth={1} />
              <strong>No worlds established</strong>
              <p>
                Create your first world to begin your reign.
              </p>
            </div>
          ) : (
            <div className="world-selection__worlds">
              {worlds.map((world) => (
                <button
                  key={world.id}
                  type="button"
                  className="world-selection__world"
                  onClick={() => onSelectWorld?.(world)}
                >
                  <Crown size={22} strokeWidth={1.3} />

                  <div>
                    <strong>{world.name}</strong>
                    <span>{world.mode}</span>
                  </div>

                  <ArrowRight size={17} />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="world-selection__section">
          <div className="world-selection__section-heading">
            <div>
              <span>New Dominion</span>
              <h2>Create a World</h2>
            </div>

            <Plus size={18} />
          </div>

          <form
            className="world-selection__form"
            onSubmit={handleCreate}
          >
            <label htmlFor="world-name">
              World Name
            </label>

            <input
              id="world-name"
              type="text"
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              placeholder="Eternal Winter"
              required
              disabled={creating}
            />

            <label htmlFor="world-mode">
              World Mode
            </label>

            <select
              id="world-mode"
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              disabled={creating}
            >
              <option value="singleplayer">
                Singleplayer
              </option>

              <option value="multiplayer">
                Multiplayer
              </option>
            </select>

            <button
              type="submit"
              className="world-selection__create"
              disabled={creating}
            >
              <Crown size={17} />

              {creating
                ? "Establishing Dominion..."
                : "Create World"}
            </button>
          </form>
        </section>

      </div>
    </main>
  );
}

export default WorldSelectionPage;


import { useEffect, useState } from "react";
import {
  Crown,
  Globe2,
  Plus,
  Snowflake,
  ArrowRight,
  RefreshCw,
  Mail,
  CheckCircle2,
} from "lucide-react";

import { worldApi } from "../services/worldApi";
import { invitationApi } from "../services/invitationApi";

import "./WorldSelectionPage.css";

function WorldSelectionPage({ onSelectWorld }) {
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [invitationError, setInvitationError] = useState("");

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

  async function loadInvitations() {
    setLoadingInvitations(true);
    setInvitationError("");

    try {
      const response = await invitationApi.getMyInvitations();
      setInvitations(response.data.invitations);
    } catch (err) {
      setInvitationError(err.message || "Failed to load invitations.");
    } finally {
      setLoadingInvitations(false);
    }
  }

  async function handleAccept(membershipId) {
    if (acceptingId) return;

    setAcceptingId(membershipId);
    setInvitationError("");

    try {
      await invitationApi.accept(membershipId);
      setInvitations((current) =>
        current.filter((item) => item.membership_id !== membershipId)
      );
      // Accepted worlds become active memberships. Refresh the world list.
      await loadWorlds();
    } catch (err) {
      setInvitationError(err.message || "Could not accept invitation.");
    } finally {
      setAcceptingId(null);
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

    invitationApi
      .getMyInvitations()
      .then((response) => {
        if (!cancelled) {
          setInvitations(response.data.invitations);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setInvitationError(err.message || "Failed to load invitations.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingInvitations(false);
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
              <span>Imperial Correspondence</span>
              <h2>Pending Invitations</h2>
            </div>

            <button
              type="button"
              onClick={loadInvitations}
              disabled={loadingInvitations || acceptingId !== null}
              className="world-selection__refresh"
              aria-label="Refresh invitations"
            >
              <RefreshCw size={17} />
            </button>
          </div>

          {invitationError && (
            <div className="world-selection__error" role="alert">
              {invitationError}
            </div>
          )}

          {loadingInvitations ? (
            <p className="world-selection__message">
              Retrieving invitations...
            </p>
          ) : invitations.length === 0 ? (
            <div className="world-selection__empty">
              <Mail size={30} strokeWidth={1} />
              <strong>No pending invitations</strong>
              <p>New invitations to join other worlds will appear here.</p>
            </div>
          ) : (
            <div className="world-selection__worlds">
              {invitations.map((invitation) => (
                <div
                  className="world-selection__world world-selection__invitation"
                  key={invitation.membership_id}
                >
                  <Mail size={22} strokeWidth={1.3} />
                  <div>
                    <strong>{invitation.world_name}</strong>
                    <span>{invitation.mode} • Invitation pending</span>
                  </div>
                  <button
                    type="button"
                    className="world-selection__accept"
                    disabled={acceptingId !== null}
                    onClick={() => handleAccept(invitation.membership_id)}
                  >
                    <CheckCircle2 size={15} />
                    {acceptingId === invitation.membership_id
                      ? "Joining..."
                      : "Accept"}
                  </button>
                </div>
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

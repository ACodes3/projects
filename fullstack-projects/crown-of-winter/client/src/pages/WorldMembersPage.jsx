
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Snowflake,
  UserPlus,
  Users,
} from "lucide-react";

import { invitationApi } from "../services/invitationApi";

import "./WorldMembersPage.css";

function WorldMembersPage() {
  const { worldId } = useParams();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restricted, setRestricted] = useState(false);

  const [username, setUsername] = useState("");
  const [inviting, setInviting] = useState(false);

  const [error, setError] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [success, setSuccess] = useState("");

  const loadMembers = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await invitationApi.getMembers(worldId);

        setMembers(response?.data?.members ?? []);
        setRestricted(false);
      } catch (err) {
        if (err?.status === 403) {
          setRestricted(true);
          setMembers([]);
        } else {
          setError(err?.message || "Failed to load world members.");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [worldId]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMembers();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadMembers]);

  async function handleInvite(event) {
    event.preventDefault();

    if (inviting) return;

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setInviteError("Please enter a username.");
      return;
    }

    try {
      setInviting(true);
      setInviteError("");
      setSuccess("");

      const response = await invitationApi.invite(
        worldId,
        cleanUsername
      );

      setSuccess(
        response?.message || "Invitation sent successfully."
      );

      setUsername("");

      await loadMembers(true);
    } catch (err) {
      if (err?.status === 403) {
        setRestricted(true);
      } else {
        setInviteError(
          err?.message || "Failed to create invitation."
        );
      }
    } finally {
      setInviting(false);
    }
  }

  const activeMembers = members.filter(
    (member) => member.status === "active"
  );

  const invitedMembers = members.filter(
    (member) => member.status === "invited"
  );

  const removedMembers = members.filter(
    (member) => member.status === "removed"
  );

  if (loading) {
    return (
      <main className="world-members">
        <div className="world-members__state">
          <LoaderCircle size={30} className="world-members__spin" />
          <h2>Accessing Imperial Records</h2>
          <p>Verifying Sovereign clearance...</p>
        </div>
      </main>
    );
  }

  if (restricted) {
    return (
      <main className="world-members">
        <div className="world-members__state">
          <ShieldAlert size={38} />
          <h2>Access Restricted</h2>
          <p>
            Only the world's Sovereign can manage
            player invitations and membership records.
          </p>

          <Link
            to={`/worlds/${worldId}/dashboard`}
            className="world-members__back"
          >
            <ArrowLeft size={16} />
            Return to Imperial Command
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="world-members">
      <div className="world-members__container">

        {/* HEADER */}
        <header className="world-members__header">
          <div>
            <span className="world-members__eyebrow">
              Winter Palace • Sovereign Administration
            </span>

            <h1>World Members</h1>

            <p>
              Manage imperial membership records and invite
              registered players into your world.
            </p>
          </div>

          <div className="world-members__clearance">
            <Crown size={20} strokeWidth={1.2} />
            <div>
              <span>Authority</span>
              <strong>Sovereign</strong>
            </div>
          </div>
        </header>

        {error && (
          <div className="world-members__error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="world-members__success" role="status">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* MEMBERS */}
        <section className="world-members__panel">
          <div className="world-members__panel-header">
            <div>
              <span>Imperial Registry</span>
              <h2>Current Membership</h2>
            </div>

            <button
              type="button"
              className="world-members__refresh"
              onClick={() => loadMembers(true)}
              disabled={refreshing}
              aria-label="Refresh world members"
            >
              <RefreshCw size={17} />
            </button>
          </div>

          <div className="world-members__summary">
            <div>
              <Users size={20} />
              <span>Active Members</span>
              <strong>{activeMembers.length}</strong>
            </div>

            <div>
              <UserPlus size={20} />
              <span>Pending Invitations</span>
              <strong>{invitedMembers.length}</strong>
            </div>

            <div>
              <Snowflake size={20} />
              <span>Total Records</span>
              <strong>{members.length}</strong>
            </div>
          </div>

          {refreshing && (
            <p className="world-members__message">
              Updating imperial registry...
            </p>
          )}

          {members.length === 0 ? (
            <p className="world-members__message">
              No membership records available.
            </p>
          ) : (
            <div className="world-members__list">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="world-members__member"
                >
                  <div className="world-members__member-icon">
                    {member.character_name ? (
                      <Crown size={20} strokeWidth={1.2} />
                    ) : (
                      <Users size={20} strokeWidth={1.2} />
                    )}
                  </div>

                  <div className="world-members__member-info">
                    <strong>{member.username}</strong>
                    <span>
                      {member.character_name ||
                        "No character assigned"}
                    </span>
                  </div>

                  <span
                    className={`world-members__member-status world-members__member-status--${member.status}`}
                  >
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {removedMembers.length > 0 && (
            <p className="world-members__footnote">
              Removed members are retained in the registry
              for administrative history.
            </p>
          )}
        </section>

        {/* INVITATIONS */}
        <section className="world-members__panel">
          <div className="world-members__panel-header">
            <div>
              <span>Imperial Recruitment</span>
              <h2>Invite a Player</h2>
            </div>

            <UserPlus size={19} />
          </div>

          <form
            className="world-members__form"
            onSubmit={handleInvite}
          >
            <label htmlFor="invite-username">
              Registered Username
            </label>

            <input
              id="invite-username"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setInviteError("");
                setSuccess("");
              }}
              placeholder="Enter player's username"
              autoComplete="off"
              disabled={inviting}
              required
            />

            <p>
              Only existing active accounts can receive invitations.
              Invited players must accept before entering this world.
            </p>

            {inviteError && (
              <div
                className="world-members__error"
                role="alert"
              >
                {inviteError}
              </div>
            )}

            <button
              type="submit"
              className="world-members__invite-button"
              disabled={inviting || !username.trim()}
            >
              {inviting ? (
                <LoaderCircle
                  size={17}
                  className="world-members__spin"
                />
              ) : (
                <UserPlus size={17} />
              )}

              {inviting
                ? "Sending Invitation..."
                : "Send Invitation"}
            </button>
          </form>
        </section>

        <Link
          to={`/worlds/${worldId}/system`}
          className="world-members__back"
        >
          <ArrowLeft size={16} />
          Return to System Control
        </Link>
      </div>
    </main>
  );
}

export default WorldMembersPage;

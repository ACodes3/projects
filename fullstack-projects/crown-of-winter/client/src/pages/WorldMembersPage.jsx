import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  UserCheck,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Snowflake,
  UserPlus,
  Users,
} from "lucide-react";

import { invitationApi } from "../services/invitationApi";
import { characterApi } from "../services/characterApi";

import "./WorldMembersPage.css";

// Codes verified against the development database.
// SOVEREIGN is intentionally excluded and forbidden by the backend.
const assignableRoles = [
  { code: "AGENT", name: "Fatui Agent" },
  { code: "DIRECTOR", name: "Director" },
  { code: "HARBINGER", name: "Fatui Harbinger" },
  { code: "INTELLIGENCE_OFFICER", name: "Intelligence Officer" },
  { code: "PALACE_ADMIN", name: "Palace Administrator" },
  { code: "PALACE_STAFF", name: "Palace Staff" },
  { code: "RESEARCH_DIRECTOR", name: "Research Director" },
  { code: "RESEARCHER", name: "Researcher" },
];

function WorldMembersPage() {
  const { worldId } = useParams();

  const [members, setMembers] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [rosterError, setRosterError] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [selectedRole, setSelectedRole] = useState("HARBINGER");
  const [assigning, setAssigning] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
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
        try {
          const charactersResponse = await characterApi.getCharacters(worldId);
          setCharacters(charactersResponse?.data?.characters ?? []);
          setRosterError("");
        } catch (characterError) {
          setCharacters([]);
          setRosterError(
            characterError?.message || "Could not load available characters.",
          );
        }
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
    [worldId],
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

      const response = await invitationApi.invite(worldId, cleanUsername);

      setSuccess(response?.message || "Invitation sent successfully.");

      setUsername("");

      await loadMembers(true);
    } catch (err) {
      if (err?.status === 403) {
        setRestricted(true);
      } else {
        setInviteError(err?.message || "Failed to create invitation.");
      }
    } finally {
      setInviting(false);
    }
  }

  async function handleAssignment(event) {
    event.preventDefault();
    if (assigning || !selectedMemberId || !selectedCharacterId) return;

    try {
      setAssigning(true);
      setAssignmentError("");
      setSuccess("");
      const response = await characterApi.assign(
        worldId,
        selectedMemberId,
        selectedCharacterId,
        [selectedRole],
      );
      setSelectedMemberId("");
      setSelectedCharacterId("");
      await loadMembers(true);
      setSuccess(response?.message || "Character assigned successfully.");
    } catch (err) {
      if (err?.status === 403) {
        setRestricted(true);
      } else {
        setAssignmentError(err?.message || "Failed to assign character.");
      }
    } finally {
      setAssigning(false);
    }
  }

  const eligibleMembers = members.filter(
    (member) => member.status === "active" && !member.character_name,
  );

  const availableCharacters = characters.filter(
    (character) =>
      character.assignment_status === "available" &&
      character.slug !== "tsaritsa",
  );

  const activeMembers = members.filter((member) => member.status === "active");

  const invitedMembers = members.filter(
    (member) => member.status === "invited",
  );

  const removedMembers = members.filter(
    (member) => member.status === "removed",
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
            Only the world's Sovereign can manage player invitations and
            membership records.
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
              Manage imperial membership records and invite registered players
              into your world.
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
                <div key={member.id} className="world-members__member">
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
                      {member.character_name || "No character assigned"}
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
              Removed members are retained in the registry for administrative
              history.
            </p>
          )}
        </section>

        {/* CHARACTER ASSIGNMENT */}
        <section className="world-members__panel">
          <div className="world-members__panel-header">
            <div>
              <span>Imperial Appointments</span>
              <h2>Assign a Character</h2>
            </div>
            <UserCheck size={19} />
          </div>

          <form className="world-members__form" onSubmit={handleAssignment}>
            <label htmlFor="assignment-member">World Member</label>
            <select
              id="assignment-member"
              value={selectedMemberId}
              onChange={(event) => setSelectedMemberId(event.target.value)}
              disabled={assigning || refreshing}
              required
            >
              <option value="">Select an unassigned active member</option>
              {eligibleMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.username}
                </option>
              ))}
            </select>

            <label htmlFor="assignment-character">Available Character</label>
            <select
              id="assignment-character"
              value={selectedCharacterId}
              onChange={(event) => setSelectedCharacterId(event.target.value)}
              disabled={assigning || refreshing || Boolean(rosterError)}
              required
            >
              <option value="">Select a playable character</option>
              {availableCharacters.map((character) => (
                <option
                  key={character.character_id}
                  value={character.character_id}
                >
                  {character.name}
                  {character.title ? ` — ${character.title}` : ""}
                </option>
              ))}
            </select>

            <label htmlFor="assignment-role">Initial Role</label>
            <select
              id="assignment-role"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
              disabled={assigning || refreshing}
              required
            >
              {assignableRoles.map((role) => (
                <option key={role.code} value={role.code}>
                  {role.name}
                </option>
              ))}
            </select>

            <p>
              Assign one available playable character and an initial role to an
              active world member. The Tsaritsa cannot be reassigned.
            </p>

            {rosterError && (
              <div className="world-members__error" role="alert">
                {rosterError} Use the membership refresh button to retry.
              </div>
            )}
            {assignmentError && (
              <div className="world-members__error" role="alert">
                {assignmentError}
              </div>
            )}
            {!rosterError && availableCharacters.length === 0 && (
              <p>No available characters found.</p>
            )}

            <button
              type="submit"
              className="world-members__invite-button"
              disabled={
                assigning ||
                refreshing ||
                Boolean(rosterError) ||
                !selectedMemberId ||
                !selectedCharacterId ||
                !selectedRole
              }
            >
              {assigning ? (
                <LoaderCircle size={17} className="world-members__spin" />
              ) : (
                <UserCheck size={17} />
              )}
              {assigning ? "Assigning Character..." : "Assign Character"}
            </button>
          </form>
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

          <form className="world-members__form" onSubmit={handleInvite}>
            <label htmlFor="invite-username">Registered Username</label>

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
              Only existing active accounts can receive invitations. Invited
              players must accept before entering this world.
            </p>

            {inviteError && (
              <div className="world-members__error" role="alert">
                {inviteError}
              </div>
            )}

            <button
              type="submit"
              className="world-members__invite-button"
              disabled={inviting || !username.trim()}
            >
              {inviting ? (
                <LoaderCircle size={17} className="world-members__spin" />
              ) : (
                <UserPlus size={17} />
              )}

              {inviting ? "Sending Invitation..." : "Send Invitation"}
            </button>
          </form>
        </section>

        <Link to={`/worlds/${worldId}/system`} className="world-members__back">
          <ArrowLeft size={16} />
          Return to System Control
        </Link>
      </div>
    </main>
  );
}

export default WorldMembersPage;

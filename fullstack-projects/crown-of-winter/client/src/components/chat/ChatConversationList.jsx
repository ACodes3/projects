import { useMemo, useState } from "react";
import { ArrowLeft, Crown, Search, UserRound, Users } from "lucide-react";

const ui = {
  section: { display: "flex", flexDirection: "column", gap: 8, minHeight: 0 },
  search: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #29475c",
    borderRadius: 8,
    padding: "9px 11px",
    background: "#102435",
    color: "#9fbacd",
  },
  input: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#e5f4fb",
    font: "inherit",
    fontSize: 12,
  },
  heading: {
    margin: "13px 4px 4px",
    color: "#83aec5",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    width: "100%",
    padding: "11px 10px",
    border: "1px solid transparent",
    borderRadius: 9,
    textAlign: "left",
    color: "#e1eef7",
    background: "transparent",
    cursor: "pointer",
    font: "inherit",
  },
  avatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: "50%",
    flexShrink: 0,
    background: "#193d57",
    color: "#b5dff2",
    overflow: "hidden",
  },
  name: {
    fontSize: 12,
    fontWeight: 650,
    color: "#e6f3f9",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  snippet: {
    fontSize: 10,
    color: "#8cabbc",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginTop: 3,
  },
  status: { color: "#9bb7c6", fontSize: 11, padding: "12px 6px", margin: 0 },
  unreadBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    minWidth: 19,
    height: 19,
    padding: "0 5px",
    borderRadius: 999,
    background: "#9dcfe1",
    color: "#0b2030",
    fontFamily: "Arial, sans-serif",
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1,
    boxSizing: "border-box",
  },
};

function CharacterAvatar({ slug, portraitUrl, world = false }) {
  return (
    <span style={ui.avatar} aria-hidden="true">
      {portraitUrl ? (
        <img
          src={portraitUrl}
          alt=""
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : world ? (
        <Users size={18} strokeWidth={1.5} />
      ) : slug === "tsaritsa" ? (
        <Crown size={18} strokeWidth={1.5} />
      ) : (
        <UserRound size={18} strokeWidth={1.5} />
      )}
    </span>
  );
}

function ConversationUnreadBadge({ count }) {
  const unread = Number(count);
  if (!Number.isFinite(unread) || unread <= 0) return null;

  return (
    <span
      style={ui.unreadBadge}
      aria-label={`${unread} unread messages`}
      title={`${unread} unread messages`}
    >
      {unread > 99 ? "99+" : unread}
    </span>
  );
}

/**
 * Conversation picker for Imperial Communications.
 *
 * Props:
 * - conversations: GET /chat/conversations -> data.conversations
 * - contacts: GET /chat/contacts -> data.contacts
 * - unreadCounts: conversation ID -> unread message count
 * - loading: whether the parent is loading conversations/contacts
 * - error: optional load/create error string
 * - creatingContactId: world_character_id being opened (optional)
 * - onSelectConversation(conversation): opens the selected existing chat
 * - onStartDirect(contact): parent creates/reopens the direct chat, then opens it
 * - onRetry(): retries the parent API requests (optional)
 *
 * This component does not invent chats or send requests itself.
 */
export default function ChatConversationList({
  conversations = [],
  contacts = [],
  unreadCounts = {},
  loading = false,
  error = "",
  creatingContactId = null,
  onSelectConversation,
  onStartDirect,
  onRetry,
}) {
  const [query, setQuery] = useState("");
  const [showContacts, setShowContacts] = useState(false);

  const worldConversation = conversations.find(
    (entry) => entry.kind === "world",
  );
  const directs = conversations.filter((entry) => entry.kind === "direct");
  const startedContactIds = useMemo(
    () => new Set(directs.map((entry) => entry.other_world_character_id)),
    [directs],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const includesQuery = (text) =>
    String(text || "")
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  const visibleDirects = directs.filter((entry) =>
    includesQuery(entry.other_name),
  );
  const availableContacts = contacts.filter(
    (contact) =>
      !startedContactIds.has(contact.world_character_id) &&
      includesQuery(contact.name),
  );

  function openContactPicker() {
    setShowContacts(true);
    setQuery("");
  }

  return (
    <div style={ui.section}>
      <label style={ui.search}>
        <Search size={14} strokeWidth={1.6} />
        <input
          type="search"
          aria-label={showContacts ? "Search players" : "Search conversations"}
          placeholder={
            showContacts ? "Search players..." : "Search conversations..."
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={ui.input}
        />
      </label>

      {error && (
        <div role="alert" style={{ ...ui.status, color: "#f0aaa9" }}>
          {error}{" "}
          {onRetry && (
            <button type="button" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      )}

      {showContacts ? (
        <>
          <button
            type="button"
            onClick={() => {
              setShowContacts(false);
              setQuery("");
            }}
            style={{ ...ui.item, color: "#b5def1", paddingLeft: 4 }}
          >
            <ArrowLeft size={15} />{" "}
            <span style={{ fontSize: 12 }}>Back to conversations</span>
          </button>
          <p style={ui.heading}>NEW PRIVATE CORRESPONDENCE</p>
          {loading && <p style={ui.status}>Loading players...</p>}
          {!loading && availableContacts.length === 0 && (
            <p style={ui.status}>
              {normalizedQuery
                ? "No matching players."
                : "No other available players."}
            </p>
          )}
          {availableContacts.map((contact) => (
            <button
              key={contact.world_character_id}
              type="button"
              disabled={Boolean(creatingContactId)}
              onClick={() => onStartDirect?.(contact)}
              style={{
                ...ui.item,
                opacity:
                  creatingContactId &&
                  creatingContactId !== contact.world_character_id
                    ? 0.5
                    : 1,
              }}
            >
              <CharacterAvatar
                slug={contact.slug}
                portraitUrl={contact.portrait_url}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ ...ui.name, display: "block" }}>
                  {contact.name}
                </span>
                <span style={{ ...ui.snippet, display: "block" }}>
                  {creatingContactId === contact.world_character_id
                    ? "Opening correspondence..."
                    : "Start a private conversation"}
                </span>
              </span>
            </button>
          ))}
        </>
      ) : (
        <>
          <p style={ui.heading}>COMMON CHANNEL</p>
          {loading && <p style={ui.status}>Loading conversations...</p>}
          {!loading &&
            worldConversation &&
            includesQuery("Imperial Alliance") && (
              <button
                type="button"
                onClick={() => onSelectConversation?.(worldConversation)}
                style={{
                  ...ui.item,
                  background: "#163248",
                  borderColor: "#2f5268",
                }}
              >
                <CharacterAvatar world />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ ...ui.name, display: "block" }}>
                    Imperial Alliance
                  </span>
                  <span style={{ ...ui.snippet, display: "block" }}>
                    {worldConversation.last_message_content ||
                      "Common chat for everyone in this world"}
                  </span>
                </span>
                <ConversationUnreadBadge
                  count={unreadCounts[worldConversation.id] ?? 0}
                />
              </button>
            )}
          <p style={ui.heading}>PRIVATE CORRESPONDENCES</p>
          {!loading && visibleDirects.length === 0 && (
            <p style={ui.status}>
              {normalizedQuery
                ? "No matching conversations."
                : "No private conversations yet."}
            </p>
          )}
          {visibleDirects.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelectConversation?.(conversation)}
              style={ui.item}
            >
              <CharacterAvatar
                slug={conversation.other_slug}
                portraitUrl={conversation.other_portrait_url}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ ...ui.name, display: "block" }}>
                  {conversation.other_name || "Unknown character"}
                </span>
                <span style={{ ...ui.snippet, display: "block" }}>
                  {conversation.last_message_content || "No messages yet"}
                </span>
              </span>
              <ConversationUnreadBadge
                count={unreadCounts[conversation.id] ?? 0}
              />
            </button>
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={openContactPicker}
            style={{
              ...ui.item,
              borderColor: "#315369",
              color: "#bce2f6",
              justifyContent: "center",
              marginTop: 8,
              fontSize: 12,
            }}
          >
            + New correspondence
          </button>
        </>
      )}
    </div>
  );
}

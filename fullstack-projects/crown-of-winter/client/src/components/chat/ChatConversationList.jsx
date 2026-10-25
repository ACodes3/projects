import { useMemo, useState } from "react";
import { ArrowLeft, Crown, Plus, Search, UserRound, Users } from "lucide-react";
import "./ChatConversationList.css";

function CharacterAvatar({ slug, portraitUrl, world = false }) {
  return (
    <span
      className={`imperial-conversations__avatar${world ? " imperial-conversations__avatar--world" : ""}`}
      aria-hidden="true"
    >
      {portraitUrl ? (
        <img src={portraitUrl} alt="" loading="lazy" />
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
      className="imperial-conversations__unread"
      aria-label={`${unread} unread messages`}
      title={`${unread} unread messages`}
    >
      {unread > 99 ? "99+" : unread}
    </span>
  );
}

function ConversationRow({
  conversation,
  isWorld = false,
  unread = 0,
  onClick,
}) {
  const hasUnread = Number(unread) > 0;
  const name = isWorld
    ? "Imperial Alliance"
    : conversation.other_name || "Unknown character";
  const preview =
    conversation.last_message_content ||
    (isWorld ? "Common chat for everyone in this world" : "No messages yet");

  return (
    <button
      type="button"
      className={[
        "imperial-conversations__row",
        isWorld && "imperial-conversations__row--world",
        hasUnread && "imperial-conversations__row--unread",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onClick?.(conversation)}
      aria-label={`${name}${hasUnread ? `, ${unread} unread messages` : ""}`}
    >
      <CharacterAvatar
        world={isWorld}
        slug={conversation.other_slug}
        portraitUrl={conversation.other_portrait_url}
      />
      <span className="imperial-conversations__row-text">
        <span className="imperial-conversations__name">{name}</span>
        <span className="imperial-conversations__preview">{preview}</span>
      </span>
      <ConversationUnreadBadge count={unread} />
    </button>
  );
}

/** Conversation picker: all rows and unread counts are supplied by the parent API. */
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
  const includesQuery = (value) =>
    String(value || "")
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
    <div className="imperial-conversations">
      <label className="imperial-conversations__search">
        <Search size={15} strokeWidth={1.6} aria-hidden="true" />
        <input
          type="search"
          aria-label={showContacts ? "Search players" : "Search conversations"}
          placeholder={
            showContacts ? "Search players..." : "Search conversations..."
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {error && (
        <div className="imperial-conversations__error" role="alert">
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
            className="imperial-conversations__back"
            onClick={() => {
              setShowContacts(false);
              setQuery("");
            }}
          >
            <ArrowLeft size={15} strokeWidth={1.6} />
            <span>Back to conversations</span>
          </button>
          <p className="imperial-conversations__heading">
            NEW PRIVATE CORRESPONDENCE
          </p>
          {loading && (
            <p className="imperial-conversations__status">Loading players...</p>
          )}
          {!loading && availableContacts.length === 0 && (
            <p className="imperial-conversations__status">
              {normalizedQuery
                ? "No matching players."
                : "No other available players."}
            </p>
          )}
          {availableContacts.map((contact) => (
            <button
              key={contact.world_character_id}
              type="button"
              className="imperial-conversations__row"
              disabled={Boolean(creatingContactId)}
              onClick={() => onStartDirect?.(contact)}
            >
              <CharacterAvatar
                slug={contact.slug}
                portraitUrl={contact.portrait_url}
              />
              <span className="imperial-conversations__row-text">
                <span className="imperial-conversations__name">
                  {contact.name}
                </span>
                <span className="imperial-conversations__preview">
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
          <p className="imperial-conversations__heading">COMMON CHANNEL</p>
          {loading && (
            <p className="imperial-conversations__status">
              Loading conversations...
            </p>
          )}
          {!loading &&
            worldConversation &&
            includesQuery("Imperial Alliance") && (
              <ConversationRow
                conversation={worldConversation}
                isWorld
                unread={unreadCounts[worldConversation.id] ?? 0}
                onClick={onSelectConversation}
              />
            )}

          <p className="imperial-conversations__heading">
            PRIVATE CORRESPONDENCES
          </p>
          {!loading && visibleDirects.length === 0 && (
            <p className="imperial-conversations__status">
              {normalizedQuery
                ? "No matching conversations."
                : "No private conversations yet."}
            </p>
          )}
          {visibleDirects.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              unread={unreadCounts[conversation.id] ?? 0}
              onClick={onSelectConversation}
            />
          ))}

          <button
            type="button"
            className="imperial-conversations__new"
            disabled={loading}
            onClick={openContactPicker}
          >
            <Plus size={14} strokeWidth={1.7} />
            <span>New correspondence</span>
          </button>
        </>
      )}
    </div>
  );
}

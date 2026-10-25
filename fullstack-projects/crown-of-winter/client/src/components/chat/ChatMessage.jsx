
import { Crown, UserRound } from "lucide-react";

import "./ChatMessage.css";

function formatMessageTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChatMessage({ message, isOwnMessage = false }) {
  if (!message) return null;

  const {
    sender_name,
    sender_slug,
    sender_portrait_url,
    content,
    created_at,
  } = message;

  const isTsaritsa = sender_slug === "tsaritsa";
  const displayName = sender_name || "Unknown Character";

  return (
    <article
      className={`imperial-chat-message ${
        isOwnMessage
          ? "imperial-chat-message--own"
          : "imperial-chat-message--other"
      }`}
    >
      <div className="imperial-chat-message__avatar">
        {sender_portrait_url ? (
          <img
            src={sender_portrait_url}
            alt={`${displayName} portrait`}
            loading="lazy"
          />
        ) : isTsaritsa ? (
          <Crown size={17} strokeWidth={1.4} />
        ) : (
          <UserRound size={17} strokeWidth={1.4} />
        )}
      </div>

      <div className="imperial-chat-message__body">
        <div className="imperial-chat-message__meta">
          <span className="imperial-chat-message__name">
            {displayName}
            {isOwnMessage && " · You"}
          </span>

          <time dateTime={created_at}>
            {formatMessageTime(created_at)}
          </time>
        </div>

        <div className="imperial-chat-message__bubble">
          {content}
        </div>
      </div>
    </article>
  );
}

export default ChatMessage;

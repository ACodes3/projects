import {
  LayoutDashboard,
  Crown,
  Castle,
  Map as MapIcon,
  Users,
  FileText,
  Gem,
  Archive,
  Settings,
  Snowflake,
  ArrowLeftRight,
  MessageSquare,
  X,
  Send,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { authApi } from "../services/api";
import { useWorldAccess } from "../context/WorldAccessContext";
import { socket, connectSocket, disconnectSocket } from "../services/socket";
import { chatApi } from "../services/chatApi";
import ChatMessage from "../components/chat/ChatMessage";

import "./AppShell.css";

// Merges REST responses, history and Socket.IO events without duplicate messages.
function mergeChatMessages(current, incoming) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) {
    if (message?.id) byId.set(message.id, message);
  }
  return [...byId.values()]
    .sort(
      (a, b) =>
        new Date(a.created_at) - new Date(b.created_at) ||
        String(a.id).localeCompare(String(b.id)),
    )
    .slice(-50);
}

const navigation = [
  {
    label: "Imperial Command",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "The Tsaritsa",
    path: "/tsaritsa",
    icon: Crown,
  },
  {
    label: "Palace",
    path: "/palace",
    icon: Castle,
  },
  {
    label: "War Table",
    path: "/war-table",
    icon: MapIcon,
  },
  {
    label: "Harbingers",
    path: "/harbingers",
    icon: Users,
  },
  {
    label: "Intelligence",
    path: "/intelligence",
    icon: FileText,
  },
  {
    label: "Project: Gnoses",
    path: "/gnoses",
    icon: Gem,
  },
  {
    label: "Relic Vault",
    path: "/relic-vault",
    icon: Archive,
  },
];

function AppShell({ user, onLogout }) {
  const navigate = useNavigate();
  const { worldId } = useParams();
  const worldBase = worldId ? `/worlds/${worldId}` : "/worlds";
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState("loading");
  const [chatError, setChatError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const currentWorldIdRef = useRef(worldId?.toLowerCase());

  useEffect(() => {
    currentWorldIdRef.current = worldId?.toLowerCase();
  }, [worldId]);

  // Character identity and permissions are shared across all world pages.
  const { status, character } = useWorldAccess();
  const hasCharacter = Boolean(character);

  const roleNames = {
    SOVEREIGN: "Sovereign",
    HARBINGER: "Fatui Harbinger",
    AGENT: "Fatui Agent",
    DIRECTOR: "Director",
    INTELLIGENCE_OFFICER: "Intelligence Officer",
    PALACE_ADMIN: "Palace Administrator",
    PALACE_STAFF: "Palace Staff",
    RESEARCH_DIRECTOR: "Research Director",
    RESEARCHER: "Researcher",
  };
  const roleLabel = character?.roles
    ?.map((code) => roleNames[code] || code)
    .join(" · ");

  // Keep one authenticated Socket.IO connection for the entire active world.
  // Page components subscribe to events, but must NOT disconnect this socket.
  useEffect(() => {
    if (!worldId || status !== "ready" || !hasCharacter) {
      disconnectSocket();
      return;
    }

    const activeWorldId = worldId.toLowerCase();
    let disposed = false;

    function joinWorld() {
      if (disposed || !socket.connected) return;

      socket.emit("world:join", activeWorldId, (response) => {
        if (disposed) return;
        if (!response?.success) {
          console.warn(
            "Imperial Network: unable to join world",
            response?.message,
          );
        }
      });
    }

    function handleConnectError(error) {
      if (!disposed) {
        console.warn("Imperial Network connection error:", error.message);
      }
    }

    function handleAccessRevoked(payload) {
      if (payload?.worldId?.toLowerCase() === activeWorldId) {
        disconnectSocket();
        setChatOpen(false);
      }
    }

    socket.on("connect", joinWorld);
    socket.on("connect_error", handleConnectError);
    socket.on("world:access-revoked", handleAccessRevoked);

    connectSocket();
    if (socket.connected) joinWorld();

    return () => {
      disposed = true;
      socket.off("connect", joinWorld);
      socket.off("connect_error", handleConnectError);
      socket.off("world:access-revoked", handleAccessRevoked);
      // Disconnect on world switch or when AppShell unmounts (sign-out).
      // The War Table will be updated next to stop managing this lifecycle.
      disconnectSocket();
    };
  }, [worldId, status, hasCharacter]);

  // Listen globally, including while the popup is closed.
  useEffect(() => {
    let active = true;
    const normalizedWorldId = worldId?.toLowerCase();

    async function loadHistory() {
      try {
        const response = await chatApi.getMessages(normalizedWorldId);
        if (!active) return;
        if (!response?.success || !Array.isArray(response.data?.messages)) {
          throw new Error("Invalid chat history response.");
        }
        setMessages((current) =>
          mergeChatMessages(current, response.data.messages),
        );
        setChatStatus("ready");
        setChatError("");
      } catch (error) {
        if (!active) return;
        setChatStatus("error");
        setChatError(error?.message || "Unable to load messages.");
      }
    }

    function handleNewMessage(payload) {
      if (!active || payload?.worldId?.toLowerCase() !== normalizedWorldId)
        return;
      if (payload.message?.id) {
        setMessages((current) => mergeChatMessages(current, [payload.message]));
      }
    }

    // Restore messages missed during a temporary network disconnection.
    function handleReconnect() {
      void loadHistory();
    }

    socket.on("chat:message-created", handleNewMessage);
    socket.on("connect", handleReconnect);

    // Defer initialization so this effect does not synchronously trigger a render.
    queueMicrotask(() => {
      if (!active) return;

      setMessages([]);
      setChatError("");
      setDraft("");

      if (!normalizedWorldId || status !== "ready" || !hasCharacter) {
        setChatStatus("unavailable");
        return;
      }

      setChatStatus("loading");
      void loadHistory();
    });

    return () => {
      active = false;
      socket.off("chat:message-created", handleNewMessage);
      socket.off("connect", handleReconnect);
    };
  }, [worldId, status, hasCharacter]);

  useEffect(() => {
    if (chatOpen) messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [chatOpen, messages]);

  async function handleSendMessage(event) {
    event.preventDefault();
    const content = draft.trim();
    if (
      !worldId ||
      !hasCharacter ||
      chatStatus !== "ready" ||
      sending ||
      !content
    )
      return;
    if (content.length > 2000) {
      setChatError("Messages must be 2000 characters or fewer.");
      return;
    }

    const sendingWorldId = worldId.toLowerCase();
    setSending(true);
    setChatError("");
    try {
      const response = await chatApi.sendMessage(sendingWorldId, content);
      if (!response?.success || !response.data?.message?.id) {
        throw new Error(response?.message || "Unable to send message.");
      }
      if (currentWorldIdRef.current !== sendingWorldId) return;
      // A socket event may have arrived first; merge by ID either way.
      setMessages((current) =>
        mergeChatMessages(current, [response.data.message]),
      );
      setDraft((current) => (current === content ? "" : current));
    } catch (error) {
      if (currentWorldIdRef.current === sendingWorldId) {
        setChatError(error?.message || "Unable to send message.");
      }
    } finally {
      setSending(false);
    }
  }

  // Chat is a global AppShell popup, not a route.
  useEffect(() => {
    if (!chatOpen) return;

    function closeOnEscape(event) {
      if (event.key === "Escape") setChatOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [chatOpen]);

  async function handleLogout() {
    if (loggingOut) return;

    setLogoutError("");
    setLoggingOut(true);

    try {
      await authApi.logout();
      disconnectSocket();
      setChatOpen(false);
      onLogout();
      navigate("/", { replace: true });
    } catch (error) {
      setLogoutError(error?.message || "Could not sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="app-shell__brand">
          <Snowflake size={28} strokeWidth={1.3} />

          <div>
            <strong>Crown of Winter</strong>
            <span>Winter Palace</span>
          </div>
        </div>

        <nav className="app-shell__nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={`${worldBase}${item.path}`}
                className={({ isActive }) =>
                  `app-shell__nav-item ${
                    isActive ? "app-shell__nav-item--active" : ""
                  }`
                }
              >
                <Icon size={17} strokeWidth={1.4} />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="app-shell__sidebar-bottom">
          <NavLink to="/worlds" className="app-shell__nav-item">
            <ArrowLeftRight size={17} strokeWidth={1.4} />
            <span>Switch World</span>
          </NavLink>

          <NavLink
            to={`${worldBase}/system`}
            className={({ isActive }) =>
              `app-shell__nav-item ${
                isActive ? "app-shell__nav-item--active" : ""
              }`
            }
          >
            <Settings size={17} strokeWidth={1.4} />

            <span>System</span>
          </NavLink>

          <button
            type="button"
            className="app-shell__nav-item"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              textAlign: "left",
              cursor: loggingOut ? "wait" : "pointer",
            }}
          >
            <LogOut size={17} strokeWidth={1.4} />
            <span>{loggingOut ? "Signing Out..." : "Sign Out"}</span>
          </button>

          {logoutError && (
            <p
              role="alert"
              style={{
                color: "#ffb4b4",
                fontSize: "0.8rem",
                padding: "0 1rem",
              }}
            >
              {logoutError}
            </p>
          )}
        </div>
      </aside>

      <section className="app-shell__main">
        <header className="app-shell__topbar">
          <div className="app-shell__topbar-heading">
            <span className="app-shell__topbar-label">Imperial Network</span>
            <strong>Winter Palace Command</strong>
          </div>

          <div className="app-shell__topbar-right">
            <button
              type="button"
              className={`app-shell__chat-launcher${chatOpen ? " app-shell__chat-launcher--active" : ""}`}
              aria-label={
                chatOpen
                  ? "Close Imperial Communications"
                  : "Open Imperial Communications"
              }
              aria-controls="imperial-communications-popup"
              aria-expanded={chatOpen}
              title="Imperial Communications"
              onClick={() => setChatOpen((open) => !open)}
            >
              <MessageSquare size={18} strokeWidth={1.5} />
              <span>Communications</span>
            </button>

            <div className="app-shell__identity" aria-live="polite">
              <div className="app-shell__identity-icon">
                <Crown size={19} strokeWidth={1.3} />
              </div>

              <div className="app-shell__identity-info">
                {status === "loading" && (
                  <span>Verifying character identity...</span>
                )}

                {status === "ready" && character && (
                  <>
                    <strong>{character.name}</strong>
                    <span>
                      {[roleLabel, user?.username].filter(Boolean).join(" · ")}
                    </span>
                  </>
                )}

                {status === "ready" && !character && (
                  <span>Character identity unavailable</span>
                )}

                {status === "unassigned" && (
                  <>
                    <strong>Awaiting Character Assignment</strong>
                    {user?.username && <span>{user.username}</span>}
                  </>
                )}

                {status === "error" && (
                  <>
                    <strong>Character identity unavailable</strong>
                    {user?.username && <span>{user.username}</span>}
                  </>
                )}
              </div>
            </div>

            <div className="app-shell__status">
              <span className="app-shell__status-dot" />
              Cryo Network // Online
            </div>
          </div>
        </header>

        <div className="app-shell__content">
          <Outlet />
        </div>

        {chatOpen && (
          <section
            id="imperial-communications-popup"
            className="app-shell__chat-popup"
            role="dialog"
            aria-modal="false"
            aria-label="Imperial Communications"
          >
            <header className="app-shell__chat-header">
              <div className="app-shell__chat-heading">
                <MessageSquare size={17} strokeWidth={1.4} />
                <div>
                  <strong>Imperial Communications</strong>
                  <span>
                    WORLD CHANNEL · {character?.name ?? "WINTER PALACE"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="app-shell__chat-close"
                aria-label="Close chat"
                onClick={() => setChatOpen(false)}
              >
                <X size={16} />
              </button>
            </header>

            <div
              className="app-shell__chat-messages"
              role="log"
              aria-label="World chat messages"
              aria-live="polite"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                padding: "16px 14px",
              }}
            >
              {chatStatus === "loading" && (
                <p>Loading imperial communications...</p>
              )}
              {chatStatus === "unavailable" && (
                <p>Active character access required.</p>
              )}
              {chatStatus === "ready" && messages.length === 0 && (
                <p
                  style={{
                    color: "#86aabd",
                    fontSize: 11,
                    textAlign: "center",
                  }}
                >
                  No messages yet. Begin the imperial correspondence.
                </p>
              )}
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwnMessage={message.sender_user_id === user?.id}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {chatError && (
              <p
                role="alert"
                style={{ color: "#f0aaa9", fontSize: 10, margin: "0 14px 8px" }}
              >
                {chatError}
              </p>
            )}

            <form
              className="app-shell__chat-compose"
              onSubmit={handleSendMessage}
            >
              <input
                type="text"
                placeholder={
                  chatStatus === "ready"
                    ? "Transmit a message..."
                    : "Communications unavailable"
                }
                aria-label="Message"
                value={draft}
                maxLength={2000}
                onChange={(event) => setDraft(event.target.value)}
                disabled={chatStatus !== "ready" || sending}
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={chatStatus !== "ready" || sending || !draft.trim()}
              >
                <Send size={17} />
              </button>
            </form>
          </section>
        )}
      </section>
    </div>
  );
}

export default AppShell;

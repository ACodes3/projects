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
  ArrowLeft,
  X,
  Send,
  LogOut,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";

import { authApi } from "../services/api";
import { useWorldAccess } from "../context/WorldAccessContext";
import { socket, connectSocket, disconnectSocket } from "../services/socket";
import { chatApi } from "../services/chatApi";

import ChatMessage from "../components/chat/ChatMessage";
import ChatConversationList from "../components/chat/ChatConversationList";

import "./AppShell.css";

// ==========================================
// CHAT MESSAGE HELPERS
// ==========================================

function mergeChatMessages(current, incoming) {
  const byId = new Map(current.map((message) => [message.id, message]));

  for (const message of incoming) {
    if (message?.id) {
      byId.set(message.id, message);
    }
  }

  return [...byId.values()]
    .sort(
      (a, b) =>
        new Date(a.created_at) - new Date(b.created_at) ||
        String(a.id).localeCompare(String(b.id)),
    )
    .slice(-50);
}

// ==========================================
// SIDEBAR NAVIGATION
// ==========================================

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

// ==========================================
// APP SHELL
// ==========================================

function AppShell({ user, onLogout }) {
  const navigate = useNavigate();
  const { worldId } = useParams();

  const worldBase = worldId ? `/worlds/${worldId}` : "/worlds";

  const activeWorldId = worldId?.toLowerCase();

  // ----------------------------------------
  // Account state
  // ----------------------------------------

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  // ----------------------------------------
  // Communications state
  // ----------------------------------------

  const [chatOpen, setChatOpen] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);

  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  const [creatingContactId, setCreatingContactId] = useState(null);

  const [selectedConversation, setSelectedConversation] = useState(null);

  const [messages, setMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState("loading");
  const [chatError, setChatError] = useState("");

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  // ----------------------------------------
  // Refs
  // ----------------------------------------

  const messagesEndRef = useRef(null);

  const worldIdRef = useRef(activeWorldId);
  const selectedConversationRef = useRef(null);

  useEffect(() => {
    worldIdRef.current = activeWorldId;
  }, [activeWorldId]);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation?.id ?? null;
  }, [selectedConversation]);

  // ----------------------------------------
  // Character identity
  // ----------------------------------------

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

  const selectedId = selectedConversation?.id ?? null;

  // ==========================================
  // GLOBAL SOCKET CONNECTION
  // ==========================================

  useEffect(() => {
    if (!activeWorldId || status !== "ready" || !hasCharacter) {
      disconnectSocket();
      return;
    }

    let disposed = false;

    function joinWorld() {
      if (disposed || !socket.connected) {
        return;
      }

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

    function debugPrivateMessage(payload) {
      console.log("[GLOBAL SOCKET] Private message arrived:", payload);
    }

    socket.on("chat:conversation-message-created", debugPrivateMessage);

    socket.on("connect", joinWorld);

    socket.on("connect_error", handleConnectError);

    socket.on("world:access-revoked", handleAccessRevoked);

    connectSocket();

    if (socket.connected) {
      joinWorld();
    }

    return () => {
      disposed = true;

      socket.off("chat:conversation-message-created", debugPrivateMessage);

      socket.off("connect", joinWorld);

      socket.off("connect_error", handleConnectError);

      socket.off("world:access-revoked", handleAccessRevoked);

      disconnectSocket();
    };
  }, [activeWorldId, status, hasCharacter]);

  // ==========================================
  // LOAD CONVERSATIONS AND CONTACTS
  // ==========================================

  async function refreshConversationList() {
    if (!activeWorldId || status !== "ready" || !hasCharacter) {
      return;
    }

    const targetWorld = activeWorldId;

    try {
      const [chatsResult, contactsResult] = await Promise.all([
        chatApi.getConversations(targetWorld),
        chatApi.getContacts(targetWorld),
      ]);

      if (worldIdRef.current !== targetWorld) {
        return;
      }

      if (
        !chatsResult?.success ||
        !Array.isArray(chatsResult.data?.conversations) ||
        !contactsResult?.success ||
        !Array.isArray(contactsResult.data?.contacts)
      ) {
        throw new Error("Invalid conversations response.");
      }

      setConversations(chatsResult.data.conversations);

      setContacts(contactsResult.data.contacts);

      setListError("");
    } catch (error) {
      if (worldIdRef.current === targetWorld) {
        setListError(error?.message || "Unable to load conversations.");
      }
    }
  }

  // Reload the list while Communications is open.
  // This temporarily discovers new private chats
  // without requiring private Socket.IO events.

  useEffect(() => {
    if (!chatOpen || !activeWorldId || status !== "ready" || !hasCharacter) {
      return;
    }

    let active = true;

    queueMicrotask(() => {
      if (!active) return;

      setListLoading(true);

      void refreshConversationList().finally(() => {
        if (active) {
          setListLoading(false);
        }
      });
    });

    const interval = window.setInterval(() => {
      void refreshConversationList();
    }, 8000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen, activeWorldId, status, hasCharacter]);

  // ==========================================
  // RESET CHAT ON WORLD SWITCH
  // ==========================================

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedConversation(null);
      setConversations([]);
      setContacts([]);
      setMessages([]);
      setDraft("");
      setChatError("");
    });
  }, [activeWorldId]);

  // ==========================================
  // SELECTED CONVERSATION MESSAGES
  // ==========================================

  useEffect(() => {
    if (!selectedId || !activeWorldId || status !== "ready" || !hasCharacter) {
      return;
    }

    let active = true;

    const conversationId = selectedId;
    const world = activeWorldId;

    async function loadMessages() {
      try {
        const response = await chatApi.getConversationMessages(
          world,
          conversationId,
        );

        if (!active) return;

        if (!response?.success || !Array.isArray(response.data?.messages)) {
          throw new Error("Invalid messages response.");
        }

        setMessages((current) =>
          mergeChatMessages(current, response.data.messages),
        );

        setChatStatus("ready");
        setChatError("");
      } catch (error) {
        if (!active) return;

        setChatStatus("error");
        setChatError(error?.message || "Unable to retrieve messages.");
      }
    }

    // Legacy real-time event is for
    // the common world chat only.
    // Never insert it into private chats.

    function handleCommonMessage(payload) {
      if (
        !active ||
        selectedConversation?.kind !== "world" ||
        payload?.worldId?.toLowerCase() !== world
      ) {
        return;
      }

      const message = payload.message;

      if (
        message?.id &&
        (!message.conversation_id || message.conversation_id === conversationId)
      ) {
        setMessages((current) => mergeChatMessages(current, [message]));
      }
    }

    function handleReconnect() {
      void loadMessages();
    }

    function handleConversationMessage(payload) {
      console.log("[Imperial Chat] Socket message received:", payload);
      if (
        !active ||
        payload?.worldId?.toLowerCase() !== world ||
        payload?.conversationId !== conversationId
      ) {
        return;
      }

      if (payload.message?.id) {
        setMessages((current) => mergeChatMessages(current, [payload.message]));
      }
    }

    socket.on("chat:message-created", handleCommonMessage);

    socket.on("chat:conversation-message-created", handleConversationMessage);

    socket.on("connect", handleReconnect);

    queueMicrotask(() => {
      if (!active) return;

      setMessages([]);
      setChatStatus("loading");
      setChatError("");

      void loadMessages();
    });

    // Temporary polling until private
    // Socket.IO delivery is implemented.

    const interval = window.setInterval(() => {
      void loadMessages();
    }, 3000);

    return () => {
      active = false;

      socket.off("chat:message-created", handleCommonMessage);

      socket.off(
        "chat:conversation-message-created",
        handleConversationMessage,
      );

      socket.off("connect", handleReconnect);

      window.clearInterval(interval);
    };
  }, [
    activeWorldId,
    selectedId,
    selectedConversation?.kind,
    status,
    hasCharacter,
  ]);

  // ==========================================
  // AUTO-SCROLL CHAT
  // ==========================================

  useEffect(() => {
    if (chatOpen && selectedId) {
      messagesEndRef.current?.scrollIntoView({
        block: "end",
      });
    }
  }, [chatOpen, selectedId, messages]);

  // ==========================================
  // OPEN A CONVERSATION
  // ==========================================

  function openConversation(conversation) {
    if (!conversation?.id) {
      return;
    }

    setSelectedConversation(conversation);

    selectedConversationRef.current = conversation.id;

    setMessages([]);
    setDraft("");
    setChatError("");
  }

  // ==========================================
  // CREATE PRIVATE CORRESPONDENCE
  // ==========================================

  async function startDirectConversation(contact) {
    if (!activeWorldId || !contact?.world_character_id || creatingContactId) {
      return;
    }

    const targetWorld = activeWorldId;

    setCreatingContactId(contact.world_character_id);

    setListError("");

    try {
      const response = await chatApi.createDirectConversation(
        targetWorld,
        contact.world_character_id,
      );

      if (!response?.success || !response.data?.conversation?.id) {
        throw new Error(response?.message || "Unable to start correspondence.");
      }

      if (worldIdRef.current !== targetWorld) {
        return;
      }

      const newConversation = {
        ...response.data.conversation,
        other_world_character_id: contact.world_character_id,
        other_name: contact.name,
        other_slug: contact.slug,
        other_portrait_url: contact.portrait_url,
      };

      openConversation(newConversation);

      void refreshConversationList();
    } catch (error) {
      if (worldIdRef.current === targetWorld) {
        setListError(error?.message || "Unable to start correspondence.");
      }
    } finally {
      setCreatingContactId(null);
    }
  }

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  async function handleSendMessage(event) {
    event.preventDefault();

    const content = draft.trim();

    if (
      !activeWorldId ||
      !selectedId ||
      !hasCharacter ||
      chatStatus !== "ready" ||
      sending ||
      !content
    ) {
      return;
    }

    if (content.length > 2000) {
      setChatError("Messages must be 2000 characters or fewer.");
      return;
    }

    const targetWorld = activeWorldId;
    const targetConversation = selectedId;

    setSending(true);
    setChatError("");

    try {
      const response = await chatApi.sendConversationMessage(
        targetWorld,
        targetConversation,
        content,
      );

      if (!response?.success || !response.data?.message?.id) {
        throw new Error(response?.message || "Unable to send message.");
      }

      if (
        worldIdRef.current !== targetWorld ||
        selectedConversationRef.current !== targetConversation
      ) {
        return;
      }

      setMessages((current) =>
        mergeChatMessages(current, [response.data.message]),
      );

      setDraft((current) => (current.trim() === content ? "" : current));

      void refreshConversationList();
    } catch (error) {
      if (
        worldIdRef.current === targetWorld &&
        selectedConversationRef.current === targetConversation
      ) {
        setChatError(error?.message || "Unable to send message.");
      }
    } finally {
      setSending(false);
    }
  }

  // ==========================================
  // CLOSE CHAT WITH ESCAPE
  // ==========================================

  useEffect(() => {
    if (!chatOpen) return;

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setChatOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [chatOpen]);

  // ==========================================
  // LOGOUT
  // ==========================================

  async function handleLogout() {
    if (loggingOut) return;

    setLogoutError("");
    setLoggingOut(true);

    try {
      await authApi.logout();

      disconnectSocket();
      setChatOpen(false);

      onLogout();

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      setLogoutError(error?.message || "Could not sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="app-shell">
      {/* ===================================
          SIDEBAR
      =================================== */}

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

      {/* ===================================
          MAIN CONTENT
      =================================== */}

      <section className="app-shell__main">
        <header className="app-shell__topbar">
          <div className="app-shell__topbar-heading">
            <span className="app-shell__topbar-label">Imperial Network</span>

            <strong>Winter Palace Command</strong>
          </div>

          <div className="app-shell__topbar-right">
            {/* COMMUNICATIONS BUTTON */}

            <button
              type="button"
              className={`app-shell__chat-launcher${
                chatOpen ? " app-shell__chat-launcher--active" : ""
              }`}
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

            {/* CHARACTER IDENTITY */}

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

        {/* ===================================
            IMPERIAL COMMUNICATIONS POPUP
        =================================== */}

        {chatOpen && (
          <section
            id="imperial-communications-popup"
            className="app-shell__chat-popup"
            role="dialog"
            aria-modal="false"
            aria-label="Imperial Communications"
          >
            {/* CHAT HEADER */}

            <header className="app-shell__chat-header">
              <div
                className="app-shell__chat-heading"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                {selectedConversation && (
                  <button
                    type="button"
                    aria-label="Back to conversations"
                    title="Back to conversations"
                    onClick={() => {
                      setSelectedConversation(null);
                      selectedConversationRef.current = null;
                    }}
                    style={{
                      color: "#b9dff2",
                      background: "none",
                      border: 0,
                      cursor: "pointer",
                      padding: 3,
                    }}
                  >
                    <ArrowLeft size={17} />
                  </button>
                )}

                <MessageSquare size={17} strokeWidth={1.4} />

                <div>
                  <strong>
                    {selectedConversation
                      ? selectedConversation.kind === "world"
                        ? "Imperial Alliance"
                        : selectedConversation.other_name ||
                          "Private Correspondence"
                      : "Imperial Communications"}
                  </strong>

                  <span>
                    {selectedConversation
                      ? selectedConversation.kind === "world"
                        ? "COMMON WORLD CHANNEL"
                        : "PRIVATE CORRESPONDENCE"
                      : "CHOOSE A CONVERSATION"}
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

            {/* =================================
                CONVERSATION SELECTOR
            ================================= */}

            {!selectedConversation ? (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  padding: "12px 14px",
                }}
              >
                <ChatConversationList
                  conversations={conversations}
                  contacts={contacts}
                  loading={listLoading}
                  error={listError}
                  creatingContactId={creatingContactId}
                  onSelectConversation={openConversation}
                  onStartDirect={startDirectConversation}
                  onRetry={() => void refreshConversationList()}
                />

                {(status !== "ready" || !hasCharacter) && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "#86aabd",
                    }}
                  >
                    Active character access required.
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* ===========================
                    SELECTED CHAT MESSAGES
                =========================== */}

                <div
                  className="app-shell__chat-messages"
                  role="log"
                  aria-label="Conversation messages"
                  aria-live="polite"
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    padding: "16px 14px",
                  }}
                >
                  {chatStatus === "loading" && <p>Loading correspondence...</p>}

                  {chatStatus === "ready" && messages.length === 0 && (
                    <p
                      style={{
                        color: "#86aabd",
                        fontSize: 11,
                        textAlign: "center",
                      }}
                    >
                      No messages yet. Begin the correspondence.
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

                {/* CHAT ERROR */}

                {chatError && (
                  <p
                    role="alert"
                    style={{
                      color: "#f0aaa9",
                      fontSize: 10,
                      margin: "0 14px 8px",
                    }}
                  >
                    {chatError}
                  </p>
                )}

                {/* ===========================
                    MESSAGE COMPOSER
                =========================== */}

                <form
                  className="app-shell__chat-compose"
                  onSubmit={handleSendMessage}
                >
                  <input
                    type="text"
                    aria-label="Message"
                    placeholder={
                      chatStatus === "ready"
                        ? "Transmit a message..."
                        : "Communications unavailable"
                    }
                    value={draft}
                    maxLength={2000}
                    onChange={(event) => setDraft(event.target.value)}
                    disabled={chatStatus !== "ready" || sending}
                  />

                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={
                      chatStatus !== "ready" || sending || !draft.trim()
                    }
                  >
                    <Send size={17} />
                  </button>
                </form>
              </>
            )}
          </section>
        )}
      </section>
    </div>
  );
}

export default AppShell;

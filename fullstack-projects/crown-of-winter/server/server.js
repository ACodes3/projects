import "dotenv/config";

import { createServer } from "node:http";
import { Server } from "socket.io";

import app from "./app.js";
import { pool } from "./src/db/pool.js";
import { hashSessionToken } from "./src/services/authService.js";

const PORT = Number(process.env.PORT || 5000);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ==========================================
// SHARED HTTP SERVER
// ==========================================

const httpServer = createServer(app);

// ==========================================
// SOCKET.IO SERVER
// ==========================================

export const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },

  transports: ["websocket", "polling"],

  allowRequest: (request, callback) => {
    callback(null, request.headers.origin === CLIENT_URL);
  },
});

// ==========================================
// SESSION VERIFICATION
// ==========================================

async function getActiveSession(tokenHash) {
  const result = await pool.query(
    `
    SELECT
      s.id AS session_id,
      u.id,
      u.username,
      u.email,
      u.account_status,
      u.created_at
    FROM user_sessions s
    JOIN users u
      ON u.id = s.user_id
    WHERE s.token_hash = $1
      AND s.revoked_at IS NULL
      AND s.expires_at > NOW()
      AND u.account_status = 'active'
    LIMIT 1
    `,
    [tokenHash],
  );

  return result.rows[0] ?? null;
}

// ==========================================
// WORLD ACCESS VERIFICATION
// ==========================================

async function getActiveWorldCharacter(worldId, userId) {
  const result = await pool.query(
    `
    SELECT
      wm.id AS membership_id,
      wc.id AS world_character_id,
      c.name AS character_name,
      c.slug AS character_slug
    FROM world_members wm
    JOIN character_assignments ca
      ON ca.world_member_id = wm.id
      AND ca.world_id = wm.world_id
      AND ca.revoked_at IS NULL
    JOIN world_characters wc
      ON wc.id = ca.world_character_id
      AND wc.world_id = wm.world_id
    JOIN characters c
      ON c.id = wc.character_id
    WHERE wm.world_id = $1
      AND wm.user_id = $2
      AND wm.status = 'active'
      AND wc.status = 'active'
    LIMIT 1
    `,
    [worldId, userId],
  );

  return result.rows[0] ?? null;
}

// ==========================================
// SOCKET AUTHENTICATION
// ==========================================

io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.request.headers.cookie || "";

    const tokenMatch = cookieHeader.match(
      /(?:^|;\s*)crown_session=([a-f0-9]{64})(?:;|$)/,
    );

    const token = tokenMatch?.[1];

    if (!token) {
      return next(new Error("Authentication required."));
    }

    const tokenHash = hashSessionToken(token);
    const session = await getActiveSession(tokenHash);

    if (!session) {
      return next(new Error("Invalid or expired session."));
    }

    socket.data.user = {
      id: session.id,
      username: session.username,
      email: session.email,
      account_status: session.account_status,
      created_at: session.created_at,
    };

    socket.data.sessionId = session.session_id;
    socket.data.tokenHash = tokenHash;

    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);

    next(new Error("Socket authentication failed."));
  }
});

// ==========================================
// SECURE WAR TABLE BROADCASTER
// ==========================================

// Called by warBoardController after PostgreSQL
// successfully saves a movement.
//
// Every recipient is revalidated before delivery.

async function broadcastWarBoardMove({ worldId, piece }) {
  if (typeof worldId !== "string" || !UUID_PATTERN.test(worldId)) {
    throw new Error("Invalid broadcast world ID.");
  }

  const normalizedWorldId = worldId.toLowerCase();
  const roomName = `world:${normalizedWorldId}`;

  // Get currently connected sockets in this room.
  const sockets = await io.in(roomName).fetchSockets();

  let delivered = 0;

  for (const socket of sockets) {
    // A player may have switched worlds since
    // the recipient list was collected.
    if (socket.data.worldId !== normalizedWorldId) {
      continue;
    }

    try {
      // --------------------------------------
      // Revalidate login session
      // --------------------------------------

      const session = await getActiveSession(socket.data.tokenHash);

      if (!session || session.id !== socket.data.user.id) {
        socket.disconnect(true);
        continue;
      }

      // --------------------------------------
      // Revalidate world membership
      // --------------------------------------

      const character = await getActiveWorldCharacter(
        normalizedWorldId,
        session.id,
      );

      if (!character) {
        await socket.leave(roomName);

        delete socket.data.worldId;
        delete socket.data.character;

        socket.emit("world:access-revoked", {
          worldId: normalizedWorldId,
          message: "World access is no longer available.",
        });

        continue;
      }

      // Recheck that the socket is still in
      // the intended world after async queries.
      if (
        !socket.connected ||
        socket.data.worldId !== normalizedWorldId ||
        !socket.rooms.has(roomName)
      ) {
        continue;
      }

      // --------------------------------------
      // Deliver authorized movement
      // --------------------------------------

      socket.emit("war-board:piece-moved", {
        worldId: normalizedWorldId,
        piece,
      });

      delivered += 1;
    } catch (error) {
      console.error("War board recipient validation failed:", error);

      // Fail closed if access cannot be verified.
      await socket.leave(roomName);

      delete socket.data.worldId;
      delete socket.data.character;
    }
  }

  console.log(
    `[Socket.IO] War board movement in ${normalizedWorldId}: ${piece.region_id} (${delivered} recipients)`,
  );
}

// Make the broadcaster available to the
// existing Express War Table controller.
app.set("broadcastWarBoardMove", broadcastWarBoardMove);

// ==========================================
// AUTHENTICATED SOCKET CONNECTIONS
// ==========================================

io.on("connection", (socket) => {
  const username = socket.data.user.username;

  console.log(`[Socket.IO] ${username} connected: ${socket.id}`);

  socket.emit("connection:ready", {
    success: true,
    username,
    message: "Connected to Crown of Winter.",
  });

  // ----------------------------------------
  // JOIN WORLD
  // ----------------------------------------

  socket.on("world:join", async (worldId, ack) => {
    const respond = typeof ack === "function" ? ack : () => {};

    try {
      if (typeof worldId !== "string" || !UUID_PATTERN.test(worldId)) {
        return respond({
          success: false,
          message: "Invalid world ID.",
        });
      }

      const normalizedWorldId = worldId.toLowerCase();

      const session = await getActiveSession(socket.data.tokenHash);

      if (!session || session.id !== socket.data.user.id) {
        respond({
          success: false,
          message: "Invalid or expired session.",
        });

        socket.disconnect(true);
        return;
      }

      const character = await getActiveWorldCharacter(
        normalizedWorldId,
        session.id,
      );

      if (!character) {
        return respond({
          success: false,
          message: "No active playable character in this world.",
        });
      }

      // Leave any previously joined world.
      for (const room of socket.rooms) {
        if (room.startsWith("world:")) {
          await socket.leave(room);
        }
      }

      const roomName = `world:${normalizedWorldId}`;

      await socket.join(roomName);

      socket.data.worldId = normalizedWorldId;
      socket.data.character = character;

      console.log(
        `[Socket.IO] ${username} joined ${roomName} as ${character.character_name}`,
      );

      return respond({
        success: true,
        worldId: normalizedWorldId,
        character: {
          id: character.world_character_id,
          name: character.character_name,
          slug: character.character_slug,
        },
        message: "Successfully joined world.",
      });
    } catch (error) {
      console.error("Socket world join error:", error.message);

      return respond({
        success: false,
        message: "Unable to join world.",
      });
    }
  });

  // ----------------------------------------
  // LEAVE WORLD
  // ----------------------------------------

  socket.on("world:leave", async (ack) => {
    for (const room of socket.rooms) {
      if (room.startsWith("world:")) {
        await socket.leave(room);
      }
    }

    delete socket.data.worldId;
    delete socket.data.character;

    if (typeof ack === "function") {
      ack({
        success: true,
        message: "Left world.",
      });
    }
  });

  // ----------------------------------------
  // DISCONNECT
  // ----------------------------------------

  socket.on("disconnect", (reason) => {
    console.log(`[Socket.IO] ${username} disconnected: ${reason}`);
  });
});

// ==========================================
// SERVER STARTUP
// ==========================================

async function startServer() {
  try {
    await pool.query("SELECT 1");

    console.log("PostgreSQL connected successfully.");

    httpServer.listen(PORT, () => {
      console.log(`Crown of Winter API running on port ${PORT}`);

      console.log(`Health check: http://localhost:${PORT}/api/health`);

      console.log("Socket.IO ready for authenticated connections.");

      console.log("Secure War Table broadcasting initialized.");
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);

    io.close();
    await pool.end();

    process.exitCode = 1;
  }
}

startServer();

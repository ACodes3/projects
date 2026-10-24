import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

// Reusable Socket.IO client.
//
// autoConnect: false prevents connections before
// the user has authenticated.
//
// withCredentials: true sends the existing
// crown_session HTTP-only cookie.

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"],
});

export function connectSocket() {
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  socket.disconnect();
}

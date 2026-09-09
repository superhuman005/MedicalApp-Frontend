import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Connects (or reuses an existing connection) to the backend's Socket.io
 * server, authenticated with the same JWT used for REST calls. Safe to call
 * multiple times - it will only open a new connection if one isn't already
 * active for the given token.
 */
export const connectSocket = (token: string): Socket => {
  if (socket && socket.connected) return socket;

  if (socket) {
    socket.disconnect();
  }

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

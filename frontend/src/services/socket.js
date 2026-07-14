/**
 * socket.js — Singleton Socket.IO client for the frontend
 *
 * One shared connection per browser session, reused across all modules.
 * Reconnects automatically on drop. No duplicate connections.
 *
 * Usage:
 *   import { getSocket, joinRoom, leaveRoom } from "@/services/socket";
 *
 *   const socket = getSocket();
 *   joinRoom("deliveryBoy:abc123");
 *   socket.on("order:assigned", (data) => { ... });
 */

import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
const activeRooms = new Set();

let _socket = null;

/** Returns the shared socket instance, creating it on first call */
export function getSocket() {
  if (!_socket) {
    _socket = io(BACKEND_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
    });

    _socket.on("connect", () => {
      console.log("[Socket] Connected:", _socket.id);
      // Automatically re-join active rooms on reconnection
      activeRooms.forEach((room) => {
        _socket.emit("join:room", room);
        console.log(`[Socket] Auto-rejoined room: ${room}`);
      });
    });

    _socket.on("disconnect", (reason) => {
      console.warn("[Socket] Disconnected:", reason);
    });

    _socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });
  }

  return _socket;
}

/** Join a named room (server listens for "join:room" event) */
export function joinRoom(room) {
  const socket = getSocket();
  activeRooms.add(room);
  socket.emit("join:room", room);
}

/** Leave a named room */
export function leaveRoom(room) {
  const socket = getSocket();
  activeRooms.delete(room);
  socket.emit("leave:room", room);
}

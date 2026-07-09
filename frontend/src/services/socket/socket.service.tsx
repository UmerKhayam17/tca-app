/**
 * services/socket.service.js
 * ──────────────────────────────────────────────────────────────
 * Global Socket.io client manager.
 * Manages /chat, /notifications, /presence namespaces.
 */

import { io, type Socket } from "socket.io-client";
import { getSocketUrl } from "@/lib/api";
import { ensureAccessToken } from "@/lib/auth";

class SocketService {
  chat: Socket | null = null;
  notifications: Socket | null = null;
  presence: Socket | null = null;
  private _connected = false;

  private socketOptions() {
    return {
      auth: (cb: (data: { token: string }) => void) => {
        void ensureAccessToken().then((token) => cb({ token: token || "" }));
      },
      transports: ["websocket", "polling"] as ("websocket" | "polling")[],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    };
  }

  connect(_token?: string) {
    if (this._connected) return;
    this._connected = true;

    const opts = this.socketOptions();
    const base = getSocketUrl();

    this.chat = io(`${base}/chat`, opts);
    this.notifications = io(`${base}/notifications`, opts);
    this.presence = io(`${base}/presence`, opts);

    this.chat.on("connect", () => {
      this.chat?.emit("conversation:join-all", {}, () => {});
    });

    this.chat.on("connect_error", (err) => {
      console.error("Chat socket error:", err.message);
    });
  }

  disconnect() {
    this.chat?.disconnect();
    this.notifications?.disconnect();
    this.presence?.disconnect();
    this.chat = null;
    this.notifications = null;
    this.presence = null;
    this._connected = false;
  }

  isConnected() {
    return this._connected && Boolean(this.chat?.connected);
  }

  joinConversation(conversationId: string) {
    this.chat?.emit("conversation:join", { conversationId });
  }

  sendMessage(payload: unknown, cb?: (...args: unknown[]) => void) {
    this.chat?.emit("message:send", payload, cb);
  }

  editMessage(payload: unknown, cb?: (...args: unknown[]) => void) {
    this.chat?.emit("message:edit", payload, cb);
  }

  deleteMessage(payload: unknown, cb?: (...args: unknown[]) => void) {
    this.chat?.emit("message:delete", payload, cb);
  }

  forwardMessage(payload: unknown, cb?: (...args: unknown[]) => void) {
    this.chat?.emit("message:forward", payload, cb);
  }

  markRead(conversationId: string, cb?: (...args: unknown[]) => void) {
    this.chat?.emit("message:read", { conversationId }, cb);
  }

  startTyping(conversationId: string) {
    this.chat?.emit("typing:start", { conversationId });
  }

  stopTyping(conversationId: string) {
    this.chat?.emit("typing:stop", { conversationId });
  }

  toggleReaction(payload: unknown, cb?: (...args: unknown[]) => void) {
    this.chat?.emit("reaction:toggle", payload, cb);
  }

  setPresenceStatus(status: string) {
    this.presence?.emit("presence:set-status", status);
  }
}

const socketService = new SocketService();
export default socketService;

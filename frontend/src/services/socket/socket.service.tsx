/**
 * services/socket.service.js
 * ──────────────────────────────────────────────────────────────
 * Global Socket.io client manager.
 * Manages /chat, /notifications, /presence namespaces.
 *
 * Usage:
 *   import socketService from "@/services/socket.service";
 *   socketService.connect(token);
 *   socketService.chat.on("message:new", handler);
 *   socketService.disconnect();
 */

import { io } from "socket.io-client";
import { getSocketUrl } from "@/lib/api";
class SocketService {
  constructor() {
    this.chat          = null;
    this.notifications = null;
    this.presence      = null;
    this._token        = null;
    this._connected    = false;
  }

  connect(token) {
    if (this._connected) return;
    this._token    = token;
    this._connected = true;

    const opts = {
      auth:       { token },
      transports: ["websocket", "polling"],
      reconnection:      true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    };

    this.chat = io(`${getSocketUrl()}/chat`, opts);
    this.notifications = io(`${getSocketUrl()}/notifications`, opts);
    this.presence      = io(`${getSocketUrl()}/presence`, opts);

    this.chat.on("connect", () => {
      // console.log("✅ Chat socket connected");
      // Auto-join all conversation rooms
      this.chat.emit("conversation:join-all", {}, (res) => {
        // if (res?.ok) console.log(`🏠 Joined ${res.joined} conversation rooms`);
      });
    });

    this.chat.on("connect_error", (err) => {
      console.error("Chat socket error:", err.message);
    });

    this.notifications.on("connect", () => {
      // console.log("✅ Notifications socket connected");
    });
  }

  disconnect() {
    this.chat?.disconnect();
    this.notifications?.disconnect();
    this.presence?.disconnect();
    this.chat          = null;
    this.notifications = null;
    this.presence      = null;
    this._connected    = false;
  }

  isConnected() {
    return this._connected && this.chat?.connected;
  }

  // ── Convenience emitters ────────────────────────────────────
  joinConversation(conversationId) {
    this.chat?.emit("conversation:join", { conversationId });
  }

  sendMessage(payload, cb) {
    this.chat?.emit("message:send", payload, cb);
  }

  editMessage(payload, cb) {
    this.chat?.emit("message:edit", payload, cb);
  }

  deleteMessage(payload, cb) {
    this.chat?.emit("message:delete", payload, cb);
  }

  forwardMessage(payload, cb) {
    this.chat?.emit("message:forward", payload, cb);
  }

  markRead(conversationId, cb) {
    this.chat?.emit("message:read", { conversationId }, cb);
  }

  startTyping(conversationId) {
    this.chat?.emit("typing:start", { conversationId });
  }

  stopTyping(conversationId) {
    this.chat?.emit("typing:stop", { conversationId });
  }

  toggleReaction(payload, cb) {
    this.chat?.emit("reaction:toggle", payload, cb);
  }

  setPresenceStatus(status) {
    this.presence?.emit("presence:set-status", status);
  }
}

const socketService = new SocketService();
export default socketService;
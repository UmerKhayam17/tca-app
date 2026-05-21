/**
 * socket/index.js
 * ─────────────────────────────────────────────────────────────
 * Global Socket.io initializer.
 * Call initSocket(server) once from server.js, then call
 * getIO() anywhere in the app to emit events.
 *
 * Namespace layout:
 *   /chat          – chat messages, typing, reactions
 *   /notifications – push-style in-app alerts (future)
 *   /presence      – user online/offline status
 * ─────────────────────────────────────────────────────────────
 */

const { Server } = require("socket.io");
const { socketAuthMiddleware } = require("./../../middleware/socketauth.middleware");
const registerChatNamespace = require("./namespaces/chat.namespace");
const registerNotificationNamespace = require("./namespaces/notification.namespace");
const registerPresenceNamespace = require("./namespaces/presence.namespace");

let _io = null;

/**
 * Initialize Socket.io and attach all namespaces.
 * @param {import("http").Server} httpServer
 * @param {string[]} allowedOrigins
 */
function initSocket(httpServer, allowedOrigins = []) {
  _io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  // ── Attach auth middleware to every namespace ──────────────
  _io.use(socketAuthMiddleware);

  const chatNamespace = _io.of("/chat");
  const notificationNamespace = _io.of("/notifications");
  const presenceNamespace = _io.of("/presence");

  // attach middleware to each namespace
  chatNamespace.use(socketAuthMiddleware);
  notificationNamespace.use(socketAuthMiddleware);
  presenceNamespace.use(socketAuthMiddleware);

  // register handlers
  registerChatNamespace(chatNamespace);
  registerNotificationNamespace(notificationNamespace);
  registerPresenceNamespace(presenceNamespace);

  // setInterval(() => {
  //     if (!_io) return;

  //     const users = [];

  //     for (const [, nsp] of _io._nsps) {
  //       for (const [, socket] of nsp.sockets) {
  //         if (socket.user) {
  //           users.push({
  //             userId: socket.user._id,
  //             email: socket.user.email,
  //           });
  //         }
  //       }
  //     }

  //     console.log("🟢 Active users:", users);
  //   }, 5000);


  return _io;
}

/**
 * Get the Socket.io instance anywhere in the app.
 * @returns {import("socket.io").Server}
 */
function getIO() {
  if (!_io) throw new Error("Socket.io not initialized. Call initSocket(server) first.");
  return _io;
}

module.exports = { initSocket, getIO };
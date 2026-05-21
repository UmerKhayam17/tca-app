/**
 * socket/namespaces/presence.namespace.js
 * Real-time presence updates (used as a shared channel).
 */

/**
 * @param {import("socket.io").Namespace} nsp
 */
function registerPresenceNamespace(nsp) {
  nsp.on("connection", (socket) => {
    const _id = socket.user._id;
    
    socket.on("presence:set-status", (status) => {
      // Allowed statuses
      const allowed = ["online", "away", "busy", "offline"];
      if (!allowed.includes(status)) return;

      nsp.emit("presence:update", {
        userId: _id,
        status,
      });
    });

    socket.on("disconnect", () => {});
  });
}

module.exports = registerPresenceNamespace;
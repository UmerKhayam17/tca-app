/**
 * socket/namespaces/notification.namespace.js
 * Dedicated namespace for push-style in-app notifications.
 * Future use: HR alerts, leave approvals, project updates, etc.
 */

/**
 * @param {import("socket.io").Namespace} nsp
 */
function registerNotificationNamespace(nsp) {
  nsp.on("connection", (socket) => {
    const _id = socket.user._id;

    socket.join(`user:${_id}`);
    
    // Acknowledge connection
    socket.emit("notification:connected", { userId: _id });

    socket.on("disconnect", () => {
      // cleanup if needed
    });
  });
}

/**
 * Send a notification to a specific user.
 * Call from anywhere: notifyUser(io, userId, payload)
 */
function notifyUser(io, userId, payload) {
  io.of("/notifications").to(`user:${userId}`).emit("notification:new", payload);
}

/**
 * Broadcast to entire company.
 */
function notifyCompany(io, payload) {
  io.of("/notifications").emit("notification:new", payload);
}

module.exports = registerNotificationNamespace;
module.exports.notifyUser = notifyUser;
module.exports.notifyCompany = notifyCompany;
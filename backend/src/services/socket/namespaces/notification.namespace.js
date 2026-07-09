/**
 * socket/namespaces/notification.namespace.js
 * In-app notifications + module-wide CRUD sync (role/module rooms).
 */
const {
  loadUserForRealtime,
  getModuleRoomsForUser,
} = require('../../realtime/realtimeService');

/**
 * @param {import("socket.io").Namespace} nsp
 */
function registerNotificationNamespace(nsp) {
  nsp.on('connection', async (socket) => {
    try {
      const fullUser = await loadUserForRealtime(socket.user._id);
      if (fullUser) {
        socket.user = fullUser;
        const rooms = getModuleRoomsForUser(fullUser);
        rooms.forEach((room) => socket.join(room));
      } else {
        socket.join(`user:${socket.user._id}`);
      }
    } catch {
      socket.join(`user:${socket.user._id}`);
    }

    socket.emit('notification:connected', { userId: String(socket.user._id) });

    socket.on('disconnect', () => {});
  });
}

/**
 * Send a notification to a specific user.
 */
function notifyUser(io, userId, payload) {
  io.of('/notifications').to(`user:${userId}`).emit('notification:new', payload);
}

/**
 * Broadcast to entire company (rare).
 */
function notifyCompany(io, payload) {
  io.of('/notifications').emit('notification:new', payload);
}

module.exports = registerNotificationNamespace;
module.exports.notifyUser = notifyUser;
module.exports.notifyCompany = notifyCompany;

/**
 * socket/utils/roomEmitter.js
 * Helper to emit to all sockets in a conversation room.
 */

/**
 * Emit an event to all sockets in a conversation room.
 * @param {import("socket.io").Namespace} nsp
 * @param {string} conversationId
 * @param {string} event
 * @param {*} payload
 */
function emitToConversation(nsp, conversationId, event, payload) {
  nsp.to(`conv:${conversationId}`).emit(event, payload);
}

/**
 * Emit an event to a specific user (all their sockets/tabs).
 */
function emitToUser(nsp, userId, event, payload) {
  nsp.to(`user:${userId}`).emit(event, payload);
}

/**
 * Emit an event to everyone in a company.
 */
function emitToCompany(nsp, companyId, event, payload) {
  nsp.to(`company:${companyId}`).emit(event, payload);
}

module.exports = { emitToConversation, emitToUser, emitToCompany };
/**
 * socket/handlers/typing.handler.js
 */

const { emitToConversation } = require("../utils/roomEmitter");

// Map to debounce typing stop: conversationId:userId -> timeout
const typingTimers = new Map();

function registerTypingHandlers(socket, nsp) {
  socket.on("typing:start", ({ conversationId }) => {
    const { _id, name } = socket.user;

    // Broadcast to others in the conversation (not self)
    socket.to(`conv:${conversationId}`).emit("typing:update", {
      conversationId,
      userId: _id,
      name,
      isTyping: true,
    });

    // Auto-stop typing after 4s of no activity
    const key = `${conversationId}:${_id}`;
    if (typingTimers.has(key)) clearTimeout(typingTimers.get(key));
    typingTimers.set(
      key,
      setTimeout(() => {
        socket.to(`conv:${conversationId}`).emit("typing:update", {
          conversationId,
          userId: _id,
          name,
          isTyping: false,
        });
        typingTimers.delete(key);
      }, 4000)
    );
  });

  socket.on("typing:stop", ({ conversationId }) => {
    const { _id, name } = socket.user;
    const key = `${conversationId}:${_id}`;

    if (typingTimers.has(key)) {
      clearTimeout(typingTimers.get(key));
      typingTimers.delete(key);
    }

    socket.to(`conv:${conversationId}`).emit("typing:update", {
      conversationId,
      userId: _id,
      name,
      isTyping: false,
    });
  });
}

module.exports = registerTypingHandlers;
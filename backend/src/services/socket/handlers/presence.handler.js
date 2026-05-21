/**
 * socket/handlers/presence.handler.js
 */

const UserPresence = require("../../../models/chat/userPresence.chat.model");

async function updatePresence(userId, status, nsp) {
  try {
    const update ={
            status,
            lastSeenAt: new Date(),
          };

    await UserPresence.findOneAndUpdate(
      { userId },
      update,
      { upsert: true, new: true }
    );

    // Broadcast to everyone in the company
    nsp.emit("presence:update", {
      userId,
      status,
      lastSeenAt: status === "offline" ? new Date() : undefined,
    });
  } catch (err) {
    console.error("updatePresence error", err);
  }
}

module.exports = { updatePresence };
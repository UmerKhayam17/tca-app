/**
 * socket/handlers/conversation.handler.js
 * Handles joining/leaving conversation rooms and group management events.
 */

const Conversation = require("../../../models/chat/conversation.chat.model");

function registerConversationHandlers(socket, nsp) {
  // ── Join conversation rooms on connect ─────────────────────
  socket.on("conversation:join-all", async (_, ack) => {
    try {
      const userId = socket.user._id;

      const conversations = await Conversation.find({
        "participants.userId": userId,
        isDeleted: false,
      }).select("_id").lean();

      const roomIds = conversations.map((c) => `conv:${c._id}`);
      if (roomIds.length) socket.join(roomIds);

      ack?.({ ok: true, joined: roomIds.length });
    } catch (err) {
      ack?.({ ok: false, error: "Server error" });
    }
  });

  // ── Join a single conversation room ───────────────────────
  socket.on("conversation:join", async ({ conversationId }, ack) => {
    try {
      const userId = socket.user._id;

      const conv = await Conversation.findOne({
        _id: conversationId,
        "participants.userId": userId,
        isDeleted: false,
      });

      if (!conv) return ack?.({ ok: false, error: "Not a participant" });

      socket.join(`conv:${conversationId}`);
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: "Server error" });
    }
  });

  // ── Leave a conversation room ─────────────────────────────
  socket.on("conversation:leave", ({ conversationId }) => {
    socket.leave(`conv:${conversationId}`);
  });
}

module.exports = registerConversationHandlers;
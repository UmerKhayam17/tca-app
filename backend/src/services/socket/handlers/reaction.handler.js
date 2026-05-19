/**
 * socket/handlers/reaction.handler.js
 */

const Reaction = require("../../../models/chat/reaction.chat.model");
const { emitToConversation } = require("../utils/roomEmitter");

function registerReactionHandlers(socket, nsp) {
  socket.on("reaction:toggle", async (data, ack) => {
    try {
      const { messageId, conversationId, emoji } = data;
      const userId = socket.user._id;

      // Check if same emoji exists → remove it (toggle)
      const existing = await Reaction.findOne({ messageId, userId });

      let action;
      if (existing && existing.emoji === emoji) {
        await existing.deleteOne();
        action = "removed";
      } else if (existing) {
        existing.emoji = emoji;
        await existing.save();
        action = "updated";
      } else {
        await Reaction.create({ messageId, conversationId, userId, emoji });
        action = "added";
      }

      // Fetch all reactions for this message to send updated counts
      const reactions = await Reaction.find({ messageId })
        .populate("userId", "name profile_image")
        .lean();

      emitToConversation(nsp, conversationId, "reaction:updated", {
        conversationId,
        messageId,
        reactions,
        action,
        actorId: userId,
        emoji,
      });

      ack?.({ ok: true, action });
    } catch (err) {
      console.error("reaction:toggle error", err);
      ack?.({ ok: false, error: "Server error" });
    }
  });
}

module.exports = registerReactionHandlers;
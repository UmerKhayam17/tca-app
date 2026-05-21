const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MessageChat",
      required: true,
      index: true,
    },

    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConversationChat",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Single emoji per user per message (upsert logic)
    emoji: { type: String, required: true }, // e.g. "👍", "❤️", "😂"
  },
  { timestamps: true }
);

// One reaction per user per message
reactionSchema.index({ messageId: 1, userId: 1 }, { unique: true });

const Reaction = mongoose.model("ReactionChat", reactionSchema);
module.exports = Reaction;
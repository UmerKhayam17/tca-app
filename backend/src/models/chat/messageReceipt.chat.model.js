const mongoose = require("mongoose");

const messageReceiptSchema = new mongoose.Schema(
  {
    
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MessageChat",
      index: true,
    },

    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConversationChat",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["delivered", "read"],
    },

    deliveredAt: Date,
    readAt:      Date,
  },
  { timestamps: true }
);

messageReceiptSchema.index({ messageId: 1, userId: 1 }, { unique: true });
messageReceiptSchema.index({ conversationId: 1, userId: 1 });

const MessageReceipt = mongoose.model("MessageReceiptChat", messageReceiptSchema);
module.exports = MessageReceipt;
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },

    title: String,
    description: String,
    avatar: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["admin", "member"],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
        isMuted: { type: Boolean, default: false },
        isBlocked: { type: Boolean, default: false },
        lastReadAt: { type: Date },
        unreadCount: { type: Number, default: 0 },
        notifyUntil: { type: Date },
      },
    ],

    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MessageChat",
    },
    lastMessageAt: Date,
    lastMessagePreview: { type: String, default: "" },

    pinnedMessages: [
      {
        messageId: { type: mongoose.Schema.Types.ObjectId, ref: "MessageChat" },
        pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        pinnedAt: { type: Date, default: Date.now },
      },
    ],

    settings: {
      onlyAdminsCanSend: { type: Boolean, default: false },
      onlyAdminsCanAddMembers: { type: Boolean, default: false },
      allowFileSharing: { type: Boolean, default: true },
      messageRetentionDays: { type: Number, default: 0 },
      disappearingMessages: { type: Number, default: 0 },
      allowReactions: { type: Boolean, default: true },
      allowReplies: { type: Boolean, default: true },
      allowForwarding: { type: Boolean, default: true },
      allowEditing: { type: Boolean, default: true },
      editTimeLimit: { type: Number, default: 0 },
    },

    isArchived: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

conversationSchema.index({ "participants.userId": 1 });
conversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.model("ConversationChat", conversationSchema);
module.exports = Conversation;
const mongoose = require("mongoose");

const replyPreviewSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: String,
    type: String,
  },
  { _id: false }
);

/**
 * Mention schema — position-based (no IDs in text).
 *
 * text  : "Hey Alice how are you Bob"
 * mentions: [
 *   { userId: <ObjectId>, position: 4  },  → "@Alice" inserted at index 4
 *   { userId: <ObjectId>, position: 20 },  → "@Bob"   inserted at index 20
 * ]
 *
 * Positions refer to character offsets in the CLEAN text (without any @id tokens).
 * The frontend inserts clickable "@Name" chips at those offsets at render time.
 */
const mentionSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    position: { type: Number, required: true },  // char offset in clean text
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConversationChat",
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    type: {
      type: String,
      enum: ["text", "file", "image", "video", "audio", "system", "sticker"],
      default: "text",
    },

    // Clean text — never contains @userId tokens.
    // Mention names are injected by the frontend using mentions[].position.
    text: { type: String, default: "" },

    // For file/image/video/audio
    file: {
      url:          String,
      name:         String,
      size:         Number,
      mimeType:     String,
      thumbnailUrl: String,
      duration:     Number,
      width:        Number,
      height:       Number,
    },

    // Reply threading
    replyToMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MessageChat",
    },
    replyToPreview: replyPreviewSchema,

    // Forwarding
    isForwarded:     { type: Boolean, default: false },
    forwardedFrom: {
      messageId:       { type: mongoose.Schema.Types.ObjectId, ref: "MessageChat" },
      conversationId:  { type: mongoose.Schema.Types.ObjectId, ref: "ConversationChat" },
      senderId:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    // Position-based mentions: userId + char offset in clean text.
    mentions: [mentionSchema],

    // System message metadata
    systemMeta: {
      action:    String,
      targetId:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      extraData: String,
    },

    status: {
      type: String,
      enum: ["sending", "sent", "delivered", "read", "failed"],
      default: "sent",
    },

    isEdited:   { type: Boolean, default: false },
    editedAt:   Date,
    editHistory: [
      {
        text:     String,
        editedAt: { type: Date, default: Date.now },
      },
    ],

    deletedForEveryone: { type: Boolean, default: false },
    deletedForUsers:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ "mentions.userId": 1 });

const Message = mongoose.model("MessageChat", messageSchema);
module.exports = Message;
const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    url:          String,
    name:         String,
    size:         Number,       // bytes
    mimeType:     String,
    thumbnailUrl: String,
    width:        Number,
    height:       Number,
    duration:     Number,       // audio/video seconds

    storageProvider: {
      type: String,
      enum: ["s3", "minio", "local"],
      default: "local",
    },

    storageKey: String,         // S3/MinIO object key for deletion

    relatedMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MessageChat",
    },

    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConversationChat",
    },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

fileSchema.index({ conversationId: 1, mimeType: 1 });
fileSchema.index({ uploadedBy: 1 });

const File = mongoose.model("FileChat", fileSchema);
module.exports = File;
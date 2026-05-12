const mongoose = require('mongoose');

const readReceiptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'voice_note', 'system'],
      default: 'text',
    },
    content: { type: String, trim: true },
    fileUrl: { type: String },
    fileName: { type: String },
    readBy: [readReceiptSchema],
    isDeleted: { type: Boolean, default: false },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);

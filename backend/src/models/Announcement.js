const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String },
    url: { type: String },
  },
  { _id: false }
);

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: ['holiday', 'fee_reminder', 'test_schedule', 'event', 'urgent', 'general'],
      default: 'general',
    },
    targetAudience: {
      type: String,
      enum: ['all', 'class', 'section', 'teachers', 'parents'],
      default: 'all',
    },
    targetClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    targetSection: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    attachments: [attachmentSchema],
    isPinned: { type: Boolean, default: false },
    publishedAt: { type: Date },
    expiresAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notificationSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

announcementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);

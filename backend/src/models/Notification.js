const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, trim: true, default: '' },
    /** Panel path without role prefix, e.g. /students/:id/activate */
    path: { type: String, trim: true },
    moduleKey: { type: String, trim: true, index: true },
    resource: { type: String, trim: true },
    resourceId: { type: String, trim: true },
    meta: { type: mongoose.Schema.Types.Mixed },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

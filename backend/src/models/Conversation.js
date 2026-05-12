const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'class_group', 'subject_group', 'teacher_group', 'staff_group'],
      required: true,
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    name: { type: String, trim: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);

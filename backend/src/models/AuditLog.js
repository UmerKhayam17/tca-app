const mongoose = require('mongoose');

const AUDIT_ACTIONS = [
  'SESSION_CREATED',
  'SESSION_ACTIVATED',
  'SESSION_COMPLETED',
  'SESSION_ARCHIVED',
  'SESSION_STRUCTURE_CLONED',
  'SESSION_CONFIGURATION_SHIFTED',
  'TIMETABLE_VERSION_CREATED',
  'TIMETABLE_PUBLISHED',
  'TIMETABLE_ARCHIVED',
  'TIMETABLE_SLOT_UPDATED',
  'TEACHER_SUBSTITUTION',
  'CLASS_CREATED',
  'SECTION_CREATED',
];

const auditLogSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    action: { type: String, enum: AUDIT_ACTIONS, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    entityType: { type: String, trim: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ session: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
module.exports.AUDIT_ACTIONS = AUDIT_ACTIONS;

const AuditLog = require('../../models/AuditLog');

async function logAudit({ sessionId, action, userId, entityType, entityId, details }) {
  return AuditLog.create({
    session: sessionId,
    action,
    user: userId,
    entityType,
    entityId,
    details: details || {},
  });
}

async function listAuditLogs(sessionId, { limit = 100 } = {}) {
  return AuditLog.find({ session: sessionId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);
}

module.exports = { logAudit, listAuditLogs };

const ApiError = require('../../utils/ApiError');
const Session = require('../../models/Session');

const SESSION_STATUSES = ['active', 'completed', 'archived'];

function resolveSessionStatus(session) {
  if (session.status && SESSION_STATUSES.includes(session.status)) {
    return session.status;
  }
  if (session.isClosed) return 'completed';
  if (session.isActive) return 'active';
  return 'active';
}

function syncSessionFlags(session, status) {
  session.status = status;
  if (status === 'active') {
    session.isActive = true;
    session.isClosed = false;
  } else {
    session.isActive = false;
    session.isClosed = true;
  }
}

async function getSessionOrThrow(sessionId) {
  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, 'Session not found');
  return session;
}

/** Fix legacy rows where status and isActive/isClosed disagree. */
async function healSessionFlags(session) {
  const resolved = resolveSessionStatus(session);
  const needsHeal =
    session.status !== resolved ||
    (resolved === 'active' && (!session.isActive || session.isClosed)) ||
    (resolved !== 'active' && (session.isActive || !session.isClosed));

  if (!needsHeal) return session;

  syncSessionFlags(session, resolved);
  await session.save();
  return session;
}

async function assertSessionWritable(sessionId) {
  let session = await getSessionOrThrow(sessionId);
  session = await healSessionFlags(session);

  const status = resolveSessionStatus(session);
  if (status !== 'active') {
    throw new ApiError(
      403,
      `Session "${session.name}" is ${status} and cannot be modified. Use "Set active" on another session or open Session history → Activate.`
    );
  }
  return session;
}

function isSessionReadOnly(session) {
  return resolveSessionStatus(session) !== 'active';
}

module.exports = {
  SESSION_STATUSES,
  resolveSessionStatus,
  syncSessionFlags,
  getSessionOrThrow,
  healSessionFlags,
  assertSessionWritable,
  isSessionReadOnly,
};

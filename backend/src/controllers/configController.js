const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { getSystemModulesForApi } = require('../config/systemModules');
const { logAudit } = require('../services/session/auditService');
const { assertSessionWritable, syncSessionFlags, resolveSessionStatus, healSessionFlags } = require('../services/session/sessionGuard');
const Session = require('../models/Session');
const { ensureDefaultAcademyStructure, syncAcademyToTimetableStructure } = require('../services/academy/academyDefaultStructureService');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const Timetable = require('../models/Timetable');

const listSessions = catchAsync(async (req, res) => {
  const { status } = req.query;
  const q = status ? { status } : {};
  const sessions = await Session.find(q).sort({ startDate: -1 });
  const normalized = sessions.map((s) => {
    const doc = s.toObject();
    doc.status = resolveSessionStatus(s);
    doc.writable = doc.status === 'active';
    return doc;
  });
  res.json({ success: true, data: normalized });
});

const createSession = catchAsync(async (req, res) => {
  const body = { ...req.body };
  const name = body.name?.trim();
  if (!name) throw new ApiError(400, 'Session name is required');

  const duplicate = await Session.findOne({ name });
  if (duplicate) {
    throw new ApiError(409, `A session named "${name}" already exists`);
  }

  const existingCount = await Session.countDocuments();
  const shouldActivate =
    existingCount === 0 ||
    (body.isActive !== false && body.status !== 'completed' && body.status !== 'archived');

  if (shouldActivate && existingCount > 0) {
    await Session.updateMany(
      {},
      { $set: { isActive: false, status: 'completed', isClosed: true } }
    );
  }

  const session = await Session.create({
    name,
    startDate: body.startDate,
    endDate: body.endDate,
    workingDays: body.workingDays,
    timezone: body.timezone,
    notes: body.notes,
    createdBy: req.user._id,
  });
  if (shouldActivate) {
    syncSessionFlags(session, 'active');
  } else {
    syncSessionFlags(session, body.status || 'completed');
  }
  await session.save();

  const defaultStructure = await ensureDefaultAcademyStructure(session._id, req.user._id);

  await logAudit({
    sessionId: session._id,
    action: 'SESSION_CREATED',
    userId: req.user._id,
    details: { name: session.name, defaultStructure },
  });
  res.status(201).json({ success: true, data: session, defaultStructure });
});

const patchSession = catchAsync(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, 'Session not found');
  if (session.status === 'archived') {
    throw new ApiError(403, 'Archived sessions cannot be modified');
  }

  const updates = { ...req.body };
  if (updates.status === 'archived' || updates.status === 'completed') {
    throw new ApiError(400, 'Use session lifecycle endpoints to complete or archive a session');
  }
  if (updates.isActive || updates.status === 'active') {
    const currentStatus = resolveSessionStatus(session);
    if (currentStatus === 'completed' || currentStatus === 'archived') {
      throw new ApiError(400, 'Completed sessions cannot be reactivated. Create a new session instead.');
    }
    await Session.updateMany(
      { _id: { $ne: req.params.id } },
      { $set: { isActive: false, status: 'completed', isClosed: true } }
    );
    updates.isActive = true;
    updates.status = 'active';
    updates.isClosed = false;
  }

  const updated = await Session.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (updated) await healSessionFlags(updated);
  const data = await Session.findById(req.params.id);
  res.json({ success: true, data });
});

const listClasses = catchAsync(async (req, res) => {
  const { sessionId } = req.query;
  if (sessionId) {
    await syncAcademyToTimetableStructure(sessionId, req.user?._id);
  }
  const q = sessionId ? { session: sessionId } : {};
  const classes = await Class.find(q).populate('sections').populate('subjects').populate('classTeacher');
  res.json({ success: true, data: classes });
});

const createClass = catchAsync(async (req, res) => {
  await assertSessionWritable(req.body.session);
  const cls = await Class.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: cls });
});

const patchClass = catchAsync(async (req, res) => {
  const existing = await Class.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Class not found');
  await assertSessionWritable(existing.session);
  const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: cls });
});

const createSection = catchAsync(async (req, res) => {
  const parentClass = await Class.findById(req.body.class);
  if (!parentClass) throw new ApiError(404, 'Class not found');
  await assertSessionWritable(parentClass.session);
  const body = { ...req.body };
  if (body.teacher === '') body.teacher = null;
  const section = await Section.create({ ...body, createdBy: req.user._id });
  await Class.findByIdAndUpdate(body.class, { $addToSet: { sections: section._id } });
  const populated = await Section.findById(section._id)
    .populate('class', 'name session')
    .populate('teacher', 'name email');
  res.status(201).json({ success: true, data: { ...populated.toObject(), studentCount: 0 } });
});

const patchSection = catchAsync(async (req, res) => {
  const existing = await Section.findById(req.params.id).populate('class', 'session');
  if (!existing) throw new ApiError(404, 'Section not found');
  await assertSessionWritable(existing.class.session);
  const updates = { ...req.body };
  if (updates.teacher === '') updates.teacher = null;
  const section = await Section.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    .populate('class', 'name session')
    .populate('teacher', 'name email');
  if (!section) throw new ApiError(404, 'Section not found');
  const studentCount = await Student.countDocuments({ section: section._id });
  res.json({ success: true, data: { ...section.toObject(), studentCount } });
});

const deleteSection = catchAsync(async (req, res) => {
  const section = await Section.findById(req.params.id).populate('class', 'session');
  if (!section) throw new ApiError(404, 'Section not found');
  await assertSessionWritable(section.class.session);

  const enrolled = await Student.countDocuments({ section: section._id });
  if (enrolled > 0) {
    throw new ApiError(400, `Cannot delete section: ${enrolled} student(s) are enrolled. Move or remove them first.`);
  }

  await Class.findByIdAndUpdate(section.class, { $pull: { sections: section._id } });
  await Section.findByIdAndDelete(section._id);
  res.json({ success: true, data: { deleted: true } });
});

const createSubject = catchAsync(async (req, res) => {
  const parentClass = await Class.findById(req.body.class);
  if (!parentClass) throw new ApiError(404, 'Class not found');
  await assertSessionWritable(parentClass.session);
  const subject = await Subject.create({ ...req.body, createdBy: req.user._id });
  await Class.findByIdAndUpdate(req.body.class, { $addToSet: { subjects: subject._id } });
  res.status(201).json({ success: true, data: subject });
});

const listSections = catchAsync(async (req, res) => {
  const { classId, sessionId } = req.query;
  if (sessionId) {
    await syncAcademyToTimetableStructure(sessionId, req.user?._id);
  } else if (classId) {
    const parent = await Class.findById(classId).select('session');
    if (parent?.session) {
      await syncAcademyToTimetableStructure(parent.session, req.user?._id);
    }
  }
  const q = {};
  if (classId) {
    q.class = classId;
  } else if (sessionId) {
    const classes = await Class.find({ session: sessionId }).select('_id');
    q.class = { $in: classes.map((c) => c._id) };
  }
  const sections = await Section.find(q)
    .populate('class', 'name session')
    .populate('teacher', 'name email')
    .sort({ class: 1, name: 1 });

  const sectionIds = sections.map((s) => s._id);
  const counts = sectionIds.length
    ? await Student.aggregate([
        { $match: { section: { $in: sectionIds } } },
        { $group: { _id: '$section', count: { $sum: 1 } } },
      ])
    : [];
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  const data = sections.map((s) => ({
    ...s.toObject(),
    studentCount: countMap[String(s._id)] || 0,
  }));

  res.json({ success: true, data });
});

const listSubjects = catchAsync(async (req, res) => {
  const { classId } = req.query;
  if (classId) {
    const parent = await Class.findById(classId).select('session');
    if (parent?.session) {
      await syncAcademyToTimetableStructure(parent.session, req.user?._id);
    }
  }
  const q = classId ? { class: classId } : {};
  const subjects = await Subject.find(q).populate('teacher').populate('class');
  res.json({ success: true, data: subjects });
});

const patchSubject = catchAsync(async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('teacher')
    .populate('class');
  if (!subject) throw new ApiError(404, 'Subject not found');
  res.json({ success: true, data: subject });
});

const createTimetable = catchAsync(async (req, res) => {
  if (req.body.isActive) {
    await Timetable.updateMany(
      { class: req.body.class, section: req.body.section, session: req.body.session },
      { $set: { isActive: false } }
    );
  }
  const tt = await Timetable.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: tt });
});

const listTimetables = catchAsync(async (req, res) => {
  const { classId, sectionId, sessionId } = req.query;
  const q = {};
  if (classId) q.class = classId;
  if (sectionId) q.section = sectionId;
  if (sessionId) q.session = sessionId;
  const rows = await Timetable.find(q).populate('class').populate('section').populate('session');
  res.json({ success: true, data: rows });
});

/** Canonical RBAC module list (same source as `moduleConfig` / staff matrix). */
const listSystemModules = catchAsync(async (req, res) => {
  res.json({ success: true, data: { modules: getSystemModulesForApi() } });
});

module.exports = {
  listSessions,
  createSession,
  patchSession,
  listClasses,
  createClass,
  patchClass,
  createSection,
  patchSection,
  deleteSection,
  createSubject,
  listSubjects,
  patchSubject,
  listSections,
  createTimetable,
  listTimetables,
  listSystemModules,
};

const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { getSystemModulesForApi } = require('../config/systemModules');
const Session = require('../models/Session');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');

const listSessions = catchAsync(async (req, res) => {
  const sessions = await Session.find().sort({ startDate: -1 });
  res.json({ success: true, data: sessions });
});

const createSession = catchAsync(async (req, res) => {
  const body = req.body;
  if (body.isActive) {
    await Session.updateMany({}, { $set: { isActive: false } });
  }
  const session = await Session.create({
    ...body,
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, data: session });
});

const patchSession = catchAsync(async (req, res) => {
  const updates = { ...req.body };
  if (updates.isActive) {
    await Session.updateMany({ _id: { $ne: req.params.id } }, { $set: { isActive: false } });
  }
  const session = await Session.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!session) throw new ApiError(404, 'Session not found');
  res.json({ success: true, data: session });
});

const listClasses = catchAsync(async (req, res) => {
  const { sessionId } = req.query;
  const q = sessionId ? { session: sessionId } : {};
  const classes = await Class.find(q).populate('sections').populate('subjects').populate('classTeacher');
  res.json({ success: true, data: classes });
});

const createClass = catchAsync(async (req, res) => {
  const cls = await Class.create(req.body);
  res.status(201).json({ success: true, data: cls });
});

const patchClass = catchAsync(async (req, res) => {
  const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!cls) throw new ApiError(404, 'Class not found');
  res.json({ success: true, data: cls });
});

const createSection = catchAsync(async (req, res) => {
  const section = await Section.create(req.body);
  await Class.findByIdAndUpdate(req.body.class, { $addToSet: { sections: section._id } });
  res.status(201).json({ success: true, data: section });
});

const patchSection = catchAsync(async (req, res) => {
  const section = await Section.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!section) throw new ApiError(404, 'Section not found');
  res.json({ success: true, data: section });
});

const createSubject = catchAsync(async (req, res) => {
  const subject = await Subject.create(req.body);
  await Class.findByIdAndUpdate(req.body.class, { $addToSet: { subjects: subject._id } });
  res.status(201).json({ success: true, data: subject });
});

const listSubjects = catchAsync(async (req, res) => {
  const { classId } = req.query;
  const q = classId ? { class: classId } : {};
  const subjects = await Subject.find(q).populate('teacher').populate('class');
  res.json({ success: true, data: subjects });
});

const createTimetable = catchAsync(async (req, res) => {
  if (req.body.isActive) {
    await Timetable.updateMany(
      { class: req.body.class, section: req.body.section, session: req.body.session },
      { $set: { isActive: false } }
    );
  }
  const tt = await Timetable.create(req.body);
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
  createSubject,
  listSubjects,
  createTimetable,
  listTimetables,
  listSystemModules,
};

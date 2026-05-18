const PeriodTemplate = require('../../models/timetable/PeriodTemplate');
const ApiError = require('../../utils/ApiError');
const { assertSessionWritable } = require('../session/sessionGuard');

async function listPeriodTemplates({ sessionId, isActive }) {
  const q = {};
  if (sessionId) q.session = sessionId;
  if (isActive !== undefined) q.isActive = isActive === 'true' || isActive === true;
  return PeriodTemplate.find(q).sort({ isDefault: -1, name: 1 });
}

async function getPeriodTemplate(id) {
  const tpl = await PeriodTemplate.findById(id);
  if (!tpl) throw new ApiError(404, 'Period template not found');
  return tpl;
}

async function createPeriodTemplate(body, userId) {
  await assertSessionWritable(body.session);
  if (body.isDefault) {
    await PeriodTemplate.updateMany({ session: body.session }, { $set: { isDefault: false } });
  }
  return PeriodTemplate.create({ ...body, createdBy: userId });
}

async function updatePeriodTemplate(id, body) {
  const existing = await PeriodTemplate.findById(id);
  if (!existing) throw new ApiError(404, 'Period template not found');
  await assertSessionWritable(existing.session);

  if (body.isDefault) {
    await PeriodTemplate.updateMany(
      { session: existing.session, _id: { $ne: id } },
      { $set: { isDefault: false } }
    );
  }

  const tpl = await PeriodTemplate.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  return tpl;
}

async function deletePeriodTemplate(id) {
  const existing = await PeriodTemplate.findById(id);
  if (!existing) throw new ApiError(404, 'Period template not found');
  await assertSessionWritable(existing.session);
  const tpl = await PeriodTemplate.findByIdAndDelete(id);
  if (!tpl) throw new ApiError(404, 'Period template not found');
  return { deleted: true };
}

module.exports = {
  listPeriodTemplates,
  getPeriodTemplate,
  createPeriodTemplate,
  updatePeriodTemplate,
  deletePeriodTemplate,
};

const TimetableSettings = require('../../models/timetable/TimetableSettings');
const ApiError = require('../../utils/ApiError');

async function getSettings(sessionId) {
  let settings = await TimetableSettings.findOne({ session: sessionId }).populate(
    'defaultPeriodTemplate'
  );
  if (!settings) {
    settings = await TimetableSettings.create({ session: sessionId });
  }
  return settings;
}

async function upsertSettings(sessionId, body) {
  const settings = await TimetableSettings.findOneAndUpdate(
    { session: sessionId },
    { ...body, session: sessionId },
    { new: true, upsert: true, runValidators: true }
  ).populate('defaultPeriodTemplate');
  return settings;
}

module.exports = { getSettings, upsertSettings };

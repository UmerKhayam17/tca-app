const mongoose = require('mongoose');

const RECURRENCE_LABELS = {
  daily: 'Day',
  weekly: 'Week',
  monthly: 'Month',
};

function defaultSeriesCount(recurrence) {
  if (recurrence === 'daily') return 7;
  if (recurrence === 'weekly') return 12;
  if (recurrence === 'monthly') return 6;
  return 1;
}

function normalizeTestTime(value) {
  const raw = String(value || '09:00').trim();
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return '09:00';
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const min = Math.min(59, Math.max(0, Number(m[2])));
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function startOfDay(dateInput) {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addRecurrenceOffset(start, recurrence, index) {
  const d = new Date(start);
  if (recurrence === 'daily') {
    d.setDate(d.getDate() + index);
  } else if (recurrence === 'weekly') {
    d.setDate(d.getDate() + index * 7);
  } else if (recurrence === 'monthly') {
    d.setMonth(d.getMonth() + index);
  }
  return d;
}

function occurrenceTitle(seriesLabel, recurrence, index, total) {
  if (recurrence === 'once' || total <= 1) return seriesLabel;
  const unit = RECURRENCE_LABELS[recurrence] || 'Part';
  return `${seriesLabel} — ${unit} ${index}/${total}`;
}

function buildSeriesPlan(body) {
  const recurrence = body.recurrence || 'once';
  const seriesLabel = body.title.trim();
  const testTime = normalizeTestTime(body.testTime);
  const startDate = startOfDay(body.examDate);
  const count =
    recurrence === 'once'
      ? 1
      : Math.min(52, Math.max(2, Number(body.seriesCount) || defaultSeriesCount(recurrence)));

  const seriesId = new mongoose.Types.ObjectId();
  const occurrences = [];

  for (let i = 0; i < count; i += 1) {
    occurrences.push({
      seriesId,
      seriesLabel,
      title: occurrenceTitle(seriesLabel, recurrence, i + 1, count),
      examDate: addRecurrenceOffset(startDate, recurrence, i),
      testTime,
      recurrence,
      occurrenceIndex: i + 1,
      occurrenceCount: count,
    });
  }

  return { seriesId, occurrences, createdCount: count };
}

module.exports = {
  RECURRENCE_LABELS,
  defaultSeriesCount,
  normalizeTestTime,
  buildSeriesPlan,
  occurrenceTitle,
};

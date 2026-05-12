const Bull = require('bull');
const env = require('../config/env');
const { sendAttendanceAbsentNotification } = require('../services/notificationService');
const { generateMonthlyVouchersForActiveStudents } = require('../services/feeService');

const attendanceNotifQueue = new Bull('attendance-notifications', env.redisUrl, {
  defaultJobOptions: { removeOnComplete: 100, removeOnFail: 50 },
});

attendanceNotifQueue.process(async (job) => {
  await sendAttendanceAbsentNotification(job.data);
});

const feeVoucherQueue = new Bull('fee-voucher-generation', env.redisUrl, {
  defaultJobOptions: { removeOnComplete: 20, removeOnFail: 20 },
});

feeVoucherQueue.process(async (job) => {
  const { month, year, sessionId, userId } = job.data;
  await generateMonthlyVouchersForActiveStudents({ month, year, sessionId, userId });
});

function addAttendanceNotificationJob(data) {
  return attendanceNotifQueue.add(data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

function addFeeVoucherGenerationJob(data) {
  return feeVoucherQueue.add(data, { delay: 0 });
}

async function queueAttendanceAbsent(payload) {
  try {
    await addAttendanceNotificationJob(payload);
  } catch {
    await sendAttendanceAbsentNotification(payload);
  }
}

module.exports = {
  attendanceNotifQueue,
  feeVoucherQueue,
  addAttendanceNotificationJob,
  addFeeVoucherGenerationJob,
  queueAttendanceAbsent,
};

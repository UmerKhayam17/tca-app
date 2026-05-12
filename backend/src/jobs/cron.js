const cron = require('node-cron');
const Session = require('../models/Session');
const User = require('../models/User');
const Role = require('../models/Role');
const { addFeeVoucherGenerationJob } = require('./queues');

function startCronJobs() {
  cron.schedule('0 0 1 * *', async () => {
    const session = await Session.findOne({ isActive: true });
    if (!session) return;
    const adminRole = await Role.findOne({ name: 'admin' });
    const adminUser = adminRole ? await User.findOne({ role: adminRole._id }) : await User.findOne();
    const now = new Date();
    await addFeeVoucherGenerationJob({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      sessionId: session._id,
      userId: adminUser?._id,
    });
  });
}

module.exports = { startCronJobs };

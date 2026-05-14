const { Router } = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const studentRoutes = require('./studentRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const feeRoutes = require('./feeRoutes');
const examRoutes = require('./examRoutes');
const chatRoutes = require('./chatRoutes');
const announcementRoutes = require('./announcementRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const configRoutes = require('./configRoutes');
const roleRoutes = require('./roleRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use(roleRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/fee', feeRoutes);
router.use(examRoutes);
router.use(chatRoutes);
router.use('/announcements', announcementRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/config', configRoutes);

module.exports = router;

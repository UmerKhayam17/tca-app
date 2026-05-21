const { Router } = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const studentRoutes = require('./studentRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const feeRoutes = require('./feeRoutes');
const examRoutes = require('./examRoutes');
const announcementRoutes = require('./announcementRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const configRoutes = require('./configRoutes');
const timetableRoutes = require('./timetableRoutes');
const studentManagementRoutes = require('./studentManagementRoutes');
const roleRoutes = require('./roleRoutes');
const chatRoutes = require('./chatRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use(roleRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/fee', feeRoutes);
router.use(examRoutes);
router.use('/announcements', announcementRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/config', configRoutes);
router.use('/timetable', timetableRoutes);
router.use('/student-management', studentManagementRoutes);
router.use('/chat', chatRoutes);

module.exports = router;

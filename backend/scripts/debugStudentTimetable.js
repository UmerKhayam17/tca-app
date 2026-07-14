const mongoose = require('mongoose');
const env = require('../src/config/env');
const AcademyStudent = require('../src/models/academy/AcademyStudent');
const studentRecordService = require('../src/services/academy/academyStudentRecordService');

async function run(studentId) {
    await mongoose.connect(env.mongoUri);
    try {
        const student = await AcademyStudent.findById(studentId)
            .populate('classId', 'className sessionId')
            .populate('sectionId', 'sectionName');
        console.log('student:', student ? student.toJSON() : null);
        const record = await studentRecordService.getStudentRecord(studentId);
        console.log('record.timetable length:', record.timetable.length);
        console.log('record.timetable:', JSON.stringify(record.timetable, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

const studentId = process.argv[2];
if (!studentId) {
    console.error('Usage: node debugStudentTimetable.js <studentId>');
    process.exit(1);
}
run(studentId);

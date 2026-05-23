const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const Student = require('../models/Student');
const User = require('../models/User');
const Role = require('../models/Role');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Session = require('../models/Session');
const { generateRollNumber } = require('../utils/rollNumber');
const { decrypt } = require('../utils/encryption');

function maskStudent(doc) {
  const o =
    doc && typeof doc.toObject === 'function'
      ? doc.toObject()
      : JSON.parse(JSON.stringify(doc || {}));
  if (o.cnicOrBForm) {
    try {
      o.cnicOrBForm = decrypt(o.cnicOrBForm);
    } catch {
      o.cnicOrBForm = undefined;
    }
  }
  return o;
}

const register = catchAsync(async (req, res) => {
  const {
    studentName,
    fatherName,
    motherName,
    cnicOrBForm,
    contactNumber,
    desiredClass,
    previousSchool,
    dateOfBirth,
    gender,
    address,
    session,
  } = req.body;

  const registrationNumber = `REG-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  const student = await Student.create({
    studentName,
    fatherName,
    motherName,
    cnicOrBForm,
    contactNumber,
    desiredClass,
    previousSchool,
    dateOfBirth,
    gender,
    address,
    session,
    status: 'pending_fee',
    registrationNumber,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: maskStudent(student) });
});

const list = catchAsync(async (req, res) => {
  const { status, classId, sectionId, sessionId } = req.query;
  const q = {};
  if (status) q.status = status;
  if (classId) q.class = classId;
  if (sectionId) q.section = sectionId;
  if (sessionId) q.session = sessionId;

  const students = await Student.find(q)
    .populate('class')
    .populate('section')
    .populate('session')
    .populate('desiredClass')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: students.map(maskStudent) });
});

const getById = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('class')
    .populate('section')
    .populate('session')
    .populate('userId')
    .populate('parentUserId');
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: maskStudent(student) });
});

const activate = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id).populate('session').populate('desiredClass');
  if (!student) throw new ApiError(404, 'Student not found');
  if (student.status !== 'pending_fee') {
    throw new ApiError(400, 'Student is not awaiting fee confirmation');
  }

  const {
    sectionId,
    classId,
    parentName,
    parentEmail,
    parentPhone,
    parentPassword,
    studentPassword,
    admissionFeeAmount,
    paymentDate,
    paymentMethod,
    receiptNumber,
  } = req.body;

  const section = await Section.findById(sectionId);
  if (!section) throw new ApiError(404, 'Section not found');

  const klass = await Class.findById(classId || section.class);
  if (!klass) throw new ApiError(404, 'Class not found');
  if (String(section.class) !== String(klass._id)) {
    throw new ApiError(400, 'Section does not belong to the selected class');
  }

  const sessionDoc = student.session || klass.session;
  if (!sessionDoc) throw new ApiError(400, 'Session missing');

  const session = await Session.findById(sessionDoc);
  if (!session) throw new ApiError(404, 'Session not found');

  const rollNumber = await generateRollNumber({
    sessionName: session.name,
    className: klass.name,
  });

  const studentRole = await Role.findOne({ name: 'student' });
  const parentRole = await Role.findOne({ name: 'parent' });
  if (!studentRole || !parentRole) throw new ApiError(500, 'Roles not initialized');

  let parentUser = await User.findOne({ email: parentEmail });
  if (!parentUser) {
    parentUser = await User.create({
      name: parentName,
      email: parentEmail,
      phone: parentPhone,
      password: await bcrypt.hash(parentPassword || 'Parent@123456', 12),
      role: parentRole._id,
    });
  }

  const portalEmail = `${rollNumber.replace(/[^a-zA-Z0-9]/g, '')}@student.academy.local`.toLowerCase();
  const studPwd = studentPassword || 'Student@123456';
  const studentUser = await User.create({
    name: student.studentName || student.fatherName,
    email: portalEmail,
    phone: student.contactNumber || parentPhone,
    password: await bcrypt.hash(studPwd, 12),
    role: studentRole._id,
  });

  student.rollNumber = rollNumber;
  student.class = klass._id;
  student.section = section._id;
  student.session = session._id;
  student.userId = studentUser._id;
  student.parentUserId = parentUser._id;
  student.status = 'active';
  student.admissionDate = new Date();
  student.admissionFeeAmount = admissionFeeAmount;
  student.paymentDate = paymentDate || new Date();
  student.paymentMethod = paymentMethod;
  student.receiptNumber = receiptNumber;
  student.portalEmail = portalEmail;
  student.notificationSent = true;

  if (!section.students.map(String).includes(String(student._id))) {
    section.students.push(student._id);
    await section.save();
  }

  await student.save();

  res.json({
    success: true,
    data: maskStudent(student),
    credentials: {
      studentEmail: portalEmail,
      studentPassword: studPwd,
      parentEmail: parentUser.email,
    },
  });
});

const updateStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const student = await Student.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: maskStudent(student) });
});

const uploadDir = path.join(__dirname, '../../uploads');

const addDocument = catchAsync(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'File required');
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');

  fs.mkdirSync(uploadDir, { recursive: true });
  const filename = `${req.params.id}-${Date.now()}-${req.file.originalname}`;
  const dest = path.join(uploadDir, filename);
  fs.writeFileSync(dest, req.file.buffer);

  const url = `/uploads/${filename}`;
  student.documents.push({
    name: req.file.originalname,
    url,
    type: req.file.mimetype,
  });
  await student.save();
  res.status(201).json({ success: true, data: maskStudent(student) });
});

module.exports = { register, list, getById, activate, updateStatus, addDocument };

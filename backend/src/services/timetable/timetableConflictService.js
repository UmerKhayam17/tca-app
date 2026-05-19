const ScheduleSlot = require('../../models/timetable/ScheduleSlot');
const TimetableVersion = require('../../models/timetable/TimetableVersion');
const TeacherProfile = require('../../models/timetable/TeacherProfile');
const TeacherAssignment = require('../../models/timetable/TeacherAssignment');
const SubjectRequirement = require('../../models/timetable/SubjectRequirement');
const TimetableSettings = require('../../models/timetable/TimetableSettings');
const Room = require('../../models/timetable/Room');
const Subject = require('../../models/Subject');

function findPeriodInTemplate(template, periodId) {
  if (!template?.slots?.length || periodId == null) return null;
  if (typeof template.slots.id === 'function') {
    const byId = template.slots.id(periodId);
    if (byId) return byId;
  }
  return template.slots.find((s) => String(s._id) === String(periodId)) || null;
}

/** Teacher may teach this subject for the section (assignment, subject default, or profile). */
async function teacherCanTeachSubject({ sessionId, sectionId, subjectId, teacherId }) {
  if (!teacherId || !subjectId) return false;

  const assignment = await TeacherAssignment.findOne({
    session: sessionId,
    section: sectionId,
    subject: subjectId,
    teacher: teacherId,
    isActive: true,
  });
  if (assignment) return true;

  const subject = await Subject.findById(subjectId).select('teacher');
  if (subject?.teacher && String(subject.teacher) === String(teacherId)) return true;

  const profile = await TeacherProfile.findOne({
    user: teacherId,
    session: sessionId,
    isActive: true,
  });
  if (profile?.subjects?.some((s) => String(s._id || s) === String(subjectId))) return true;

  return false;
}

/**
 * Validate a single slot or full timetable version.
 * @returns {{ valid: boolean, errors: object[], warnings: object[] }}
 */
async function validateSlot({
  sessionId,
  timetableVersionId,
  day,
  periodId,
  subjectId,
  teacherId,
  roomId,
  sectionId,
  excludeSlotId,
  strict = false,
}) {
  const errors = [];
  const warnings = [];

  const version = await TimetableVersion.findById(timetableVersionId).populate('periodTemplate');
  if (!version) {
    errors.push({ code: 'VERSION_NOT_FOUND', message: 'Timetable version not found' });
    return { valid: false, errors, warnings };
  }

  const template = version.periodTemplate;
  const slotDef = findPeriodInTemplate(template, periodId);
  if (!slotDef) {
    errors.push({ code: 'INVALID_PERIOD', message: 'Period does not exist in template' });
    return { valid: false, errors, warnings };
  }
  if (slotDef.type === 'break') {
    errors.push({ code: 'INVALID_PERIOD', message: 'Cannot assign subjects to a break period' });
    return { valid: false, errors, warnings };
  }

  const settings = await TimetableSettings.findOne({ session: sessionId });
  const checkCrossVersion = settings?.conflictCheckOnDraft !== false;

  const baseQuery = { cancelled: { $ne: true } };
  if (excludeSlotId) baseQuery._id = { $ne: excludeSlotId };

  // R1: Teacher conflict (published + optionally draft across session)
  const teacherConflictQuery = {
    ...baseQuery,
    session: sessionId,
    day,
    periodId,
    teacher: teacherId,
  };
  if (checkCrossVersion) {
    const publishedVersions = await TimetableVersion.find({
      session: sessionId,
      status: 'published',
      _id: { $ne: timetableVersionId },
    }).select('_id');
    const versionIds = [timetableVersionId, ...publishedVersions.map((v) => v._id)];
    teacherConflictQuery.timetableVersion = { $in: versionIds };
  } else {
    teacherConflictQuery.timetableVersion = timetableVersionId;
  }

  const teacherConflict = await ScheduleSlot.findOne(teacherConflictQuery);
  if (teacherConflict) {
    errors.push({
      code: 'TEACHER_CONFLICT',
      message: 'Teacher is already assigned at this day and period',
      slotId: teacherConflict._id,
    });
  }

  // R2: Room conflict
  if (roomId) {
    const roomConflictQuery = {
      ...baseQuery,
      session: sessionId,
      day,
      periodId,
      room: roomId,
    };
    if (checkCrossVersion) {
      const publishedVersions = await TimetableVersion.find({
        session: sessionId,
        status: 'published',
        _id: { $ne: timetableVersionId },
      }).select('_id');
      roomConflictQuery.timetableVersion = {
        $in: [timetableVersionId, ...publishedVersions.map((v) => v._id)],
      };
    } else {
      roomConflictQuery.timetableVersion = timetableVersionId;
    }
    const roomConflict = await ScheduleSlot.findOne(roomConflictQuery);
    if (roomConflict) {
      errors.push({
        code: 'ROOM_CONFLICT',
        message: 'Room is already assigned at this day and period',
        slotId: roomConflict._id,
      });
    }
  }

  // R7: Teacher availability
  const profile = await TeacherProfile.findOne({ user: teacherId, session: sessionId, isActive: true });
  if (profile?.availability?.length) {
    const dayAvail = profile.availability.find((a) => a.day === day);
    if (dayAvail && dayAvail.periodIds?.length && !dayAvail.periodIds.some((id) => String(id) === String(periodId))) {
      const entry = {
        code: 'TEACHER_UNAVAILABLE',
        message: 'Teacher is not available at this period',
      };
      if (strict) errors.push(entry);
      else warnings.push(entry);
    }
  }

  // R8: Teacher must be allowed to teach this subject for this section
  const canTeach = await teacherCanTeachSubject({
    sessionId,
    sectionId,
    subjectId,
    teacherId,
  });
  if (!canTeach) {
    errors.push({
      code: 'TEACHER_NOT_ASSIGNED',
      message:
        'Teacher is not assigned to this subject. Add an assignment under System Configuration → Assignments.',
    });
  }

  // R9: Lab room type
  const requirement = await SubjectRequirement.findOne({
    session: sessionId,
    section: sectionId,
    subject: subjectId,
    isActive: true,
  });
  if (requirement?.requiresRoomType && roomId) {
    const room = await Room.findById(roomId);
    if (room && room.type !== requirement.requiresRoomType) {
      errors.push({
        code: 'ROOM_TYPE_MISMATCH',
        message: `Subject requires room type "${requirement.requiresRoomType}"`,
      });
    }
  }

  // R4: Daily teacher limit
  if (profile?.maxLecturesPerDay) {
    const dayCount = await ScheduleSlot.countDocuments({
      timetableVersion: timetableVersionId,
      teacher: teacherId,
      day,
      cancelled: { $ne: true },
      ...(excludeSlotId ? { _id: { $ne: excludeSlotId } } : {}),
    });
    if (dayCount >= profile.maxLecturesPerDay) {
      errors.push({
        code: 'TEACHER_DAILY_LIMIT',
        message: `Teacher exceeds max ${profile.maxLecturesPerDay} lectures per day`,
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

async function validateVersion(timetableVersionId, { forPublish = false } = {}) {
  const errors = [];
  const warnings = [];

  const version = await TimetableVersion.findById(timetableVersionId).populate('periodTemplate');
  if (!version) {
    return { valid: false, errors: [{ code: 'VERSION_NOT_FOUND', message: 'Timetable version not found' }], warnings };
  }

  const slots = await ScheduleSlot.find({
    timetableVersion: timetableVersionId,
    cancelled: { $ne: true },
  });

  const settings = await TimetableSettings.findOne({ session: version.session });

  // Per-slot validation
  for (const slot of slots) {
    const result = await validateSlot({
      sessionId: version.session,
      timetableVersionId,
      day: slot.day,
      periodId: slot.periodId,
      subjectId: slot.subject,
      teacherId: slot.teacher,
      roomId: slot.room,
      sectionId: version.section,
      excludeSlotId: slot._id,
      strict: forPublish,
    });
    result.errors.forEach((e) =>
      errors.push({ ...e, day: slot.day, periodId: slot.periodId, slotId: slot._id })
    );
  }

  // R3: Subject weekly quota
  const requirements = await SubjectRequirement.find({
    session: version.session,
    section: version.section,
    isActive: true,
  });

  for (const req of requirements) {
    const count = slots.filter((s) => String(s.subject) === String(req.subject)).length;
    if (count > req.weeklyPeriods) {
      errors.push({
        code: 'SUBJECT_QUOTA_EXCEEDED',
        message: `Subject exceeds weekly limit of ${req.weeklyPeriods} periods`,
        subjectId: req.subject,
        actual: count,
        required: req.weeklyPeriods,
      });
    } else if (count < req.weeklyPeriods) {
      const entry = {
        code: 'SUBJECT_QUOTA_INCOMPLETE',
        message: `Subject has ${count}/${req.weeklyPeriods} weekly periods`,
        subjectId: req.subject,
        actual: count,
        required: req.weeklyPeriods,
      };
      if (forPublish && settings?.publishRequiresCompleteQuotas !== false) {
        errors.push(entry);
      } else {
        warnings.push(entry);
      }
    }
  }

  // R5: Consecutive subject limit per day
  const template = version.periodTemplate;
  const lectureSlots = (template?.slots || [])
    .filter((s) => s.type === 'lecture')
    .sort((a, b) => a.order - b.order);

  for (const req of requirements) {
    const maxConsecutive = req.maxConsecutive ?? settings?.defaultMaxConsecutive ?? 2;
    for (const day of [...new Set(slots.map((s) => s.day))]) {
      let run = 0;
      for (const period of lectureSlots) {
        const hasSubject = slots.some(
          (s) =>
            s.day === day &&
            String(s.periodId) === String(period._id) &&
            String(s.subject) === String(req.subject)
        );
        if (hasSubject) {
          run += 1;
          if (run > maxConsecutive) {
            errors.push({
              code: 'CONSECUTIVE_LIMIT',
              message: `More than ${maxConsecutive} consecutive periods for subject`,
              subjectId: req.subject,
              day,
            });
            break;
          }
        } else {
          run = 0;
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

module.exports = {
  validateSlot,
  validateVersion,
};

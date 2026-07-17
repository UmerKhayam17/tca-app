const mongoose = require('mongoose');

const academySectionSchema = new mongoose.Schema(
  {
    sectionName: { type: String, required: true, trim: true },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademyClass',
      required: true,
      index: true,
    },
    useClassSubjects: { type: Boolean, default: true },
    subjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AcademySubject' }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'sections' }
);

academySectionSchema.index({ classId: 1, sectionName: 1 }, { unique: true });

/** Timetable / legacy config API compatibility */
academySectionSchema.virtual('name').get(function getName() {
  return this.sectionName;
});
academySectionSchema.virtual('class').get(function getClass() {
  return this.classId;
});
academySectionSchema.set('toJSON', { virtuals: true });
academySectionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AcademySection', academySectionSchema);

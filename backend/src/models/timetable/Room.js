const mongoose = require('mongoose');
const { ROOM_TYPES } = require('./constants');

const roomSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    capacity: { type: Number, default: 35, min: 1 },
    type: { type: String, enum: ROOM_TYPES, default: 'classroom' },
    /** Home room for one academy class — exclusive within a session. */
    assignedClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademyClass',
      default: null,
    },
    equipment: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

roomSchema.index({ session: 1, code: 1 }, { unique: true });
roomSchema.index(
  { session: 1, assignedClass: 1 },
  { unique: true, partialFilterExpression: { assignedClass: { $type: 'objectId' } } }
);

module.exports = mongoose.model('Room', roomSchema);

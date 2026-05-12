const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, required: true, trim: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
    isActive: { type: Boolean, default: true },
    profileImage: { type: String },
    fcmToken: { type: String },
    lastLogin: { type: Date },
    refreshToken: { type: String, select: false },
  },
  { timestamps: true }
);

userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);

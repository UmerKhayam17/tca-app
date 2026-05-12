const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    module: { type: String, required: true, trim: true },
    action: {
      type: String,
      required: true,
      enum: ['create', 'read', 'update', 'delete', 'approve'],
    },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Permission', permissionSchema);

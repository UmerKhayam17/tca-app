const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
    // Module-based permissions: { exam: ['view', 'create', 'edit'], assignment: ['view'] }
    modulePermissions: {
      type: Map,
      of: [String],
      default: new Map(),
    },
    isCustom: { type: Boolean, default: false },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);

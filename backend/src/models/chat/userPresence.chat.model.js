const mongoose = require("mongoose");

const userPresenceSchema = new mongoose.Schema(
  {
    
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["online", "offline", "away", "busy"],
      default: "offline",
    },

    statusMessage: { type: String, default: "" }, // custom "In a meeting..."
    lastActiveAt:  { type: Date },
    lastSeenAt:    { type: Date },   // last time they were online
  },
  { timestamps: true }
);


const UserPresence = mongoose.model("UserPresenceChat", userPresenceSchema);
module.exports = UserPresence;
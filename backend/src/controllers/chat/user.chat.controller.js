/**
 * controllers/user.chat.controller.js
 * Search company users to start conversations with.
 */

const User = require("../../models/User");
const UserPresence = require("../../models/chat/userPresence.chat.model");

exports.searchUsers = async (req, res) => {
  try {
    const myId = req.user._id;
    const { q = "", limit = 20 } = req.query;

    const users = await User.find({
      _id:      { $ne: myId },
      isActive: true,
      $or: [
        { name:  { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("name email profileImage")
      .limit(Number(limit))
      .lean();

    // Attach presence
    const presences = await UserPresence.find({
      userId: { $in: users.map((u) => u._id) },
    }).lean();

    const presenceMap = {};
    presences.forEach((p) => { presenceMap[p.userId.toString()] = p.status; });

    const result = users.map((u) => ({
      ...u,
      profile_image: u.profileImage,
      onlineStatus: presenceMap[u._id.toString()] || "offline",
    }));

    res.json({ ok: true, users: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Server error" });
  }
};
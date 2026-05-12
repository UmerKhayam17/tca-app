const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/tokenService');
const User = require('../models/User');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access token required');
    }
    const token = header.slice(7);
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub)
      .populate({
        path: 'role',
        populate: { path: 'permissions' },
      })
      .populate('permissions');

    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or inactive');
    }

    req.user = user;
    req.user.roleDoc = user.role;
    next();
  } catch (e) {
    if (e instanceof ApiError) return next(e);
    return next(new ApiError(401, 'Invalid or expired access token'));
  }
}

module.exports = { protect };

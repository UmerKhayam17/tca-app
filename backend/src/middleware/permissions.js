const ApiError = require('../utils/ApiError');

function collectPermissionNames(user) {
  const names = new Set();
  const role = user.roleDoc || user.role;
  if (role && role.permissions) {
    role.permissions.forEach((p) => {
      if (p && p.name) names.add(p.name);
    });
  }
  if (user.permissions && user.permissions.length) {
    user.permissions.forEach((p) => {
      if (p && p.name) names.add(p.name);
    });
  }
  return names;
}

function requirePermission(...permissionNames) {
  return (req, res, next) => {
    const role = req.user?.roleDoc || req.user?.role;
    const roleName = typeof role === 'object' && role?.name ? role.name : null;
    if (roleName === 'admin') {
      return next();
    }

    const names = collectPermissionNames(req.user);
    const allowed = permissionNames.some((p) => names.has(p));
    if (!allowed) {
      return next(new ApiError(403, 'You do not have permission for this action'));
    }
    return next();
  };
}

function requireAnyPermission(...permissionNames) {
  return (req, res, next) => {
    const role = req.user?.roleDoc || req.user?.role;
    const roleName = typeof role === 'object' && role?.name ? role.name : null;
    if (roleName === 'admin') {
      return next();
    }
    const names = collectPermissionNames(req.user);
    const allowed = permissionNames.some((p) => names.has(p));
    if (!allowed) {
      return next(new ApiError(403, 'You do not have permission for this action'));
    }
    return next();
  };
}

module.exports = { requirePermission, requireAnyPermission, collectPermissionNames };

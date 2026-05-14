const ApiError = require('../utils/ApiError');
const { hasModulePermission } = require('../modules');

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

/**
 * Require module-based permission
 * @param {String} moduleName - Module name (e.g., 'exam', 'assignment')
 * @param {String|Array} action - Action(s) to require (e.g., 'view', 'create', or ['view', 'edit'])
 */
function requireModulePermission(moduleName, action) {
  return (req, res, next) => {
    const role = req.user?.roleDoc || req.user?.role;
    const roleName = typeof role === 'object' && role?.name ? role.name : null;
    if (roleName === 'admin') {
      return next();
    }

    const actions = Array.isArray(action) ? action : [action];
    const hasPermission = actions.some((a) => hasModulePermission(req.user, moduleName, a));

    if (!hasPermission) {
      return next(
        new ApiError(
          403,
          `You do not have ${action} permission for ${moduleName} module`
        )
      );
    }
    return next();
  };
}

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireModulePermission,
  collectPermissionNames,
};

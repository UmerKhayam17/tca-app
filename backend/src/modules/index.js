/**
 * Modules Export
 * Central export for all module-related utilities
 */

const MODULES = require('./moduleConfig');
const {
    hasModulePermission,
    hasModuleAccess,
    grantModulePermission,
    revokeModulePermission,
    getModulePermissions,
    getAllUserModulePermissions,
} = require('./moduleUtils');

module.exports = {
    MODULES,
    hasModulePermission,
    hasModuleAccess,
    grantModulePermission,
    revokeModulePermission,
    getModulePermissions,
    getAllUserModulePermissions,
};

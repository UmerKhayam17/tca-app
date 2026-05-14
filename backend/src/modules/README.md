# Module-Based Permission System

## Overview

This module-based permission system allows granular control over user access to different modules (Exam, Assignment, Attendance, etc.) with specific actions (view, create, edit, delete, etc.).

## Structure

### Available Modules and Actions

```
{
  exam: {view, create, edit, delete, publish}
  assignment: {view, create, edit, delete, submit}
  attendance: {view, create, edit, delete, correct}
  student: {view, create, edit, delete, activate, suspend}
  fee: {view, create, edit, delete, generate, record}
  timetable: {view, create, edit, delete}
  announcement: {view, create, edit, delete}
  chat: {view, create, edit, delete, participate}
  config: {view, create, edit, delete}
  role: {view, create, edit, delete}
  user: {view, create, edit, delete}
}
```

## Creating a User with Module Permissions

### Request Example

```json
POST /api/v1/users/

{
  "name": "John Doe",
  "email": "john@academy.local",
  "password": "SecurePass@123",
  "phone": "+92300123456",
  "role": "507f1f77bcf86cd799439011",
  "modulePermissions": {
    "exam": ["view", "create", "edit"],
    "assignment": ["view", "create"],
    "attendance": ["view"],
    "student": ["view", "edit"]
  }
}
```

### Response

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "email": "john@academy.local",
    "phone": "+92300123456",
    "role": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "teacher",
      "permissions": []
    },
    "modulePermissions": {
      "exam": ["view", "create", "edit"],
      "assignment": ["view", "create"],
      "attendance": ["view"],
      "student": ["view", "edit"]
    },
    "isActive": true,
    "createdAt": "2026-05-13T10:00:00.000Z"
  }
}
```

## Managing Module Permissions

### Grant/Update Module Permissions

```
PATCH /api/v1/users/{userId}/module-permissions

{
  "moduleName": "exam",
  "actions": ["view", "create", "edit", "publish"]
}
```

### Revoke All Module Permissions

```
DELETE /api/v1/users/{userId}/module-permissions

{
  "moduleName": "exam"
}
```

## Using Module Permissions in Routes

### Protect Routes with Module Permission

```javascript
const { requireModulePermission } = require('../middleware/permissions');
const router = require('express').Router();
const examController = require('../controllers/examController');

// Require view permission
router.get('/', requireModulePermission('exam', 'view'), examController.listExams);

// Require create or edit permission
router.post('/', requireModulePermission('exam', ['create', 'edit']), examController.createExam);

// Require delete permission
router.delete('/:id', requireModulePermission('exam', 'delete'), examController.deleteExam);
```

## Using Module Utilities

### In Controllers

```javascript
const { hasModulePermission, getAllUserModulePermissions } = require('../modules');

function getExams(req, res) {
  const canView = hasModulePermission(req.user, 'exam', 'view');
  const canCreate = hasModulePermission(req.user, 'exam', 'create');
  
  if (!canView) {
    return res.status(403).json({ success: false, message: 'No permission' });
  }
  
  // Get all module permissions for user
  const allPerms = getAllUserModulePermissions(req.user);
  console.log(allPerms);
  // { exam: ['view', 'create'], assignment: ['view'] }
}
```

### Available Utility Functions

```javascript
const {
  hasModulePermission,        // Check single action permission
  hasModuleAccess,            // Check if user has any permission for module
  grantModulePermission,      // Add permissions to user
  revokeModulePermission,     // Remove permissions from user
  getModulePermissions,       // Get all actions for specific module
  getAllUserModulePermissions // Get all module permissions for user
} = require('../modules');
```

## Frontend Integration

### Display Permissions Based on User Permissions

```javascript
// After login, user receives modulePermissions in token payload or user data
const userPermissions = user.modulePermissions;

// Show/hide UI elements based on permissions
if (userPermissions.exam?.includes('create')) {
  showCreateExamButton();
}

if (userPermissions.assignment?.includes('view')) {
  showAssignmentsList();
}
```

## Default Admin

The admin role has access to **all modules and all actions** by default. No explicit permission checking is needed for admin users.

## Notes

- Admin users bypass all module permission checks
- Each user can have different permissions for different modules
- Permissions are stored as an array of action strings per module
- Invalid actions are filtered out during creation/update

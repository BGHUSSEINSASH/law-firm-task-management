const rolePermissions = {
  admin: ['*'],
  department_head: [
    'tasks:create',
    'tasks:update',
    'tasks:approve',
    'files:upload',
    'files:delete',
    'clients:read',
    'departments:read',
    'lawyers:read',
    'users:read'
  ],
  lawyer: [
    'tasks:read',
    'tasks:update_own',
    'files:upload',
    'files:read'
  ],
  assistant: [
    'tasks:read',
    'clients:read',
    'files:read'
  ]
};

const hasPermission = (role, permission) => {
  const permissions = rolePermissions[role] || [];
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
};

const authorizePermission = (permission) => (req, res, next) => {
  const role = req.user?.role;
  if (!role || !hasPermission(role, permission)) {
    return res.status(403).json({ success: false, message: 'غير مصرح' });
  }
  next();
};

module.exports = { rolePermissions, authorizePermission, hasPermission };

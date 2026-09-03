import { Router, Response } from 'express';
import { db } from '../db.js';
import { generateTemporaryPassword, hashPassword } from '../crypto.js';
import { authenticateStaff, AuthenticatedRequest, extractClientIp, requireRole } from '../auth.js';
import { EmployeeUser, StaffRole, UserRole } from '../../src/types.js';

const router = Router();

// Only SUPER_ADMIN or ADMIN can access staff management endpoints
router.use(authenticateStaff);
router.use(requireRole('SUPER_ADMIN', 'ADMIN'));

function sanitize(user: EmployeeUser) {
  const { passwordHash, salt, ...safe } = user;
  return safe;
}

/**
 * GET /api/admin/staff
 * List all employee accounts with session count
 */
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers();
  const sessions = db.getSessions();

  // Exclude regular customers from staff directory
  const staffUsers = users.filter(u => u.role !== 'CUSTOMER');

  const enriched = staffUsers.map(u => {
    const activeSessions = sessions.filter(s => s.userId === u.id && new Date(s.expiresAt) > new Date()).length;
    return {
      ...sanitize(u),
      activeSessions,
      isOwner: u.role === 'SUPER_ADMIN',
    };
  });

  res.json(enriched);
});

/**
 * POST /api/admin/staff
 * Create a new employee account with individual identity and temporary password
 * Requirement: Only Super Admins or Admins can create these staff accounts and assign roles.
 */
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const { name, email, role, customTemporaryPassword } = req.body;
  const admin = req.user!;
  const ip = extractClientIp(req);

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required.' });
  }

  // Prevent creating SUPER_ADMIN accounts
  if (role === 'SUPER_ADMIN') {
    return res.status(400).json({ error: 'Cannot create additional SUPER_ADMIN accounts. Only the primary Main Manager holds this role.' });
  }

  // Requirement: Only the Main Manager has the authority to create IDs and passwords for other staff members
  if (admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ 
      error: 'Access Denied: Only the Main Manager (Super Admin) has the authority to create IDs and passwords for staff members (Admins and Employees).',
      code: 'MAIN_MANAGER_ONLY'
    });
  }

  const validRoles: UserRole[] = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'INVENTORY_MANAGER', 'ORDER_MANAGER', 'SUPPORT_AGENT'];
  if (!validRoles.includes(role as UserRole)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
  }

  const users = db.getUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(409).json({ error: `An account with email ${email} already exists.` });
  }

  const tempPassword = customTemporaryPassword || generateTemporaryPassword();
  const { hash, salt } = hashPassword(tempPassword);

  const newEmployee: EmployeeUser = {
    id: `usr_emp_${Date.now().toString(36)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: role as UserRole,
    status: 'ACTIVE',
    authProvider: 'LOCAL',
    passwordHash: hash,
    salt,
    mustChangePassword: true,
    temporaryPassword: tempPassword, // Provided to Admin ONCE at creation
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newEmployee);
  db.setUsers(users);

  // Record audit log
  db.recordAuditLog({
    employeeId: admin.id,
    employeeName: admin.name,
    employeeEmail: admin.email,
    role: admin.role,
    action: 'EMPLOYEE_CREATE',
    resource: 'Staff',
    resourceId: newEmployee.id,
    details: `${admin.role} created staff account for ${newEmployee.name} (${newEmployee.email}) with role ${newEmployee.role}.`,
    ip,
    status: 'SUCCESS',
  });

  res.status(201).json({
    message: 'Employee account created successfully.',
    employee: sanitize(newEmployee),
    temporaryPassword: tempPassword,
  });
});

/**
 * PUT /api/admin/staff/:id
 * Edit employee details or role
 */
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  const admin = req.user!;
  const ip = extractClientIp(req);

  const users = db.getUsers();
  const employee = users.find(u => u.id === id);

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  // Prevent modifying owner / SUPER_ADMIN role
  if (employee.role === 'SUPER_ADMIN' && role && role !== 'SUPER_ADMIN') {
    return res.status(400).json({ error: 'Cannot change the role of the primary Super Admin / Owner.' });
  }

  // Prevent changing someone else to SUPER_ADMIN
  if (employee.role !== 'SUPER_ADMIN' && role === 'SUPER_ADMIN') {
    return res.status(400).json({ error: 'Cannot elevate accounts to SUPER_ADMIN.' });
  }

  const oldRole = employee.role;
  if (name) employee.name = name.trim();
  if (email) employee.email = email.trim().toLowerCase();
  if (role) employee.role = role as StaffRole;
  employee.updatedAt = new Date().toISOString();

  db.setUsers(users);

  db.recordAuditLog({
    employeeId: admin.id,
    employeeName: admin.name,
    employeeEmail: admin.email,
    role: admin.role,
    action: 'EMPLOYEE_UPDATE',
    resource: 'Staff',
    resourceId: employee.id,
    details: `Updated ${employee.name} details. ${oldRole !== employee.role ? `Role changed from ${oldRole} to ${employee.role}.` : ''}`,
    ip,
    status: 'SUCCESS',
  });

  res.json({
    message: 'Employee details updated.',
    employee: sanitize(employee),
  });
});

/**
 * PATCH /api/admin/staff/:id/status
 * Enable or Disable employee account
 * CRITICAL: When disabled, all sessions MUST be revoked immediately
 */
router.patch('/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const admin = req.user!;
  const ip = extractClientIp(req);

  if (status !== 'ACTIVE' && status !== 'DISABLED') {
    return res.status(400).json({ error: 'Status must be ACTIVE or DISABLED.' });
  }

  // Requirement: Only the Main Manager has the authority to deactivate or suspend any Admin/Staff account
  if (admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ 
      error: 'Access Denied: Only the Main Manager (Super Admin) has the authority to deactivate or suspend staff accounts.',
      code: 'MAIN_MANAGER_ONLY'
    });
  }

  const users = db.getUsers();
  const employee = users.find(u => u.id === id);

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  // Cannot disable the owner / super admin
  if (employee.role === 'SUPER_ADMIN') {
    return res.status(400).json({ error: 'Cannot disable the primary SUPER_ADMIN / OWNER account.' });
  }

  employee.status = status;
  employee.updatedAt = new Date().toISOString();

  // If disabled, revoke all active sessions immediately
  if (status === 'DISABLED') {
    db.revokeUserSessions(employee.id);
  }

  db.setUsers(users);

  db.recordAuditLog({
    employeeId: admin.id,
    employeeName: admin.name,
    employeeEmail: admin.email,
    role: admin.role,
    action: status === 'DISABLED' ? 'EMPLOYEE_DISABLE' : 'EMPLOYEE_ENABLE',
    resource: 'Staff',
    resourceId: employee.id,
    details: `Super Admin ${status === 'DISABLED' ? 'disabled' : 'reactivated'} employee ${employee.name} (${employee.email}). All active sessions ${status === 'DISABLED' ? 'revoked immediately' : 'ready'}.`,
    ip,
    status: 'SUCCESS',
  });

  res.json({
    message: `Employee account is now ${status}. ${status === 'DISABLED' ? 'All active sessions were revoked.' : ''}`,
    employee: sanitize(employee),
  });
});

/**
 * POST /api/admin/staff/:id/reset-password
 * Reset employee password, generate new temporary password, force change on next login, revoke sessions
 */
router.post('/:id/reset-password', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const admin = req.user!;
  const ip = extractClientIp(req);

  if (admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ 
      error: 'Access Denied: Only the Main Manager (Super Admin) can reset passwords and create new credentials for staff accounts.',
      code: 'MAIN_MANAGER_ONLY'
    });
  }

  const users = db.getUsers();
  const employee = users.find(u => u.id === id);

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const newTempPassword = generateTemporaryPassword();
  const { hash, salt } = hashPassword(newTempPassword);

  employee.passwordHash = hash;
  employee.salt = salt;
  employee.mustChangePassword = true;
  employee.temporaryPassword = newTempPassword;
  employee.updatedAt = new Date().toISOString();

  // Revoke all existing sessions so employee must log in with new password
  db.revokeUserSessions(employee.id);
  db.setUsers(users);

  db.recordAuditLog({
    employeeId: admin.id,
    employeeName: admin.name,
    employeeEmail: admin.email,
    role: admin.role,
    action: 'EMPLOYEE_PASSWORD_RESET',
    resource: 'Staff',
    resourceId: employee.id,
    details: `Super Admin reset password for ${employee.name} and revoked all active sessions.`,
    ip,
    status: 'SUCCESS',
  });

  res.json({
    message: 'Password reset successfully. A temporary password was generated and all active sessions were revoked.',
    temporaryPassword: newTempPassword,
    employee: sanitize(employee),
  });
});

/**
 * POST /api/admin/staff/:id/revoke-sessions
 * Immediately revoke all active sessions for this employee
 */
router.post('/:id/revoke-sessions', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const admin = req.user!;
  const ip = extractClientIp(req);

  const users = db.getUsers();
  const employee = users.find(u => u.id === id);

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const sessions = db.getSessions();
  const revokedCount = sessions.filter(s => s.userId === id).length;
  db.revokeUserSessions(id);

  db.recordAuditLog({
    employeeId: admin.id,
    employeeName: admin.name,
    employeeEmail: admin.email,
    role: admin.role,
    action: 'SESSION_REVOCATION',
    resource: 'Staff',
    resourceId: employee.id,
    details: `Super Admin revoked ${revokedCount} active session(s) for ${employee.name}.`,
    ip,
    status: 'SUCCESS',
  });

  res.json({
    message: `Successfully revoked ${revokedCount} active session(s) for ${employee.name}.`,
    revokedCount,
  });
});

/**
 * GET /api/admin/staff/:id/activity
 * Get audit logs for a specific employee
 */
router.get('/:id/activity', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const logs = db.getAuditLogs().filter(l => l.employeeId === id || l.resourceId === id);
  res.json(logs);
});

/**
 * DELETE /api/admin/staff/:id
 * Permanent deletion of employee account (SUPER_ADMIN only)
 * Historical audit logs remain preserved with former employee info
 */
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const admin = req.user!;
  const ip = extractClientIp(req);

  if (admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ 
      error: 'Access Denied: Only the Main Manager (Super Admin) can permanently delete staff accounts.',
      code: 'MAIN_MANAGER_ONLY'
    });
  }

  const users = db.getUsers();
  const employee = users.find(u => u.id === id);

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  if (employee.role === 'SUPER_ADMIN') {
    return res.status(400).json({ error: 'Cannot remove the primary SUPER_ADMIN / OWNER.' });
  }

  // Revoke sessions
  db.revokeUserSessions(id);

  // Remove from users
  db.setUsers(users.filter(u => u.id !== id));

  db.recordAuditLog({
    employeeId: admin.id,
    employeeName: admin.name,
    employeeEmail: admin.email,
    role: admin.role,
    action: 'EMPLOYEE_DELETE',
    resource: 'Staff',
    resourceId: id,
    details: `Super Admin permanently deleted employee record for ${employee.name} (${employee.email}, role: ${employee.role}). Historical audit logs preserved.`,
    ip,
    status: 'SUCCESS',
  });

  res.json({
    message: `Employee ${employee.name} was permanently removed. Historical audit records remain preserved.`,
  });
});

export default router;

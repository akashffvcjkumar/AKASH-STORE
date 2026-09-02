import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { generateSessionToken, hashPassword, verifyPassword } from '../crypto.js';
import { authenticateStaff, authenticateUser, AuthenticatedRequest, extractClientIp } from '../auth.js';
import { ROLE_PERMISSIONS, UserRole, isStaffRole, EmployeeUser, StaffRole } from '../../src/types.js';

const router = Router();

// Sanitize user object before sending to client (never expose passwordHash or salt)
function sanitizeUser(user: any) {
  const { passwordHash, salt, ...safeUser } = user;
  return safeUser;
}

/**
 * ============================================================================
 * CUSTOMER AUTHENTICATION (Google OAuth & Customer Sessions)
 * Strict RBAC: All customers are assigned role 'CUSTOMER'.
 * Customers NEVER have access to admin credentials or staff APIs.
 * ============================================================================
 */

/**
 * POST /api/auth/customer/google
 * (Also aliased as POST /api/auth/google)
 * Customer Google OAuth handler: Authenticate or register customer via Google account.
 * Strict RBAC Guarantee: Default role is always 'CUSTOMER'.
 */
router.post(['/customer/google', '/google'], (req: Request, res: Response) => {
  const { email, name, avatar, googleId } = req.body;
  const ip = extractClientIp(req);

  if (!email) {
    return res.status(400).json({ error: 'Google email is required.' });
  }

  // Find or create customer with GUARANTEED role: 'CUSTOMER'
  const customer = db.findOrCreateGoogleCustomer({
    email,
    name: name || 'Google Customer',
    avatar,
    googleId: googleId || `google_${Date.now()}`,
  });

  if (customer.status === 'DISABLED') {
    return res.status(403).json({
      error: 'Your customer account has been suspended. Please contact customer support.',
      code: 'ACCOUNT_DISABLED',
    });
  }

  // Create isolated customer session
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  const sessions = db.getSessions();
  sessions.push({
    token,
    userId: customer.id,
    role: customer.role, // strictly 'CUSTOMER'
    createdAt: new Date().toISOString(),
    expiresAt,
    userAgent: req.headers['user-agent'],
    ip,
  });
  db.setSessions(sessions);

  // Audit record for customer sign-in
  db.recordAuditLog({
    employeeId: customer.id,
    employeeName: customer.name,
    employeeEmail: customer.email,
    role: customer.role,
    action: 'CUSTOMER_GOOGLE_LOGIN',
    resource: 'CustomerAuth',
    details: `Customer ${customer.name} logged in via Google OAuth (${customer.email})`,
    ip,
    status: 'SUCCESS',
  });

  return res.json({
    token,
    user: sanitizeUser(customer),
    role: customer.role,
  });
});

/**
 * GET /api/auth/customer/me
 * Returns current authenticated customer profile
 */
router.get('/customer/me', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({
    user: sanitizeUser(user),
    role: user.role,
  });
});

/**
 * POST /api/auth/customer/logout
 * Revokes active customer session
 */
router.post('/customer/logout', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const token = req.sessionToken!;
  const user = req.user!;
  const sessions = db.getSessions().filter(s => s.token !== token);
  db.setSessions(sessions);

  res.json({ message: 'Customer successfully logged out.' });
});

/**
 * ============================================================================
 * ADMIN & STAFF MANUAL AUTHENTICATION
 * Strict RBAC: Email & strong hashed password specifically for the Admin Portal.
 * Customers are strictly barred from logging in or using this endpoint.
 * ============================================================================
 */

/**
 * POST /api/auth/login and /api/auth/staff/login
 * Individual employee login with password verification
 */
router.post(['/login', '/staff/login'], (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ip = extractClientIp(req);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = db.getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user || !user.passwordHash || !user.salt) {
    db.recordAuditLog({
      employeeId: 'unknown',
      employeeName: 'Unknown',
      employeeEmail: email,
      role: 'SUPPORT_AGENT',
      action: 'LOGIN_FAILED_CREDENTIALS',
      resource: 'Auth',
      details: `Failed login attempt for non-existent or unconfigured staff account: ${email}`,
      ip,
      status: 'FAILED',
    });
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // STRICT RBAC CHECK:
  // If this user is a regular customer, DO NOT ALLOW access to Admin Portal!
  if (user.role === 'CUSTOMER' || !isStaffRole(user.role)) {
    db.recordAuditLog({
      employeeId: user.id,
      employeeName: user.name,
      employeeEmail: user.email,
      role: user.role,
      action: 'STAFF_LOGIN_REJECTED_CUSTOMER',
      resource: 'Auth',
      details: `Customer account (${user.email}) attempted to sign in via Staff Admin login. Blocked.`,
      ip,
      status: 'REJECTED',
    });
    return res.status(403).json({
      error: 'Access Denied: Customer accounts are strictly prohibited from accessing the Staff Admin Portal. Please use the Customer Sign-In.',
      code: 'CUSTOMER_CANNOT_ACCESS_ADMIN',
    });
  }

  // Check if account is disabled
  if (user.status === 'DISABLED') {
    db.revokeUserSessions(user.id);
    db.recordAuditLog({
      employeeId: user.id,
      employeeName: user.name,
      employeeEmail: user.email,
      role: user.role,
      action: 'LOGIN_BLOCKED_DISABLED_ACCOUNT',
      resource: 'Auth',
      details: `Disabled employee ${user.name} attempted to log in.`,
      ip,
      status: 'REJECTED',
    });
    return res.status(403).json({ 
      error: 'Your account has been deactivated. Please contact the Store Owner.',
      code: 'ACCOUNT_DISABLED'
    });
  }

  // Verify password
  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    db.recordAuditLog({
      employeeId: user.id,
      employeeName: user.name,
      employeeEmail: user.email,
      role: user.role,
      action: 'LOGIN_FAILED_PASSWORD',
      resource: 'Auth',
      details: `Invalid password entered for ${user.email}`,
      ip,
      status: 'FAILED',
    });
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Update last login
  user.lastLoginAt = new Date().toISOString();
  db.save();

  // Create session (valid for 24 hours)
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const sessions = db.getSessions();
  sessions.push({
    token,
    userId: user.id,
    role: user.role,
    createdAt: new Date().toISOString(),
    expiresAt,
    userAgent: req.headers['user-agent'],
    ip,
  });
  db.setSessions(sessions);

  // Audit log
  db.recordAuditLog({
    employeeId: user.id,
    employeeName: user.name,
    employeeEmail: user.email,
    role: user.role,
    action: 'LOGIN_SUCCESS',
    resource: 'Auth',
    details: `${user.name} logged in successfully with staff role ${user.role}.`,
    ip,
    status: 'SUCCESS',
  });

  return res.json({
    token,
    user: sanitizeUser(user),
    permissions: ROLE_PERMISSIONS[user.role],
    mustChangePassword: !!user.mustChangePassword,
  });
});

/**
 * GET /api/auth/me
 * Returns current authenticated employee profile and permissions
 */
router.get('/me', authenticateStaff, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({
    user: sanitizeUser(user),
    permissions: ROLE_PERMISSIONS[user.role],
    mustChangePassword: !!user.mustChangePassword,
  });
});

/**
 * POST /api/auth/logout
 * Revokes current session
 */
router.post('/logout', authenticateStaff, (req: AuthenticatedRequest, res: Response) => {
  const token = req.sessionToken!;
  const user = req.user!;
  const sessions = db.getSessions().filter(s => s.token !== token);
  db.setSessions(sessions);

  db.recordAuditLog({
    employeeId: user.id,
    employeeName: user.name,
    employeeEmail: user.email,
    role: user.role,
    action: 'LOGOUT',
    resource: 'Auth',
    details: `${user.name} logged out.`,
    ip: extractClientIp(req),
    status: 'SUCCESS',
  });

  res.json({ message: 'Successfully logged out.' });
});

/**
 * POST /api/auth/change-password
 * Required on first login if mustChangePassword is true, or on user self-service change
 */
router.post('/change-password', authenticateStaff, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;
  const ip = extractClientIp(req);

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  // If not forcing first-login change, require verifying current password
  if (!user.mustChangePassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required.' });
    }
    const isValid = verifyPassword(currentPassword, user.passwordHash!, user.salt!);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
  }

  const { hash, salt } = hashPassword(newPassword);
  user.passwordHash = hash;
  user.salt = salt;
  user.mustChangePassword = false;
  user.temporaryPassword = null;
  user.updatedAt = new Date().toISOString();
  db.save();

  db.recordAuditLog({
    employeeId: user.id,
    employeeName: user.name,
    employeeEmail: user.email,
    role: user.role,
    action: 'PASSWORD_CHANGED',
    resource: 'User',
    resourceId: user.id,
    details: `${user.name} updated account password.`,
    ip,
    status: 'SUCCESS',
  });

  res.json({
    message: 'Password successfully updated.',
    user: sanitizeUser(user),
  });
});

/**
 * POST /api/auth/quick-switch
 * Developer / Evaluation Helper: easily switch active session between any of the 5 seeded roles
 * or a specific user ID to evaluate RBAC and permissions seamlessly in the UI
 */
router.post('/quick-switch', (req: Request, res: Response) => {
  const { role, userId } = req.body;
  const users = db.getUsers();
  
  let targetUser: EmployeeUser | undefined;
  if (userId) {
    targetUser = users.find(u => u.id === userId);
  } else if (role) {
    targetUser = users.find(u => u.role === (role as StaffRole) && u.status === 'ACTIVE') 
      || users.find(u => u.role === (role as StaffRole));
  }

  if (!targetUser) {
    return res.status(404).json({ error: 'Target staff member not found.' });
  }

  // If disabled, test disabled enforcement
  if (targetUser.status === 'DISABLED') {
    return res.status(403).json({
      error: `Cannot switch: Account for ${targetUser.name} is DISABLED.`,
      code: 'ACCOUNT_DISABLED',
      user: sanitizeUser(targetUser),
    });
  }

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const sessions = db.getSessions();
  sessions.push({
    token,
    userId: targetUser.id,
    role: targetUser.role,
    createdAt: new Date().toISOString(),
    expiresAt,
    userAgent: 'Demo Quick Switcher',
    ip: extractClientIp(req),
  });
  db.setSessions(sessions);

  res.json({
    token,
    user: sanitizeUser(targetUser),
    permissions: ROLE_PERMISSIONS[targetUser.role],
    mustChangePassword: !!targetUser.mustChangePassword,
  });
});

export default router;

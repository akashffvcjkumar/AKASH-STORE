import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { EmployeeUser, PermissionDefinition, ROLE_PERMISSIONS, UserRole, isStaffRole } from '../src/types.js';

export interface AuthenticatedRequest extends Request {
  user?: EmployeeUser;
  sessionToken?: string;
}

export function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Middleware: General Token Authenticator (Customers or Staff)
 */
export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No session token provided.' });
  }

  const token = authHeader.substring(7);
  const sessions = db.getSessions();
  const session = sessions.find(s => s.token === token);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }

  // Check expiration
  if (new Date(session.expiresAt) < new Date()) {
    db.setSessions(sessions.filter(s => s.token !== token));
    return res.status(401).json({ error: 'Session has expired. Please log in again.' });
  }

  const users = db.getUsers();
  const user = users.find(u => u.id === session.userId);

  if (!user) {
    db.setSessions(sessions.filter(s => s.token !== token));
    return res.status(401).json({ error: 'User account not found.' });
  }

  if (user.status === 'DISABLED') {
    db.revokeUserSessions(user.id);
    return res.status(403).json({ 
      error: 'Your account has been deactivated. Access denied.',
      code: 'ACCOUNT_DISABLED' 
    });
  }

  req.user = user;
  req.sessionToken = token;
  next();
}

/**
 * Middleware: Strict Staff RBAC Authenticator.
 * Protects all /admin/* and /api/admin/* endpoints.
 * If user has role 'CUSTOMER' or is unauthenticated, instantly blocks with 403 Forbidden.
 */
export function authenticateStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const ip = extractClientIp(req);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Authentication required. Staff credentials are required to access this endpoint.',
      code: 'AUTH_REQUIRED'
    });
  }

  const token = authHeader.substring(7);
  const sessions = db.getSessions();
  const session = sessions.find(s => s.token === token);

  if (!session) {
    return res.status(401).json({ 
      error: 'Invalid or expired session. Please log in with your Staff credentials.',
      code: 'SESSION_INVALID'
    });
  }

  // Check expiration
  if (new Date(session.expiresAt) < new Date()) {
    db.setSessions(sessions.filter(s => s.token !== token));
    return res.status(401).json({ 
      error: 'Staff session has expired. Please log in again.',
      code: 'SESSION_EXPIRED'
    });
  }

  // Find user in DB
  const users = db.getUsers();
  const user = users.find(u => u.id === session.userId);

  if (!user) {
    db.setSessions(sessions.filter(s => s.token !== token));
    return res.status(401).json({ error: 'User account not found.' });
  }

  // CRITICAL RBAC REQUIREMENT:
  // If a user with the CUSTOMER role tries to access any admin URL or API,
  // INSTANTLY block them with a 403 Forbidden error and record an audit log!
  if (user.role === 'CUSTOMER' || !isStaffRole(user.role)) {
    db.recordAuditLog({
      employeeId: user.id,
      employeeName: user.name,
      employeeEmail: user.email,
      role: user.role,
      action: 'BLOCKED_CUSTOMER_ADMIN_ACCESS',
      resource: 'AdminAPI',
      details: `Customer account (${user.email}) attempted unauthorized access to admin endpoint ${req.method} ${req.originalUrl}. Blocked with 403 Forbidden.`,
      ip,
      status: 'REJECTED',
    });
    return res.status(403).json({
      error: 'Access Denied: Customer accounts are strictly prohibited from accessing Admin endpoints.',
      code: 'CUSTOMER_FORBIDDEN',
      role: user.role,
    });
  }

  // If staff account is disabled, reject immediately and revoke any residual sessions
  if (user.status === 'DISABLED') {
    db.revokeUserSessions(user.id);
    db.recordAuditLog({
      employeeId: user.id,
      employeeName: user.name,
      employeeEmail: user.email,
      role: user.role,
      action: 'BLOCKED_ACCESS_DISABLED_ACCOUNT',
      resource: 'System',
      details: `Disabled staff member ${user.name} tried to access ${req.method} ${req.originalUrl}`,
      ip,
      status: 'REJECTED',
    });
    return res.status(403).json({ 
      error: 'Your staff account has been deactivated by the store administrator. Access denied.',
      code: 'ACCOUNT_DISABLED' 
    });
  }

  // Check if temporary password requires change
  if (user.mustChangePassword && !req.originalUrl.includes('/api/auth/change-password') && !req.originalUrl.includes('/api/auth/me')) {
    return res.status(403).json({
      error: 'Temporary password must be changed before accessing the admin panel.',
      code: 'PASSWORD_CHANGE_REQUIRED',
    });
  }

  req.user = user;
  req.sessionToken = token;
  next();
}

/**
 * Alias for authenticateStaff for clear route middleware naming
 */
export const requireStaffAuth = authenticateStaff;

/**
 * Middleware: Require specific permission defined in ROLE_PERMISSIONS
 */
export function requirePermission(permissionKey: keyof PermissionDefinition) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const permissions = ROLE_PERMISSIONS[req.user.role];
    if (!permissions || !permissions[permissionKey]) {
      db.recordAuditLog({
        employeeId: req.user.id,
        employeeName: req.user.name,
        employeeEmail: req.user.email,
        role: req.user.role,
        action: 'PERMISSION_DENIED',
        resource: permissionKey,
        details: `Role ${req.user.role} attempted unauthorized action requiring ${permissionKey}`,
        ip: extractClientIp(req),
        status: 'REJECTED',
      });
      return res.status(403).json({ 
        error: `Permission denied: Your role (${req.user.role}) does not have permission to ${permissionKey}.`,
        code: 'FORBIDDEN'
      });
    }

    next();
  };
}

/**
 * Middleware: Strict Role check (e.g. SUPER_ADMIN, ADMIN)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      db.recordAuditLog({
        employeeId: req.user.id,
        employeeName: req.user.name,
        employeeEmail: req.user.email,
        role: req.user.role,
        action: 'ROLE_UNAUTHORIZED',
        resource: 'RoleConstraint',
        details: `Access denied to ${req.originalUrl}. Required: ${allowedRoles.join(', ')}. User role: ${req.user.role}`,
        ip: extractClientIp(req),
        status: 'REJECTED',
      });
      return res.status(403).json({ 
        error: `Access restricted. Only ${allowedRoles.join(' or ')} can perform this action.`,
        code: 'FORBIDDEN' 
      });
    }

    next();
  };
}

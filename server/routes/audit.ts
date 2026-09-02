import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateStaff, AuthenticatedRequest, requirePermission } from '../auth.js';

const router = Router();

router.use(authenticateStaff);
router.use(requirePermission('canViewAuditLogs'));

/**
 * GET /api/admin/audit-logs
 * List audit logs with search, filtering by role, action, or date
 */
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { search, role, action, status, limit } = req.query;
  let logs = db.getAuditLogs();

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    logs = logs.filter(l => 
      l.employeeName.toLowerCase().includes(q) ||
      l.employeeEmail.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q) ||
      l.resource.toLowerCase().includes(q) ||
      l.resourceId?.toLowerCase().includes(q)
    );
  }

  if (role && typeof role === 'string' && role !== 'ALL') {
    logs = logs.filter(l => l.role === role);
  }

  if (action && typeof action === 'string' && action !== 'ALL') {
    logs = logs.filter(l => l.action === action);
  }

  if (status && typeof status === 'string' && status !== 'ALL') {
    logs = logs.filter(l => l.status === status);
  }

  const max = limit ? parseInt(limit as string, 10) : 200;
  res.json(logs.slice(0, max));
});

export default router;

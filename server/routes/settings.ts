import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticateStaff, AuthenticatedRequest, extractClientIp, requireRole } from '../auth.js';

const router = Router();

/**
 * Public: GET /api/settings/public
 * Returns general configuration needed by customer storefront
 */
router.get('/public', (req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({
    storeName: settings.storeName,
    ownerName: settings.ownerName,
    headquarters: settings.headquarters,
    contactEmail: settings.contactEmail,
    supportPhoneDisplay: settings.supportPhoneDisplay,
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
    bkashNumber: settings.bkashNumber,
    bkashEnabled: settings.bkashEnabled,
    nagadNumber: settings.nagadNumber,
    nagadEnabled: settings.nagadEnabled,
    codEnabled: settings.codEnabled,
    insideDhakaFee: settings.insideDhakaFee,
    outsideDhakaFee: settings.outsideDhakaFee,
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
  });
});

/**
 * Protected: GET /api/admin/settings
 * Super Admin gets full settings
 */
router.get('/admin', authenticateStaff, requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getSettings());
});

/**
 * Protected: PUT /api/admin/settings
 * Update settings (SUPER_ADMIN only)
 */
router.put('/admin', authenticateStaff, requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const ip = extractClientIp(req);
  const data = req.body;

  const current = db.getSettings();
  const updated = {
    ...current,
    storeName: data.storeName ?? current.storeName,
    ownerName: data.ownerName ?? current.ownerName,
    headquarters: data.headquarters ?? current.headquarters,
    contactEmail: data.contactEmail ?? current.contactEmail,
    bkashNumber: data.bkashNumber ?? current.bkashNumber,
    bkashEnabled: data.bkashEnabled !== undefined ? Boolean(data.bkashEnabled) : current.bkashEnabled,
    nagadNumber: data.nagadNumber ?? current.nagadNumber,
    nagadEnabled: data.nagadEnabled !== undefined ? Boolean(data.nagadEnabled) : current.nagadEnabled,
    codEnabled: data.codEnabled !== undefined ? Boolean(data.codEnabled) : current.codEnabled,
    codRequiresConfirmation: data.codRequiresConfirmation !== undefined ? Boolean(data.codRequiresConfirmation) : current.codRequiresConfirmation,
    insideDhakaFee: Number(data.insideDhakaFee ?? current.insideDhakaFee),
    outsideDhakaFee: Number(data.outsideDhakaFee ?? current.outsideDhakaFee),
    freeDeliveryThreshold: Number(data.freeDeliveryThreshold ?? current.freeDeliveryThreshold),
  };

  db.setSettings(updated);

  db.recordAuditLog({
    employeeId: user.id,
    employeeName: user.name,
    employeeEmail: user.email,
    role: user.role,
    action: 'SETTINGS_UPDATE',
    resource: 'StoreSettings',
    details: `${user.name} updated store and payment configurations.`,
    ip,
    status: 'SUCCESS',
  });

  res.json({
    message: 'Store and payment settings saved.',
    settings: updated,
  });
});

export default router;

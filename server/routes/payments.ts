import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateStaff, AuthenticatedRequest, extractClientIp, requirePermission } from '../auth.js';

const router = Router();

router.use(authenticateStaff);
router.use(requirePermission('canManagePayments'));

/**
 * GET /api/admin/payments
 * Get all payment records with filters for verification queue
 */
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { status, method, search } = req.query;
  let payments = db.getPayments();

  if (status && typeof status === 'string' && status !== 'ALL') {
    payments = payments.filter(p => p.status === status);
  }

  if (method && typeof method === 'string' && method !== 'ALL') {
    payments = payments.filter(p => p.method === method);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    payments = payments.filter(p => 
      p.id.toLowerCase().includes(q) ||
      p.orderId.toLowerCase().includes(q) ||
      p.transactionId?.toLowerCase().includes(q) ||
      p.senderPhone?.includes(q)
    );
  }

  res.json(payments);
});

/**
 * POST /api/admin/payments/:id/verify
 * Server-side payment verification (transitions to PAID & CONFIRMED)
 */
router.post('/:id/verify', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;
  const user = req.user!;
  const ip = extractClientIp(req);

  const payments = db.getPayments();
  const payment = payments.find(p => p.id === id);

  if (!payment) {
    return res.status(404).json({ error: 'Payment record not found.' });
  }

  if (payment.status === 'PAID') {
    return res.status(400).json({ error: 'This payment is already verified and marked as PAID.' });
  }

  payment.status = 'PAID';
  payment.verificationStatus = 'VERIFIED';
  payment.verifiedAt = new Date().toISOString();
  payment.verifiedBy = user.id;
  payment.updatedAt = new Date().toISOString();
  db.setPayments(payments);

  // Update associated Order status
  const orders = db.getOrders();
  const order = orders.find(o => o.id === payment.orderId);
  if (order) {
    order.paymentStatus = 'PAID';
    if (order.status === 'PENDING' || order.status === 'PAYMENT_VERIFICATION' || order.status === 'AWAITING_PAYMENT') {
      order.status = 'CONFIRMED';
    }
    order.timeline.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      note: `Payment verified by ${user.name} (${user.role}). TrxID: ${payment.transactionId || 'N/A'}. ${note || ''}`,
      updatedBy: user.id,
    });
    order.updatedAt = new Date().toISOString();
    db.setOrders(orders);
  }

  // Audit log (Example in prompt: "Admin X verified bKash payment.")
  db.recordAuditLog({
    employeeId: user.id,
    employeeName: user.name,
    employeeEmail: user.email,
    role: user.role,
    action: 'PAYMENT_VERIFY',
    resource: 'Payment',
    resourceId: payment.id,
    details: `${user.name} verified ${payment.method} payment of ৳${payment.amount} for order #${payment.orderId} (TrxID: ${payment.transactionId || 'N/A'})`,
    ip,
    status: 'SUCCESS',
  });

  res.json({
    message: 'Payment verified successfully. Order confirmed.',
    payment,
    order,
  });
});

/**
 * POST /api/admin/payments/:id/reject
 * Reject payment with mandatory reason (e.g. "Admin Y rejected a bKash payment")
 */
router.post('/:id/reject', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const user = req.user!;
  const ip = extractClientIp(req);

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'A specific reason is strictly required when rejecting a payment.' });
  }

  const payments = db.getPayments();
  const payment = payments.find(p => p.id === id);

  if (!payment) {
    return res.status(404).json({ error: 'Payment record not found.' });
  }

  payment.status = 'REJECTED';
  payment.verificationStatus = 'FAILED';
  payment.failureReason = reason.trim();
  payment.updatedAt = new Date().toISOString();
  db.setPayments(payments);

  // Update order timeline
  const orders = db.getOrders();
  const order = orders.find(o => o.id === payment.orderId);
  if (order) {
    order.paymentStatus = 'REJECTED';
    order.status = 'AWAITING_PAYMENT';
    order.timeline.push({
      status: 'AWAITING_PAYMENT',
      timestamp: new Date().toISOString(),
      note: `Payment rejected by ${user.name}: ${reason.trim()}. Customer must provide valid transaction.`,
      updatedBy: user.id,
    });
    order.updatedAt = new Date().toISOString();
    db.setOrders(orders);
  }

  // Audit log (Prompt example: "Admin Y rejected a bKash payment.")
  db.recordAuditLog({
    employeeId: user.id,
    employeeName: user.name,
    employeeEmail: user.email,
    role: user.role,
    action: 'PAYMENT_REJECT',
    resource: 'Payment',
    resourceId: payment.id,
    details: `${user.name} rejected ${payment.method} payment for order #${payment.orderId}. Reason: ${reason.trim()}`,
    ip,
    status: 'SUCCESS',
  });

  res.json({
    message: 'Payment rejected. Reason logged in audit records.',
    payment,
    order,
  });
});

export default router;

import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { generateOrderId } from '../crypto.js';
import { authenticateStaff, AuthenticatedRequest, extractClientIp, requirePermission } from '../auth.js';
import { OrderRecord, PaymentRecord, OrderStatus, PaymentMethod } from '../../src/types.js';

const router = Router();

// Normalizes Bangladeshi mobile numbers (e.g. +88017... or 017...)
function normalizeBdPhone(phone: string): string {
  const clean = phone.replace(/[\s\-()]/g, '');
  if (clean.startsWith('+880')) return '0' + clean.slice(4);
  if (clean.startsWith('880')) return '0' + clean.slice(3);
  return clean;
}

function isValidBdPhone(phone: string): boolean {
  const normalized = normalizeBdPhone(phone);
  return /^01[3-9]\d{8}$/.test(normalized);
}

/**
 * Public: POST /api/orders/checkout
 * Customer checkout with server-side price recalculation, stock reservation, and payment initiation
 */
router.post('/checkout', (req: Request, res: Response) => {
  const { customer, items, paymentMethod, paymentDetails, couponCode } = req.body;
  const settings = db.getSettings();

  if (!customer || !customer.fullName || !customer.phone || !customer.division || !customer.areaAddress) {
    return res.status(400).json({ error: 'Customer name, valid phone number, division, and full address are required.' });
  }

  const cleanPhone = normalizeBdPhone(customer.phone);
  if (!isValidBdPhone(cleanPhone)) {
    return res.status(400).json({ error: 'Please provide a valid Bangladesh phone number (e.g., 017XXXXXXXX).' });
  }
  customer.phone = cleanPhone;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  const validMethods: PaymentMethod[] = ['COD', 'BKASH', 'NAGAD'];
  if (!validMethods.includes(paymentMethod)) {
    return res.status(400).json({ error: 'Invalid payment method selected.' });
  }

  // Server-side inventory & price calculation (RULE 1 & RULE 2: Never trust frontend prices or stock)
  const products = db.getProducts();
  const verifiedItems = [];
  let calculatedSubtotal = 0;

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product || product.status !== 'ACTIVE') {
      return res.status(400).json({ error: `Product "${item.productName || 'Item'}" is no longer available.` });
    }

    let unitPrice = product.price;
    let availableStock = product.stock;
    let sku = product.sku;
    let variantName = undefined;

    if (item.variantId) {
      const variant = product.variants.find(v => v.id === item.variantId);
      if (!variant) {
        return res.status(400).json({ error: `Selected variant for "${product.name}" was not found.` });
      }
      unitPrice = variant.price;
      availableStock = variant.stock;
      sku = variant.sku;
      variantName = variant.name;
    }

    const qty = Math.max(1, Number(item.quantity) || 1);
    if (availableStock < qty) {
      return res.status(400).json({ 
        error: `Insufficient stock for "${product.name}${variantName ? ` - ${variantName}` : ''}". Available: ${availableStock}, requested: ${qty}.` 
      });
    }

    const itemTotal = unitPrice * qty;
    calculatedSubtotal += itemTotal;

    verifiedItems.push({
      productId: product.id,
      variantId: item.variantId,
      productName: product.name,
      variantName,
      sku,
      image: product.images[0] || '',
      price: unitPrice,
      quantity: qty,
      total: itemTotal,
    });
  }

  // Delivery fee calculation
  const isInsideDhaka = customer.division.toLowerCase().includes('dhaka') && 
                        customer.district?.toLowerCase().includes('dhaka');
  let deliveryFee = isInsideDhaka ? settings.insideDhakaFee : settings.outsideDhakaFee;
  if (calculatedSubtotal >= settings.freeDeliveryThreshold) {
    deliveryFee = 0; // Free delivery qualification
  }

  // Coupon discount calculation (Server-side verified)
  let discount = 0;
  if (couponCode) {
    const coupons = db.getCoupons();
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isActive);
    if (coupon) {
      if (calculatedSubtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'PERCENTAGE') {
          discount = Math.round((calculatedSubtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }
        coupon.usageCount++;
        db.setCoupons(coupons);
      }
    }
  }

  const finalTotal = Math.max(0, calculatedSubtotal + deliveryFee - discount);
  const orderSeq = db.nextOrderSequence();
  const orderId = generateOrderId(orderSeq);
  const paymentId = `pay_${paymentMethod.toLowerCase()}_${Date.now().toString(36)}`;

  // Payment Verification logic
  let initialOrderStatus: OrderStatus = 'PENDING';
  let initialPaymentStatus = 'UNPAID';
  let initialVerificationStatus = 'NONE';
  let trxId: string | undefined = undefined;
  let senderPhone: string | undefined = undefined;

  if (paymentMethod === 'BKASH' || paymentMethod === 'NAGAD') {
    senderPhone = paymentDetails?.senderPhone ? normalizeBdPhone(paymentDetails.senderPhone) : undefined;
    trxId = paymentDetails?.transactionId ? paymentDetails.transactionId.trim().toUpperCase() : undefined;

    if (!senderPhone || !isValidBdPhone(senderPhone)) {
      return res.status(400).json({ error: `Please enter the valid sender ${paymentMethod} mobile number.` });
    }
    if (!trxId || trxId.length < 5) {
      return res.status(400).json({ error: `Please enter the valid ${paymentMethod} Transaction ID (TrxID).` });
    }

    // RULE 5: Prevent duplicate transaction IDs
    const existingPayment = db.getPayments().find(p => p.transactionId && p.transactionId.toUpperCase() === trxId);
    if (existingPayment) {
      return res.status(400).json({ 
        error: `Transaction ID "${trxId}" has already been used for another order. Each transaction can only be claimed once.` 
      });
    }

    initialOrderStatus = 'PAYMENT_VERIFICATION';
    initialPaymentStatus = 'VERIFICATION_PENDING';
    initialVerificationStatus = 'PENDING';
  } else {
    // COD
    initialOrderStatus = settings.codRequiresConfirmation ? 'PENDING' : 'CONFIRMED';
    initialPaymentStatus = 'UNPAID';
    initialVerificationStatus = 'NONE';
  }

  // Deduct inventory transactionally
  for (const item of verifiedItems) {
    const product = products.find(p => p.id === item.productId)!;
    if (item.variantId) {
      const variant = product.variants.find(v => v.id === item.variantId)!;
      variant.stock -= item.quantity;
      product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    } else {
      product.stock -= item.quantity;
    }
    if (product.stock === 0) product.status = 'OUT_OF_STOCK';
  }
  db.setProducts(products);

  // Create payment record
  const receiverPhone = paymentMethod === 'BKASH' ? settings.bkashNumber : (paymentMethod === 'NAGAD' ? settings.nagadNumber : undefined);
  const paymentRecord: PaymentRecord = {
    id: paymentId,
    orderId,
    method: paymentMethod,
    status: initialPaymentStatus as any,
    verificationStatus: initialVerificationStatus as any,
    amount: finalTotal,
    currency: 'BDT',
    senderPhone,
    receiverPhone,
    transactionId: trxId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const payments = db.getPayments();
  payments.unshift(paymentRecord);
  db.setPayments(payments);

  // Create Order record
  const timeline = [
    {
      status: 'PENDING' as OrderStatus,
      timestamp: new Date().toISOString(),
      note: `Order placed via ${paymentMethod}. Total: ৳${finalTotal.toLocaleString()}`,
    },
  ];

  if (paymentMethod === 'BKASH' || paymentMethod === 'NAGAD') {
    timeline.push({
      status: 'PAYMENT_VERIFICATION' as OrderStatus,
      timestamp: new Date().toISOString(),
      note: `Payment info submitted: ${paymentMethod} TrxID ${trxId} from ${senderPhone}. Sent to verification queue.`,
    });
  } else if (initialOrderStatus === 'CONFIRMED') {
    timeline.push({
      status: 'CONFIRMED' as OrderStatus,
      timestamp: new Date().toISOString(),
      note: 'Cash on Delivery order automatically confirmed by store policy.',
    });
  }

  const orderRecord: OrderRecord = {
    id: orderId,
    customer,
    items: verifiedItems,
    subtotal: calculatedSubtotal,
    deliveryFee,
    discount,
    total: finalTotal,
    currency: 'BDT',
    status: initialOrderStatus,
    paymentMethod,
    paymentStatus: initialPaymentStatus as any,
    paymentId,
    timeline,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const orders = db.getOrders();
  orders.unshift(orderRecord);
  db.setOrders(orders);

  res.status(201).json({
    message: 'Order placed successfully!',
    order: orderRecord,
    payment: paymentRecord,
  });
});

/**
 * Public: GET /api/orders/track/:orderIdOrPhone
 * Customer lookup of order timeline
 */
router.get('/track/:orderIdOrPhone', (req: Request, res: Response) => {
  const { orderIdOrPhone } = req.params;
  const q = orderIdOrPhone.trim();
  const cleanPhone = normalizeBdPhone(q);

  const orders = db.getOrders();
  const order = orders.find(o => 
    o.id.toLowerCase() === q.toLowerCase() || 
    (cleanPhone.length >= 10 && normalizeBdPhone(o.customer.phone) === cleanPhone)
  );

  if (!order) {
    return res.status(404).json({ error: 'Order not found. Please check your Order ID or phone number.' });
  }

  res.json(order);
});

/**
 * Protected: GET /api/orders or /api/admin/orders
 * List orders for admin dashboard
 */
router.get(['/', '/admin/list', '/admin'], authenticateStaff, requirePermission('canManageOrders'), (req: AuthenticatedRequest, res: Response) => {
  const { status, search } = req.query;
  let orders = db.getOrders();

  if (status && typeof status === 'string' && status !== 'ALL') {
    orders = orders.filter(o => o.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    orders = orders.filter(o => 
      o.id.toLowerCase().includes(q) ||
      o.customer.fullName.toLowerCase().includes(q) ||
      o.customer.phone.includes(q)
    );
  }

  res.json(orders);
});

/**
 * Protected: PATCH /api/orders/:id/status or /api/admin/orders/:id/status
 * Update order fulfillment status with audit logging
 */
router.patch(['/:id/status', '/admin/:id/status'], authenticateStaff, requirePermission('canManageOrders'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const user = req.user!;
  const ip = extractClientIp(req);

  const orders = db.getOrders();
  const order = orders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const oldStatus = order.status;
  order.status = status as OrderStatus;
  order.updatedAt = new Date().toISOString();

  const timelineNote = note || `Status updated from ${oldStatus} to ${status} by ${user.name} (${user.role})`;
  order.timeline.push({
    status: status as OrderStatus,
    timestamp: new Date().toISOString(),
    note: timelineNote,
    updatedBy: user.id,
  });

  db.setOrders(orders);

  // Record audit log
  db.recordAuditLog({
    employeeId: user.id,
    employeeName: user.name,
    employeeEmail: user.email,
    role: user.role,
    action: 'ORDER_STATUS_CHANGE',
    resource: 'Order',
    resourceId: order.id,
    details: `${user.name} changed order #${order.id} from ${oldStatus} to ${status}. Note: ${timelineNote}`,
    ip,
    status: 'SUCCESS',
  });

  res.json({ message: 'Order status updated successfully', order });
});

/**
 * Protected: POST /api/orders/:id/refund or /api/admin/orders/:id/refund
 * Process order refund with audit logging and optional inventory restoration
 */
router.post(['/:id/refund', '/admin/:id/refund'], authenticateStaff, requirePermission('canManageRefunds'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason, amount, restockItems } = req.body;
  const user = req.user!;
  const ip = extractClientIp(req);

  const orders = db.getOrders();
  const order = orders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const refundAmount = amount ? Number(amount) : order.total;
  order.paymentStatus = 'REFUNDED';
  order.status = 'REFUNDED' as any;
  order.updatedAt = new Date().toISOString();

  const refundNote = `Refund of ৳${refundAmount.toLocaleString()} approved by ${user.name} (${user.role}). Reason: ${reason || 'Customer request / defective item'}`;
  order.timeline.push({
    status: 'CANCELLED',
    timestamp: new Date().toISOString(),
    note: refundNote,
    updatedBy: user.id,
  });

  // If restock items requested, restore product stock
  if (restockItems !== false) {
    const products = db.getProducts();
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        prod.stock += item.quantity;
        if (item.variantId) {
          const v = prod.variants.find(va => va.id === item.variantId);
          if (v) v.stock += item.quantity;
        }
      }
    });
    db.setProducts(products);
  }

  db.setOrders(orders);

  db.recordAuditLog({
    employeeId: user.id,
    employeeName: user.name,
    employeeEmail: user.email,
    role: user.role,
    action: 'ORDER_REFUND',
    resource: 'Order',
    resourceId: order.id,
    details: `${user.name} processed refund of ৳${refundAmount.toLocaleString()} for order #${order.id}. ${refundNote}`,
    ip,
    status: 'SUCCESS',
  });

  res.json({ message: `Refund processed successfully for order #${order.id}.`, order });
});

/**
 * Protected: POST /api/orders/:id/cancel or /api/admin/orders/:id/cancel
 * Cancel order and automatically restore product stock
 */
router.post(['/:id/cancel', '/admin/:id/cancel'], authenticateStaff, requirePermission('canManageOrders'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const user = req.user!;
  const ip = extractClientIp(req);

  const orders = db.getOrders();
  const order = orders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (order.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Order is already cancelled.' });
  }

  const oldStatus = order.status;
  order.status = 'CANCELLED';
  order.updatedAt = new Date().toISOString();

  const cancelNote = `Order cancelled by ${user.name} (${user.role}). Reason: ${reason || 'Customer requested cancellation / Unreachable'}`;
  order.timeline.push({
    status: 'CANCELLED',
    timestamp: new Date().toISOString(),
    note: cancelNote,
    updatedBy: user.id,
  });

  // Restore inventory stock back
  const products = db.getProducts();
  order.items.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    if (prod) {
      prod.stock += item.quantity;
      if (item.variantId) {
        const v = prod.variants.find(va => va.id === item.variantId);
        if (v) v.stock += item.quantity;
      }
    }
  });
  db.setProducts(products);

  db.setOrders(orders);

  db.recordAuditLog({
    employeeId: user.id,
    employeeName: user.name,
    employeeEmail: user.email,
    role: user.role,
    action: 'ORDER_CANCELLED',
    resource: 'Order',
    resourceId: order.id,
    details: `${user.name} cancelled order #${order.id} (previously ${oldStatus}). Restocked items. Note: ${cancelNote}`,
    ip,
    status: 'SUCCESS',
  });

  res.json({ message: `Order #${order.id} has been cancelled and items restocked.`, order });
});

/**
 * Protected: POST /api/orders/:id/notes or /api/admin/orders/:id/notes
 * Add support / internal notes to an order
 */
router.post(['/:id/notes', '/admin/:id/notes'], authenticateStaff, requirePermission('canAddSupportNotes'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;
  const user = req.user!;

  if (!note || !note.trim()) {
    return res.status(400).json({ error: 'Note content is required.' });
  }

  const orders = db.getOrders();
  const order = orders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (!order.supportNotes) order.supportNotes = [];
  order.supportNotes.push(`[${new Date().toLocaleString()}] ${user.name} (${user.role}): ${note.trim()}`);
  order.updatedAt = new Date().toISOString();
  db.setOrders(orders);

  res.json(order);
});

export default router;

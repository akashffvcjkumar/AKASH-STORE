import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateStaff, AuthenticatedRequest, requirePermission } from '../auth.js';

const router = Router();

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  authProvider: 'GOOGLE' | 'LOCAL';
  avatar?: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt?: string;
  createdAt: string;
}

/**
 * Protected: GET /api/admin/customers
 * Returns all registered customers and customers from order history
 */
router.get('/', authenticateStaff, requirePermission('canViewStaff'), (req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers();
  const orders = db.getOrders();

  const customerMap = new Map<string, CustomerSummary>();

  // 1. Registered Customer accounts (Google OAuth & local)
  users.filter(u => u.role === 'CUSTOMER').forEach(u => {
    const custOrders = orders.filter(o => o.customer.email.toLowerCase() === u.email.toLowerCase());
    const totalSpent = custOrders.reduce((sum, o) => sum + (o.paymentStatus === 'PAID' ? o.total : 0), 0);
    const lastOrder = custOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    customerMap.set(u.email.toLowerCase(), {
      id: u.id,
      name: u.name,
      email: u.email,
      authProvider: u.authProvider === 'GOOGLE' ? 'GOOGLE' : 'LOCAL',
      avatar: u.avatar,
      ordersCount: custOrders.length,
      totalSpent,
      lastOrderAt: lastOrder?.createdAt,
      createdAt: u.createdAt,
    });
  });

  // 2. Customers from checkout orders (guest checkouts or storefront orders)
  orders.forEach(o => {
    const emailKey = o.customer.email.toLowerCase();
    if (!customerMap.has(emailKey)) {
      const custOrders = orders.filter(ord => ord.customer.email.toLowerCase() === emailKey);
      const totalSpent = custOrders.reduce((sum, ord) => sum + (ord.paymentStatus === 'PAID' ? ord.total : 0), 0);
      const sorted = custOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      customerMap.set(emailKey, {
        id: `cust_order_${emailKey.replace(/[^a-z0-9]/g, '_')}`,
        name: o.customer.fullName,
        email: o.customer.email,
        phone: o.customer.phone,
        authProvider: 'LOCAL',
        ordersCount: custOrders.length,
        totalSpent,
        lastOrderAt: sorted[0]?.createdAt,
        createdAt: sorted[sorted.length - 1]?.createdAt || o.createdAt,
      });
    } else {
      const existing = customerMap.get(emailKey)!;
      if (!existing.phone && o.customer.phone) {
        existing.phone = o.customer.phone;
      }
    }
  });

  const list = Array.from(customerMap.values()).sort((a, b) => b.ordersCount - a.ordersCount);
  res.json(list);
});

/**
 * Protected: GET /api/admin/customers/:idOrEmail
 * Returns customer profile and full purchase history
 */
router.get('/:idOrEmail', authenticateStaff, requirePermission('canViewStaff'), (req: AuthenticatedRequest, res: Response) => {
  const { idOrEmail } = req.params;
  const q = decodeURIComponent(idOrEmail).toLowerCase();

  const users = db.getUsers();
  const orders = db.getOrders();

  const registeredUser = users.find(u => u.id === idOrEmail || u.email.toLowerCase() === q);
  const targetEmail = registeredUser?.email.toLowerCase() || q;

  const customerOrders = orders.filter(o => 
    o.customer.email.toLowerCase() === targetEmail || 
    (registeredUser && o.customer.fullName.toLowerCase() === registeredUser.name.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalSpent = customerOrders.reduce((sum, o) => sum + (o.paymentStatus === 'PAID' ? o.total : 0), 0);
  const primaryPhone = customerOrders[0]?.customer.phone;
  const primaryAddress = customerOrders[0]?.customer;

  res.json({
    customer: {
      id: registeredUser?.id || `cust_${targetEmail.replace(/[^a-z0-9]/g, '_')}`,
      name: registeredUser?.name || customerOrders[0]?.customer.fullName || 'Customer',
      email: targetEmail,
      phone: primaryPhone,
      avatar: registeredUser?.avatar,
      authProvider: registeredUser?.authProvider || 'LOCAL',
      registeredAt: registeredUser?.createdAt,
      totalOrders: customerOrders.length,
      totalSpent,
      lastAddress: primaryAddress ? {
        division: primaryAddress.division,
        district: primaryAddress.district,
        upazila: primaryAddress.upazila,
        areaAddress: primaryAddress.areaAddress,
        postalCode: primaryAddress.postalCode,
      } : null,
    },
    orders: customerOrders,
  });
});

export default router;

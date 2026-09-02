/**
 * AKASH STORE - OrderRepository
 * 
 * Abstracts Room OrderDao operations.
 * Provides a clean API for ViewModels to manage orders, bKash verification, and timeline events.
 */

import { AkashRoomDatabase } from '../database/RoomDatabase.js';
import { OrderEntity, StaffRole } from '../database/entities.js';

export class OrderRepository {
  private db: AkashRoomDatabase;

  constructor(db?: AkashRoomDatabase) {
    this.db = db || AkashRoomDatabase.getInstance();
  }

  async getAllOrders(): Promise<OrderEntity[]> {
    return this.db.orderDao.getAll();
  }

  async getOrderById(id: string): Promise<OrderEntity | null> {
    return this.db.orderDao.getById(id);
  }

  async updateOrderStatus(
    orderId: string, 
    status: string, 
    performedBy: { id: string; name: string; email: string; role: StaffRole },
    note?: string
  ): Promise<boolean> {
    const success = await this.db.orderDao.updateStatus(orderId, status, note);
    if (success) {
      await this.db.auditLogDao.insert({
        id: `aud_ord_${Date.now()}`,
        employeeId: performedBy.id,
        employeeName: performedBy.name,
        employeeEmail: performedBy.email,
        role: performedBy.role,
        action: 'ORDER_STATUS_CHANGE',
        resource: 'Orders',
        resourceId: orderId,
        details: `Updated Order #${orderId} status to "${status}". Note: ${note || 'Status updated'}`,
        ip: '103.145.118.42',
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      });
    }
    return success;
  }

  async verifyBkashPayment(
    orderId: string,
    trxId: string,
    performedBy: { id: string; name: string; email: string; role: StaffRole }
  ): Promise<boolean> {
    const success = await this.db.orderDao.updatePaymentStatus(orderId, 'PAID');
    if (success) {
      await this.db.auditLogDao.insert({
        id: `aud_pay_${Date.now()}`,
        employeeId: performedBy.id,
        employeeName: performedBy.name,
        employeeEmail: performedBy.email,
        role: performedBy.role,
        action: 'PAYMENT_VERIFY',
        resource: 'Payments',
        resourceId: orderId,
        details: `Verified bKash payment for Order #${orderId} (TrxID: ${trxId}). Marked PAID.`,
        ip: '103.145.118.42',
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      });
    }
    return success;
  }
}

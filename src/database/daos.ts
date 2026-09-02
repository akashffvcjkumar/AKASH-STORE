/**
 * AKASH STORE - Room Database DAO (Data Access Object) Interfaces & Implementations
 * 
 * Provides type-safe queries and data mutations for Room entities.
 */

import { UserEntity, RoleEntity, ProductEntity, OrderEntity, AuditLogEntity, AccountStatus, UserRole } from './entities.js';

export interface UserDao {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  insert(user: UserEntity): Promise<void>;
  update(user: UserEntity): Promise<void>;
  delete(id: string): Promise<boolean>;
  getAllStaff(): Promise<UserEntity[]>;
  getAllCustomers(): Promise<UserEntity[]>;
  updateAccountStatus(id: string, status: AccountStatus): Promise<boolean>;
  updatePassword(id: string, passwordHash: string, salt: string): Promise<boolean>;
  revokeAllSessions(id: string): Promise<boolean>;
  verifyRoleClaim(id: string, expectedStaffRole?: string): Promise<{ valid: boolean; user: UserEntity | null; reason?: string }>;
}

export interface RoleDao {
  getRole(roleId: UserRole): Promise<RoleEntity | null>;
  getAllRoles(): Promise<RoleEntity[]>;
  insertOrUpdate(role: RoleEntity): Promise<void>;
}

export interface ProductDao {
  getAll(): Promise<ProductEntity[]>;
  getById(id: string): Promise<ProductEntity | null>;
  insert(product: ProductEntity): Promise<void>;
  update(product: ProductEntity): Promise<void>;
  updateStock(id: string, newStock: number): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

export interface OrderDao {
  getAll(): Promise<OrderEntity[]>;
  getById(id: string): Promise<OrderEntity | null>;
  insert(order: OrderEntity): Promise<void>;
  update(order: OrderEntity): Promise<void>;
  updateStatus(id: string, status: string, note?: string): Promise<boolean>;
  updatePaymentStatus(id: string, paymentStatus: 'PAID' | 'REJECTED' | 'VERIFICATION_PENDING' | 'REFUNDED'): Promise<boolean>;
}

export interface AuditLogQueryFilter {
  employeeName?: string;
  actionType?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  role?: string;
  limit?: number;
}

export interface AuditLogDao {
  insert(log: AuditLogEntity): Promise<void>;
  getAll(): Promise<AuditLogEntity[]>;
  getByEmployeeId(employeeId: string): Promise<AuditLogEntity[]>;
  query(filter: AuditLogQueryFilter): Promise<AuditLogEntity[]>;
}

/**
 * AKASH STORE - Room Database Implementation
 * 
 * Implements Room Database Architecture:
 * - AppDatabase / AkashRoomDatabase Singleton
 * - Schema Versioning and Initialization
 * - Concrete DAOs for User, Role, Product, Order, and AuditLog
 * - Automatic initial seeding of default entities & roles
 */

import { 
  UserEntity, 
  RoleEntity, 
  ProductEntity, 
  OrderEntity, 
  AuditLogEntity, 
  AccountStatus, 
  StaffRole, 
  UserRole 
} from './entities.js';
import { 
  UserDao, 
  RoleDao, 
  ProductDao, 
  OrderDao, 
  AuditLogDao, 
  AuditLogQueryFilter 
} from './daos.js';
import { 
  JsonConverter, 
  RolePermissionsConverter 
} from './converters.js';

const DB_STORAGE_KEY_PREFIX = 'akash_room_db_';
const DB_VERSION = 2;

// Default Roles Seeding
const DEFAULT_ROLES: RoleEntity[] = [
  {
    roleId: 'SUPER_ADMIN',
    displayName: 'Super Admin / Owner',
    description: 'Permanent store owner with unrestricted control over staff accounts, permissions, and security.',
    isStaff: true,
    permissionsJson: RolePermissionsConverter.toJson({
      canAccessAdmin: true,
      canManageStaff: true,
      canManageAdmins: true,
      canManagePaymentSettings: true,
      canManageStoreSettings: true,
      canManageProducts: true,
      canManageInventory: true,
      canManageOrders: true,
      canManageDelivery: true,
      canManageCustomers: true,
      canManageCoupons: true,
      canManagePayments: true,
      canManageRefunds: true,
      canViewAnalytics: true,
      canViewAuditLogs: true,
      canAddSupportNotes: true,
    }),
    createdAt: new Date().toISOString()
  },
  {
    roleId: 'ADMIN',
    displayName: 'Store Administrator',
    description: 'Day-to-day administrative operations, order tracking, and product management.',
    isStaff: true,
    permissionsJson: RolePermissionsConverter.toJson({
      canAccessAdmin: true,
      canManageStaff: false,
      canManageAdmins: false,
      canManagePaymentSettings: false,
      canManageStoreSettings: false,
      canManageProducts: true,
      canManageInventory: true,
      canManageOrders: true,
      canManageDelivery: true,
      canManageCustomers: true,
      canManageCoupons: true,
      canManagePayments: true,
      canManageRefunds: false,
      canViewAnalytics: true,
      canViewAuditLogs: true,
      canAddSupportNotes: true,
    }),
    createdAt: new Date().toISOString()
  },
  {
    roleId: 'MANAGER',
    displayName: 'Operations Manager',
    description: 'Store management, order processing, delivery management, and inventory supervision.',
    isStaff: true,
    permissionsJson: RolePermissionsConverter.toJson({
      canAccessAdmin: true,
      canManageStaff: false,
      canManageAdmins: false,
      canManagePaymentSettings: false,
      canManageStoreSettings: false,
      canManageProducts: true,
      canManageInventory: true,
      canManageOrders: true,
      canManageDelivery: true,
      canManageCustomers: true,
      canManageCoupons: true,
      canManagePayments: false,
      canManageRefunds: true,
      canViewAnalytics: true,
      canViewAuditLogs: false,
      canAddSupportNotes: true,
    }),
    createdAt: new Date().toISOString()
  },
  {
    roleId: 'EMPLOYEE',
    displayName: 'Store Employee',
    description: 'General store floor employee with inventory and order handling duties.',
    isStaff: true,
    permissionsJson: RolePermissionsConverter.toJson({
      canAccessAdmin: true,
      canManageStaff: false,
      canManageAdmins: false,
      canManagePaymentSettings: false,
      canManageStoreSettings: false,
      canManageProducts: false,
      canManageInventory: true,
      canManageOrders: true,
      canManageDelivery: true,
      canManageCustomers: true,
      canManageCoupons: false,
      canManagePayments: false,
      canManageRefunds: false,
      canViewAnalytics: false,
      canViewAuditLogs: false,
      canAddSupportNotes: true,
    }),
    createdAt: new Date().toISOString()
  },
  {
    roleId: 'INVENTORY_MANAGER',
    displayName: 'Inventory Manager',
    description: 'Stock levels, warehouse intake, catalog items, and product pricing updates.',
    isStaff: true,
    permissionsJson: RolePermissionsConverter.toJson({
      canAccessAdmin: true,
      canManageStaff: false,
      canManageAdmins: false,
      canManagePaymentSettings: false,
      canManageStoreSettings: false,
      canManageProducts: true,
      canManageInventory: true,
      canManageOrders: false,
      canManageDelivery: false,
      canManageCustomers: false,
      canManageCoupons: false,
      canManagePayments: false,
      canManageRefunds: false,
      canViewAnalytics: false,
      canViewAuditLogs: true,
      canAddSupportNotes: false,
    }),
    createdAt: new Date().toISOString()
  },
  {
    roleId: 'ORDER_MANAGER',
    displayName: 'Order & Logistics Manager',
    description: 'Order packaging, dispatch, courier assign, bKash verification, and delivery tracking.',
    isStaff: true,
    permissionsJson: RolePermissionsConverter.toJson({
      canAccessAdmin: true,
      canManageStaff: false,
      canManageAdmins: false,
      canManagePaymentSettings: false,
      canManageStoreSettings: false,
      canManageProducts: false,
      canManageInventory: false,
      canManageOrders: true,
      canManageDelivery: true,
      canManageCustomers: false,
      canManageCoupons: false,
      canManagePayments: true,
      canManageRefunds: false,
      canViewAnalytics: false,
      canViewAuditLogs: true,
      canAddSupportNotes: true,
    }),
    createdAt: new Date().toISOString()
  },
  {
    roleId: 'SUPPORT_AGENT',
    displayName: 'Customer Support Agent',
    description: 'Customer inquiry support, order note logging, and issue escalation.',
    isStaff: true,
    permissionsJson: RolePermissionsConverter.toJson({
      canAccessAdmin: true,
      canManageStaff: false,
      canManageAdmins: false,
      canManagePaymentSettings: false,
      canManageStoreSettings: false,
      canManageProducts: false,
      canManageInventory: false,
      canManageOrders: false,
      canManageDelivery: false,
      canManageCustomers: true,
      canManageCoupons: false,
      canManagePayments: false,
      canManageRefunds: false,
      canViewAnalytics: false,
      canViewAuditLogs: true,
      canAddSupportNotes: true,
    }),
    createdAt: new Date().toISOString()
  },
  {
    roleId: 'CUSTOMER',
    displayName: 'Customer / Buyer',
    description: 'Standard consumer account with storefront shopping rights only (No Admin Access).',
    isStaff: false,
    permissionsJson: RolePermissionsConverter.toJson({
      canAccessAdmin: false,
      canManageStaff: false,
      canManageAdmins: false,
      canManagePaymentSettings: false,
      canManageStoreSettings: false,
      canManageProducts: false,
      canManageInventory: false,
      canManageOrders: false,
      canManageDelivery: false,
      canManageCustomers: false,
      canManageCoupons: false,
      canManagePayments: false,
      canManageRefunds: false,
      canViewAnalytics: false,
      canViewAuditLogs: false,
      canAddSupportNotes: false,
    }),
    createdAt: new Date().toISOString()
  }
];

// Initial Seed Users
const DEFAULT_USERS: UserEntity[] = [
  {
    id: 'usr_super_admin_01',
    name: 'Akash Chondror Roy',
    email: 'akashchondroroy@protonmail.com',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    isStaff: true,
    passwordHash: '@Akash5051', // Super Admin initial seed password
    salt: 'salt_owner_01',
    phone: '01874839665',
    activeSessionsJson: JSON.stringify(['sess_owner_token_01']),
    lastLoginAt: new Date().toISOString(),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr_admin_02',
    name: 'Tariqul Islam',
    email: 'tariqul@akashstore.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    isStaff: true,
    passwordHash: 'admin123456',
    salt: 'salt_admin_02',
    phone: '01711223344',
    activeSessionsJson: JSON.stringify([]),
    lastLoginAt: '2026-09-01T14:30:00.000Z',
    createdAt: '2026-02-15T00:00:00.000Z',
    updatedAt: '2026-09-01T14:30:00.000Z',
  },
  {
    id: 'usr_inv_03',
    name: 'Selim Reza',
    email: 'selim@akashstore.com',
    role: 'INVENTORY_MANAGER',
    status: 'ACTIVE',
    isStaff: true,
    passwordHash: 'inventory123',
    salt: 'salt_inv_03',
    phone: '01812345678',
    activeSessionsJson: JSON.stringify([]),
    lastLoginAt: '2026-09-02T09:15:00.000Z',
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-09-02T09:15:00.000Z',
  },
  {
    id: 'usr_order_04',
    name: 'Rahim Ahmed',
    email: 'rahim@akashstore.com',
    role: 'ORDER_MANAGER',
    status: 'ACTIVE',
    isStaff: true,
    passwordHash: 'rahim123456',
    salt: 'salt_order_04',
    phone: '01912345678',
    activeSessionsJson: JSON.stringify([]),
    lastLoginAt: '2026-09-02T10:00:00.000Z',
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-09-02T10:00:00.000Z',
  },
  {
    id: 'usr_support_05',
    name: 'Nusrat Jahan',
    email: 'nusrat@akashstore.com',
    role: 'SUPPORT_AGENT',
    status: 'ACTIVE',
    isStaff: true,
    passwordHash: 'nusrat123',
    salt: 'salt_support_05',
    phone: '01612345678',
    activeSessionsJson: JSON.stringify([]),
    lastLoginAt: '2026-09-01T17:45:00.000Z',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-09-01T17:45:00.000Z',
  },
  // Customer account for negative testing of role claim enforcement
  {
    id: 'usr_cust_101',
    name: 'Tanvir Customer',
    email: 'tanvir.customer@gmail.com',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    isStaff: false,
    passwordHash: 'custpass123',
    salt: 'salt_cust_101',
    phone: '01799887766',
    activeSessionsJson: JSON.stringify([]),
    lastLoginAt: '2026-09-01T12:00:00.000Z',
    createdAt: '2026-05-10T00:00:00.000Z',
    updatedAt: '2026-09-01T12:00:00.000Z',
  }
];

// Initial Seed Audit Logs
const DEFAULT_AUDIT_LOGS: AuditLogEntity[] = [
  {
    id: 'aud_seed_001',
    employeeId: 'usr_super_admin_01',
    employeeName: 'Akash Chondror Roy',
    employeeEmail: 'akashchondroroy@protonmail.com',
    role: 'SUPER_ADMIN',
    action: 'SYSTEM_BOOT',
    resource: 'System',
    resourceId: 'SYS_INIT',
    details: 'AKASH STORE Room Database initialized with schema version 2 and RBAC matrix.',
    ip: '103.145.118.42',
    status: 'SUCCESS',
    timestamp: '2026-09-01T08:00:00.000Z'
  },
  {
    id: 'aud_seed_002',
    employeeId: 'usr_order_04',
    employeeName: 'Rahim Ahmed',
    employeeEmail: 'rahim@akashstore.com',
    role: 'ORDER_MANAGER',
    action: 'PAYMENT_VERIFY',
    resource: 'Payment',
    resourceId: 'BKASH-TX-9921',
    details: 'Verified bKash transaction ID 9K882LK19A for Order #AKS-20260901-0021 (৳2,450).',
    ip: '103.145.118.45',
    status: 'SUCCESS',
    timestamp: '2026-09-02T09:30:00.000Z'
  },
  {
    id: 'aud_seed_003',
    employeeId: 'usr_inv_03',
    employeeName: 'Selim Reza',
    employeeEmail: 'selim@akashstore.com',
    role: 'INVENTORY_MANAGER',
    action: 'INVENTORY_ADJUST',
    resource: 'Product',
    resourceId: 'p1',
    details: 'Stock received: added 25 units of Premium Wireless Bluetooth Headphone.',
    ip: '103.145.118.50',
    status: 'SUCCESS',
    timestamp: '2026-09-02T10:15:00.000Z'
  }
];

/**
 * Concrete UserDao Implementation for Room Database
 */
class RoomUserDao implements UserDao {
  private getStorageKey(): string {
    return `${DB_STORAGE_KEY_PREFIX}users`;
  }

  private loadUsers(): UserEntity[] {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    return [...DEFAULT_USERS];
  }

  private saveUsers(users: UserEntity[]): void {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(users));
    } catch (e) {
      console.error('Failed to persist users to Room Database store:', e);
    }
  }

  async findById(id: string): Promise<UserEntity | null> {
    const users = this.loadUsers();
    return users.find(u => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const users = this.loadUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async insert(user: UserEntity): Promise<void> {
    const users = this.loadUsers();
    const existingIndex = users.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (existingIndex >= 0) {
      throw new Error(`User with email "${user.email}" already exists in Room database.`);
    }
    users.push(user);
    this.saveUsers(users);
  }

  async update(user: UserEntity): Promise<void> {
    const users = this.loadUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...user, updatedAt: new Date().toISOString() };
      this.saveUsers(users);
    }
  }

  async delete(id: string): Promise<boolean> {
    const users = this.loadUsers();
    const user = users.find(u => u.id === id);
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') {
      throw new Error('Owner / Super Admin account cannot be deleted.');
    }
    const filtered = users.filter(u => u.id !== id);
    this.saveUsers(filtered);
    return true;
  }

  async getAllStaff(): Promise<UserEntity[]> {
    const users = this.loadUsers();
    return users.filter(u => u.isStaff && u.role !== 'CUSTOMER');
  }

  async getAllCustomers(): Promise<UserEntity[]> {
    const users = this.loadUsers();
    return users.filter(u => !u.isStaff || u.role === 'CUSTOMER');
  }

  async updateAccountStatus(id: string, status: AccountStatus): Promise<boolean> {
    const users = this.loadUsers();
    const index = users.findIndex(u => u.id === id);
    if (index < 0) return false;

    if (users[index].role === 'SUPER_ADMIN' && status === 'DISABLED') {
      throw new Error('Super Admin / Store Owner account cannot be disabled.');
    }

    users[index].status = status;
    // When deactivating, revoke all active sessions immediately
    if (status === 'DISABLED') {
      users[index].activeSessionsJson = JSON.stringify([]);
    }
    users[index].updatedAt = new Date().toISOString();
    this.saveUsers(users);
    return true;
  }

  async updatePassword(id: string, passwordHash: string, salt: string): Promise<boolean> {
    const users = this.loadUsers();
    const index = users.findIndex(u => u.id === id);
    if (index < 0) return false;

    users[index].passwordHash = passwordHash;
    users[index].salt = salt;
    users[index].activeSessionsJson = JSON.stringify([]); // Revoke existing sessions upon password reset
    users[index].mustChangePassword = true;
    users[index].updatedAt = new Date().toISOString();
    this.saveUsers(users);
    return true;
  }

  async revokeAllSessions(id: string): Promise<boolean> {
    const users = this.loadUsers();
    const index = users.findIndex(u => u.id === id);
    if (index < 0) return false;

    users[index].activeSessionsJson = JSON.stringify([]);
    users[index].updatedAt = new Date().toISOString();
    this.saveUsers(users);
    return true;
  }

  /**
   * Secure Logic Layer: Validates user's role claim directly against Room User database
   * before allowing navigation to /admin route.
   */
  async verifyRoleClaim(
    id: string, 
    expectedStaffRole?: string
  ): Promise<{ valid: boolean; user: UserEntity | null; reason?: string }> {
    const user = await this.findById(id);
    if (!user) {
      return { valid: false, user: null, reason: 'User record not found in Room Database.' };
    }

    if (user.status === 'DISABLED') {
      return { 
        valid: false, 
        user, 
        reason: 'Account Deactivated: This employee account has been disabled by the Super Admin.' 
      };
    }

    if (!user.isStaff || user.role === 'CUSTOMER') {
      return { 
        valid: false, 
        user, 
        reason: `Role Claim Violation: User role '${user.role}' is a customer account and lacks admin access privileges.` 
      };
    }

    if (expectedStaffRole && user.role !== expectedStaffRole && user.role !== 'SUPER_ADMIN') {
      return {
        valid: false,
        user,
        reason: `Insufficient Permissions: Role '${user.role}' does not meet required role '${expectedStaffRole}'.`
      };
    }

    return { valid: true, user };
  }
}

/**
 * Concrete RoleDao Implementation
 */
class RoomRoleDao implements RoleDao {
  private getStorageKey(): string {
    return `${DB_STORAGE_KEY_PREFIX}roles`;
  }

  private loadRoles(): RoleEntity[] {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    return [...DEFAULT_ROLES];
  }

  async getRole(roleId: UserRole): Promise<RoleEntity | null> {
    const roles = this.loadRoles();
    return roles.find(r => r.roleId === roleId) || null;
  }

  async getAllRoles(): Promise<RoleEntity[]> {
    return this.loadRoles();
  }

  async insertOrUpdate(role: RoleEntity): Promise<void> {
    const roles = this.loadRoles();
    const index = roles.findIndex(r => r.roleId === role.roleId);
    if (index >= 0) {
      roles[index] = role;
    } else {
      roles.push(role);
    }
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(roles));
    } catch (e) {
      console.error(e);
    }
  }
}

/**
 * Concrete AuditLogDao Implementation with Employee Name, Action Type, and Date Range filtering
 */
class RoomAuditLogDao implements AuditLogDao {
  private getStorageKey(): string {
    return `${DB_STORAGE_KEY_PREFIX}audit_logs`;
  }

  private loadLogs(): AuditLogEntity[] {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    return [...DEFAULT_AUDIT_LOGS];
  }

  private saveLogs(logs: AuditLogEntity[]): void {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(logs));
    } catch (e) {
      console.error(e);
    }
  }

  async insert(log: AuditLogEntity): Promise<void> {
    const logs = this.loadLogs();
    logs.unshift(log); // newest first
    this.saveLogs(logs);
  }

  async getAll(): Promise<AuditLogEntity[]> {
    return this.loadLogs();
  }

  async getByEmployeeId(employeeId: string): Promise<AuditLogEntity[]> {
    const logs = this.loadLogs();
    return logs.filter(l => l.employeeId === employeeId);
  }

  /**
   * Searchable by employee name, action type, and date range
   */
  async query(filter: AuditLogQueryFilter): Promise<AuditLogEntity[]> {
    let logs = this.loadLogs();

    if (filter.employeeName && filter.employeeName.trim()) {
      const q = filter.employeeName.toLowerCase().trim();
      logs = logs.filter(l => 
        l.employeeName.toLowerCase().includes(q) || 
        l.employeeEmail.toLowerCase().includes(q)
      );
    }

    if (filter.actionType && filter.actionType !== 'ALL') {
      logs = logs.filter(l => l.action.toLowerCase() === filter.actionType?.toLowerCase());
    }

    if (filter.role && filter.role !== 'ALL') {
      logs = logs.filter(l => l.role === filter.role);
    }

    if (filter.startDate) {
      const start = new Date(filter.startDate).getTime();
      if (!isNaN(start)) {
        logs = logs.filter(l => new Date(l.timestamp).getTime() >= start);
      }
    }

    if (filter.endDate) {
      const end = new Date(filter.endDate).getTime() + (24 * 60 * 60 * 1000 - 1); // end of that day
      if (!isNaN(end)) {
        logs = logs.filter(l => new Date(l.timestamp).getTime() <= end);
      }
    }

    if (filter.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase().trim();
      logs = logs.filter(l => 
        l.details.toLowerCase().includes(q) ||
        l.employeeName.toLowerCase().includes(q) ||
        l.employeeEmail.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.resourceId && l.resourceId.toLowerCase().includes(q))
      );
    }

    if (filter.limit && filter.limit > 0) {
      logs = logs.slice(0, filter.limit);
    }

    return logs;
  }
}

/**
 * Concrete ProductDao Implementation
 */
class RoomProductDao implements ProductDao {
  private getStorageKey(): string {
    return `${DB_STORAGE_KEY_PREFIX}products`;
  }

  private loadProducts(): ProductEntity[] {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  private saveProducts(products: ProductEntity[]): void {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }

  async getAll(): Promise<ProductEntity[]> {
    return this.loadProducts();
  }

  async getById(id: string): Promise<ProductEntity | null> {
    const products = this.loadProducts();
    return products.find(p => p.id === id) || null;
  }

  async insert(product: ProductEntity): Promise<void> {
    const products = this.loadProducts();
    products.push(product);
    this.saveProducts(products);
  }

  async update(product: ProductEntity): Promise<void> {
    const products = this.loadProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
      this.saveProducts(products);
    }
  }

  async updateStock(id: string, newStock: number): Promise<boolean> {
    const products = this.loadProducts();
    const index = products.findIndex(p => p.id === id);
    if (index < 0) return false;
    products[index].stock = Math.max(0, newStock);
    this.saveProducts(products);
    return true;
  }

  async delete(id: string): Promise<boolean> {
    const products = this.loadProducts();
    const filtered = products.filter(p => p.id !== id);
    this.saveProducts(filtered);
    return true;
  }
}

/**
 * Concrete OrderDao Implementation
 */
class RoomOrderDao implements OrderDao {
  private getStorageKey(): string {
    return `${DB_STORAGE_KEY_PREFIX}orders`;
  }

  private loadOrders(): OrderEntity[] {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  private saveOrders(orders: OrderEntity[]): void {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }

  async getAll(): Promise<OrderEntity[]> {
    return this.loadOrders();
  }

  async getById(id: string): Promise<OrderEntity | null> {
    const orders = this.loadOrders();
    return orders.find(o => o.id === id) || null;
  }

  async insert(order: OrderEntity): Promise<void> {
    const orders = this.loadOrders();
    orders.unshift(order);
    this.saveOrders(orders);
  }

  async update(order: OrderEntity): Promise<void> {
    const orders = this.loadOrders();
    const index = orders.findIndex(o => o.id === order.id);
    if (index >= 0) {
      orders[index] = order;
      this.saveOrders(orders);
    }
  }

  async updateStatus(id: string, status: string, note?: string): Promise<boolean> {
    const orders = this.loadOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index < 0) return false;

    orders[index].status = status;
    orders[index].updatedAt = new Date().toISOString();
    this.saveOrders(orders);
    return true;
  }

  async updatePaymentStatus(id: string, paymentStatus: 'PAID' | 'REJECTED' | 'VERIFICATION_PENDING' | 'REFUNDED'): Promise<boolean> {
    const orders = this.loadOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index < 0) return false;

    orders[index].paymentStatus = paymentStatus;
    orders[index].updatedAt = new Date().toISOString();
    this.saveOrders(orders);
    return true;
  }
}

/**
 * Main Room Database Class
 * AkashRoomDatabase encapsulates database access, initialization, and DAO accessors.
 */
export class AkashRoomDatabase {
  private static instance: AkashRoomDatabase | null = null;

  public readonly userDao: UserDao;
  public readonly roleDao: RoleDao;
  public readonly productDao: ProductDao;
  public readonly orderDao: OrderDao;
  public readonly auditLogDao: AuditLogDao;

  private constructor() {
    this.userDao = new RoomUserDao();
    this.roleDao = new RoomRoleDao();
    this.productDao = new RoomProductDao();
    this.orderDao = new RoomOrderDao();
    this.auditLogDao = new RoomAuditLogDao();
    this.initDatabase();
  }

  public static getInstance(): AkashRoomDatabase {
    if (!AkashRoomDatabase.instance) {
      AkashRoomDatabase.instance = new AkashRoomDatabase();
    }
    return AkashRoomDatabase.instance;
  }

  private initDatabase(): void {
    try {
      const storedVersion = localStorage.getItem(`${DB_STORAGE_KEY_PREFIX}version`);
      if (!storedVersion || parseInt(storedVersion, 10) < DB_VERSION) {
        // Ensure default users and roles are seeded
        const users = localStorage.getItem(`${DB_STORAGE_KEY_PREFIX}users`);
        if (!users) {
          localStorage.setItem(`${DB_STORAGE_KEY_PREFIX}users`, JSON.stringify(DEFAULT_USERS));
        }
        const roles = localStorage.getItem(`${DB_STORAGE_KEY_PREFIX}roles`);
        if (!roles) {
          localStorage.setItem(`${DB_STORAGE_KEY_PREFIX}roles`, JSON.stringify(DEFAULT_ROLES));
        }
        const logs = localStorage.getItem(`${DB_STORAGE_KEY_PREFIX}audit_logs`);
        if (!logs) {
          localStorage.setItem(`${DB_STORAGE_KEY_PREFIX}audit_logs`, JSON.stringify(DEFAULT_AUDIT_LOGS));
        }
        localStorage.setItem(`${DB_STORAGE_KEY_PREFIX}version`, DB_VERSION.toString());
      }
    } catch (e) {
      console.warn('Room Database storage initialization:', e);
    }
  }
}

export const AppDatabase = AkashRoomDatabase;

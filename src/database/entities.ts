/**
 * AKASH STORE - Room Database Relational Entities & Role Definitions
 * 
 * Supports primary relational models:
 * - User (UserEntity): Supports SUPER_ADMIN, ADMIN, INVENTORY_MANAGER, ORDER_MANAGER, SUPPORT_AGENT, and CUSTOMER
 * - Role (RoleEntity): Permission matrices and access policies
 * - Product (ProductEntity): Inventory catalog, SKU, variants, stock thresholds
 * - Order (OrderEntity): Customer checkout records, fulfillment states, payment verification
 * - AuditLog (AuditLogEntity): Immutable employee actions audit trail
 */

export type StaffRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'MANAGER'
  | 'EMPLOYEE'
  | 'INVENTORY_MANAGER' 
  | 'ORDER_MANAGER' 
  | 'SUPPORT_AGENT';

export type UserRole = StaffRole | 'CUSTOMER';

export type AccountStatus = 'ACTIVE' | 'DISABLED';

export interface RolePermissions {
  canAccessAdmin: boolean;
  canManageStaff: boolean;
  canManageAdmins: boolean;
  canManagePaymentSettings: boolean;
  canManageStoreSettings: boolean;
  canManageProducts: boolean;
  canManageInventory: boolean;
  canManageOrders: boolean;
  canManageDelivery: boolean;
  canManageCustomers: boolean;
  canManageCoupons: boolean;
  canManagePayments: boolean;
  canManageRefunds: boolean;
  canViewAnalytics: boolean;
  canViewAuditLogs: boolean;
  canAddSupportNotes: boolean;
}

/**
 * Entity: RoleEntity
 * Stores the definition and capability flags of roles in the system
 */
export interface RoleEntity {
  roleId: UserRole;
  displayName: string;
  description: string;
  isStaff: boolean;
  permissionsJson: string; // Serialized RolePermissions
  createdAt: string;
}

/**
 * Entity: UserEntity
 * Core relational entity representing customer and employee accounts in Room DB
 */
export interface UserEntity {
  id: string;                    // Primary Key (e.g. usr_owner_001, usr_emp_002, usr_cust_001)
  name: string;
  email: string;                 // Unique index
  role: UserRole;                // Role claim
  status: AccountStatus;         // ACTIVE or DISABLED
  isStaff: boolean;              // Distinguish between customer and staff
  passwordHash: string;          // Scrypt / SHA-256 password hash
  salt: string;                  // Salt for cryptographic hash
  phone?: string;
  mustChangePassword?: boolean;
  temporaryPassword?: string | null;
  activeSessionsJson?: string;   // Serialized active session tokens
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Entity: ProductEntity
 */
export interface ProductEntity {
  id: string;                    // Primary Key
  name: string;
  slug: string;
  sku: string;
  category: string;
  brand: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  lowStockThreshold: number;
  status: 'ACTIVE' | 'DRAFT' | 'OUT_OF_STOCK' | 'ARCHIVED';
  imagesJson: string;            // Serialized string[]
  variantsJson: string;          // Serialized ProductVariant[]
  specificationsJson: string;    // Serialized Record<string, string>
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Entity: OrderEntity
 */
export interface OrderEntity {
  id: string;                    // Primary Key (e.g. AKS-20260902-000123)
  customerJson: string;          // Serialized CustomerAddress
  itemsJson: string;             // Serialized OrderItem[]
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  currency: 'BDT';
  status: string;                // PENDING, CONFIRMED, PROCESSING, PACKED, SHIPPED, DELIVERED, CANCELLED
  paymentMethod: 'COD' | 'BKASH' | 'NAGAD';
  paymentStatus: 'UNPAID' | 'VERIFICATION_PENDING' | 'PAID' | 'REJECTED' | 'REFUNDED';
  timelineJson: string;          // Serialized OrderTimelineEvent[]
  supportNotesJson: string;      // Serialized string[]
  createdAt: string;
  updatedAt: string;
}

/**
 * Entity: AuditLogEntity
 * Immutable audit logs for all employee actions
 */
export interface AuditLogEntity {
  id: string;                    // Primary Key
  employeeId: string;            // Foreign key to UserEntity.id
  employeeName: string;
  employeeEmail: string;
  role: StaffRole;
  action: string;                // e.g. EMPLOYEE_DEACTIVATE, ORDER_STATUS_CHANGE, PAYMENT_VERIFY
  resource: string;              // e.g. Staff, Orders, Payments, Inventory
  resourceId?: string;
  details: string;
  ip: string;
  status: 'SUCCESS' | 'FAILED' | 'REJECTED';
  timestamp: string;             // ISO-8601
}

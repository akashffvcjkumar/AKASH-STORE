/**
 * AKASH STORE - Types and Interfaces
 * Role-Based Access Control (RBAC), E-Commerce, Payment, and Audit Schemas
 */

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'MANAGER' 
  | 'EMPLOYEE' 
  | 'CUSTOMER'
  | 'INVENTORY_MANAGER' 
  | 'ORDER_MANAGER' 
  | 'SUPPORT_AGENT';

export type StaffRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'MANAGER' 
  | 'EMPLOYEE' 
  | 'INVENTORY_MANAGER' 
  | 'ORDER_MANAGER' 
  | 'SUPPORT_AGENT';

export const STAFF_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'EMPLOYEE',
  'INVENTORY_MANAGER',
  'ORDER_MANAGER',
  'SUPPORT_AGENT',
];

export function isStaffRole(role?: string | null): boolean {
  if (!role) return false;
  return STAFF_ROLES.includes(role as UserRole) && role !== 'CUSTOMER';
}

export type StaffStatus = 'ACTIVE' | 'DISABLED';

export interface PermissionDefinition {
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

export const ROLE_PERMISSIONS: Record<UserRole, PermissionDefinition> = {
  SUPER_ADMIN: {
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
  },
  ADMIN: {
    canManageStaff: false, // Cannot manage or remove SUPER_ADMIN
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
    canManageRefunds: true,
    canViewAnalytics: true,
    canViewAuditLogs: true,
    canAddSupportNotes: true,
  },
  MANAGER: {
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
    canViewAuditLogs: true,
    canAddSupportNotes: true,
  },
  EMPLOYEE: {
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
  },
  CUSTOMER: {
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
  },
  INVENTORY_MANAGER: {
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
    canViewAuditLogs: false,
    canAddSupportNotes: false,
  },
  ORDER_MANAGER: {
    canManageStaff: false,
    canManageAdmins: false,
    canManagePaymentSettings: false,
    canManageStoreSettings: false,
    canManageProducts: false,
    canManageInventory: false,
    canManageOrders: true,
    canManageDelivery: true,
    canManageCustomers: true, // View required customer info
    canManageCoupons: false,
    canManagePayments: false, // Cannot change payment credentials
    canManageRefunds: true,
    canViewAnalytics: false,
    canViewAuditLogs: false,
    canAddSupportNotes: true,
  },
  SUPPORT_AGENT: {
    canManageStaff: false,
    canManageAdmins: false,
    canManagePaymentSettings: false,
    canManageStoreSettings: false,
    canManageProducts: false,
    canManageInventory: false,
    canManageOrders: false, // Read only through support view
    canManageDelivery: false,
    canManageCustomers: true,
    canManageCoupons: false,
    canManagePayments: false,
    canManageRefunds: false,
    canViewAnalytics: false,
    canViewAuditLogs: false,
    canAddSupportNotes: true,
  },
};

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER';
  avatar?: string;
  googleId?: string;
  authProvider: 'GOOGLE' | 'LOCAL';
  createdAt: string;
  lastLoginAt: string | null;
}

export interface EmployeeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: StaffStatus;
  authProvider?: 'LOCAL' | 'GOOGLE';
  googleId?: string;
  avatar?: string;
  passwordHash?: string;
  salt?: string;
  mustChangePassword?: boolean;
  temporaryPassword?: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserRecord = EmployeeUser;

export interface SessionRecord {
  token: string;
  userId: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
  userAgent?: string;
  ip?: string;
}

export interface AuditLogRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  role: UserRole;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ip: string;
  status: 'SUCCESS' | 'FAILED' | 'REJECTED';
  timestamp: string;
}

export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'OUT_OF_STOCK' | 'ARCHIVED';

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Black / 8GB + 128GB" or "M / Navy Blue"
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>; // e.g. { size: 'M', color: 'Navy Blue' }
}

export interface Product {
  id: string;
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
  status: ProductStatus;
  images: string[];
  variants: ProductVariant[];
  specifications: Record<string, string>;
  tags: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export type PaymentMethod = 'COD' | 'BKASH' | 'NAGAD';
export type PaymentStatus = 'UNPAID' | 'VERIFICATION_PENDING' | 'PAID' | 'REJECTED' | 'REFUNDED';
export type VerificationStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'FAILED';

export interface PaymentRecord {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  verificationStatus: VerificationStatus;
  amount: number;
  currency: 'BDT';
  senderPhone?: string;
  receiverPhone?: string;
  transactionId?: string;
  failureReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 
  | 'PENDING' 
  | 'AWAITING_PAYMENT' 
  | 'PAYMENT_VERIFICATION' 
  | 'CONFIRMED' 
  | 'PROCESSING' 
  | 'PACKED' 
  | 'SHIPPED' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'REFUNDED';

export interface OrderItem {
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  sku: string;
  image: string;
  price: number;
  quantity: number;
  total: number;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note: string;
  updatedBy?: string;
}

export interface CustomerAddress {
  fullName: string;
  phone: string;
  email?: string;
  division: string;
  district: string;
  upazila: string;
  areaAddress: string;
  postalCode?: string;
}

export interface OrderRecord {
  id: string; // e.g. AKS-20260902-000123
  customer: CustomerAddress;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  currency: 'BDT';
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  timeline: OrderTimelineEvent[];
  supportNotes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CouponRecord {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageCount: number;
  usageLimit: number;
  expiryDate: string;
  isActive: boolean;
}

export interface StoreSettings {
  storeName: string;
  ownerName: string;
  headquarters: string;
  contactEmail: string;
  supportPhoneDisplay?: string;
  currency: string;
  currencySymbol: string;
  
  // Payment Settings
  bkashNumber: string;
  bkashEnabled: boolean;
  nagadNumber: string;
  nagadEnabled: boolean;
  codEnabled: boolean;
  codRequiresConfirmation: boolean;

  // Delivery settings
  insideDhakaFee: number;
  outsideDhakaFee: number;
  freeDeliveryThreshold: number;
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

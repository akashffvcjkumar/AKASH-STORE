/**
 * AKASH STORE - Room Database TypeConverters
 * 
 * Provides bi-directional converters between primitive database types and
 * structured domain objects for User, Role, Product, Order, and AuditLog entities.
 */

import { RolePermissions, StaffRole, UserRole, AccountStatus } from './entities.js';

export class DateConverter {
  static toTimestamp(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    return typeof date === 'string' ? new Date(date).toISOString() : date.toISOString();
  }

  static fromTimestamp(timestamp: string | null | undefined): Date | null {
    if (!timestamp) return null;
    const parsed = new Date(timestamp);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
}

export class JsonConverter {
  static toJson<T>(object: T): string {
    try {
      return JSON.stringify(object ?? null);
    } catch {
      return 'null';
    }
  }

  static fromJson<T>(jsonString: string | null | undefined, fallback: T): T {
    if (!jsonString) return fallback;
    try {
      return JSON.parse(jsonString) as T;
    } catch {
      return fallback;
    }
  }
}

export class StringListConverter {
  static fromList(list: string[]): string {
    return JSON.stringify(list || []);
  }

  static toList(json: string | null | undefined): string[] {
    if (!json) return [];
    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  }
}

export class RolePermissionsConverter {
  static toJson(permissions: RolePermissions): string {
    return JSON.stringify(permissions);
  }

  static fromJson(json: string | null | undefined): RolePermissions {
    const defaultPermissions: RolePermissions = {
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
    };

    if (!json) return defaultPermissions;
    try {
      return { ...defaultPermissions, ...JSON.parse(json) };
    } catch {
      return defaultPermissions;
    }
  }
}

export class RoleConverter {
  static toRole(roleStr: string): UserRole {
    const validRoles: UserRole[] = [
      'SUPER_ADMIN',
      'ADMIN',
      'INVENTORY_MANAGER',
      'ORDER_MANAGER',
      'SUPPORT_AGENT',
      'CUSTOMER'
    ];
    if (validRoles.includes(roleStr as UserRole)) {
      return roleStr as UserRole;
    }
    return 'CUSTOMER';
  }

  static isStaffRole(role: UserRole): role is StaffRole {
    return role !== 'CUSTOMER';
  }
}

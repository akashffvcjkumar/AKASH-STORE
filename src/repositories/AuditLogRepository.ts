/**
 * AKASH STORE - AuditLogRepository
 * 
 * Abstracts Room AuditLogDao operations.
 * Provides a clean API for ViewModels to query, filter, and inspect immutable audit trail records.
 * Supports filtering by employee name, action type, and date range.
 */

import { AkashRoomDatabase } from '../database/RoomDatabase.js';
import { AuditLogEntity, StaffRole } from '../database/entities.js';
import { AuditLogQueryFilter } from '../database/daos.js';

export interface AuditSearchParams {
  employeeName?: string;
  actionType?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  role?: string;
  limit?: number;
}

export class AuditLogRepository {
  private db: AkashRoomDatabase;

  constructor(db?: AkashRoomDatabase) {
    this.db = db || AkashRoomDatabase.getInstance();
  }

  /**
   * Search audit logs with multi-parameter filtering:
   * - employeeName
   * - actionType
   * - date range (startDate to endDate)
   * - free text searchQuery
   */
  async searchLogs(params: AuditSearchParams): Promise<AuditLogEntity[]> {
    const filter: AuditLogQueryFilter = {
      employeeName: params.employeeName,
      actionType: params.actionType,
      startDate: params.startDate,
      endDate: params.endDate,
      searchQuery: params.searchQuery,
      role: params.role,
      limit: params.limit || 200,
    };
    return this.db.auditLogDao.query(filter);
  }

  /**
   * Get all specific audit log entries performed by a particular employee
   * (used by the 'View Activity' button in Staff Management)
   */
  async getEmployeeAuditLogs(employeeId: string): Promise<AuditLogEntity[]> {
    return this.db.auditLogDao.getByEmployeeId(employeeId);
  }

  /**
   * Record a new immutable audit log entry
   */
  async logAction(entry: {
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
    role: StaffRole;
    action: string;
    resource: string;
    resourceId?: string;
    details: string;
    status?: 'SUCCESS' | 'FAILED' | 'REJECTED';
    ip?: string;
  }): Promise<AuditLogEntity> {
    const newLog: AuditLogEntity = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      employeeId: entry.employeeId,
      employeeName: entry.employeeName,
      employeeEmail: entry.employeeEmail,
      role: entry.role,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: entry.details,
      ip: entry.ip || '103.145.118.42',
      status: entry.status || 'SUCCESS',
      timestamp: new Date().toISOString(),
    };

    await this.db.auditLogDao.insert(newLog);
    return newLog;
  }

  /**
   * Fetch all audit logs
   */
  async getAllLogs(): Promise<AuditLogEntity[]> {
    return this.db.auditLogDao.getAll();
  }
}

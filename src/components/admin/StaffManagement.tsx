/**
 * AKASH STORE - Staff Management View
 * 
 * Enhanced with:
 * - Direct 'View Activity' button for every employee opening their specific audit log screen
 * - Secure deactivation function for Super Admin (revokes active sessions & access while preserving 100% of historical activity logs)
 * - Complete RBAC roles: SUPER_ADMIN, ADMIN, INVENTORY_MANAGER, ORDER_MANAGER, SUPPORT_AGENT
 * - Room Database UserRepository integration
 */

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  ShieldCheck, 
  Key, 
  Ban, 
  CheckCircle, 
  Trash2, 
  LogOut, 
  History, 
  AlertTriangle, 
  RefreshCw,
  Search,
  UserCheck,
  Lock,
  Eye,
  EyeOff,
  UserX,
  FileText,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react';
import { EmployeeUser, StaffRole } from '../../types.js';
import { useStore } from '../../context/StoreContext.js';
import { UserRepository } from '../../repositories/UserRepository.js';
import { AuditLogRepository } from '../../repositories/AuditLogRepository.js';
import { AuditLogEntity } from '../../database/entities.js';

export const StaffManagement: React.FC = () => {
  const { currentStaff, token, showToast } = useStore();
  const [userRepo] = useState(() => new UserRepository());
  const [auditRepo] = useState(() => new AuditLogRepository());

  const [staffList, setStaffList] = useState<EmployeeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deactivateModalUser, setDeactivateModalUser] = useState<EmployeeUser | null>(null);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [resetModalUser, setResetModalUser] = useState<EmployeeUser | null>(null);
  const [tempPasswordGenerated, setTempPasswordGenerated] = useState<string | null>(null);

  // 'View Activity' Screen / Drawer
  const [employeeLogsUser, setEmployeeLogsUser] = useState<EmployeeUser | null>(null);
  const [employeeLogs, setEmployeeLogs] = useState<AuditLogEntity[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [activityActionFilter, setActivityActionFilter] = useState('ALL');

  // Form states for new employee
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<StaffRole>('ORDER_MANAGER');
  const [formPassword, setFormPassword] = useState('');

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      // First try Room Database
      const roomStaff = await userRepo.getAllStaff();
      
      // If token exists, sync with server API
      if (token) {
        try {
          const res = await fetch('/api/admin/staff', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const serverStaff = await res.json();
            setStaffList(serverStaff);
            setIsLoading(false);
            return;
          }
        } catch {}
      }

      // Map room staff to EmployeeUser format
      const formatted: EmployeeUser[] = roomStaff.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as StaffRole,
        status: u.status,
        phone: u.phone,
        activeSessions: u.activeSessionsJson ? JSON.parse(u.activeSessionsJson) : [],
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      }));
      setStaffList(formatted);
    } catch {
      showToast('Error loading staff accounts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [token]);

  // Check RBAC permission: Only SUPER_ADMIN can manage staff accounts
  if (currentStaff?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Access Restricted (SUPER_ADMIN Only)</h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Staff Account Management, RBAC role assignment, account deactivation, and session revocation are restricted exclusively to the <strong>SUPER_ADMIN / STORE OWNER</strong>.
        </p>
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
          Your current active role is: <strong className="text-slate-800 dark:text-slate-200">{currentStaff?.role || 'None'}</strong>. Use the Role Switcher at the top to switch to <strong>Akash Chondror Roy (SUPER_ADMIN)</strong>.
        </div>
      </div>
    );
  }

  // Handle Create Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      showToast('Please fill in name, individual email, and initial password.', 'error');
      return;
    }

    try {
      // 1. Room DB creation
      if (currentStaff) {
        await userRepo.createEmployee({
          name: formName,
          email: formEmail,
          role: formRole,
          password: formPassword,
        }, {
          id: currentStaff.id,
          name: currentStaff.name,
          email: currentStaff.email,
          role: currentStaff.role,
        });
      }

      // 2. Server API sync if available
      if (token) {
        await fetch('/api/admin/staff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formName.trim(),
            email: formEmail.trim().toLowerCase(),
            role: formRole,
            password: formPassword.trim(),
            customTemporaryPassword: formPassword.trim(),
          }),
        }).catch(() => {});
      }

      showToast(`Employee account "${formName}" created with individual identity!`);
      setCreateModalOpen(false);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      fetchStaff();
    } catch (err: any) {
      showToast(err.message || 'Error creating account', 'error');
    }
  };

  /**
   * SECURE FUNCTION: Super Admin deactivates an employee account.
   * Revokes access and sessions immediately while 100% preserving historical activity logs.
   */
  const handleConfirmDeactivation = async () => {
    if (!deactivateModalUser || !currentStaff) return;

    if (deactivateModalUser.role === 'SUPER_ADMIN') {
      showToast('Security Alert: Store Owner / Super Admin account cannot be deactivated.', 'error');
      setDeactivateModalUser(null);
      return;
    }

    setIsDeactivating(true);

    try {
      // 1. Execute secure deactivation in Room Database UserRepository
      const result = await userRepo.deactivateEmployee(
        deactivateModalUser.id,
        {
          id: currentStaff.id,
          name: currentStaff.name,
          email: currentStaff.email,
          role: currentStaff.role,
        },
        deactivationReason.trim() || 'Super Admin Administrative Action'
      );

      if (!result.success) {
        showToast(result.error || 'Failed to deactivate employee', 'error');
        setIsDeactivating(false);
        return;
      }

      // 2. Sync with backend API
      if (token) {
        await fetch(`/api/admin/staff/${deactivateModalUser.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'DISABLED' }),
        }).catch(() => {});

        await fetch(`/api/admin/staff/${deactivateModalUser.id}/revoke-sessions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }

      showToast(`Account for ${deactivateModalUser.name} deactivated. All sessions revoked; all historical logs preserved intact.`);
      setDeactivateModalUser(null);
      setDeactivationReason('');
      fetchStaff();
    } catch (err: any) {
      showToast('Error deactivating account: ' + err.message, 'error');
    } finally {
      setIsDeactivating(false);
    }
  };

  // Reactivate employee account
  const handleReactivateEmployee = async (user: EmployeeUser) => {
    if (!currentStaff) return;
    try {
      await userRepo.reactivateEmployee(user.id, {
        id: currentStaff.id,
        name: currentStaff.name,
        email: currentStaff.email,
        role: currentStaff.role,
      });

      if (token) {
        await fetch(`/api/admin/staff/${user.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'ACTIVE' }),
        }).catch(() => {});
      }

      showToast(`Account for ${user.name} reactivated.`);
      fetchStaff();
    } catch (err: any) {
      showToast('Error reactivating account: ' + err.message, 'error');
    }
  };

  // View Activity Logs for an Employee (opens dedicated activity screen)
  const handleOpenEmployeeActivity = async (user: EmployeeUser) => {
    setEmployeeLogsUser(user);
    setIsLoadingLogs(true);
    setActivityActionFilter('ALL');

    try {
      // 1. Query Room AuditLogRepository
      const roomLogs = await auditRepo.getEmployeeAuditLogs(user.id);

      // 2. Query Server API if token available
      if (token) {
        try {
          const res = await fetch(`/api/admin/audit-logs?employeeId=${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const apiLogs = await res.json();
            const map = new Map<string, AuditLogEntity>();
            roomLogs.forEach(l => map.set(l.id, l));
            apiLogs.forEach((l: any) => map.set(l.id, l));
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            setEmployeeLogs(merged);
            setIsLoadingLogs(false);
            return;
          }
        } catch {}
      }

      setEmployeeLogs(roomLogs);
    } catch {
      showToast('Failed to load employee activity history', 'error');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (user: EmployeeUser) => {
    if (!currentStaff) return;
    try {
      const res = await userRepo.resetPassword(user.id, {
        id: currentStaff.id,
        name: currentStaff.name,
        email: currentStaff.email,
        role: currentStaff.role,
      });

      if (res.success && res.tempPassword) {
        setTempPasswordGenerated(res.tempPassword);
        setResetModalUser(user);
        showToast(`Temporary password generated for ${user.name}.`);
        fetchStaff();
      }
    } catch {
      showToast('Network error resetting password', 'error');
    }
  };

  // Handle Delete Employee
  const handleDeleteEmployee = async (user: EmployeeUser) => {
    if (user.role === 'SUPER_ADMIN') {
      showToast('Owner account cannot be deleted.', 'error');
      return;
    }

    if (!window.confirm(`Permanently remove employee record for ${user.name} (${user.email})? Note: Deactivation is recommended to preserve employee identities.`)) {
      return;
    }

    try {
      await userRepo['db'].userDao.delete(user.id);
      if (token) {
        await fetch(`/api/admin/staff/${user.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      showToast(`Employee record for ${user.name} deleted.`);
      fetchStaff();
    } catch (err: any) {
      showToast('Error removing account: ' + err.message, 'error');
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedEmployeeLogs = employeeLogs.filter(l => 
    activityActionFilter === 'ALL' || l.action === activityActionFilter
  );

  return (
    <div className="space-y-6">
      
      {/* RBAC Compliance Banner */}
      <div className="bg-emerald-950 border border-emerald-800 rounded-2xl p-5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">Individual Staff Accounts & RBAC Matrix</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Strict individual accountability enforced across all 5 roles: <strong>SUPER_ADMIN</strong>, <strong>ADMIN</strong>, <strong>INVENTORY_MANAGER</strong>, <strong>ORDER_MANAGER</strong>, and <strong>SUPPORT_AGENT</strong>. Deactivating an account revokes access immediately without deleting immutable activity logs.
          </p>
        </div>

        <button
          onClick={() => {
            setFormPassword(`Akash@${Math.floor(1000 + Math.random() * 9000)}`);
            setCreateModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Employee Account</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
          />
        </div>

        <button
          onClick={fetchStaff}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Staff List</span>
        </button>
      </div>

      {/* Staff Accounts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Employee Details</th>
                <th className="py-3.5 px-4">Role Claim</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Activity Audit</th>
                <th className="py-3.5 px-4">Active Sessions</th>
                <th className="py-3.5 px-4 text-right">Super Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.map((staff) => {
                const isOwner = staff.role === 'SUPER_ADMIN';
                const isActive = staff.status === 'ACTIVE';

                return (
                  <tr key={staff.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    
                    {/* Employee Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${
                          isOwner 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 dark:border dark:border-amber-800' 
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{staff.name}</span>
                            {isOwner && (
                              <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700 font-extrabold px-1 rounded">
                                OWNER
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] select-all">
                            {staff.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Claim Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        staff.role === 'SUPER_ADMIN'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                          : staff.role === 'ADMIN'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                          : staff.role === 'INVENTORY_MANAGER'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                          : staff.role === 'ORDER_MANAGER'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}>
                        {staff.role}
                      </span>
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                      }`}>
                        {isActive ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Ban className="w-3 h-3 text-rose-500" />}
                        <span>{staff.status}</span>
                      </span>
                    </td>

                    {/* PROMINENT 'View Activity' BUTTON */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleOpenEmployeeActivity(staff)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                        title={`View immutable audit log entries for ${staff.name}`}
                      >
                        <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>View Activity</span>
                      </button>
                    </td>

                    {/* Active Sessions */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      <span>{staff.activeSessions?.length || 0} active</span>
                    </td>

                    {/* Super Admin Controls */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Reset Password */}
                        <button
                          onClick={() => handleResetPassword(staff)}
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Reset Employee Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>

                        {/* SECURE DEACTIVATE / REACTIVATE BUTTON */}
                        {!isOwner && (
                          isActive ? (
                            <button
                              onClick={() => setDeactivateModalUser(staff)}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Deactivate Employee Account (Revokes access; preserves historical activity logs)"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Deactivate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateEmployee(staff)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Reactivate Account"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Reactivate</span>
                            </button>
                          )
                        )}

                        {/* Permanent Delete */}
                        {!isOwner && (
                          <button
                            onClick={() => handleDeleteEmployee(staff)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Permanently Remove Employee Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECURE DEACTIVATION CONFIRMATION MODAL */}
      {deactivateModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-slate-900 dark:text-slate-100 animate-in zoom-in-95 transition-colors">
            
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
              <UserX className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Deactivate Employee Account
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {deactivateModalUser.name} ({deactivateModalUser.email}) • {deactivateModalUser.role}
              </p>
            </div>

            {/* Crucial policy reassurance */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Audit Trail Integrity Guaranteed</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                Deactivation immediately revokes this employee&apos;s credentials and terminates all active sessions. <strong>Their historical activity logs will NOT be deleted</strong> and remain permanently preserved in the Room database for auditing.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deactivation Reason (Recorded in Audit Log)
              </label>
              <input
                type="text"
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                placeholder="e.g., Employment ended, Security review, Role transition..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeactivating}
                onClick={() => setDeactivateModalUser(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeactivating}
                onClick={handleConfirmDeactivation}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeactivating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                <span>Confirm Deactivation</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DEDICATED EMPLOYEE ACTIVITY AUDIT LOG SCREEN / MODAL */}
      {employeeLogsUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors animate-in zoom-in-95">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Employee Activity Logs: {employeeLogsUser.name}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {employeeLogsUser.email} • Role: <strong className="text-emerald-600 dark:text-emerald-400">{employeeLogsUser.role}</strong> • Status: {employeeLogsUser.status}
                </p>
              </div>
              <button 
                onClick={() => setEmployeeLogsUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Sub-bar */}
            <div className="px-4 py-2 bg-slate-100/60 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">
                Showing {displayedEmployeeLogs.length} activity records
              </span>

              <select
                value={activityActionFilter}
                onChange={(e) => setActivityActionFilter(e.target.value)}
                className="px-2 py-1 text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-medium text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">All Actions</option>
                <option value="PAYMENT_VERIFY">PAYMENT_VERIFY</option>
                <option value="ORDER_STATUS_CHANGE">ORDER_STATUS_CHANGE</option>
                <option value="INVENTORY_ADJUST">INVENTORY_ADJUST</option>
                <option value="EMPLOYEE_CREATE">EMPLOYEE_CREATE</option>
                <option value="EMPLOYEE_DEACTIVATE">EMPLOYEE_DEACTIVATE</option>
                <option value="PASSWORD_RESET">PASSWORD_RESET</option>
                <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              </select>
            </div>

            {/* Activity Entries List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {isLoadingLogs ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                  <span>Loading employee audit history from Room Database...</span>
                </div>
              ) : displayedEmployeeLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-1">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">No activity records found</p>
                  <p className="text-xs text-slate-400">This employee has not performed any actions matching this filter yet.</p>
                </div>
              ) : (
                displayedEmployeeLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 uppercase text-[10px] bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="text-slate-400 text-[10px] font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </span>
                    </div>

                    <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      {log.details}
                    </p>

                    <div className="text-[10px] text-slate-400 font-mono pt-0.5 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800/60">
                      <span>IP Address: {log.ip}</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Status: {log.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">
                Preserved permanently in Room Audit Trail
              </span>
              <button
                onClick={() => setEmployeeLogsUser(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-slate-900 dark:text-slate-100 transition-colors">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Create Employee Account</h3>
              </div>
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Each staff member must have an individual account and work email. Shared credentials like <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-amber-600">admin / sharedpassword</code> are strictly forbidden.
            </p>

            <form onSubmit={handleCreateStaff} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employee Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Rahim Ahmed"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Individual Work Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g., rahim@akashstore.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned RBAC Role *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as StaffRole)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="ADMIN">ADMIN (Operations & Catalog)</option>
                  <option value="MANAGER">MANAGER (Operations & Orders/Inventory)</option>
                  <option value="EMPLOYEE">EMPLOYEE (General Staff & Customer Support)</option>
                  <option value="INVENTORY_MANAGER">INVENTORY_MANAGER (Stock & Products)</option>
                  <option value="ORDER_MANAGER">ORDER_MANAGER (Orders & bKash)</option>
                  <option value="SUPPORT_AGENT">SUPPORT_AGENT (Customer Service)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password *
                </label>
                <input
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  Save Employee Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET CONFIRMATION MODAL */}
      {resetModalUser && tempPasswordGenerated && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center text-slate-900 dark:text-slate-100 transition-colors">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-300 dark:border-amber-800">
              <Key className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Password Reset Completed</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              A temporary password was generated for <strong>{resetModalUser.name}</strong> ({resetModalUser.email}).
            </p>

            <div className="p-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl select-all font-mono font-bold text-sm text-slate-900 dark:text-emerald-400">
              {tempPasswordGenerated}
            </div>

            <button
              onClick={() => {
                setResetModalUser(null);
                setTempPasswordGenerated(null);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

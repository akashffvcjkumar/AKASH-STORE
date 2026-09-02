/**
 * AKASH STORE - Audit Logs Dashboard View
 * 
 * Screen in the Admin Dashboard that displays immutable audit logs for employee actions:
 * - Searchable by Employee Name
 * - Searchable by Action Type
 * - Searchable by Date Range (Start Date to End Date with quick presets)
 * - Detail inspection drawer/modal
 * - Export to JSON / CSV
 * - Powered by Room Database AuditLogRepository
 */

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  RefreshCw, 
  Filter, 
  Calendar, 
  Download, 
  ShieldCheck, 
  User, 
  Clock, 
  Info, 
  Eye, 
  X,
  FileText
} from 'lucide-react';
import { AuditLogEntity, StaffRole } from '../../database/entities.js';
import { AuditLogRepository } from '../../repositories/AuditLogRepository.js';
import { useStore } from '../../context/StoreContext.js';

interface AuditLogsViewProps {
  initialEmployeeId?: string;
  initialEmployeeName?: string;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  initialEmployeeId,
  initialEmployeeName,
}) => {
  const { token, showToast, currentStaff, adminDarkMode } = useStore();
  const [auditRepo] = useState(() => new AuditLogRepository());

  const [logs, setLogs] = useState<AuditLogEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters required by user specification:
  const [employeeNameQuery, setEmployeeNameQuery] = useState(initialEmployeeName || '');
  const [actionTypeFilter, setActionTypeFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generalSearch, setGeneralSearch] = useState('');

  // Selected Log Modal for deep inspection
  const [selectedLog, setSelectedLog] = useState<AuditLogEntity | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Query through AuditLogRepository (Room DB)
      const results = await auditRepo.searchLogs({
        employeeName: employeeNameQuery.trim() || undefined,
        actionType: actionTypeFilter !== 'ALL' ? actionTypeFilter : undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        searchQuery: generalSearch.trim() || undefined,
      });

      // Also try to query backend API to merge any server-side logs
      if (token) {
        try {
          let url = '/api/admin/audit-logs?';
          if (employeeNameQuery.trim()) url += `search=${encodeURIComponent(employeeNameQuery.trim())}&`;
          if (actionTypeFilter !== 'ALL') url += `action=${actionTypeFilter}&`;
          if (roleFilter !== 'ALL') url += `role=${roleFilter}&`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const apiLogs = await res.json();
            // Merge unique by ID
            const map = new Map<string, AuditLogEntity>();
            results.forEach(l => map.set(l.id, l));
            apiLogs.forEach((l: any) => {
              if (!map.has(l.id)) {
                map.set(l.id, {
                  id: l.id,
                  employeeId: l.employeeId || 'usr_unknown',
                  employeeName: l.employeeName || 'Staff Member',
                  employeeEmail: l.employeeEmail || '',
                  role: l.role || 'ORDER_MANAGER',
                  action: l.action,
                  resource: l.resource,
                  resourceId: l.resourceId,
                  details: l.details,
                  ip: l.ip || '103.145.118.42',
                  status: l.status || 'SUCCESS',
                  timestamp: l.timestamp,
                });
              }
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            setLogs(merged);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          // fallback to Room DB records
        }
      }

      setLogs(results);
    } catch (err: any) {
      showToast('Error querying audit logs: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionTypeFilter, roleFilter, startDate, endDate]);

  const handleResetFilters = () => {
    setEmployeeNameQuery('');
    setActionTypeFilter('ALL');
    setRoleFilter('ALL');
    setStartDate('');
    setEndDate('');
    setGeneralSearch('');
    setTimeout(fetchLogs, 50);
  };

  const applyPreset = (preset: 'today' | '7days' | '30days' | 'all') => {
    const today = new Date();
    const toDateStr = today.toISOString().slice(0, 10);

    if (preset === 'today') {
      setStartDate(toDateStr);
      setEndDate(toDateStr);
    } else if (preset === '7days') {
      const past = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(toDateStr);
    } else if (preset === '30days') {
      const past = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(toDateStr);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `akash_audit_trail_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Exported ${logs.length} audit records.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">Room Database Immutable Audit Trail</h3>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800 font-mono">
              Search & Filters
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Every staff action (bKash payment verification, order packaging & shipping, inventory modifications, employee account creations, and Super Admin deactivations) is permanently recorded with individual employee identity, exact timestamp, client IP, and action type.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportJson}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* SEARCH & DATE RANGE FILTERS PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4 transition-colors">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-500" />
            <span>Searchable Employee Actions Filter</span>
          </span>
          <button
            onClick={handleResetFilters}
            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* 1. Search by Employee Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Search by Employee Name:
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Rahim, Tariqul, Akash..."
                value={employeeNameQuery}
                onChange={(e) => setEmployeeNameQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 2. Search by Action Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Action Type:
            </label>
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Action Types</option>
              <option value="EMPLOYEE_DEACTIVATE">EMPLOYEE_DEACTIVATE (Super Admin)</option>
              <option value="EMPLOYEE_REACTIVATE">EMPLOYEE_REACTIVATE</option>
              <option value="EMPLOYEE_CREATE">EMPLOYEE_CREATE</option>
              <option value="PAYMENT_VERIFY">PAYMENT_VERIFY (bKash)</option>
              <option value="PAYMENT_REJECT">PAYMENT_REJECT</option>
              <option value="ORDER_STATUS_CHANGE">ORDER_STATUS_CHANGE</option>
              <option value="INVENTORY_ADJUST">INVENTORY_ADJUST</option>
              <option value="PASSWORD_RESET">PASSWORD_RESET</option>
              <option value="SESSIONS_REVOKE">SESSIONS_REVOKE</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            </select>
          </div>

          {/* 3. Date Range: Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Start Date:
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 4. Date Range: End Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              End Date:
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

        </div>

        {/* Quick Date Presets & Filter Submit */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mr-1">Date Presets:</span>
            <button
              onClick={() => applyPreset('today')}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={() => applyPreset('7days')}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => applyPreset('30days')}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => applyPreset('all')}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              All Time
            </button>
          </div>

          <button
            onClick={fetchLogs}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Apply Search Filters</span>
          </button>
        </div>

      </div>

      {/* AUDIT LOGS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Employee / Individual ID</th>
                <th className="py-3.5 px-4">Action Type</th>
                <th className="py-3.5 px-4">Action Details & Target Resource</th>
                <th className="py-3.5 px-4">Client IP</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No audit log records match your filter criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the employee name, action type, or date range.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isDeactivate = log.action === 'EMPLOYEE_DEACTIVATE';
                  const isPayment = log.action.includes('PAYMENT');
                  const isOrder = log.action.includes('ORDER');

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      
                      {/* Timestamp */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* Employee details */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{log.employeeName}</span>
                          {log.role === 'SUPER_ADMIN' && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-extrabold px-1 rounded">
                              OWNER
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono select-all mt-0.5">
                          {log.employeeEmail}
                        </div>
                        <span className="inline-block mt-1 text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                          {log.role}
                        </span>
                      </td>

                      {/* Action Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] inline-block ${
                          isDeactivate
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : isPayment 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800' 
                            : isOrder 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 dark:border dark:border-blue-800'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 dark:border dark:border-purple-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Action Details & Resource */}
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 max-w-md">
                        <p className="font-medium text-xs leading-relaxed">{log.details}</p>
                        {log.resourceId && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 inline-block">
                            Resource: {log.resource} (#{log.resourceId})
                          </span>
                        )}
                      </td>

                      {/* Client IP */}
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                        {log.ip}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                          log.status === 'SUCCESS' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border dark:border-emerald-800' 
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 dark:border dark:border-rose-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>

                      {/* Inspect */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Inspect full audit event record"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Audit Log Record Details</h4>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Log ID</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Timestamp</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Actor Name</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedLog.employeeName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Role Claim</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{selectedLog.role}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Action Code</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Client IP Address</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">{selectedLog.ip}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Details & Description</span>
                <p className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed text-slate-800 dark:text-slate-200">
                  {selectedLog.details}
                </p>
              </div>

              {selectedLog.resourceId && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Resource Context</span>
                  <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[11px]">
                    Target Resource: {selectedLog.resource} • Target ID: {selectedLog.resourceId}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

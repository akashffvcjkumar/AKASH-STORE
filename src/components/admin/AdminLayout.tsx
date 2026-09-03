import React, { useEffect } from 'react';
import { 
  Users, 
  CreditCard, 
  Package, 
  History, 
  Settings, 
  ShoppingBag, 
  LogOut, 
  ShieldCheck, 
  ArrowLeft,
  UserCheck,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';
import { useStore } from '../../context/StoreContext.js';
import { StaffManagement } from './StaffManagement.js';
import { PaymentsQueue } from './PaymentsQueue.js';
import { OrdersManager } from './OrdersManager.js';
import { ProductsManager } from './ProductsManager.js';
import { AuditLogsView } from './AuditLogsView.js';
import { SettingsManager } from './SettingsManager.js';
import { CustomersManager } from './CustomersManager.js';
import { StaffRole } from '../../types.js';

export const AdminLayout: React.FC = () => {
  const { 
    currentStaff, 
    logoutStaff, 
    switchStaffRole, 
    setActiveView, 
    adminTab, 
    setAdminTab,
    settings,
    adminDarkMode,
    toggleAdminDarkMode
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || (e.ctrlKey && e.shiftKey)) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        toggleAdminDarkMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleAdminDarkMode]);

  const demoStaffRoles: { role: StaffRole; name: string; desc: string }[] = [
    { role: 'SUPER_ADMIN', name: 'Akash Chondror Roy', desc: 'Store Owner (All Permissions)' },
    { role: 'ADMIN', name: 'Tariqul Islam', desc: 'Admin Operations' },
    { role: 'INVENTORY_MANAGER', name: 'Selim Reza', desc: 'Inventory & Stock' },
    { role: 'ORDER_MANAGER', name: 'Rahim', desc: 'Orders & Logistics' },
    { role: 'SUPPORT_AGENT', name: 'Nusrat Jahan', desc: 'Customer Support' },
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${adminDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* Top Bar: Active Staff Identity, Theme Toggle & Quick Role Switcher */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Store & Active Session */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  A
                </div>
                <div>
                  <h1 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                    <span>{settings?.storeName || 'AKASH STORE'}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono border border-slate-700">
                      ADMIN PORTAL
                    </span>
                  </h1>
                  <p className="text-[10px] text-slate-400">Headquarters: {settings?.headquarters || 'Sherpur, Bogura'}</p>
                </div>
              </div>

              {/* Mobile Controls: Theme toggle & Storefront */}
              <div className="flex items-center gap-1.5 md:hidden">
                <button
                  onClick={toggleAdminDarkMode}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                  title="Toggle Dark / Light Mode"
                >
                  {adminDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                </button>
                <button
                  onClick={() => setActiveView('customer')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>Store</span>
                </button>
              </div>
            </div>

            {/* Quick Multi-Employee Role Switcher (Crucial for RBAC verification) */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto justify-start md:justify-center py-1 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden lg:inline">
                Test Individual Account:
              </span>
              {demoStaffRoles.map((item) => {
                const isCurrent = currentStaff?.role === item.role;
                return (
                  <button
                    key={item.role}
                    onClick={() => switchStaffRole(item.role)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                    title={item.desc}
                  >
                    <span>{item.name.split(' ')[0]}</span>
                    <span className="text-[9px] opacity-75 font-mono">({item.role.slice(0, 5)})</span>
                  </button>
                );
              })}
            </div>

            {/* Active User info, Dark Mode Toggle & Actions */}
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              
              {/* Eye Strain Reduction Dark Mode Toggle */}
              <button
                id="admin-theme-toggle"
                onClick={toggleAdminDarkMode}
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  adminDarkMode
                    ? 'bg-slate-900 hover:bg-slate-800/90 text-amber-300 border-amber-500/30 shadow-xs'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                }`}
                title="Toggle Dark Mode to prevent eye strain during long shifts (Shortcut: Alt+D)"
              >
                {adminDarkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="text-slate-200">Night Mode</span>
                    <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1 py-0.2 rounded font-mono">
                      ON
                    </span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Dark Mode</span>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono">
                      OFF
                    </span>
                  </>
                )}
              </button>

              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-200 flex items-center justify-end gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{currentStaff?.name || 'Authenticated Staff'}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {currentStaff?.email} • <span className="text-emerald-400 font-bold">{currentStaff?.role}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveView('customer')}
                className="hidden md:flex px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Storefront</span>
              </button>

              <button
                onClick={logoutStaff}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                title="Log Out of Admin Panel"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 shadow-2xs transition-colors">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          
          {/* Staff Management (Super Admin Exclusive) */}
          <button
            onClick={() => setAdminTab('staff')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              adminTab === 'staff'
                ? 'bg-slate-900 text-white shadow-2xs dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/40'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span>Staff & Employee Accounts</span>
            {currentStaff?.role === 'SUPER_ADMIN' && (
              <span className="text-[9px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 dark:border dark:border-purple-800 px-1 py-0.2 rounded font-extrabold">
                OWNER
              </span>
            )}
          </button>

          {/* Payments Queue */}
          <button
            onClick={() => setAdminTab('payments')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              adminTab === 'payments'
                ? 'bg-slate-900 text-white shadow-2xs dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/40'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4 text-pink-500 dark:text-pink-400" />
            <span>bKash Payment Verification</span>
          </button>

          {/* Orders & Logistics */}
          <button
            onClick={() => setAdminTab('orders')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              adminTab === 'orders'
                ? 'bg-slate-900 text-white shadow-2xs dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/40'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            <Package className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Orders & Fulfillment</span>
          </button>

          {/* Products & Inventory */}
          <button
            onClick={() => setAdminTab('products')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              adminTab === 'products'
                ? 'bg-slate-900 text-white shadow-2xs dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/40'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span>Catalog & Stock</span>
          </button>

          {/* Customers & CRM */}
          <button
            onClick={() => setAdminTab('customers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              adminTab === 'customers'
                ? 'bg-slate-900 text-white shadow-2xs dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/40'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4 text-teal-500 dark:text-teal-400" />
            <span>Customers & Accounts</span>
          </button>

          {/* Audit Logs */}
          <button
            onClick={() => setAdminTab('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              adminTab === 'audit'
                ? 'bg-slate-900 text-white shadow-2xs dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/40'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            <History className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Audit Trail</span>
          </button>

          {/* Store Settings */}
          {currentStaff?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setAdminTab('settings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                adminTab === 'settings'
                  ? 'bg-slate-900 text-white shadow-2xs dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/40'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Settings</span>
            </button>
          )}

        </div>
      </div>

      {/* Main Admin Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {adminTab === 'staff' && <StaffManagement />}
        {adminTab === 'payments' && <PaymentsQueue />}
        {adminTab === 'orders' && <OrdersManager />}
        {adminTab === 'products' && <ProductsManager />}
        {adminTab === 'customers' && <CustomersManager />}
        {adminTab === 'audit' && <AuditLogsView />}
        {adminTab === 'settings' && <SettingsManager />}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        AKASH STORE Admin Management System • Operating from Sherpur, Bogura, Bangladesh • Owner: {settings?.ownerName || 'Akash Chondror Roy'}
      </footer>

    </div>
  );
};

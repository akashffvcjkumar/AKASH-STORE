import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, AlertTriangle, UserCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext.js';

interface Forbidden403ScreenProps {
  onBackToHome?: () => void;
  attemptedUrl?: string;
}

export const Forbidden403Screen: React.FC<Forbidden403ScreenProps> = ({
  onBackToHome,
  attemptedUrl = '/admin'
}) => {
  const { currentCustomer, setActiveView } = useStore();

  const handleReturn = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      setActiveView('customer');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-xl w-full bg-slate-900 border-2 border-rose-600/60 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Security Alert Header Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3 text-rose-400 mb-4">
          <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-400 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-widest text-rose-400 font-bold uppercase px-2 py-0.5 bg-rose-950 rounded border border-rose-800">
                HTTP 403 FORBIDDEN
              </span>
              <span className="text-xs text-slate-400 font-mono">RBAC_SECURITY_INTERCEPT</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">Access Blocked by Policy</h1>
          </div>
        </div>

        {/* Detailed Explanation */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300">
              <p className="font-semibold text-rose-300">
                Regular customer accounts are strictly prohibited from accessing the Admin Panel.
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Our strict Role-Based Access Control (RBAC) architecture completely isolates the customer shopping portal from staff administration. Unauthenticated or customer sessions attempting to access <code className="text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded text-xs font-mono">{attemptedUrl}</code> are blocked instantly.
              </p>
            </div>
          </div>

          {currentCustomer && (
            <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">Active Identity:</span>
                <span className="text-white font-medium">{currentCustomer.name}</span>
                <span className="text-slate-400">({currentCustomer.email})</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                ROLE: CUSTOMER
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-end">
          <button
            onClick={handleReturn}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Storefront</span>
          </button>
          <button
            onClick={() => setActiveView('admin_login')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            <Lock className="w-4 h-4" />
            <span>Staff Manual Login Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};

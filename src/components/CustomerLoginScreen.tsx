import React, { useState } from 'react';
import { 
  ShoppingBag, 
  ArrowLeft, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  Lock, 
  User, 
  ExternalLink,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useStore } from '../context/StoreContext.js';

interface CustomerLoginScreenProps {
  onSuccessNavigate?: () => void;
  onCancel?: () => void;
}

export const CustomerLoginScreen: React.FC<CustomerLoginScreenProps> = ({
  onSuccessNavigate,
  onCancel,
}) => {
  const { 
    currentCustomer, 
    loginCustomerWithGoogle, 
    logoutCustomer, 
    showToast,
    setActiveView,
    setTrackingModalOpen
  } = useStore();

  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  // Preset Google test customer profiles
  const presetGoogleAccounts = [
    {
      name: 'Tanvir Hossain',
      email: 'tanvir.hossain.bd@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80',
      googleId: 'g_user_tanvir_98124',
    },
    {
      name: 'Nusrat Jahan',
      email: 'nusrat.jahan.dhaka@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80',
      googleId: 'g_user_nusrat_65213',
    },
    {
      name: 'Rafiqul Islam',
      email: 'rafiqul.islam.ctg@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&q=80',
      googleId: 'g_user_rafiq_33421',
    },
  ];

  const handleGoogleSignIn = async (account: {
    email: string;
    name?: string;
    avatar?: string;
    googleId?: string;
  }) => {
    setIsProcessing(true);
    try {
      const result = await loginCustomerWithGoogle(account);
      if (result.success) {
        showToast(`Signed in with Google as ${account.name || account.email}!`, 'success');
        if (onSuccessNavigate) {
          onSuccessNavigate();
        } else {
          setActiveView('customer');
        }
      } else {
        showToast(result.error || 'Failed to authenticate with Google', 'error');
      }
    } catch {
      showToast('Authentication network error', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      showToast('Please enter a valid Google email address.', 'error');
      return;
    }
    const derivedName = customName.trim() || customEmail.split('@')[0];
    handleGoogleSignIn({
      email: customEmail.trim().toLowerCase(),
      name: derivedName,
      googleId: `g_user_${Date.now()}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white flex flex-col justify-between py-8 px-4 sm:px-6">
      
      {/* Top Bar */}
      <div className="max-w-4xl mx-auto w-full flex justify-between items-center pb-6">
        <button
          onClick={onCancel || (() => setActiveView('customer'))}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Store</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Customer Portal • Route: <code className="font-mono font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">/login</code></span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto w-full">
        
        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-500/20">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Customer Sign In
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Sign in with your Google Account to manage orders, speed up checkout, and save your wishlist across devices.
            </p>
          </div>

          {/* Current Customer State */}
          {currentCustomer ? (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-200 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold overflow-hidden shrink-0">
                  {currentCustomer.avatar ? (
                    <img src={currentCustomer.avatar} alt={currentCustomer.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{currentCustomer.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-emerald-950 truncate">{currentCustomer.name}</div>
                  <div className="text-[11px] text-emerald-700 truncate">{currentCustomer.email}</div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Google OAuth Active</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/70">
                <button
                  onClick={() => {
                    setActiveView('customer');
                    setTrackingModalOpen(true);
                  }}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-emerald-100/50 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>My Orders</span>
                </button>
                <button
                  onClick={() => logoutCustomer()}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              <button
                onClick={() => setActiveView('customer')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Google OAuth 1-Click Fast Sign In */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
                  1-Click Google OAuth Sign-In
                </div>

                <div className="space-y-2">
                  {presetGoogleAccounts.map(account => (
                    <button
                      key={account.email}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleGoogleSignIn(account)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={account.avatar} 
                          alt={account.name} 
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                            {account.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {account.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-100 px-2.5 py-1 rounded-lg">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                        </svg>
                        <span>Sign In</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle manual Google account input */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  {showManualInput ? 'Hide manual Google input' : 'Use a different Google email address'}
                </button>
              </div>

              {showManualInput && (
                <form onSubmit={handleCustomGoogleSubmit} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-700">Enter your Google Email:</div>
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Full Name (optional)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    {isProcessing ? 'Authenticating...' : 'Sign In with this Google Email'}
                  </button>
                </form>
              )}

              {/* Order lookup banner */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span>Looking for an existing order?</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('customer');
                    setTrackingModalOpen(true);
                  }}
                  className="text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                >
                  Track Order
                </button>
              </div>

            </div>
          )}

          {/* Separation of Concerns Callout */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Are you an AKASH STORE staff member?</span>
            </div>
            <button
              onClick={() => {
                setActiveView('admin_login');
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/admin-secure-login');
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-800 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <span>Access Staff Portal</span>
              <code className="font-mono font-normal text-[10px] text-cyan-700 bg-white px-1 py-0.5 rounded">/admin-secure-login</code>
              <ExternalLink className="w-3 h-3" />
            </button>
            <p className="text-[10px] text-slate-400">
              Staff login strictly requires individual corporate email & hashed password credentials.
            </p>
          </div>

        </div>

      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto w-full text-center text-slate-400 text-xs pt-6">
        AKASH STORE • Separate Portal Architecture • Route /login
      </div>

    </div>
  );
};

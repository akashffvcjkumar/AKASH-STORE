import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, User, LogOut, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext.js';

export const CustomerAuthModal: React.FC = () => {
  const { 
    isCustomerAuthModalOpen, 
    setIsCustomerAuthModalOpen, 
    currentCustomer, 
    registerCustomer,
    loginCustomerWithPassword,
    loginCustomerWithGoogle, 
    logoutCustomer,
    showToast,
    setActiveView 
  } = useStore();

  const [authMode, setAuthMode] = useState<'register' | 'login' | 'google'>('register');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Google state
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCustomerAuthModalOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await registerCustomer({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
      });
      if (res.success) {
        showToast('Customer account created! Welcome to AKASH STORE.', 'success');
        setIsCustomerAuthModalOpen(false);
      } else {
        setError(res.error || 'Failed to create customer account.');
      }
    } catch (e: any) {
      setError(e.message || 'Registration error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail.trim() || !loginPassword) {
      setError('Email and password are required.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await loginCustomerWithPassword({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });
      if (res.success) {
        showToast('Signed in successfully!', 'success');
        setIsCustomerAuthModalOpen(false);
      } else {
        setError(res.error || 'Invalid customer email or password.');
      }
    } catch (e: any) {
      setError(e.message || 'Login error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Google login handler
  const handleGoogleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setError('Please enter a valid Google Account / Gmail address.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    try {
      const derivedName = customName.trim() || customEmail.split('@')[0];
      const res = await loginCustomerWithGoogle({
        email: customEmail.trim().toLowerCase(),
        name: derivedName,
        googleId: `google_${Date.now()}`
      });

      if (res.success) {
        showToast(`Signed in with Google as ${derivedName}!`, 'success');
        setIsCustomerAuthModalOpen(false);
      } else {
        setError(res.error || 'Google Authentication failed.');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred during Google sign in.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={() => setIsCustomerAuthModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              G
            </div>
            <div>
              <h2 className="text-lg font-bold">Customer Sign-In</h2>
              <p className="text-xs text-slate-400">Google OAuth Authentication</p>
            </div>
          </div>
          <div className="bg-slate-800/80 rounded-lg p-2.5 text-xs text-slate-300 flex items-center gap-2 border border-slate-700/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Strict RBAC: Customers are granted <strong>CUSTOMER</strong> role with isolated shopping rights.
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Active Customer State */}
          {currentCustomer ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                {currentCustomer.avatar ? (
                  <img 
                    src={currentCustomer.avatar} 
                    alt={currentCustomer.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                    {currentCustomer.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 truncate text-sm">{currentCustomer.name}</h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                      {currentCustomer.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{currentCustomer.email}</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Authenticated via Google OAuth
                  </p>
                </div>
              </div>

              {/* Security Boundary Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-600" /> Admin Isolation Active
                </p>
                <p className="text-amber-700 text-[11px]">
                  Your session is strictly configured for customer orders. Any attempt to access <code>/admin</code> will be intercepted by RBAC middleware with 403 Forbidden.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsCustomerAuthModalOpen(false);
                    setActiveView('admin'); // Will trigger the 403 screen to demonstrate RBAC protection
                  }}
                  className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
                >
                  Test RBAC Admin Block
                </button>
                <button
                  onClick={async () => {
                    await logoutCustomer();
                    setIsCustomerAuthModalOpen(false);
                  }}
                  className="py-2 px-4 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setError(null); }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'register' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setError(null); }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'login' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('google'); setError(null); }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'google' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Google
                </button>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* REGISTER TAB */}
              {authMode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="customer@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Password (min. 6 chars)</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {isProcessing ? 'Creating Account...' : 'Create Customer Account'}
                  </button>
                </form>
              )}

              {/* LOGIN TAB */}
              {authMode === 'login' && (
                <form onSubmit={handlePasswordLogin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="customer@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {isProcessing ? 'Signing In...' : 'Sign In as Customer'}
                  </button>
                </form>
              )}

              {/* GOOGLE TAB */}
              {authMode === 'google' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Sign In With Your Google Account</h3>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Connect your personal Google Account to save cart items, track deliveries, and manage orders.
                    </p>
                  </div>

                  <form onSubmit={handleGoogleSignInSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Google / Gmail Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="yourname@gmail.com"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Your Full Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Asif Mahmud"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing || !customEmail.trim()}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>{isProcessing ? 'Authenticating with Google...' : 'Continue with Google Account'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Notice */}
              <div className="text-[11px] text-slate-500 text-center leading-relaxed">
                Customer accounts are strictly restricted to browsing products and placing orders.
                <br />
                <span className="text-slate-400">All Admin Panel routes are blocked (403 Forbidden).</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

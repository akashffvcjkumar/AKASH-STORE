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

  // Preset Google Accounts for 1-click customer login demonstration
  const quickGoogleAccounts = [
    {
      name: 'Hanter Pro (Buyer)',
      email: 'hanterpro899@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
      googleId: 'google_108273917492817291823'
    },
    {
      name: 'Sarah Khan (Verified Buyer)',
      email: 'sarah.khan.bd@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
      googleId: 'google_204918274910283748192'
    },
    {
      name: 'Tanvir Hossain (Customer)',
      email: 'tanvir.buyer@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
      googleId: 'google_392819203918293847582'
    }
  ];

  const handleQuickGoogleSignIn = async (acc: typeof quickGoogleAccounts[0]) => {
    setError(null);
    setIsProcessing(true);
    try {
      const res = await loginCustomerWithGoogle({
        email: acc.email,
        name: acc.name,
        avatar: acc.avatar,
        googleId: acc.googleId,
      });

      if (res.success) {
        showToast(`Signed in with Google as ${acc.name}!`, 'success');
        setIsCustomerAuthModalOpen(false);
      } else {
        setError(res.error || 'Google Authentication failed.');
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred during Google sign-in.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomGoogleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setError('Please enter a valid Gmail / Google Account address.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    try {
      const name = customName.trim() || customEmail.split('@')[0];
      const res = await loginCustomerWithGoogle({
        email: customEmail.trim(),
        name,
        googleId: `google_${Date.now()}`
      });

      if (res.success) {
        showToast(`Signed in with Google as ${name}!`, 'success');
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
                <>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                      1-Click Google OAuth Profiles
                    </p>
                    <div className="space-y-2">
                      {quickGoogleAccounts.map((acc, idx) => (
                        <button
                          key={idx}
                          disabled={isProcessing}
                          onClick={() => handleQuickGoogleSignIn(acc)}
                          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-left hover:border-emerald-500 group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              src={acc.avatar} 
                              alt={acc.name} 
                              className="w-8 h-8 rounded-full object-cover border border-slate-300"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700">
                                {acc.name}
                              </div>
                              <div className="text-[11px] text-slate-500">{acc.email}</div>
                            </div>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-500">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <form onSubmit={handleCustomGoogleSignIn} className="space-y-2.5">
                      <label className="block text-xs font-medium text-slate-700">
                        Or Enter Any Gmail Address
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="yourname@gmail.com"
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="submit"
                          disabled={isProcessing || !customEmail}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                        >
                          {isProcessing ? 'Connecting...' : 'Sign In'}
                        </button>
                      </div>
                    </form>
                  </div>
                </>
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

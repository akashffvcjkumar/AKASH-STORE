/**
 * AKASH STORE - Admin & Staff Secure Login Screen
 * 
 * Architecture:
 * 1. Store Owner / Main Manager Login:
 *    The Store Owner logs in with their credentials. From inside the Admin Panel (Staff Management),
 *    the Owner creates unique IDs, roles, and passwords for Admins, Order Managers, Inventory Managers, and Staff.
 * 2. Staff / Employee Login:
 *    Employees log in with the credentials created and assigned to them by the Store Owner.
 * 
 * - Strictly NO hardcoded credentials in input fields (fields are clean and empty).
 * - Strictly NO dummy test user buttons or preset quick-fill cards.
 * - Secure Room Database verification with role-based access control (RBAC).
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Fingerprint,
  RefreshCw,
  Eye,
  EyeOff,
  Database,
  Crown,
  Briefcase
} from 'lucide-react';
import { useAuthentication } from '../../viewmodels/useAuthentication.js';
import { useStore } from '../../context/StoreContext.js';
import { UserRole } from '../../database/entities.js';

interface AdminLoginScreenProps {
  onSuccessNavigate?: () => void;
  onCancel?: () => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  onSuccessNavigate,
  onCancel,
}) => {
  const { state: authState, signIn, signInWithCredentialManager, validateRoleClaimForAdminRoute } = useAuthentication();
  const { setActiveView, showToast, settings, currentCustomer, logoutCustomer, loginStaff } = useStore();

  // Login Mode: Store Owner/Manager vs. Staff/Employee
  const [loginMode, setLoginMode] = useState<'MANAGER' | 'STAFF'>('MANAGER');

  // Input fields start completely empty - NO pre-filled credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saveInCredentialManager, setSaveInCredentialManager] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [roleClaimDiagnostic, setRoleClaimDiagnostic] = useState<{
    tested: boolean;
    valid: boolean;
    role?: UserRole;
    reason?: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset inputs when switching login modes
  const handleSwitchMode = (mode: 'MANAGER' | 'STAFF') => {
    setLoginMode(mode);
    setEmail('');
    setPassword('');
    setLocalError(null);
    setRoleClaimDiagnostic(null);
  };

  // Clear errors when typing
  useEffect(() => {
    setLocalError(null);
  }, [email, password]);

  // Handle Form Submission
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLocalError(null);
    setRoleClaimDiagnostic(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError(loginMode === 'MANAGER' 
        ? 'Please enter the Store Owner / Manager email or ID.' 
        : 'Please enter your staff email or ID assigned by your manager.');
      return;
    }

    if (!password) {
      setLocalError('Please enter your account password.');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Authenticate via AuthenticationViewModel + UserRepository
      const authResult = await signIn(trimmedEmail, password, {
        saveCredential: saveInCredentialManager,
      });

      if (!authResult.success || !authResult.user) {
        setLocalError(authResult.error || 'ভুল ইমেইল অথবা পাসওয়ার্ড প্রদান করা হয়েছে। অনুগ্রহ করে সঠিক তথ্য দিয়ে চেষ্টা করুন।');
        setIsProcessing(false);
        return;
      }

      // Check if account status is DISABLED
      if (authResult.user.status === 'DISABLED') {
        setLocalError('আপনার অ্যাকাউন্টের মেয়াদ শেষ বা আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে। অনুগ্রহ করে ম্যানেজারের সাথে যোগাযোগ করুন। (Account Expired / Disabled by Manager)');
        setIsProcessing(false);
        return;
      }

      // Step 2: SECURE LOGIC LAYER - Validate user's role claim against Room User Database
      const claimCheck = await validateRoleClaimForAdminRoute();

      if (!claimCheck.allowed) {
        setRoleClaimDiagnostic({
          tested: true,
          valid: false,
          role: claimCheck.role,
          reason: claimCheck.reason,
        });
        setLocalError(claimCheck.reason || 'প্রবেশাধিকার সংরক্ষিত: আপনার অ্যাকাউন্টে ম্যানেজমেন্ট প্যানেলে প্রবেশের অনুমতি নেই।');
        setIsProcessing(false);
        return;
      }

      // Verify role alignment with selected portal mode
      if (loginMode === 'MANAGER' && claimCheck.role !== 'SUPER_ADMIN') {
        setRoleClaimDiagnostic({
          tested: true,
          valid: false,
          role: claimCheck.role,
          reason: 'প্রবেশাধিকার সংরক্ষিত: শুধুমাত্র প্রধান ম্যানেজার (akashchondroroy@protonmail.com) এই পোর্টালে লগইন করতে পারবেন।',
        });
        setLocalError('প্রবেশাধিকার সংরক্ষিত: শুধুমাত্র স্টোর ওনার / প্রধান ম্যানেজার (akashchondroroy@protonmail.com) এই পোর্টালে লগইন করতে পারবেন। স্টাফ বা অ্যাডমিনরা অনুগ্রহ করে Staff / Employee পোর্টালে লগইন করুন।');
        setIsProcessing(false);
        return;
      } else {
        setRoleClaimDiagnostic({
          tested: true,
          valid: true,
          role: claimCheck.role,
          reason: `Role validated against Room Database: '${claimCheck.role}' authorized.`,
        });
      }

      // Sync session with StoreContext
      await loginStaff(trimmedEmail, password);

      showToast(`Welcome back, ${authResult.user.name} (${claimCheck.role})!`, 'success');

      setTimeout(() => {
        setIsProcessing(false);
        if (onSuccessNavigate) {
          onSuccessNavigate();
        } else {
          setActiveView('admin');
        }
      }, 500);

    } catch (err: any) {
      setLocalError(err.message || 'An unexpected authentication error occurred.');
      setIsProcessing(false);
    }
  };

  // Handle Credential Manager One-Click Sign In (if saved by user)
  const handleCredentialManagerSignIn = async () => {
    setLocalError(null);
    setRoleClaimDiagnostic(null);
    setIsProcessing(true);

    try {
      const result = await signInWithCredentialManager();

      if (!result.success || !result.user) {
        setLocalError(result.error || 'No saved credentials found in Credential Manager.');
        setIsProcessing(false);
        return;
      }

      // Validate role claim against Room DB
      const claimCheck = await validateRoleClaimForAdminRoute();
      if (!claimCheck.allowed) {
        setRoleClaimDiagnostic({
          tested: true,
          valid: false,
          role: claimCheck.role,
          reason: claimCheck.reason,
        });
        setLocalError(claimCheck.reason || 'Access Denied: Credential role rejected.');
        setIsProcessing(false);
        return;
      }

      showToast(`Identity verified for ${result.user.name} (${result.user.role}).`, 'success');

      setTimeout(() => {
        setIsProcessing(false);
        if (onSuccessNavigate) {
          onSuccessNavigate();
        } else {
          setActiveView('admin');
        }
      }, 400);

    } catch (err: any) {
      setLocalError(err.message || 'Credential Manager error.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background visual accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-950/40 via-slate-950 to-transparent pointer-events-none" />
      <div className="absolute -top-24 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Return to Storefront button */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => {
              if (onCancel) onCancel();
              else setActiveView('customer');
            }}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-900 border border-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Room DB Active</span>
          </div>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 shadow-xl mb-1">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {settings?.storeName || 'AKASH STORE'}
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Management & Staff Authentication System with Role-Based Access Control
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md py-8 px-4 sm:px-10 rounded-2xl shadow-2xl space-y-6">
          
          {/* Customer Detection & Route Separation Notice */}
          {currentCustomer && (
            <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Customer Google Account Detected ({currentCustomer.name})</span>
              </div>
              <p className="text-[11px] text-rose-200/80 leading-relaxed">
                This portal is strictly reserved for store managers and authorized employees. Customer accounts cannot access administration privileges.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveView('customer')}
                  className="px-3 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Return to Storefront
                </button>
                <button
                  type="button"
                  onClick={() => logoutCustomer()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Sign Out of Customer
                </button>
              </div>
            </div>
          )}

          {/* TWO SEPARATE PORTAL MODES: MANAGER vs. STAFF */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleSwitchMode('MANAGER')}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                loginMode === 'MANAGER'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Owner / Manager</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchMode('STAFF')}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                loginMode === 'STAFF'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4 text-cyan-200" />
              <span>Staff / Employee</span>
            </button>
          </div>

          {/* Portal Information Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
            {loginMode === 'MANAGER' ? (
              <>
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Crown className="w-4 h-4 text-amber-300" />
                  <span>Store Owner / Primary Manager Portal</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Log in with your Store Owner credentials. Once logged in, you can manage orders, products, and <strong>create/assign IDs and passwords for all Admins and Staff</strong> from the Staff Management section.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 font-bold text-cyan-400">
                  <Briefcase className="w-4 h-4 text-cyan-300" />
                  <span>Assigned Staff & Employee Portal</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Log in using the individual account credentials created and assigned to you by the Store Owner / Manager.
                </p>
              </>
            )}
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Email / ID field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {loginMode === 'MANAGER' ? 'Manager Email / ID' : 'Staff Email / ID'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={loginMode === 'MANAGER' ? 'akashchondroroy@protonmail.com' : 'employee@akashstore.com'}
                  autoComplete="username"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-inner transition-all"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <span className="text-[10px] text-slate-500">Encrypted Room DB Verification</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  autoComplete="current-password"
                  className="block w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-inner transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember with Credential Manager checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={saveInCredentialManager}
                  onChange={(e) => setSaveInCredentialManager(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span>Save session to device Credential Manager</span>
              </label>

              {authState.isCredentialManagerSupported && (
                <button
                  type="button"
                  onClick={handleCredentialManagerSignIn}
                  disabled={isProcessing}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>Passkey Login</span>
                </button>
              )}
            </div>

            {/* Error Message */}
            {localError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="space-y-1">
                  <p className="font-bold">Authentication Failed</p>
                  <p className="text-[11px] text-rose-300 leading-relaxed">{localError}</p>
                </div>
              </div>
            )}

            {/* Role Claim Diagnostic Feedback */}
            {roleClaimDiagnostic && (
              <div className={`p-3 rounded-xl text-xs border flex items-start gap-2.5 ${
                roleClaimDiagnostic.valid 
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' 
                  : 'bg-amber-950/80 border-amber-800 text-amber-300'
              }`}>
                {roleClaimDiagnostic.valid ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                )}
                <div className="space-y-0.5">
                  <span className="font-bold block">
                    {roleClaimDiagnostic.valid ? 'Role Claim Verified' : 'Role Claim Notice'}
                  </span>
                  <p className="text-[11px] leading-relaxed">{roleClaimDiagnostic.reason}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 ${
                loginMode === 'MANAGER'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-cyan-600 hover:bg-cyan-500'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>
                    {loginMode === 'MANAGER' ? 'Sign In as Store Owner / Manager' : 'Sign In as Staff Member'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Security Compliance Footer Note */}
        <div className="mt-6 text-center text-[11px] text-slate-500 space-y-1">
          <p>Strict RBAC Policy Enforced • Individual Credentials Only</p>
          <p>Store Owner creates and assigns all employee accounts in Staff Management</p>
        </div>
      </div>

    </div>
  );
};

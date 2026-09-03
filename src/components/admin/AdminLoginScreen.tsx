/**
 * AKASH STORE - Admin Login Screen
 * 
 * Features:
 * - Web Credential Manager API integration (navigator.credentials)
 * - Secure Logic Layer validating Role Claims against the Room User Database before navigating to /admin
 * - Role distinction between Customer and Staff roles
 * - Individual staff credentials (strictly no shared admin logins)
 * - Visual diagnostics and test accounts for negative & positive role claim validation
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Key, 
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
  Cpu
} from 'lucide-react';
import { useAuthentication } from '../../viewmodels/useAuthentication.js';
import { useStore } from '../../context/StoreContext.js';
import { StaffRole, UserRole } from '../../database/entities.js';

interface AdminLoginScreenProps {
  onSuccessNavigate?: () => void;
  onCancel?: () => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  onSuccessNavigate,
  onCancel,
}) => {
  const { state: authState, signIn, signInWithCredentialManager, validateRoleClaimForAdminRoute } = useAuthentication();
  const { setActiveView, showToast, settings, currentCustomer, logoutCustomer } = useStore();

  const [email, setEmail] = useState('akashchondroroy@protonmail.com');
  const [password, setPassword] = useState('@Akash5051');
  const [showPassword, setShowPassword] = useState(false);
  const [saveInCredentialManager, setSaveInCredentialManager] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [roleClaimDiagnostic, setRoleClaimDiagnostic] = useState<{
    tested: boolean;
    valid: boolean;
    role?: UserRole;
    reason?: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Clear errors when inputs change
  useEffect(() => {
    setLocalError(null);
  }, [email, password]);

  // Handle Form Submission
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLocalError(null);
    setRoleClaimDiagnostic(null);

    if (!email.trim()) {
      setLocalError('Please enter your individual staff email address.');
      return;
    }

    if (!password) {
      setLocalError('Please enter your account password.');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Authenticate via AuthenticationViewModel + UserRepository
      const authResult = await signIn(email.trim(), password, {
        saveCredential: saveInCredentialManager,
      });

      if (!authResult.success || !authResult.user) {
        setLocalError(authResult.error || 'Authentication failed. Please verify your credentials.');
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
        setLocalError(claimCheck.reason || 'Access Denied: Role claim not authorized for /admin route.');
        setIsProcessing(false);
        return;
      }

      // Step 3: Success! Role claim verified in Room DB. Navigate to /admin
      setRoleClaimDiagnostic({
        tested: true,
        valid: true,
        role: claimCheck.role,
        reason: `Role claim validated against Room Database: '${claimCheck.role}' authorized for /admin route.`,
      });

      showToast(`Authenticated as ${authResult.user.name} (${claimCheck.role}). Access granted to /admin.`, 'success');

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

  // Handle Credential Manager One-Click Sign In
  const handleCredentialManagerSignIn = async () => {
    setLocalError(null);
    setRoleClaimDiagnostic(null);
    setIsProcessing(true);

    try {
      const result = await signInWithCredentialManager();

      if (!result.success || !result.user) {
        setLocalError(result.error || 'Credential Manager was unable to authenticate this session.');
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
        setLocalError(claimCheck.reason || 'Access Denied: Credential role claim rejected.');
        setIsProcessing(false);
        return;
      }

      showToast(`Credential Manager verified identity for ${result.user.name} (${result.user.role}).`, 'success');

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

  // Quick Select Accounts for Evaluation & Testing
  const selectAccount = (accountEmail: string, accountPass: string, roleName: string) => {
    setEmail(accountEmail);
    setPassword(accountPass);
    setLocalError(null);
    setRoleClaimDiagnostic(null);
    showToast(`Loaded account for ${roleName}. Click "Authenticate" to verify.`, 'info');
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
            Admin & Staff Authentication System with Role-Based Access Control (RBAC)
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
                This route (<code className="font-mono text-rose-300">/admin-secure-login</code>) is strictly restricted to Super Admins, Admins, and Employees. Customer Google OAuth accounts are completely barred from accessing admin privileges.
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

          {/* Credential Manager Banner & Quick Action */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Credential Manager</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Web API Ready
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Authenticate seamlessly using device passkey, stored PasswordCredential, or platform authenticator.
            </p>

            <button
              type="button"
              onClick={handleCredentialManagerSignIn}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4" />
              <span>Sign In with Credential Manager</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider">
              Or individual staff credentials
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff Email Address
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
                  placeholder="employee@akashstore.com"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono shadow-inner"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <span className="text-[10px] text-slate-500">Individual identity protected</span>
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
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono shadow-inner"
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
                <span>Save credentials to Credential Manager</span>
              </label>
            </div>

            {/* Error Message */}
            {localError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="space-y-1">
                  <p className="font-bold">Authentication Rejected</p>
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
                    {roleClaimDiagnostic.valid ? 'Role Claim Verified' : 'Role Claim Verification Notice'}
                  </span>
                  <p className="text-[11px] leading-relaxed">{roleClaimDiagnostic.reason}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating Role Claim against Room DB...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Enter /admin Route</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Test Accounts & Role Claim Evaluation Suite */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test Role Claim Validation</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Room DAO Verified</span>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight">
              Click an individual account below to verify role-based access control and security claim enforcement:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              
              {/* Super Admin */}
              <button
                type="button"
                onClick={() => selectAccount('akashchondroroy@protonmail.com', '@Akash5051', 'Super Admin')}
                className="p-2 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] font-extrabold text-purple-300">SUPER_ADMIN</div>
                <div className="text-[10px] text-slate-300 truncate">Akash (Owner)</div>
              </button>

              {/* Order Manager */}
              <button
                type="button"
                onClick={() => selectAccount('rahim@akashstore.com', 'rahim123456', 'Order Manager')}
                className="p-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] font-extrabold text-amber-300">ORDER_MANAGER</div>
                <div className="text-[10px] text-slate-300 truncate">Rahim Ahmed</div>
              </button>

              {/* Inventory Manager */}
              <button
                type="button"
                onClick={() => selectAccount('selim@akashstore.com', 'inventory123', 'Inventory Manager')}
                className="p-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] font-extrabold text-emerald-300">INVENTORY_MGR</div>
                <div className="text-[10px] text-slate-300 truncate">Selim Reza</div>
              </button>

              {/* Admin */}
              <button
                type="button"
                onClick={() => selectAccount('tariqul@akashstore.com', 'admin123456', 'Admin')}
                className="p-2 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/60 text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] font-extrabold text-blue-300">ADMIN</div>
                <div className="text-[10px] text-slate-300 truncate">Tariqul Islam</div>
              </button>

              {/* Support Agent */}
              <button
                type="button"
                onClick={() => selectAccount('nusrat@akashstore.com', 'nusrat123', 'Support Agent')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] font-extrabold text-slate-300">SUPPORT_AGENT</div>
                <div className="text-[10px] text-slate-300 truncate">Nusrat Jahan</div>
              </button>

              {/* Customer Account - Tests Negative Role Claim Validation */}
              <button
                type="button"
                onClick={() => selectAccount('tanvir.customer@gmail.com', 'custpass123', 'Customer (Negative Test)')}
                className="p-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800 text-left transition-colors cursor-pointer"
                title="Tests rejection of CUSTOMER role attempting to navigate to /admin"
              >
                <div className="text-[10px] font-extrabold text-rose-300">CUSTOMER (TEST)</div>
                <div className="text-[10px] text-rose-200 truncate">Reject /admin</div>
              </button>

            </div>
          </div>

        </div>

        {/* Security Compliance Footer Note */}
        <div className="mt-6 text-center text-[11px] text-slate-500 space-y-1">
          <p>Strict RBAC Policy Enforced • Shared admin accounts are strictly prohibited</p>
          <p>All authentication events and role checks are logged to the Room Audit Trail</p>
        </div>
      </div>

    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext.js';
import { AdminLayout } from './AdminLayout.js';
import { AdminLoginScreen } from './AdminLoginScreen.js';
import { Forbidden403Screen } from './Forbidden403Screen.js';
import { isStaffRole, UserRole } from '../../types.js';

interface AdminRouteGuardProps {
  children?: React.ReactNode;
}

/**
 * Frontend Route Protection Layer:
 * 
 * Strict RBAC Rule:
 * 1. If a user with the CUSTOMER role tries to access any /admin URL or component,
 *    instantly block them by rendering the 403 Forbidden Screen or redirecting to home.
 * 2. If unauthenticated, redirect/render the manual AdminLoginScreen.
 * 3. Ensure that ONLY users with valid staff roles (SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE, etc.)
 *    can render the Admin Panel components and trigger backend admin APIs.
 */
export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { currentStaff, currentCustomer, token, setActiveView, showToast } = useStore();
  const [isVerifying, setIsVerifying] = useState(false);

  // 1. CRITICAL: If active user is identified as a CUSTOMER, block instantly with 403 Forbidden!
  if (currentCustomer && currentCustomer.role === 'CUSTOMER' && !currentStaff) {
    return (
      <Forbidden403Screen 
        attemptedUrl="/admin" 
        onBackToHome={() => setActiveView('customer')} 
      />
    );
  }

  // 2. If no valid staff session token exists, display the Staff Manual Login Screen
  if (!token || !currentStaff) {
    return (
      <AdminLoginScreen 
        onSuccessNavigate={() => setActiveView('admin')}
        onCancel={() => setActiveView('customer')}
      />
    );
  }

  // 3. Verify user's staff role claim
  if (!isStaffRole(currentStaff.role) || currentStaff.role === 'CUSTOMER') {
    return (
      <Forbidden403Screen 
        attemptedUrl="/admin" 
        onBackToHome={() => setActiveView('customer')} 
      />
    );
  }

  // 4. If staff account is disabled, block access
  if (currentStaff.status === 'DISABLED') {
    return (
      <Forbidden403Screen 
        attemptedUrl="/admin" 
        onBackToHome={() => setActiveView('customer')} 
      />
    );
  }

  // 5. Authorized Staff! Render the Admin Panel
  return children ? <>{children}</> : <AdminLayout />;
};

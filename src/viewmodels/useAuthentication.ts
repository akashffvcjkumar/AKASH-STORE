/**
 * React Hook for AuthenticationViewModel
 */

import { useState, useEffect } from 'react';
import { AuthenticationViewModel, AuthState } from './AuthenticationViewModel.js';

// Singleton instance across the application
let globalAuthViewModel: AuthenticationViewModel | null = null;

export function getAuthenticationViewModel(): AuthenticationViewModel {
  if (!globalAuthViewModel) {
    globalAuthViewModel = new AuthenticationViewModel();
  }
  return globalAuthViewModel;
}

export function useAuthentication() {
  const viewModel = getAuthenticationViewModel();
  const [authState, setAuthState] = useState<AuthState>(viewModel.getState());

  useEffect(() => {
    const unsubscribe = viewModel.subscribe((newState) => {
      setAuthState(newState);
    });
    return () => unsubscribe();
  }, [viewModel]);

  return {
    state: authState,
    signIn: (email: string, pass: string, opts?: { saveCredential?: boolean }) => 
      viewModel.signIn(email, pass, opts),
    signInWithCredentialManager: () => 
      viewModel.signInWithCredentialManager(),
    validateRoleClaimForAdminRoute: () => 
      viewModel.validateRoleClaimForAdminRoute(),
    signOut: () => 
      viewModel.signOut(),
    switchAccountByRole: (role: any) => 
      viewModel.switchAccountByRole(role),
  };
}

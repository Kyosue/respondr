import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { ResilientAuthService } from '@/firebase/resilientAuth';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: authLogin } = useAuth();
  const authService = ResilientAuthService.getInstance();
  const { isOnline, isSlowConnection } = useNetwork();

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Sign in with resilient authentication service
      const userData = await authService.signInUser(email, password);
      
      // Update auth context
      authLogin(userData);

      return true;
    } catch (err: unknown) {
      let errorMessage = 'Login failed';
      
      // Handle Firebase specific errors
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password';
            break;
          default:
            errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        // Handle custom errors (like deactivated, suspended, or pending activation)
        // Pass through the error message from ResilientAuthService
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.signOutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    login,
    logout,
    isLoading,
    error,
    clearError,
  };
}
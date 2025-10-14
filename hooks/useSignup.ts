import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { UserType } from '@/firebase/auth';
import { ResilientAuthService } from '@/firebase/resilientAuth';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';

export function useSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const authService = ResilientAuthService.getInstance();
  const { isOnline, isSlowConnection } = useNetwork();

  const signup = async (
    fullName: string, 
    displayName: string,
    email: string, 
    password: string, 
    userType: string,
    status: string = 'active'
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!fullName || !displayName || !email || !password || !userType) {
        throw new Error('All fields are required');
      }

      // Register user with resilient authentication service
      const userData = await authService.registerUser(
        email,
        password,
        fullName,
        displayName,
        userType as UserType,
        status as any // Status will be added to userData
      );
      
      // Update auth context
      login(userData);

      return true;
    } catch (err: unknown) {
      let errorMessage = 'Signup failed';
      
      // Handle Firebase specific errors
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Email already registered';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak';
            break;
          default:
            errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    signup,
    isLoading,
    error,
    clearError,
  };
}
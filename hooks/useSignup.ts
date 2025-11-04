import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { createUserSelfSignup } from '@/firebase/functions';
import { ResilientAuthService } from '@/firebase/resilientAuth';
import { UserType } from '@/types/UserType';
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
    userType?: UserType,
    status?: 'active' | 'inactive'
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!fullName || !displayName || !email || !password) {
        throw new Error('All fields are required');
      }

      // If userType or status is provided, this is an admin-created user
      // Use the old method for admin-created users (for now)
      if (userType || (status && status !== 'inactive')) {
        // Register user with resilient authentication service (admin-created users)
        const userData = await authService.registerUser(
          email,
          password,
          fullName,
          displayName,
          userType // Pass userType if provided (for admin-created users)
        );
        
        // If status is provided (for admin-created users), update it
        if (status && status !== 'inactive') {
          await authService.updateUserData(userData.id, { status });
        }
      } else {
        // Self-signup: Use Cloud Function
        // This creates the user without signing them in and sets status to 'inactive'
        await createUserSelfSignup({
          email: email.trim(),
          password: password,
          fullName: fullName.trim(),
          displayName: displayName.trim(),
        });
      }

      return true;
    } catch (err: unknown) {
      let errorMessage = 'Signup failed';
      
      // Handle Firebase Functions errors (from Cloud Function)
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err instanceof FirebaseError) {
        // Handle Firebase Auth errors (for admin-created users fallback)
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
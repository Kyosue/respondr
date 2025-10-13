import { UserData } from '@/firebase/auth';
import { auth } from '@/firebase/config';
import { ResilientAuthService } from '@/firebase/resilientAuth';
import * as SecureStore from 'expo-secure-store';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useNetwork } from './NetworkContext';

interface AuthContextType {
  user: UserData | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: UserData) => void;
  logout: () => Promise<void>;
  updateUserData: (userData: UserData) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Platform-specific storage functions
const setUserData = async (userData: UserData) => {
  try {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      localStorage.setItem('userData', JSON.stringify(userData));
    } else {
      // Use SecureStore for mobile platforms
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
    }
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

const getUserData = async (): Promise<UserData | null> => {
  try {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      const data = localStorage.getItem('userData');
      return data ? JSON.parse(data) : null;
    } else {
      // Use SecureStore for mobile platforms
      const data = await SecureStore.getItemAsync('userData');
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

const clearUserData = async () => {
  try {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      localStorage.removeItem('userData');
    } else {
      // Use SecureStore for mobile platforms
      await SecureStore.deleteItemAsync('userData');
    }
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const authService = ResilientAuthService.getInstance();
  const { isOnline } = useNetwork();

  // Check for existing auth state on mount
  useEffect(() => {
    // Set initial loading state
    setIsLoading(true);
    
    let authStateResolved = false;
    
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        console.log('🔍 Auth state changed:', { 
          hasFirebaseUser: !!fbUser, 
          platform: Platform.OS,
          authStateResolved 
        });
        
        if (fbUser) {
          // User is signed in
          setFirebaseUser(fbUser);
          
          // Get user data with offline support
          const userData = await authService.getCurrentUserData(fbUser);
          
          if (userData) {
            console.log('🔍 User data loaded:', { userId: userData.id, fullName: userData.fullName });
            setUser(userData);
            // Store user data using platform-specific storage
            await setUserData(userData);
          }
        } else {
          // User is signed out
          console.log('🔍 User signed out');
          setFirebaseUser(null);
          setUser(null);
          // Clear storage
          await clearUserData();
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        // Only set loading to false after Firebase auth state is determined
        if (!authStateResolved) {
          authStateResolved = true;
          console.log('🔍 Setting loading to false');
          setIsLoading(false);
        }
      }
    });

    // Set a timeout to ensure loading state is reset even if Firebase is slow
    const timeoutId = setTimeout(() => {
      if (!authStateResolved) {
        authStateResolved = true;
        setIsLoading(false);
      }
    }, 2000); // Increased timeout to 2 seconds

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const login = (userData: UserData) => {
    setUser(userData);
    // Store user data using platform-specific storage
    setUserData(userData);
  };

  const logout = async () => {
    try {
      await authService.signOutUser();
      setUser(null);
      setFirebaseUser(null);
      // Clear storage
      await clearUserData();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUserData = (userData: UserData) => {
    setUser(userData);
    // Update storage using platform-specific storage
    setUserData(userData);
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
import {
  AUTH_RESTORE_TIMEOUT_MS,
  AUTH_RESTORE_TIMEOUT_WITH_CACHE_MS,
} from '@/constants/authConstants';
import { UserData } from '@/firebase/auth';
import { auth } from '@/firebase/config';
import { ResilientAuthService } from '@/firebase/resilientAuth';
import * as SecureStore from 'expo-secure-store';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
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

  // Check for existing auth state on mount (persistent login: wait for Firebase + cache).
  // Single source of truth for loading: only this effect sets isLoading to false (on Firebase callback or timeout).
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsLoading(true);
    let authStateResolved = false;

    const resolveLoading = () => {
      if (!authStateResolved) {
        authStateResolved = true;
        setIsLoading(false);
      }
    };

    // Load cached user first; then set a single timeout (longer if cache exists).
    const loadCachedUser = async (): Promise<UserData | null> => {
      try {
        const cachedUser = await getUserData();
        if (cachedUser) {
          setUser(cachedUser);
        }
        return cachedUser;
      } catch (error) {
        return null;
      }
    };

    loadCachedUser().then((cachedUser) => {
      const timeoutMs = cachedUser
        ? AUTH_RESTORE_TIMEOUT_WITH_CACHE_MS
        : AUTH_RESTORE_TIMEOUT_MS;
      timeoutIdRef.current = setTimeout(resolveLoading, timeoutMs);
    });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          setFirebaseUser(fbUser);
          const userData = await authService.getCurrentUserData(fbUser);
          if (userData) {
            setUser(userData);
            await setUserData(userData);
          }
        } else {
          setFirebaseUser(null);
          setUser(null);
          await clearUserData();
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        resolveLoading();
      }
    });

    return () => {
      unsubscribe();
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
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
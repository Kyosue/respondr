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

const getUserData = async (expectedUserId?: string): Promise<UserData | null> => {
  try {
    let data: string | null = null;
    if (Platform.OS === 'web') {
      data = localStorage.getItem('userData');
    } else {
      data = await SecureStore.getItemAsync('userData');
    }
    if (!data) {
      return null;
    }
    const parsed = JSON.parse(data) as UserData;
    if (expectedUserId && parsed.id !== expectedUserId) {
      return null;
    }
    return parsed;
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

    // Read cache only to tune restore timeout — do not set user until Firebase confirms session
    const loadCachedUser = async (): Promise<UserData | null> => {
      try {
        return await getUserData();
      } catch (error) {
        return null;
      }
    };

    loadCachedUser().then((cachedUser) => {
      const timeoutMs = cachedUser
        ? AUTH_RESTORE_TIMEOUT_WITH_CACHE_MS
        : AUTH_RESTORE_TIMEOUT_MS;
      timeoutIdRef.current = setTimeout(() => {
        // Firebase may still be restoring a persisted session — don't end loading early
        if (auth.currentUser) {
          return;
        }
        resolveLoading();
      }, timeoutMs);
    });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          setFirebaseUser(fbUser);

          // Drop stale profile cache from a different account
          const anyCachedUser = await getUserData();
          if (anyCachedUser && anyCachedUser.id !== fbUser.uid) {
            await clearUserData();
            await authService.clearLocalUserCache();
          }

          // Restore matching profile immediately so refresh does not log the user out
          const cachedForUid = await getUserData(fbUser.uid);
          if (cachedForUid) {
            setUser(cachedForUid);
          }

          try {
            const userData = await authService.getCurrentUserData(fbUser);
            if (userData && userData.id === fbUser.uid) {
              setUser(userData);
              await setUserData(userData);
              await authService.cacheUserProfile(userData);
            } else if (!cachedForUid) {
              setUser(null);
            }
          } catch (error) {
            console.error('Failed to refresh user profile:', error);
            if (!cachedForUid) {
              setUser(null);
            }
          }
        } else {
          setFirebaseUser(null);
          setUser(null);
          await clearUserData();
          await authService.clearLocalUserCache();
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        if (!auth.currentUser) {
          setUser(null);
          await clearUserData();
        }
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
    setUserData(userData);
    void authService.cacheUserProfile(userData);
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
    setUserData(userData);
    void authService.cacheUserProfile(userData);
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    isAuthenticated: !!(firebaseUser ?? user),
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
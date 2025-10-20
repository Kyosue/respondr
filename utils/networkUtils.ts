import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  strength?: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

export class NetworkManager {
  private static instance: NetworkManager;
  private networkState: NetworkState | null = null;
  private listeners: Set<(state: NetworkState) => void> = new Set();

  private constructor() {
    this.initializeNetworkMonitoring();
  }

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  private initializeNetworkMonitoring() {
    NetInfo.addEventListener(state => {
      this.networkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        strength: (state.details as any)?.strength,
      };
      
      this.notifyListeners();
    });
  }

  subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    if (this.networkState) {
      this.listeners.forEach(listener => listener(this.networkState!));
    }
  }

  getCurrentState(): NetworkState | null {
    return this.networkState;
  }

  isOnline(): boolean {
    return this.networkState?.isConnected === true && 
           this.networkState?.isInternetReachable === true;
  }

  isSlowConnection(): boolean {
    if (!this.networkState) return false;
    
    // Consider 2G or cellular with low strength as slow
    return this.networkState.type === 'cellular' && 
           (this.networkState.strength === undefined || this.networkState.strength < 2);
  }

  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.networkState = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      strength: (state.details as any)?.strength,
    };
    
    this.notifyListeners();
    return this.isOnline();
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  context: string = 'operation'
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry authentication errors
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code;
        if (errorCode && (
          errorCode.includes('auth/invalid-credential') ||
          errorCode.includes('auth/user-not-found') ||
          errorCode.includes('auth/wrong-password') ||
          errorCode.includes('auth/user-disabled') ||
          errorCode.includes('auth/invalid-email')
        )) {
          console.error(`${context} failed with auth error (not retrying):`, error);
          throw lastError;
        }
      }
      
      if (attempt === config.maxRetries) {
        console.error(`${context} failed after ${config.maxRetries + 1} attempts:`, error);
        throw lastError;
      }
      
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );
      
      console.warn(`${context} attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('unreachable') ||
    errorCode.includes('network') ||
    errorCode.includes('timeout') ||
    errorCode.includes('unavailable') ||
    error.name === 'FirebaseError' && (
      errorCode.includes('unavailable') ||
      errorCode.includes('timeout') ||
      errorCode.includes('network')
    )
  );
}

export function showNetworkAlert(isOnline: boolean, isSlow: boolean = false) {
  if (!isOnline) {
    Alert.alert(
      'No Internet Connection',
      'Please check your internet connection and try again. Some features may be limited while offline.',
      [{ text: 'OK' }]
    );
  } else if (isSlow) {
    Alert.alert(
      'Slow Connection Detected',
      'Your connection appears to be slow. Some features may take longer to load.',
      [{ text: 'OK' }]
    );
  }
}

import { NetworkManager, NetworkState } from '@/utils/networkUtils';
import { SyncManager } from '@/utils/syncManager';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface NetworkContextType {
  isOnline: boolean;
  isSlowConnection: boolean;
  networkState: NetworkState | null;
  isSyncing: boolean;
  pendingOperationsCount: number;
  lastSyncTime: number | null;
  retryConnection: () => Promise<boolean>;
  forceSync: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [networkState, setNetworkState] = useState<NetworkState | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOperationsCount, setPendingOperationsCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const networkManager = NetworkManager.getInstance();
  const syncManager = SyncManager.getInstance();

  useEffect(() => {
    // Initialize network state
    const initializeNetwork = async () => {
      const isConnected = await networkManager.checkConnection();
      setIsOnline(isConnected);
      setIsSlowConnection(networkManager.isSlowConnection());
    };

    initializeNetwork();

    // Subscribe to network changes
    const unsubscribe = networkManager.subscribe((state) => {
      setNetworkState(state);
      setIsOnline(state.isConnected && state.isInternetReachable === true);
      setIsSlowConnection(networkManager.isSlowConnection());
    });

    // Start auto-sync
    const unsubscribeSync = syncManager.startAutoSync();

    // Update sync status periodically
    const updateSyncStatus = async () => {
      try {
        const status = await syncManager.getSyncStatus();
        setIsSyncing(status.isSyncing);
        setPendingOperationsCount(status.pendingOperationsCount);
        setLastSyncTime(status.lastSyncTime);
      } catch (error) {
        console.error('Failed to update sync status:', error);
      }
    };

    updateSyncStatus();
    const syncStatusInterval = setInterval(updateSyncStatus, 5000); // Update every 5 seconds

    return () => {
      unsubscribe();
      unsubscribeSync();
      clearInterval(syncStatusInterval);
    };
  }, []);

  const retryConnection = async (): Promise<boolean> => {
    try {
      return await networkManager.checkConnection();
    } catch (error) {
      console.error('Failed to retry connection:', error);
      return false;
    }
  };

  const forceSync = async (): Promise<void> => {
    try {
      setIsSyncing(true);
      const result = await syncManager.forceSync();
      console.log('Force sync result:', result);
      
      // Update sync status after sync
      const status = await syncManager.getSyncStatus();
      setPendingOperationsCount(status.pendingOperationsCount);
      setLastSyncTime(status.lastSyncTime);
    } catch (error) {
      console.error('Force sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const value: NetworkContextType = {
    isOnline,
    isSlowConnection,
    networkState,
    isSyncing,
    pendingOperationsCount,
    lastSyncTime,
    retryConnection,
    forceSync,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

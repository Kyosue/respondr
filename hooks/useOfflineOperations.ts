import { useNetwork } from '@/contexts/NetworkContext';
import { OfflineStorage, PendingOperation } from '@/utils/offlineStorage';
import { SyncManager } from '@/utils/syncManager';
import { useCallback, useEffect, useState } from 'react';

export function useOfflineOperations() {
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const { isOnline } = useNetwork();
  
  const syncManager = SyncManager.getInstance();
  const offlineStorage = OfflineStorage.getInstance();

  // Load pending operations on mount
  useEffect(() => {
    loadPendingOperations();
  }, []);

  const loadPendingOperations = useCallback(async () => {
    try {
      const operations = await offlineStorage.getPendingOperations();
      setPendingOperations(operations);
    } catch (error) {
      console.error('Failed to load pending operations:', error);
    }
  }, []);

  // Auto-sync when connection is restored
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0) {
      handleSync();
    }
  }, [isOnline, pendingOperations.length]);

  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await syncManager.forceSync();
      console.log('Sync result:', result);
      
      // Reload pending operations after sync
      await loadPendingOperations();
      
      // Update last sync time
      const syncStatus = await syncManager.getSyncStatus();
      setLastSyncTime(syncStatus.lastSyncTime);
      
      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, syncManager, loadPendingOperations]);

  const queueOperation = useCallback(async (
    type: 'create' | 'update' | 'delete',
    collection: string,
    documentId: string,
    data: any
  ) => {
    try {
      await syncManager.queueOperation(type, collection, documentId, data);
      await loadPendingOperations();
    } catch (error) {
      console.error('Failed to queue operation:', error);
      throw error;
    }
  }, [syncManager, loadPendingOperations]);

  const retryOperation = useCallback(async (operationId: string) => {
    try {
      // Find the operation
      const operation = pendingOperations.find(op => op.id === operationId);
      if (!operation) {
        throw new Error('Operation not found');
      }

      // Remove from pending and try to sync immediately
      await offlineStorage.removePendingOperation(operationId);
      await loadPendingOperations();

      if (isOnline) {
        // Try to sync immediately
        await handleSync();
      }
    } catch (error) {
      console.error('Failed to retry operation:', error);
      throw error;
    }
  }, [pendingOperations, isOnline, offlineStorage, loadPendingOperations, handleSync]);

  const clearFailedOperations = useCallback(async () => {
    try {
      const operations = await offlineStorage.getPendingOperations();
      const failedOperations = operations.filter(op => op.retryCount >= 5);
      
      for (const operation of failedOperations) {
        await offlineStorage.removePendingOperation(operation.id);
      }
      
      await loadPendingOperations();
    } catch (error) {
      console.error('Failed to clear failed operations:', error);
      throw error;
    }
  }, [offlineStorage, loadPendingOperations]);

  const getStorageInfo = useCallback(async () => {
    try {
      return await offlineStorage.getStorageInfo();
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { size: 0, keys: [] };
    }
  }, [offlineStorage]);

  const clearAllOfflineData = useCallback(async () => {
    try {
      await offlineStorage.clearAllOfflineData();
      setPendingOperations([]);
      setLastSyncTime(null);
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }, [offlineStorage]);

  return {
    pendingOperations,
    isSyncing,
    lastSyncTime,
    isOnline,
    handleSync,
    queueOperation,
    retryOperation,
    clearFailedOperations,
    getStorageInfo,
    clearAllOfflineData,
    loadPendingOperations,
  };
}

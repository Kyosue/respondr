import { UserData } from '@/firebase/auth';
import { auth, db } from '@/firebase/config';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { NetworkManager, withRetry } from './networkUtils';
import { OfflineStorage, PendingOperation } from './offlineStorage';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export class SyncManager {
  private static instance: SyncManager;
  private offlineStorage: OfflineStorage;
  private networkManager: NetworkManager;
  private isSyncing: boolean = false;

  private constructor() {
    this.offlineStorage = OfflineStorage.getInstance();
    this.networkManager = NetworkManager.getInstance();
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  // Sync pending operations when connection is restored
  async syncPendingOperations(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['Sync already in progress'] };
    }

    if (!this.networkManager.isOnline()) {
      console.log('No internet connection, skipping sync');
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['No internet connection'] };
    }

    // Check if user is authenticated before attempting sync
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('User not authenticated, skipping sync');
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['User not authenticated'] };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: []
    };

    try {
      const pendingOps = await this.offlineStorage.getPendingOperations();
      console.log(`Syncing ${pendingOps.length} pending operations...`);

      for (const operation of pendingOps) {
        try {
          await this.syncOperation(operation);
          await this.offlineStorage.removePendingOperation(operation.id);
          result.syncedCount++;
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          result.failedCount++;
          result.errors.push(`Operation ${operation.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // Update retry count
          const newRetryCount = operation.retryCount + 1;
          await this.offlineStorage.updatePendingOperationRetryCount(operation.id, newRetryCount);
          
          // Remove operation if it has exceeded max retries
          if (newRetryCount >= 5) {
            await this.offlineStorage.removePendingOperation(operation.id);
            console.log(`Removed operation ${operation.id} after ${newRetryCount} failed attempts`);
          }
        }
      }

      if (result.syncedCount > 0) {
        await this.offlineStorage.updateLastSyncTime();
      }

      result.success = result.failedCount === 0;
    } catch (error) {
      console.error('Error during sync:', error);
      result.success = false;
      result.errors.push(`Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async syncOperation(operation: PendingOperation): Promise<void> {
    // Check if user is authenticated before performing Firestore operations
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated. Cannot sync operation.');
    }

    const { type, collection, documentId, data } = operation;

    switch (type) {
      case 'create':
        await withRetry(
          () => setDoc(doc(db, collection, documentId), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
          undefined,
          `Create ${collection}/${documentId}`
        );
        break;

      case 'update':
        await withRetry(
          () => updateDoc(doc(db, collection, documentId), {
            ...data,
            updatedAt: serverTimestamp(),
          }),
          undefined,
          `Update ${collection}/${documentId}`
        );
        break;

      case 'delete':
        await withRetry(
          () => deleteDoc(doc(db, collection, documentId)),
          undefined,
          `Delete ${collection}/${documentId}`
        );
        break;

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  // Queue operations for later sync
  async queueOperation(
    type: 'create' | 'update' | 'delete',
    collection: string,
    documentId: string,
    data: any
  ): Promise<void> {
    try {
      await this.offlineStorage.addPendingOperation({
        type,
        collection,
        documentId,
        data,
      });
    } catch (error) {
      console.error('Failed to queue operation:', error);
      throw error;
    }
  }

  // Sync user data
  async syncUserData(userData: UserData): Promise<void> {
    try {
      // Check if user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated. Cannot sync user data.');
      }

      // Save to offline storage first
      await this.offlineStorage.saveUserData(userData);

      // Try to sync to Firestore if online
      if (this.networkManager.isOnline()) {
        await withRetry(
          () => setDoc(doc(db, 'users', userData.id), {
            ...userData,
            lastSyncAt: serverTimestamp(),
          }),
          undefined,
          'Sync user data'
        );
        await this.offlineStorage.updateLastSyncTime();
      } else {
        // Queue for later sync
        await this.queueOperation('update', 'users', userData.id, userData);
      }
    } catch (error) {
      console.error('Failed to sync user data:', error);
      throw error;
    }
  }

  // Get user data with offline fallback
  async getUserData(userId: string): Promise<UserData | null> {
    try {
      // Check if user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('User not authenticated, falling back to offline storage');
        return await this.offlineStorage.getUserData();
      }

      // Try to get from Firestore first if online
      if (this.networkManager.isOnline()) {
        try {
          const userDoc = await withRetry(
            () => getDoc(doc(db, 'users', userId)),
            undefined,
            'Get user data'
          );
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            // Cache the data locally
            await this.offlineStorage.saveUserData(userData);
            return userData;
          }
        } catch (error: any) {
          // Handle specific permission errors more gracefully
          if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
            console.warn('Permission denied accessing user data, falling back to offline storage');
          } else {
            console.warn('Failed to get user data from Firestore, trying offline storage:', error);
          }
        }
      }

      // Fallback to offline storage
      return await this.offlineStorage.getUserData();
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  // Force sync all data
  async forceSync(): Promise<SyncResult> {
    console.log('Starting force sync...');
    return await this.syncPendingOperations();
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    pendingOperationsCount: number;
    lastSyncTime: number | null;
  }> {
    const pendingOps = await this.offlineStorage.getPendingOperations();
    const lastSyncTime = await this.offlineStorage.getLastSyncTime();

    return {
      isOnline: this.networkManager.isOnline(),
      isSyncing: this.isSyncing,
      pendingOperationsCount: pendingOps.length,
      lastSyncTime,
    };
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    await this.offlineStorage.clearAllOfflineData();
  }

  // Start auto-sync when connection is restored
  startAutoSync(): () => void {
    return this.networkManager.subscribe(async (networkState) => {
      if (networkState.isConnected && networkState.isInternetReachable) {
        console.log('Connection restored, starting auto-sync...');
        try {
          // Check if user is authenticated before attempting sync
          const currentUser = auth.currentUser;
          if (!currentUser) {
            console.log('User not authenticated, skipping auto-sync');
            return;
          }
          
          const result = await this.syncPendingOperations();
          if (result.syncedCount > 0) {
            console.log(`Auto-sync completed: ${result.syncedCount} operations synced`);
          }
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    });
  }
}

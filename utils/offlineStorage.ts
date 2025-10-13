import { UserData } from '@/firebase/auth';
import { Agency, BorrowerProfile, MultiResourceTransaction, Resource, ResourceHistory, ResourceTransaction } from '@/types/Resource';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OfflineData {
  userData?: UserData;
  lastSyncTime?: number;
  pendingOperations?: PendingOperation[];
  criticalData?: Record<string, any>;
  resources?: Resource[];
  transactions?: ResourceTransaction[];
  history?: ResourceHistory[];
  borrowers?: BorrowerProfile[];
}

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export class OfflineStorage {
  private static instance: OfflineStorage;
  private static readonly STORAGE_KEYS = {
    USER_DATA: 'offline_user_data',
    PENDING_OPERATIONS: 'pending_operations',
    CRITICAL_DATA: 'critical_data',
    LAST_SYNC: 'last_sync_time',
    RESOURCES: 'offline_resources',
    TRANSACTIONS: 'offline_transactions',
    MULTI_TRANSACTIONS: 'offline_multi_transactions',
    HISTORY: 'offline_history',
    BORROWERS: 'offline_borrowers',
    AGENCIES: 'offline_agencies',
  };

  private constructor() {}

  static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  // User Data Management
  async saveUserData(userData: UserData): Promise<void> {
    try {
      const offlineData: OfflineData = {
        userData,
        lastSyncTime: Date.now(),
      };
      
      await AsyncStorage.setItem(
        OfflineStorage.STORAGE_KEYS.USER_DATA,
        JSON.stringify(offlineData)
      );
    } catch (error) {
      console.error('Failed to save user data offline:', error);
      throw error;
    }
  }

  async getUserData(): Promise<UserData | null> {
    try {
      const data = await AsyncStorage.getItem(OfflineStorage.STORAGE_KEYS.USER_DATA);
      if (data) {
        const offlineData: OfflineData = JSON.parse(data);
        return offlineData.userData || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get user data from offline storage:', error);
      return null;
    }
  }

  async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OfflineStorage.STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Failed to clear user data from offline storage:', error);
    }
  }

  // Pending Operations Management
  async addPendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const pendingOps = await this.getPendingOperations();
      const newOperation: PendingOperation = {
        ...operation,
        id: `${operation.type}_${operation.collection}_${operation.documentId}_${Date.now()}`,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      pendingOps.push(newOperation);
      await AsyncStorage.setItem(
        OfflineStorage.STORAGE_KEYS.PENDING_OPERATIONS,
        JSON.stringify(pendingOps)
      );
    } catch (error) {
      console.error('Failed to add pending operation:', error);
      throw error;
    }
  }

  async getPendingOperations(): Promise<PendingOperation[]> {
    try {
      const data = await AsyncStorage.getItem(OfflineStorage.STORAGE_KEYS.PENDING_OPERATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get pending operations:', error);
      return [];
    }
  }

  async removePendingOperation(operationId: string): Promise<void> {
    try {
      const pendingOps = await this.getPendingOperations();
      const filteredOps = pendingOps.filter(op => op.id !== operationId);
      await AsyncStorage.setItem(
        OfflineStorage.STORAGE_KEYS.PENDING_OPERATIONS,
        JSON.stringify(filteredOps)
      );
    } catch (error) {
      console.error('Failed to remove pending operation:', error);
    }
  }

  async updatePendingOperationRetryCount(operationId: string, retryCount: number): Promise<void> {
    try {
      const pendingOps = await this.getPendingOperations();
      const operation = pendingOps.find(op => op.id === operationId);
      if (operation) {
        operation.retryCount = retryCount;
        await AsyncStorage.setItem(
          OfflineStorage.STORAGE_KEYS.PENDING_OPERATIONS,
          JSON.stringify(pendingOps)
        );
      }
    } catch (error) {
      console.error('Failed to update pending operation retry count:', error);
    }
  }

  async clearPendingOperations(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OfflineStorage.STORAGE_KEYS.PENDING_OPERATIONS);
    } catch (error) {
      console.error('Failed to clear pending operations:', error);
    }
  }

  // Critical Data Management
  async saveCriticalData(key: string, data: any): Promise<void> {
    try {
      const criticalData = await this.getCriticalData();
      criticalData[key] = {
        data,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(
        OfflineStorage.STORAGE_KEYS.CRITICAL_DATA,
        JSON.stringify(criticalData)
      );
    } catch (error) {
      console.error('Failed to save critical data:', error);
      throw error;
    }
  }

  async getCriticalData(): Promise<Record<string, { data: any; timestamp: number }>> {
    try {
      const data = await AsyncStorage.getItem(OfflineStorage.STORAGE_KEYS.CRITICAL_DATA);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get critical data:', error);
      return {};
    }
  }

  async getCriticalDataByKey(key: string): Promise<any | null> {
    try {
      const criticalData = await this.getCriticalData();
      return criticalData[key]?.data || null;
    } catch (error) {
      console.error('Failed to get critical data by key:', error);
      return null;
    }
  }

  async clearCriticalData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OfflineStorage.STORAGE_KEYS.CRITICAL_DATA);
    } catch (error) {
      console.error('Failed to clear critical data:', error);
    }
  }

  // Sync Management
  async updateLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        OfflineStorage.STORAGE_KEYS.LAST_SYNC,
        Date.now().toString()
      );
    } catch (error) {
      console.error('Failed to update last sync time:', error);
    }
  }

  async getLastSyncTime(): Promise<number | null> {
    try {
      const data = await AsyncStorage.getItem(OfflineStorage.STORAGE_KEYS.LAST_SYNC);
      return data ? parseInt(data, 10) : null;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  // Storage Management
  async getStorageInfo(): Promise<{ size: number; keys: string[] }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const relevantKeys = keys.filter(key => 
        Object.values(OfflineStorage.STORAGE_KEYS).includes(key)
      );
      
      let totalSize = 0;
      for (const key of relevantKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      return { size: totalSize, keys: relevantKeys };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { size: 0, keys: [] };
    }
  }

  // Resource Data Management
  async saveResources(resources: Resource[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        OfflineStorage.STORAGE_KEYS.RESOURCES,
        JSON.stringify(resources)
      );
    } catch (error) {
      console.error('Failed to save resources offline:', error);
      throw error;
    }
  }

  async getResources(): Promise<Resource[]> {
    try {
      const data = await AsyncStorage.getItem(OfflineStorage.STORAGE_KEYS.RESOURCES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get resources from offline storage:', error);
      return [];
    }
  }

  async saveTransactions(transactions: ResourceTransaction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        OfflineStorage.STORAGE_KEYS.TRANSACTIONS,
        JSON.stringify(transactions)
      );
    } catch (error) {
      console.error('Failed to save transactions offline:', error);
      throw error;
    }
  }

  async getTransactions(): Promise<ResourceTransaction[]> {
    try {
      const data = await AsyncStorage.getItem(OfflineStorage.STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get transactions from offline storage:', error);
      return [];
    }
  }

  async saveHistory(history: ResourceHistory[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        OfflineStorage.STORAGE_KEYS.HISTORY,
        JSON.stringify(history)
      );
    } catch (error) {
      console.error('Failed to save history offline:', error);
      throw error;
    }
  }

  async getHistory(): Promise<ResourceHistory[]> {
    try {
      const data = await AsyncStorage.getItem(OfflineStorage.STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get history from offline storage:', error);
      return [];
    }
  }

  // Resource-specific operations
  async addResource(resource: Resource): Promise<void> {
    try {
      const resources = await this.getResources();
      resources.push(resource);
      await this.saveResources(resources);
    } catch (error) {
      console.error('Failed to add resource offline:', error);
      throw error;
    }
  }

  async updateResource(resourceId: string, updates: Partial<Resource>): Promise<void> {
    try {
      const resources = await this.getResources();
      const index = resources.findIndex(r => r.id === resourceId);
      if (index !== -1) {
        resources[index] = { ...resources[index], ...updates, updatedAt: new Date() };
        await this.saveResources(resources);
      }
    } catch (error) {
      console.error('Failed to update resource offline:', error);
      throw error;
    }
  }

  async deleteResource(resourceId: string): Promise<void> {
    try {
      const resources = await this.getResources();
      const filteredResources = resources.filter(r => r.id !== resourceId);
      await this.saveResources(filteredResources);
    } catch (error) {
      console.error('Failed to delete resource offline:', error);
      throw error;
    }
  }

  async addTransaction(transaction: ResourceTransaction): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      transactions.push(transaction);
      await this.saveTransactions(transactions);
    } catch (error) {
      console.error('Failed to add transaction offline:', error);
      throw error;
    }
  }

  async updateTransaction(transactionId: string, updates: Partial<ResourceTransaction>): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const index = transactions.findIndex(t => t.id === transactionId);
      if (index !== -1) {
        transactions[index] = { ...transactions[index], ...updates, updatedAt: new Date() };
        await this.saveTransactions(transactions);
      }
    } catch (error) {
      console.error('Failed to update transaction offline:', error);
      throw error;
    }
  }

  async getTransactionById(transactionId: string): Promise<ResourceTransaction | null> {
    try {
      const transactions = await this.getTransactions();
      return transactions.find(t => t.id === transactionId) || null;
    } catch (error) {
      console.error('Failed to get transaction by ID offline:', error);
      return null;
    }
  }

  // Multi-transaction methods
  async addMultiTransaction(transaction: MultiResourceTransaction): Promise<void> {
    try {
      const transactions = await this.getMultiTransactions();
      transactions.push(transaction);
      await this.saveMultiTransactions(transactions);
    } catch (error) {
      console.error('Failed to add multi-transaction offline:', error);
      throw error;
    }
  }

  async updateMultiTransaction(transactionId: string, updates: Partial<MultiResourceTransaction>): Promise<void> {
    try {
      const transactions = await this.getMultiTransactions();
      const index = transactions.findIndex(t => t.id === transactionId);
      if (index !== -1) {
        transactions[index] = { ...transactions[index], ...updates, updatedAt: new Date() };
        await this.saveMultiTransactions(transactions);
      }
    } catch (error) {
      console.error('Failed to update multi-transaction offline:', error);
      throw error;
    }
  }

  async getMultiTransactionById(transactionId: string): Promise<MultiResourceTransaction | null> {
    try {
      const transactions = await this.getMultiTransactions();
      return transactions.find(t => t.id === transactionId) || null;
    } catch (error) {
      console.error('Failed to get multi-transaction by ID offline:', error);
      return null;
    }
  }

  async addHistoryEntry(historyEntry: ResourceHistory): Promise<void> {
    try {
      const history = await this.getHistory();
      history.push(historyEntry);
      await this.saveHistory(history);
    } catch (error) {
      console.error('Failed to add history entry offline:', error);
      throw error;
    }
  }

  // Borrower Data Management
  async saveBorrowerData(borrower: BorrowerProfile): Promise<void> {
    try {
      const borrowers = await this.getAllBorrowers();
      const existingIndex = borrowers.findIndex(b => b.id === borrower.id);
      
      if (existingIndex !== -1) {
        borrowers[existingIndex] = borrower;
      } else {
        borrowers.push(borrower);
      }
      
      await this.saveAllBorrowers(borrowers);
    } catch (error) {
      console.error('Failed to save borrower data offline:', error);
      throw error;
    }
  }

  async getAllBorrowers(): Promise<BorrowerProfile[]> {
    try {
      const data = await AsyncStorage.getItem(OfflineStorage.STORAGE_KEYS.BORROWERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get borrowers from offline storage:', error);
      return [];
    }
  }

  async saveAllBorrowers(borrowers: BorrowerProfile[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        OfflineStorage.STORAGE_KEYS.BORROWERS,
        JSON.stringify(borrowers)
      );
    } catch (error) {
      console.error('Failed to save all borrowers offline:', error);
      throw error;
    }
  }

  async getBorrowerById(id: string): Promise<BorrowerProfile | null> {
    try {
      const borrowers = await this.getAllBorrowers();
      return borrowers.find(b => b.id === id) || null;
    } catch (error) {
      console.error('Failed to get borrower by ID from offline storage:', error);
      return null;
    }
  }

  async getBorrowerByName(name: string): Promise<BorrowerProfile | null> {
    try {
      const borrowers = await this.getAllBorrowers();
      return borrowers.find(b => b.name === name) || null;
    } catch (error) {
      console.error('Failed to get borrower by name from offline storage:', error);
      return null;
    }
  }

  async updateBorrower(borrowerId: string, updates: Partial<BorrowerProfile>): Promise<void> {
    try {
      const borrowers = await this.getAllBorrowers();
      const index = borrowers.findIndex(b => b.id === borrowerId);
      if (index !== -1) {
        borrowers[index] = { ...borrowers[index], ...updates, updatedAt: new Date() };
        await this.saveAllBorrowers(borrowers);
      }
    } catch (error) {
      console.error('Failed to update borrower offline:', error);
      throw error;
    }
  }

  async deleteBorrower(borrowerId: string): Promise<void> {
    try {
      const borrowers = await this.getAllBorrowers();
      const filteredBorrowers = borrowers.filter(b => b.id !== borrowerId);
      await this.saveAllBorrowers(filteredBorrowers);
    } catch (error) {
      console.error('Failed to delete borrower offline:', error);
      throw error;
    }
  }

  async clearBorrowerData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OfflineStorage.STORAGE_KEYS.BORROWERS);
    } catch (error) {
      console.error('Failed to clear borrower data from offline storage:', error);
    }
  }

  async clearAllOfflineData(): Promise<void> {
    try {
      const keys = Object.values(OfflineStorage.STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Failed to clear all offline data:', error);
    }
  }

  // Multi-transaction helper methods
  async getMultiTransactions(): Promise<MultiResourceTransaction[]> {
    try {
      const data = await AsyncStorage.getItem(OfflineStorage.STORAGE_KEYS.MULTI_TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get multi-transactions:', error);
      return [];
    }
  }

  async saveMultiTransactions(transactions: MultiResourceTransaction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        OfflineStorage.STORAGE_KEYS.MULTI_TRANSACTIONS,
        JSON.stringify(transactions)
      );
    } catch (error) {
      console.error('Failed to save multi-transactions:', error);
      throw error;
    }
  }

  // Agency Management Methods
  async storeOfflineData(collection: string, id: string, data: any): Promise<void> {
    try {
      if (collection === 'agencies') {
        await this.saveAgencyData(data as Agency);
      } else {
        console.warn(`Unsupported collection for offline storage: ${collection}`);
      }
    } catch (error) {
      console.error(`Failed to store offline data for ${collection}:`, error);
      throw error;
    }
  }

  async getAllOfflineData(collection: string): Promise<any[]> {
    try {
      if (collection === 'agencies') {
        return await this.getAllAgencies();
      } else {
        console.warn(`Unsupported collection for offline data retrieval: ${collection}`);
        return [];
      }
    } catch (error) {
      console.error(`Failed to get offline data for ${collection}:`, error);
      return [];
    }
  }

  async getOfflineData(collection: string, id: string): Promise<any | null> {
    try {
      if (collection === 'agencies') {
        return await this.getAgencyById(id);
      } else {
        console.warn(`Unsupported collection for offline data retrieval: ${collection}`);
        return null;
      }
    } catch (error) {
      console.error(`Failed to get offline data for ${collection}:`, error);
      return null;
    }
  }

  async removeOfflineData(collection: string, id: string): Promise<void> {
    try {
      if (collection === 'agencies') {
        await this.deleteAgency(id);
      } else {
        console.warn(`Unsupported collection for offline data removal: ${collection}`);
      }
    } catch (error) {
      console.error(`Failed to remove offline data for ${collection}:`, error);
      throw error;
    }
  }

  // Agency-specific methods
  async saveAgencyData(agency: Agency): Promise<void> {
    try {
      const agencies = await this.getAllAgencies();
      const existingIndex = agencies.findIndex(a => a.id === agency.id);
      
      if (existingIndex !== -1) {
        agencies[existingIndex] = agency;
      } else {
        agencies.push(agency);
      }
      
      await this.saveAllAgencies(agencies);
    } catch (error) {
      console.error('Failed to save agency data:', error);
      throw error;
    }
  }

  async getAllAgencies(): Promise<Agency[]> {
    try {
      const data = await AsyncStorage.getItem(OfflineStorage.STORAGE_KEYS.AGENCIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get agencies:', error);
      return [];
    }
  }

  async saveAllAgencies(agencies: Agency[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        OfflineStorage.STORAGE_KEYS.AGENCIES,
        JSON.stringify(agencies)
      );
    } catch (error) {
      console.error('Failed to save agencies:', error);
      throw error;
    }
  }

  async getAgencyById(id: string): Promise<Agency | null> {
    try {
      const agencies = await this.getAllAgencies();
      return agencies.find(a => a.id === id) || null;
    } catch (error) {
      console.error('Failed to get agency by ID:', error);
      return null;
    }
  }

  async deleteAgency(id: string): Promise<void> {
    try {
      const agencies = await this.getAllAgencies();
      const filteredAgencies = agencies.filter(a => a.id !== id);
      await this.saveAllAgencies(filteredAgencies);
    } catch (error) {
      console.error('Failed to delete agency:', error);
      throw error;
    }
  }
}

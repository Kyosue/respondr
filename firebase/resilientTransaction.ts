import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc
} from 'firebase/firestore';
import { MultiResourceTransaction, ResourceTransaction } from '../types/Resource';
import { NetworkManager } from '../utils/networkUtils';
import { OfflineStorage } from '../utils/offlineStorage';
import { SyncManager } from '../utils/syncManager';
import { db } from './config';

export class ResilientTransactionService {
  private static instance: ResilientTransactionService;
  private offlineStorage: OfflineStorage;
  private syncManager: SyncManager;
  private networkManager: NetworkManager;
  
  private readonly TRANSACTIONS_COLLECTION = 'transactions';
  private readonly MULTI_TRANSACTIONS_COLLECTION = 'multiTransactions';

  private constructor() {
    this.offlineStorage = OfflineStorage.getInstance();
    this.syncManager = SyncManager.getInstance();
    this.networkManager = new NetworkManager();
  }

  public static getInstance(): ResilientTransactionService {
    if (!ResilientTransactionService.instance) {
      ResilientTransactionService.instance = new ResilientTransactionService();
    }
    return ResilientTransactionService.instance;
  }

  // Create a new transaction with offline support
  async createTransaction(transactionData: Omit<ResourceTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Validate transaction data
      this.validateTransactionData(transactionData);

      if (this.networkManager.isOnline()) {
        // Online: Create in Firebase first, then save locally
        try {
          // Sanitize data to remove undefined values
          const sanitizedData = this.sanitizeTransactionData(transactionData);
          
          const docRef = await addDoc(collection(db, this.TRANSACTIONS_COLLECTION), {
            ...sanitizedData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          const newTransaction: ResourceTransaction = {
            ...transactionData,
            id: docRef.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Save to offline storage for caching
          await this.offlineStorage.addTransaction(newTransaction);
          
          return docRef.id;
        } catch (error) {
          console.warn('Failed to create transaction in Firebase, creating locally:', error);
          // Fall through to offline creation
        }
      }

      // Offline or Firebase failed: Create locally and queue for sync
      const localId = this.generateTransactionId();
      const newTransaction: ResourceTransaction = {
        ...transactionData,
        id: localId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to offline storage
      await this.offlineStorage.addTransaction(newTransaction);

      // Queue for sync when online
      await this.syncManager.queueOperation(
        'create',
        this.TRANSACTIONS_COLLECTION,
        localId,
        newTransaction
      );

      return localId;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Update a transaction with offline support
  async updateTransaction(transactionId: string, updates: Partial<ResourceTransaction>): Promise<void> {
    try {
      // Get existing transaction
      const existingTransaction = await this.getTransactionById(transactionId);
      if (!existingTransaction) {
        throw new Error(`Transaction with ID ${transactionId} not found`);
      }

      const updatedTransaction = {
        ...existingTransaction,
        ...updates,
        updatedAt: new Date(),
      };

      if (this.networkManager.isOnline()) {
        try {
          // Try to update in Firebase first
          await this.updateTransactionInFirestore(transactionId, updates);
          
          // Update local storage
          await this.offlineStorage.updateTransaction(transactionId, updatedTransaction);
          
          return;
        } catch (error) {
          console.warn('Failed to update transaction in Firebase, updating locally:', error);
          // Fall through to offline update
        }
      }

      // Offline or Firebase failed: Update locally and queue for sync
      await this.offlineStorage.updateTransaction(transactionId, updatedTransaction);

      // Queue for sync when online
      await this.syncManager.queueOperation(
        'update',
        this.TRANSACTIONS_COLLECTION,
        transactionId,
        updatedTransaction
      );
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  // Get transaction by ID (offline-first)
  async getTransactionById(transactionId: string): Promise<ResourceTransaction | null> {
    try {
      // First try offline storage
      const offlineTransaction = await this.offlineStorage.getTransactionById(transactionId);
      if (offlineTransaction) {
        return offlineTransaction;
      }

      // If not found offline and online, try Firebase
      if (this.networkManager.isOnline()) {
        try {
          const transaction = await this.getTransactionByIdFromFirestore(transactionId);
          if (transaction) {
            // Cache the result
            await this.offlineStorage.addTransaction(transaction);
            return transaction;
          }
        } catch (error) {
          console.warn('Failed to fetch transaction from Firebase:', error);
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting transaction by ID:', error);
      return null;
    }
  }

  // Get all transactions (offline-first)
  async getAllTransactions(): Promise<ResourceTransaction[]> {
    try {
      // First try offline storage
      const offlineTransactions = await this.offlineStorage.getTransactions();
      if (offlineTransactions.length > 0) {
        return offlineTransactions;
      }

      // If no offline data and online, try Firebase
      if (this.networkManager.isOnline()) {
        try {
          const transactions = await this.getAllTransactionsFromFirestore();
          if (transactions.length > 0) {
            // Cache the results
            await this.offlineStorage.saveTransactions(transactions);
            return transactions;
          }
        } catch (error) {
          console.warn('Failed to fetch transactions from Firebase:', error);
        }
      }

      return [];
    } catch (error) {
      console.error('Error getting all transactions:', error);
      return [];
    }
  }

  // Get transactions by user ID
  async getTransactionsByUser(userId: string): Promise<ResourceTransaction[]> {
    try {
      const allTransactions = await this.getAllTransactions();
      return allTransactions.filter(t => t.userId === userId);
    } catch (error) {
      console.error('Error getting transactions by user:', error);
      return [];
    }
  }

  // Get active transactions
  async getActiveTransactions(): Promise<ResourceTransaction[]> {
    try {
      const allTransactions = await this.getAllTransactions();
      return allTransactions.filter(t => t.status === 'active');
    } catch (error) {
      console.error('Error getting active transactions:', error);
      return [];
    }
  }

  // Sync transactions from Firebase
  async syncTransactions(): Promise<void> {
    if (!this.networkManager.isOnline()) {
      console.log('Cannot sync transactions: offline');
      return;
    }

    try {
      const transactions = await this.getAllTransactionsFromFirestore();
      await this.offlineStorage.saveTransactions(transactions);
      console.log(`Synced ${transactions.length} transactions from Firebase`);
    } catch (error) {
      console.error('Error syncing transactions:', error);
      throw error;
    }
  }

  // Subscribe to all transactions changes
  subscribeToTransactions(callback: (transactions: ResourceTransaction[]) => void): () => void {
    if (!this.networkManager.isOnline()) {
      // If offline, return cached data
      this.offlineStorage.getTransactions().then(callback);
      return () => {};
    }

    const q = query(
      collection(db, this.TRANSACTIONS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const transactions = querySnapshot.docs.map(doc => this.convertTimestamps({
        id: doc.id,
        ...doc.data(),
      } as ResourceTransaction));
      
      // Always update offline storage with current database state
      this.offlineStorage.saveTransactions(transactions);
      
      // Call callback with current database state (even if empty)
      callback(transactions);
    });
  }

  // Subscribe to all multi-transactions changes
  subscribeToMultiTransactions(callback: (multiTransactions: MultiResourceTransaction[]) => void): () => void {
    if (!this.networkManager.isOnline()) {
      // If offline, return cached data
      this.offlineStorage.getMultiTransactions().then(callback);
      return () => {};
    }

    const q = query(
      collection(db, this.MULTI_TRANSACTIONS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const multiTransactions = querySnapshot.docs.map(doc => this.convertMultiTransactionTimestamps({
        id: doc.id,
        ...doc.data(),
      } as MultiResourceTransaction));
      
      // Always update offline storage with current database state
      this.offlineStorage.saveMultiTransactions(multiTransactions);
      
      // Call callback with current database state (even if empty)
      callback(multiTransactions);
    });
  }

  // Multi-transaction methods
  async createMultiTransaction(transactionData: Omit<MultiResourceTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      if (this.networkManager.isOnline()) {
        try {
          // Sanitize data to remove undefined values
          const sanitizedData = this.sanitizeMultiTransactionData(transactionData);
          
          const docRef = await addDoc(collection(db, this.MULTI_TRANSACTIONS_COLLECTION), {
            ...sanitizedData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          const newTransaction: MultiResourceTransaction = {
            ...transactionData,
            id: docRef.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await this.offlineStorage.addMultiTransaction(newTransaction);
          return docRef.id;
        } catch (error) {
          console.warn('Failed to create multi-transaction in Firebase, creating locally:', error);
        }
      }

      const localId = this.generateTransactionId();
      const newTransaction: MultiResourceTransaction = {
        ...transactionData,
        id: localId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.offlineStorage.addMultiTransaction(newTransaction);
      await this.syncManager.queueOperation(
        'create',
        this.MULTI_TRANSACTIONS_COLLECTION,
        localId,
        newTransaction
      );

      return localId;
    } catch (error) {
      console.error('Error creating multi-transaction:', error);
      throw error;
    }
  }

  async updateMultiTransaction(transactionId: string, updates: Partial<MultiResourceTransaction>): Promise<void> {
    try {
      const existingTransaction = await this.offlineStorage.getMultiTransactionById(transactionId);
      if (!existingTransaction) {
        throw new Error(`Multi-transaction with ID ${transactionId} not found`);
      }

      const updatedTransaction = {
        ...existingTransaction,
        ...updates,
        updatedAt: new Date(),
      };

      if (this.networkManager.isOnline()) {
        try {
          await this.updateMultiTransactionInFirestore(transactionId, updates);
          await this.offlineStorage.updateMultiTransaction(transactionId, updatedTransaction);
          return;
        } catch (error) {
          console.warn('Failed to update multi-transaction in Firebase, updating locally:', error);
        }
      }

      await this.offlineStorage.updateMultiTransaction(transactionId, updatedTransaction);
      await this.syncManager.queueOperation(
        'update',
        this.MULTI_TRANSACTIONS_COLLECTION,
        transactionId,
        updatedTransaction
      );
    } catch (error) {
      console.error('Error updating multi-transaction:', error);
      throw error;
    }
  }

  async getMultiTransactionById(transactionId: string): Promise<MultiResourceTransaction | null> {
    try {
      // First try offline storage
      const offlineTransaction = await this.offlineStorage.getMultiTransactionById(transactionId);
      if (offlineTransaction) {
        return offlineTransaction;
      }

      // If not found offline and online, try Firebase
      if (this.networkManager.isOnline()) {
        try {
          const transaction = await this.getMultiTransactionByIdFromFirestore(transactionId);
          if (transaction) {
            // Cache the result
            await this.offlineStorage.addMultiTransaction(transaction);
            return transaction;
          }
        } catch (error) {
          console.warn('Failed to fetch multi-transaction from Firebase:', error);
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting multi-transaction by ID:', error);
      return null;
    }
  }

  // Get all multi-transactions
  async getAllMultiTransactions(): Promise<MultiResourceTransaction[]> {
    try {
      // Try to get from offline storage first
      const offlineTransactions = await this.offlineStorage.getMultiTransactions();
      if (offlineTransactions.length > 0) {
        return offlineTransactions.map(t => this.convertMultiTransactionTimestamps(t));
      }

      // If not found offline and online, try Firebase
      if (this.networkManager.isOnline()) {
        const q = query(
          collection(db, this.MULTI_TRANSACTIONS_COLLECTION),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const transactions = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return this.convertMultiTransactionTimestamps({
            id: doc.id,
            ...data,
          } as MultiResourceTransaction);
        });
        
        // Cache all transactions
        await this.offlineStorage.saveMultiTransactions(transactions);
        return transactions;
      }
      
      return [];
    } catch (error) {
      console.error('Error getting all multi-transactions:', error);
      throw error;
    }
  }

  private async getMultiTransactionByIdFromFirestore(transactionId: string): Promise<MultiResourceTransaction | null> {
    const docRef = doc(db, this.MULTI_TRANSACTIONS_COLLECTION, transactionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return this.convertMultiTransactionTimestamps({
        id: docSnap.id,
        ...data,
      } as MultiResourceTransaction);
    }
    
    return null;
  }

  private convertMultiTransactionTimestamps(transaction: MultiResourceTransaction): MultiResourceTransaction {
    const converted = { ...transaction };
    
    // Convert Firestore Timestamps to JavaScript Dates
    Object.keys(converted).forEach(key => {
      const value = (converted as any)[key];
      if (value && typeof value === 'object' && 'toDate' in value) {
        (converted as any)[key] = (value as Timestamp).toDate();
      }
    });
    
    // Ensure createdAt and updatedAt are proper Date objects
    if (converted.createdAt && !(converted.createdAt instanceof Date)) {
      converted.createdAt = new Date(converted.createdAt);
    }
    if (converted.updatedAt && !(converted.updatedAt instanceof Date)) {
      converted.updatedAt = new Date(converted.updatedAt);
    }
    
    // Convert timestamps in items array
    if (converted.items && Array.isArray(converted.items)) {
      converted.items = converted.items.map(item => {
        const convertedItem = { ...item };
        
        // Convert dueDate if it exists and is not already a Date
        if (convertedItem.dueDate && !(convertedItem.dueDate instanceof Date)) {
          const dueDate = new Date(convertedItem.dueDate);
          // Only set if it's a valid date
          if (!isNaN(dueDate.getTime())) {
            convertedItem.dueDate = dueDate;
          }
        }
        
        // Convert returnedDate if it exists and is not already a Date
        if (convertedItem.returnedDate && !(convertedItem.returnedDate instanceof Date)) {
          const returnedDate = new Date(convertedItem.returnedDate);
          // Only set if it's a valid date
          if (!isNaN(returnedDate.getTime())) {
            convertedItem.returnedDate = returnedDate;
          }
        }
        
        return convertedItem;
      });
    }
    
    return converted;
  }

  // Private helper methods
  private validateTransactionData(transactionData: Omit<ResourceTransaction, 'id' | 'createdAt' | 'updatedAt'>): void {
    if (!transactionData.resourceId) {
      throw new Error('Resource ID is required');
    }
    if (!transactionData.userId) {
      throw new Error('User ID is required');
    }
    if (!transactionData.quantity || transactionData.quantity <= 0) {
      throw new Error('Valid quantity is required');
    }
    if (!transactionData.borrowerName) {
      throw new Error('Borrower name is required');
    }
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Firestore operations
  private async updateTransactionInFirestore(transactionId: string, updates: Partial<ResourceTransaction>): Promise<void> {
    const docRef = doc(db, this.TRANSACTIONS_COLLECTION, transactionId);
    
    // Filter out undefined values to avoid Firebase errors
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };
    
    // Only include defined values
    if (updates.resourceId !== undefined) updateData.resourceId = updates.resourceId;
    if (updates.userId !== undefined) updateData.userId = updates.userId;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate;
    if (updates.returnedDate !== undefined) updateData.returnedDate = updates.returnedDate;
    if (updates.borrowerName !== undefined) updateData.borrowerName = updates.borrowerName;
    if (updates.borrowerContact !== undefined) updateData.borrowerContact = updates.borrowerContact;
    if (updates.borrowerDepartment !== undefined) updateData.borrowerDepartment = updates.borrowerDepartment;
    if (updates.borrowerPicture !== undefined) updateData.borrowerPicture = updates.borrowerPicture;
    
    await updateDoc(docRef, updateData);
  }

  private async getTransactionByIdFromFirestore(transactionId: string): Promise<ResourceTransaction | null> {
    const docRef = doc(db, this.TRANSACTIONS_COLLECTION, transactionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return this.convertTimestamps({
        id: docSnap.id,
        ...data,
      } as ResourceTransaction);
    }
    
    return null;
  }

  private async getAllTransactionsFromFirestore(): Promise<ResourceTransaction[]> {
    const q = query(
      collection(db, this.TRANSACTIONS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.convertTimestamps({
      id: doc.id,
      ...doc.data(),
    } as ResourceTransaction));
  }

  private async updateMultiTransactionInFirestore(transactionId: string, updates: Partial<MultiResourceTransaction>): Promise<void> {
    const docRef = doc(db, this.MULTI_TRANSACTIONS_COLLECTION, transactionId);
    
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };
    
    if (updates.userId !== undefined) updateData.userId = updates.userId;
    if (updates.borrowerName !== undefined) updateData.borrowerName = updates.borrowerName;
    if (updates.borrowerContact !== undefined) updateData.borrowerContact = updates.borrowerContact;
    if (updates.borrowerDepartment !== undefined) updateData.borrowerDepartment = updates.borrowerDepartment;
    if (updates.borrowerPicture !== undefined) updateData.borrowerPicture = updates.borrowerPicture;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.items !== undefined) updateData.items = updates.items;
    
    await updateDoc(docRef, updateData);
  }

  private convertTimestamps(transaction: ResourceTransaction): ResourceTransaction {
    const converted = { ...transaction };
    
    // Convert Firestore Timestamps to JavaScript Dates
    Object.keys(converted).forEach(key => {
      const value = (converted as any)[key];
      if (value && typeof value === 'object' && 'toDate' in value) {
        (converted as any)[key] = (value as Timestamp).toDate();
      }
    });
    
    // Ensure createdAt and updatedAt are proper Date objects
    if (converted.createdAt && !(converted.createdAt instanceof Date)) {
      converted.createdAt = new Date(converted.createdAt);
    }
    if (converted.updatedAt && !(converted.updatedAt instanceof Date)) {
      converted.updatedAt = new Date(converted.updatedAt);
    }
    if (converted.dueDate && !(converted.dueDate instanceof Date)) {
      const dueDate = new Date(converted.dueDate);
      if (!isNaN(dueDate.getTime())) {
        converted.dueDate = dueDate;
      }
    }
    if (converted.returnedDate && !(converted.returnedDate instanceof Date)) {
      const returnedDate = new Date(converted.returnedDate);
      if (!isNaN(returnedDate.getTime())) {
        converted.returnedDate = returnedDate;
      }
    }
    
    return converted;
  }

  // Sanitize transaction data to remove undefined values
  private sanitizeTransactionData(transactionData: Omit<ResourceTransaction, 'id' | 'createdAt' | 'updatedAt'>): any {
    const sanitized: any = {
      resourceId: transactionData.resourceId,
      userId: transactionData.userId,
      type: transactionData.type,
      quantity: transactionData.quantity,
      status: transactionData.status,
      borrowerName: transactionData.borrowerName,
    };

    // Only include defined optional fields
    if (transactionData.notes !== undefined) sanitized.notes = transactionData.notes;
    if (transactionData.dueDate !== undefined) sanitized.dueDate = transactionData.dueDate;
    if (transactionData.returnedDate !== undefined) sanitized.returnedDate = transactionData.returnedDate;
    if (transactionData.borrowerPicture !== undefined) sanitized.borrowerPicture = transactionData.borrowerPicture;
    if (transactionData.borrowerContact !== undefined) sanitized.borrowerContact = transactionData.borrowerContact;
    if (transactionData.borrowerDepartment !== undefined) sanitized.borrowerDepartment = transactionData.borrowerDepartment;

    return sanitized;
  }

  // Sanitize multi-transaction data to remove undefined values
  private sanitizeMultiTransactionData(transactionData: Omit<MultiResourceTransaction, 'id' | 'createdAt' | 'updatedAt'>): any {
    const sanitized: any = {
      userId: transactionData.userId,
      type: transactionData.type,
      status: transactionData.status,
      borrowerName: transactionData.borrowerName,
      items: transactionData.items.map(item => {
        const sanitizedItem: any = {
          id: item.id,
          resourceId: item.resourceId,
          quantity: item.quantity,
          status: item.status,
        };
        
        // Only include defined optional fields for items
        if (item.dueDate !== undefined) sanitizedItem.dueDate = item.dueDate;
        if (item.returnedDate !== undefined) sanitizedItem.returnedDate = item.returnedDate;
        if (item.notes !== undefined) sanitizedItem.notes = item.notes;
        
        return sanitizedItem;
      }),
    };

    // Only include defined optional fields
    if (transactionData.notes !== undefined) sanitized.notes = transactionData.notes;
    if (transactionData.borrowerPicture !== undefined) sanitized.borrowerPicture = transactionData.borrowerPicture;
    if (transactionData.borrowerContact !== undefined) sanitized.borrowerContact = transactionData.borrowerContact;
    if (transactionData.borrowerDepartment !== undefined) sanitized.borrowerDepartment = transactionData.borrowerDepartment;

    return sanitized;
  }
}

import { BorrowerProfile } from '@/types/Resource';
import { BorrowerErrorHandler, BorrowerOperation } from '@/utils/borrowerErrorHandler';
import { BorrowerValidator } from '@/utils/borrowerValidation';
import { NetworkManager, withRetry } from '@/utils/networkUtils';
import { OfflineStorage } from '@/utils/offlineStorage';
import { SyncManager } from '@/utils/syncManager';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './config';

export class ResilientBorrowerService {
  private static instance: ResilientBorrowerService;
  private offlineStorage: OfflineStorage;
  private syncManager: SyncManager;
  private networkManager: NetworkManager;
  private errorHandler: BorrowerErrorHandler;
  private readonly BORROWERS_COLLECTION = 'borrowers';

  private constructor() {
    this.offlineStorage = OfflineStorage.getInstance();
    this.syncManager = SyncManager.getInstance();
    this.networkManager = NetworkManager.getInstance();
    this.errorHandler = BorrowerErrorHandler.getInstance();
  }

  static getInstance(): ResilientBorrowerService {
    if (!ResilientBorrowerService.instance) {
      ResilientBorrowerService.instance = new ResilientBorrowerService();
    }
    return ResilientBorrowerService.instance;
  }

  // Create or update a borrower with offline support
  async upsertBorrower(borrowerData: Omit<BorrowerProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Validate borrower data
      this.validateBorrowerData(borrowerData);

      // Check if borrower already exists by name
      const existingBorrower = await this.getBorrowerByName(borrowerData.name);
      
      if (existingBorrower) {
        // Update existing borrower
        return await this.updateBorrower(existingBorrower.id, borrowerData);
      } else {
        // Create new borrower
        return await this.createBorrower(borrowerData);
      }
    } catch (error) {
      console.error('Error upserting borrower:', error);
      throw error;
    }
  }

  // Create a new borrower with offline support
  private async createBorrower(borrowerData: Omit<BorrowerProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const operationId = `create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const borrowerId = this.generateBorrowerId();
    
    const operation: BorrowerOperation = {
      id: operationId,
      type: 'create',
      borrowerId,
      data: borrowerData,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    this.errorHandler.registerOperation(operation);

    try {
      const newBorrower: BorrowerProfile = {
        ...borrowerData,
        id: borrowerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to offline storage first
      await this.offlineStorage.saveBorrowerData(newBorrower);

      // Try to save to Firestore if online
      if (this.networkManager.isOnline()) {
        try {
          await withRetry(
            () => this.saveBorrowerToFirestore(newBorrower),
            undefined,
            'Save borrower to Firestore'
          );
        } catch (error) {
          console.warn('Failed to save borrower to Firestore, will sync later:', error);
          // Handle error with retry/rollback logic
          await this.errorHandler.handleError(error as Error, operation);
          // Queue for later sync
          await this.syncManager.queueOperation('create', this.BORROWERS_COLLECTION, newBorrower.id, newBorrower);
        }
      } else {
        // Queue for later sync
        await this.syncManager.queueOperation('create', this.BORROWERS_COLLECTION, newBorrower.id, newBorrower);
      }

      return newBorrower.id;
    } catch (error) {
      console.error('Error creating borrower:', error);
      await this.errorHandler.handleError(error as Error, operation);
      throw error;
    }
  }

  // Update existing borrower with offline support
  private async updateBorrower(borrowerId: string, updates: Omit<BorrowerProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Get existing borrower data
      const existingBorrower = await this.getBorrowerById(borrowerId);
      if (!existingBorrower) {
        throw new Error('Borrower not found');
      }

      const updatedBorrower: BorrowerProfile = {
        ...existingBorrower,
        ...updates,
        updatedAt: new Date(),
      };

      // Save to offline storage first
      await this.offlineStorage.saveBorrowerData(updatedBorrower);

      // Try to save to Firestore if online
      if (this.networkManager.isOnline()) {
        try {
          await withRetry(
            () => this.updateBorrowerInFirestore(borrowerId, updates),
            undefined,
            'Update borrower in Firestore'
          );
        } catch (error) {
          console.warn('Failed to update borrower in Firestore, will sync later:', error);
          // Queue for later sync
          await this.syncManager.queueOperation('update', this.BORROWERS_COLLECTION, borrowerId, updatedBorrower);
        }
      } else {
        // Queue for later sync
        await this.syncManager.queueOperation('update', this.BORROWERS_COLLECTION, borrowerId, updatedBorrower);
      }

      return borrowerId;
    } catch (error) {
      console.error('Error updating borrower:', error);
      throw error;
    }
  }

  // Get borrower by name with offline fallback
  async getBorrowerByName(name: string): Promise<BorrowerProfile | null> {
    try {
      // Try to get from Firestore first if online
      if (this.networkManager.isOnline()) {
        try {
          const borrower = await withRetry(
            () => this.getBorrowerByNameFromFirestore(name),
            undefined,
            'Get borrower by name from Firestore'
          );
          if (borrower) {
            // Cache the result
            await this.offlineStorage.saveBorrowerData(borrower);
            return borrower;
          }
        } catch (error) {
          console.warn('Failed to get borrower from Firestore, trying offline storage:', error);
        }
      }

      // Fallback to offline storage
      return await this.offlineStorage.getBorrowerByName(name);
    } catch (error) {
      console.error('Error getting borrower by name:', error);
      return null;
    }
  }

  // Get borrower by ID with offline fallback
  async getBorrowerById(id: string): Promise<BorrowerProfile | null> {
    try {
      // Try to get from Firestore first if online
      if (this.networkManager.isOnline()) {
        try {
          const borrower = await withRetry(
            () => this.getBorrowerByIdFromFirestore(id),
            undefined,
            'Get borrower by ID from Firestore'
          );
          if (borrower) {
            // Cache the result
            await this.offlineStorage.saveBorrowerData(borrower);
            return borrower;
          }
        } catch (error) {
          console.warn('Failed to get borrower from Firestore, trying offline storage:', error);
        }
      }

      // Fallback to offline storage
      return await this.offlineStorage.getBorrowerById(id);
    } catch (error) {
      console.error('Error getting borrower by ID:', error);
      return null;
    }
  }

  // Get all borrowers with offline fallback
  async getAllBorrowers(): Promise<BorrowerProfile[]> {
    try {
      // Try to get from Firestore first if online
      if (this.networkManager.isOnline()) {
        try {
          const borrowers = await withRetry(
            () => this.getAllBorrowersFromFirestore(),
            undefined,
            'Get all borrowers from Firestore'
          );
          // Cache the results
          await this.offlineStorage.saveAllBorrowers(borrowers);
          return borrowers;
        } catch (error) {
          console.warn('Failed to get borrowers from Firestore, trying offline storage:', error);
        }
      }

      // Fallback to offline storage
      return await this.offlineStorage.getAllBorrowers();
    } catch (error) {
      console.error('Error getting all borrowers:', error);
      return [];
    }
  }

  // Sync borrower data when online
  async syncBorrowerData(): Promise<void> {
    try {
      if (!this.networkManager.isOnline()) {
        console.log('No network connection, skipping borrower sync');
        return;
      }

      // Get all borrowers from Firestore
      const firestoreBorrowers = await this.getAllBorrowersFromFirestore();
      
      // Save to offline storage
      await this.offlineStorage.saveAllBorrowers(firestoreBorrowers);
      
      console.log(`Successfully synced ${firestoreBorrowers.length} borrowers`);
    } catch (error) {
      console.error('Error syncing borrower data:', error);
      throw error;
    }
  }

  // Subscribe to all borrowers changes
  subscribeToBorrowers(callback: (borrowers: BorrowerProfile[]) => void): () => void {
    if (!this.networkManager.isOnline()) {
      // If offline, return cached data
      this.offlineStorage.getAllBorrowers().then(callback);
      return () => {};
    }

    const q = query(
      collection(db, this.BORROWERS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const borrowers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as BorrowerProfile));
      
      // Always update offline storage with current database state
      this.offlineStorage.saveAllBorrowers(borrowers);
      
      // Call callback with current database state (even if empty)
      callback(borrowers);
    });
  }

  // Validate borrower data
  private validateBorrowerData(borrowerData: Omit<BorrowerProfile, 'id' | 'createdAt' | 'updatedAt'>): void {
    // Sanitize the data first
    const sanitizedData = BorrowerValidator.sanitizeBorrowerData(borrowerData);
    
    // Validate the data
    const validationResult = BorrowerValidator.validateBorrower(sanitizedData);
    
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(error => `${error.field}: ${error.message}`).join(', ');
      throw new Error(`Borrower validation failed: ${errorMessages}`);
    }
    
    // Log warnings if any
    if (validationResult.warnings.length > 0) {
      console.warn('Borrower validation warnings:', validationResult.warnings);
    }
  }

  // Generate unique borrower ID
  private generateBorrowerId(): string {
    return `borrower_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public validation method
  validateBorrowerData(borrowerData: Partial<BorrowerProfile>): { isValid: boolean; errors: string[]; warnings: string[] } {
    const sanitizedData = BorrowerValidator.sanitizeBorrowerData(borrowerData);
    const validationResult = BorrowerValidator.validateBorrower(sanitizedData);
    
    return {
      isValid: validationResult.isValid,
      errors: validationResult.errors.map(error => `${error.field}: ${error.message}`),
      warnings: validationResult.warnings
    };
  }

  // Firestore operations
  private async saveBorrowerToFirestore(borrower: BorrowerProfile): Promise<void> {
    const docRef = doc(db, this.BORROWERS_COLLECTION, borrower.id);
    await setDoc(docRef, {
      ...borrower,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  private async updateBorrowerInFirestore(borrowerId: string, updates: Partial<BorrowerProfile>): Promise<void> {
    const docRef = doc(db, this.BORROWERS_COLLECTION, borrowerId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  private async getBorrowerByNameFromFirestore(name: string): Promise<BorrowerProfile | null> {
    const q = query(
      collection(db, this.BORROWERS_COLLECTION),
      where('name', '==', name)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return this.convertTimestamps({ id: doc.id, ...doc.data() }) as BorrowerProfile;
  }

  private async getBorrowerByIdFromFirestore(id: string): Promise<BorrowerProfile | null> {
    const docRef = doc(db, this.BORROWERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return this.convertTimestamps({ id: docSnap.id, ...docSnap.data() }) as BorrowerProfile;
  }

  private async getAllBorrowersFromFirestore(): Promise<BorrowerProfile[]> {
    const querySnapshot = await getDocs(collection(db, this.BORROWERS_COLLECTION));
    return querySnapshot.docs.map(doc => 
      this.convertTimestamps({ id: doc.id, ...doc.data() }) as BorrowerProfile
    );
  }

  // Convert Firestore timestamps to Date objects
  private convertTimestamps(data: any): any {
    const converted = { ...data };
    
    if (converted.createdAt && converted.createdAt.toDate) {
      converted.createdAt = converted.createdAt.toDate();
    }
    
    if (converted.updatedAt && converted.updatedAt.toDate) {
      converted.updatedAt = converted.updatedAt.toDate();
    }
    
    if (converted.lastBorrowDate && converted.lastBorrowDate.toDate) {
      converted.lastBorrowDate = converted.lastBorrowDate.toDate();
    }
    
    return converted;
  }
}

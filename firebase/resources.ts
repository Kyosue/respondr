import { BorrowerProfile, MultiResourceTransaction, Resource, ResourceHistory, ResourceTransaction } from '@/types/Resource';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { db } from './config';

// Collection references
const RESOURCES_COLLECTION = 'resources';
const TRANSACTIONS_COLLECTION = 'transactions';
const MULTI_TRANSACTIONS_COLLECTION = 'multiTransactions';
const BORROWERS_COLLECTION = 'borrowers';
const HISTORY_COLLECTION = 'resourceHistory';

// Simple cache for resource history to reduce Firestore queries
const historyCache = new Map<string, { data: ResourceHistory[], timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Helper function to convert Firestore timestamps to Date objects
const convertTimestamps = (data: any) => {
  const converted = { ...data };
  
  // Convert Firestore timestamps to Date objects
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    }
  });
  
  return converted;
};

// Resource CRUD operations
export const resourceService = {
  // Create a new resource
  async createResource(resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, RESOURCES_COLLECTION), {
        ...resourceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Note: History entry is handled by ResourceContext to avoid duplication
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  },

  // Get a single resource by ID
  async getResource(id: string): Promise<Resource | null> {
    try {
      const docRef = doc(db, RESOURCES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return convertTimestamps({ id: docSnap.id, ...docSnap.data() }) as Resource;
      }
      return null;
    } catch (error) {
      console.error('Error getting resource:', error);
      throw error;
    }
  },

  // Get all resources
  async getAllResources(): Promise<Resource[]> {
    try {
      const querySnapshot = await getDocs(collection(db, RESOURCES_COLLECTION));
      return querySnapshot.docs.map(doc => 
        convertTimestamps({ id: doc.id, ...doc.data() }) as Resource
      );
    } catch (error: any) {
      // Handle index building error gracefully
      if (error?.message?.includes('index is currently building')) {
        console.warn('Resources index is building, returning empty array. This is temporary.');
        return [];
      }
      console.error('Error getting resources:', error);
      throw error;
    }
  },

  // Update a resource
  async updateResource(id: string, updates: Partial<Resource>): Promise<void> {
    try {
      const docRef = doc(db, RESOURCES_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      // Note: History entry is handled by ResourceContext to avoid duplication
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  },

  // Delete a resource
  async deleteResource(id: string): Promise<void> {
    try {
      const docRef = doc(db, RESOURCES_COLLECTION, id);
      await deleteDoc(docRef);
      
      // Note: History entry is handled by ResourceContext to avoid duplication
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  },

  // Subscribe to resources changes
  subscribeToResources(callback: (resources: Resource[]) => void): () => void {
    const q = query(collection(db, RESOURCES_COLLECTION), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const resources = querySnapshot.docs.map(doc => 
        convertTimestamps({ id: doc.id, ...doc.data() }) as Resource
      );
      callback(resources);
    });
  },

  // Add history entry
  async addHistoryEntry(resourceId: string, action: string, details: string, userId?: string): Promise<void> {
    try {
      await addDoc(collection(db, HISTORY_COLLECTION), {
        resourceId,
        action,
        userId: userId || 'system',
        details,
        timestamp: serverTimestamp(),
      });
      
      // Clear cache for this resource since we added a new entry
      historyCache.delete(resourceId);
    } catch (error) {
      console.error('Error adding history entry:', error);
      throw error;
    }
  },

  // Get resource history
  async getResourceHistory(resourceId: string): Promise<ResourceHistory[]> {
    try {
      // Check cache first
      const cached = historyCache.get(resourceId);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.data;
      }

      // Use simple query to avoid index warnings
      // This is more efficient for small datasets and doesn't require composite index
      const q = query(
        collection(db, HISTORY_COLLECTION),
        where('resourceId', '==', resourceId)
      );
      
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => 
        convertTimestamps({ id: doc.id, ...doc.data() }) as ResourceHistory
      );
      
      // Sort in memory (efficient for typical history sizes)
      const sortedHistory = history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Cache the result
      historyCache.set(resourceId, { data: sortedHistory, timestamp: Date.now() });
      
      return sortedHistory;
    } catch (error: any) {
      console.error('Error getting resource history:', error);
      return [];
    }
  }
};

// Transaction CRUD operations
export const transactionService = {
  // Create a new transaction
  async createTransaction(transactionData: Omit<ResourceTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
        ...transactionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  // Update a transaction
  async updateTransaction(id: string, updates: Partial<ResourceTransaction>): Promise<void> {
    try {
      const docRef = doc(db, TRANSACTIONS_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },

  // Get transactions by resource ID
  async getTransactionsByResource(resourceId: string): Promise<ResourceTransaction[]> {
    try {
      const q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where('resourceId', '==', resourceId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        convertTimestamps({ id: doc.id, ...doc.data() }) as ResourceTransaction
      );
    } catch (error: any) {
      // Handle index building error gracefully
      if (error?.message?.includes('index is currently building')) {
        console.warn('Resource transactions index is building, returning empty array. This is temporary.');
        return [];
      }
      console.error('Error getting transactions by resource:', error);
      throw error;
    }
  },

  // Get active transactions
  async getActiveTransactions(): Promise<ResourceTransaction[]> {
    try {
      const q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        convertTimestamps({ id: doc.id, ...doc.data() }) as ResourceTransaction
      );
    } catch (error: any) {
      // Handle index building error gracefully
      if (error?.message?.includes('index is currently building')) {
        console.warn('Transaction index is building, returning empty array. This is temporary.');
        return [];
      }
      console.error('Error getting active transactions:', error);
      throw error;
    }
  },

  // Get transactions by user ID
  async getTransactionsByUser(userId: string): Promise<ResourceTransaction[]> {
    try {
      const q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        convertTimestamps({ id: doc.id, ...doc.data() }) as ResourceTransaction
      );
    } catch (error: any) {
      // Handle index building error gracefully
      if (error?.message?.includes('index is currently building')) {
        console.warn('User transactions index is building, returning empty array. This is temporary.');
        return [];
      }
      console.error('Error getting transactions by user:', error);
      throw error;
    }
  }
};

// Multi-transaction CRUD operations
export const multiTransactionService = {
  // Create a new multi-transaction
  async createMultiTransaction(transactionData: Omit<MultiResourceTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, MULTI_TRANSACTIONS_COLLECTION), {
        ...transactionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating multi-transaction:', error);
      throw error;
    }
  },

  // Update a multi-transaction
  async updateMultiTransaction(id: string, updates: Partial<MultiResourceTransaction>): Promise<void> {
    try {
      const docRef = doc(db, MULTI_TRANSACTIONS_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating multi-transaction:', error);
      throw error;
    }
  },

  // Get active multi-transactions
  async getActiveMultiTransactions(): Promise<MultiResourceTransaction[]> {
    try {
      const q = query(
        collection(db, MULTI_TRANSACTIONS_COLLECTION),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        convertTimestamps({ id: doc.id, ...doc.data() }) as MultiResourceTransaction
      );
    } catch (error: any) {
      // Handle index building error gracefully
      if (error?.message?.includes('index is currently building')) {
        console.warn('Multi-transaction index is building, returning empty array. This is temporary.');
        return [];
      }
      console.error('Error getting active multi-transactions:', error);
      throw error;
    }
  },

  // Get multi-transactions by user ID
  async getMultiTransactionsByUser(userId: string): Promise<MultiResourceTransaction[]> {
    try {
      const q = query(
        collection(db, MULTI_TRANSACTIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        convertTimestamps({ id: doc.id, ...doc.data() }) as MultiResourceTransaction
      );
    } catch (error: any) {
      // Handle index building error gracefully
      if (error?.message?.includes('index is currently building')) {
        console.warn('User multi-transactions index is building, returning empty array. This is temporary.');
        return [];
      }
      console.error('Error getting multi-transactions by user:', error);
      throw error;
    }
  }
};

// Borrower CRUD operations
export const borrowerService = {
  // Create or update a borrower profile
  async upsertBorrower(borrowerData: Omit<BorrowerProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Check if borrower already exists by name
      const q = query(
        collection(db, BORROWERS_COLLECTION),
        where('name', '==', borrowerData.name)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new borrower
        const docRef = await addDoc(collection(db, BORROWERS_COLLECTION), {
          ...borrowerData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return docRef.id;
      } else {
        // Update existing borrower
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(existingDoc.ref, {
          ...borrowerData,
          updatedAt: serverTimestamp(),
        });
        return existingDoc.id;
      }
    } catch (error) {
      console.error('Error upserting borrower:', error);
      throw error;
    }
  },

  // Get borrower by name
  async getBorrowerByName(name: string): Promise<BorrowerProfile | null> {
    try {
      const q = query(
        collection(db, BORROWERS_COLLECTION),
        where('name', '==', name)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return convertTimestamps({ id: doc.id, ...doc.data() }) as BorrowerProfile;
    } catch (error) {
      console.error('Error getting borrower by name:', error);
      throw error;
    }
  },

  // Get all borrowers
  async getAllBorrowers(): Promise<BorrowerProfile[]> {
    try {
      const querySnapshot = await getDocs(collection(db, BORROWERS_COLLECTION));
      return querySnapshot.docs.map(doc => 
        convertTimestamps({ id: doc.id, ...doc.data() }) as BorrowerProfile
      );
    } catch (error) {
      console.error('Error getting all borrowers:', error);
      throw error;
    }
  },

  // Update borrower profile
  async updateBorrower(id: string, updates: Partial<BorrowerProfile>): Promise<void> {
    try {
      const docRef = doc(db, BORROWERS_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating borrower:', error);
      throw error;
    }
  }
};

// Batch operations for better performance
export const batchService = {
  // Create multiple resources in a batch
  async createMultipleResources(resources: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    try {
      const batch = writeBatch(db);
      const resourceRefs = resources.map(() => doc(collection(db, RESOURCES_COLLECTION)));
      
      resources.forEach((resource, index) => {
        batch.set(resourceRefs[index], {
          ...resource,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      
      await batch.commit();
      return resourceRefs.map(ref => ref.id);
    } catch (error) {
      console.error('Error creating multiple resources:', error);
      throw error;
    }
  },

  // Update multiple resources in a batch
  async updateMultipleResources(updates: Array<{ id: string; data: Partial<Resource> }>): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ id, data }) => {
        const docRef = doc(db, RESOURCES_COLLECTION, id);
        batch.update(docRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error updating multiple resources:', error);
      throw error;
    }
  }
};

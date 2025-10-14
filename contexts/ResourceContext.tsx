import { cloudinaryService, imageUtils } from '@/firebase/cloudinary';
import { ResilientAgencyService } from '@/firebase/resilientAgency';
import { ResilientBorrowerService } from '@/firebase/resilientBorrower';
import { ResilientTransactionService } from '@/firebase/resilientTransaction';
import { resourceService } from '@/firebase/resources';
import { Agency, BorrowerProfile, MultiResourceTransaction, Resource, ResourceCategory, ResourceCondition, ResourceFilters, ResourceHistory, ResourceStats, ResourceTransaction, TransactionStatus } from '@/types/Resource';
import { CacheManager } from '@/utils/cacheManager';
import { generateMultiItemId, generateUniqueId } from '@/utils/idGenerator';
import { MaintenanceUtils } from '@/utils/maintenanceUtils';
import { SyncManager } from '@/utils/syncManager';
import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { useAuth } from './AuthContext';
import { useNetwork } from './NetworkContext';

interface ResourceState {
  resources: Resource[];
  transactions: ResourceTransaction[];
  multiTransactions: MultiResourceTransaction[];
  history: ResourceHistory[];
  borrowers: BorrowerProfile[];
  agencies: Agency[];
  filters: ResourceFilters;
  loading: boolean;
  error: string | null;
  stats: ResourceStats | null;
  selectedResource: Resource | null;
}

type ResourceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RESOURCES'; payload: Resource[] }
  | { type: 'ADD_RESOURCE'; payload: Resource }
  | { type: 'UPDATE_RESOURCE'; payload: Resource }
  | { type: 'DELETE_RESOURCE'; payload: string }
  | { type: 'SET_TRANSACTIONS'; payload: ResourceTransaction[] }
  | { type: 'ADD_TRANSACTION'; payload: ResourceTransaction }
  | { type: 'UPDATE_TRANSACTION'; payload: ResourceTransaction }
  | { type: 'SET_MULTI_TRANSACTIONS'; payload: MultiResourceTransaction[] }
  | { type: 'ADD_MULTI_TRANSACTION'; payload: MultiResourceTransaction }
  | { type: 'UPDATE_MULTI_TRANSACTION'; payload: MultiResourceTransaction }
  | { type: 'SET_BORROWERS'; payload: BorrowerProfile[] }
  | { type: 'ADD_BORROWER'; payload: BorrowerProfile }
  | { type: 'UPDATE_BORROWER'; payload: BorrowerProfile }
  | { type: 'SET_AGENCIES'; payload: Agency[] }
  | { type: 'ADD_AGENCY'; payload: Agency }
  | { type: 'UPDATE_AGENCY'; payload: Agency }
  | { type: 'SET_HISTORY'; payload: ResourceHistory[] }
  | { type: 'ADD_HISTORY'; payload: ResourceHistory }
  | { type: 'SET_FILTERS'; payload: ResourceFilters }
  | { type: 'SET_STATS'; payload: ResourceStats }
  | { type: 'SET_SELECTED_RESOURCE'; payload: Resource | null };

interface ResourceContextType {
  state: ResourceState;
  // Resource management
  addResource: (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateResource: (id: string, updates: Partial<Resource>, addHistory?: boolean) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  getResource: (id: string) => Resource | undefined;
  
  // Image management
  uploadResourceImage: (file: File | Blob | string, resourceId: string) => Promise<string>;
  uploadBorrowerImage: (file: File | Blob | string, borrowerName: string) => Promise<string>;
  deleteResourceImage: (publicId: string) => Promise<void>;
  deleteResourceImages: (publicIds: string[]) => Promise<void>;
  generateImageUrl: (publicId: string, options?: any) => string;
  
  // Transaction management
  borrowResource: (resourceId: string, quantity: number, notes?: string, dueDate?: Date, borrowerInfo?: {
    borrowerName: string;
    borrowerContact?: string;
    borrowerDepartment?: string;
    borrowerPicture?: string;
  }) => Promise<void>;
  returnResource: (transactionId: string, returnData: {
    quantity: number;
    condition: ResourceCondition;
    notes?: string;
  }) => Promise<void>;
  getActiveTransactions: () => ResourceTransaction[];
  getUserTransactions: (userId: string) => ResourceTransaction[];
  
  // Multi-resource borrowing
  borrowMultipleResources: (items: Array<{
    resourceId: string;
    quantity: number;
    dueDate?: Date;
    notes?: string;
  }>, borrowerInfo: {
    borrowerName: string;
    borrowerContact?: string;
    borrowerDepartment?: string;
    borrowerPicture?: string;
  }) => Promise<void>;
  returnMultiResourceItem: (multiTransactionId: string, itemId: string, returnData: {
    quantity: number;
    condition: ResourceCondition;
    notes?: string;
  }) => Promise<void>;
  getActiveMultiTransactions: () => MultiResourceTransaction[];
  getUserMultiTransactions: (userId: string) => MultiResourceTransaction[];
  
  // Borrower management
  getBorrowerProfile: (borrowerName: string) => Promise<BorrowerProfile | null>;
  getAllBorrowers: () => Promise<BorrowerProfile[]>;
  getBorrowerTransactions: (borrowerName: string) => {
    single: ResourceTransaction[];
    multi: MultiResourceTransaction[];
  };
  getBorrowerStats: (borrowerName: string) => {
    totalTransactions: number;
    activeTransactions: number;
    completedTransactions: number;
    overdueTransactions: number;
  };
  updateBorrowerProfile: (borrowerName: string, updates: Partial<BorrowerProfile>) => Promise<void>;
  
  // Agency management
  addAgency: (agency: Omit<Agency, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateAgency: (id: string, updates: Partial<Agency>) => Promise<void>;
  getAllAgencies: () => Promise<Agency[]>;
  getAgency: (id: string) => Agency | undefined;
  
  // Filtering and search
  setFilters: (filters: ResourceFilters) => void;
  getFilteredResources: () => Resource[];
  searchResources: (query: string) => Resource[];
  
  // Stats and analytics
  getStats: () => ResourceStats;
  refreshStats: () => Promise<void>;
  
  // History and tracking
  getResourceHistory: (resourceId: string) => ResourceHistory[];
  addHistoryEntry: (resourceId: string, action: string, details: string, userId?: string) => Promise<void>;
  
  // Selection
  selectResource: (resource: Resource | null) => void;
  
  // Location suggestions
  getLocationSuggestions: (query?: string) => string[];
  
  // Borrower name suggestions
  getBorrowerNameSuggestions: (query?: string) => string[];
  
  // Image cleanup
  cleanupBrokenImages: (resourceId: string) => Promise<void>;
  removeBrokenImageUrl: (resourceId: string, brokenImageUrl: string) => Promise<void>;
  
  // Sync and cache
  syncResources: () => Promise<Resource[]>;
  refreshResources: () => Promise<void>;
  refreshAllTransactions: () => Promise<void>;
  syncBorrowerData: () => Promise<void>;
}

const initialState: ResourceState = {
  resources: [],
  transactions: [],
  multiTransactions: [],
  history: [],
  borrowers: [],
  agencies: [],
  filters: {},
  loading: false,
  error: null,
  stats: null,
  selectedResource: null,
};

function resourceReducer(state: ResourceState, action: ResourceAction): ResourceState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_RESOURCES':
      return { ...state, resources: action.payload };
    case 'ADD_RESOURCE':
      return { ...state, resources: [...state.resources, action.payload] };
    case 'UPDATE_RESOURCE':
      return {
        ...state,
        resources: state.resources.map(r => r.id === action.payload.id ? action.payload : r)
      };
    case 'DELETE_RESOURCE':
      return {
        ...state,
        resources: state.resources.filter(r => r.id !== action.payload)
      };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t)
      };
    case 'SET_MULTI_TRANSACTIONS':
      return { ...state, multiTransactions: action.payload };
    case 'ADD_MULTI_TRANSACTION':
      return { ...state, multiTransactions: [...state.multiTransactions, action.payload] };
    case 'UPDATE_MULTI_TRANSACTION':
      return {
        ...state,
        multiTransactions: state.multiTransactions.map(t => t.id === action.payload.id ? action.payload : t)
      };
    case 'SET_BORROWERS':
      return { ...state, borrowers: action.payload };
    case 'ADD_BORROWER':
      return { ...state, borrowers: [...state.borrowers, action.payload] };
    case 'UPDATE_BORROWER':
      return {
        ...state,
        borrowers: state.borrowers.map(b => b.id === action.payload.id ? action.payload : b)
      };
    case 'SET_AGENCIES':
      return { ...state, agencies: action.payload };
    case 'ADD_AGENCY':
      return { ...state, agencies: [...state.agencies, action.payload] };
    case 'UPDATE_AGENCY':
      return {
        ...state,
        agencies: state.agencies.map(a => a.id === action.payload.id ? action.payload : a)
      };
    case 'SET_HISTORY':
      return { ...state, history: action.payload };
    case 'ADD_HISTORY':
      return { ...state, history: [...state.history, action.payload] };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_SELECTED_RESOURCE':
      return { ...state, selectedResource: action.payload };
    default:
      return state;
  }
}

const ResourceContext = createContext<ResourceContextType | undefined>(undefined);

export function ResourceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(resourceReducer, initialState);
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const cacheManager = CacheManager.getInstance();
  const syncManager = SyncManager.getInstance();
  const resilientAgencyService = ResilientAgencyService.getInstance();
  const resilientBorrowerService = ResilientBorrowerService.getInstance();
  const resilientTransactionService = ResilientTransactionService.getInstance();

  const addHistoryEntry = useCallback(async (resourceId: string, action: string, details: string, userId?: string) => {
    const actualUserId = userId || user?.id || '';
    const historyEntry: ResourceHistory = {
      id: generateUniqueId(),
      resourceId,
      action: action as ResourceHistory['action'],
      userId: actualUserId,
      details,
      timestamp: new Date(),
    };

    // Add to local state
    dispatch({ type: 'ADD_HISTORY', payload: historyEntry });

    // Update cache
    const updatedHistory = [...state.history, historyEntry];
    await cacheManager.set('history', updatedHistory);

    // Save to database if online
    if (isOnline && actualUserId) {
      try {
        await resourceService.addHistoryEntry(resourceId, action, details, actualUserId);
      } catch (error) {
        console.error('Failed to save history entry to database:', error);
        // Continue with local state even if database save fails
      }
    }
  }, [isOnline, user?.id, cacheManager]);

  const loadHistoryFromFirebase = useCallback(async (resources: Resource[]) => {
    try {
      // Get all resources first to know which resource histories to load
      const allHistory: ResourceHistory[] = [];
      
      // Load history for each resource
      for (const resource of resources) {
        try {
          const resourceHistory = await resourceService.getResourceHistory(resource.id);
          allHistory.push(...resourceHistory);
        } catch (error) {
          console.warn(`Failed to load history for resource ${resource.id}:`, error);
          // Continue with other resources even if one fails
        }
      }

      // Sort by timestamp (newest first)
      allHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      dispatch({ type: 'SET_HISTORY', payload: allHistory });
      
      // Cache the history
      await cacheManager.set('history', allHistory);
    } catch (error) {
      console.error('Failed to load history from Firebase:', error);
      // Don't throw - let the app continue with cached history or empty state
    }
  }, [cacheManager]);

  const loadHistory = useCallback(async () => {
    try {
      // Try to load from cache first
      const cachedHistory = await cacheManager.get<ResourceHistory[]>('history');
      if (cachedHistory) {
        dispatch({ type: 'SET_HISTORY', payload: cachedHistory });
      }

      // Note: History loading from Firebase is now handled in loadResources
      // to avoid circular dependencies and ensure we have the latest resources
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, [cacheManager]);

  const loadResources = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // If online, real-time listeners will handle data loading
      // Only load from cache if offline
      if (!isOnline) {
        // Try to load from cache first
        const cachedResources = await cacheManager.get<Resource[]>('resources');
        if (cachedResources) {
          dispatch({ type: 'SET_RESOURCES', payload: cachedResources });
        }

        // Load ALL cached transactions (not just active ones)
        const cachedTransactions = await cacheManager.get<ResourceTransaction[]>('transactions');
        if (cachedTransactions) {
          dispatch({ type: 'SET_TRANSACTIONS', payload: cachedTransactions });
        }

        // Load ALL cached multi-transactions (not just active ones)
        const cachedMultiTransactions = await cacheManager.get<MultiResourceTransaction[]>('multiTransactions');
        if (cachedMultiTransactions) {
          dispatch({ type: 'SET_MULTI_TRANSACTIONS', payload: cachedMultiTransactions });
        }

        // Load cached borrowers
        const cachedBorrowers = await cacheManager.get<BorrowerProfile[]>('borrowers');
        if (cachedBorrowers) {
          dispatch({ type: 'SET_BORROWERS', payload: cachedBorrowers });
        }
      } else {
        // If online, sync with Firebase (real-time listeners will update state)
        const syncedResources = await syncResources();
        // Use the synced resources for history loading
        if (syncedResources.length > 0) {
          await loadHistoryFromFirebase(syncedResources);
        }
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load resources' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load resources on mount
  useEffect(() => {
    if (user) {
      loadResources();
      loadHistory();
    }
  }, [user]);

  // Set up real-time listeners for transactions and multi-transactions
  useEffect(() => {
    if (!user || !isOnline) return;

    // Set up transaction listener
    const unsubscribeTransactions = resilientTransactionService.subscribeToTransactions((transactions) => {
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      // Update cache
      cacheManager.set('transactions', transactions);
    });

    // Set up multi-transaction listener
    const unsubscribeMultiTransactions = resilientTransactionService.subscribeToMultiTransactions((multiTransactions) => {
      dispatch({ type: 'SET_MULTI_TRANSACTIONS', payload: multiTransactions });
      // Update cache
      cacheManager.set('multiTransactions', multiTransactions);
    });

    // Set up resources listener
    const unsubscribeResources = resourceService.subscribeToResources((resources) => {
      dispatch({ type: 'SET_RESOURCES', payload: resources });
      // Update cache
      cacheManager.set('resources', resources);
    });

    // Set up borrowers listener
    const unsubscribeBorrowers = resilientBorrowerService.subscribeToBorrowers((borrowers) => {
      dispatch({ type: 'SET_BORROWERS', payload: borrowers });
      // Update cache
      cacheManager.set('borrowers', borrowers);
    });

    // Set up agencies listener (only if user is authenticated and online)
    let unsubscribeAgencies: (() => void) | undefined;
    if (user && isOnline) {
      try {
        unsubscribeAgencies = resilientAgencyService.setupAgenciesListener((agencies) => {
          dispatch({ type: 'SET_AGENCIES', payload: agencies });
          // Update cache
          cacheManager.set('agencies', agencies);
        });
      } catch (error) {
        console.error('Failed to set up agencies listener:', error);
        // Load agencies from cache as fallback
        cacheManager.get<Agency[]>('agencies').then(cachedAgencies => {
          if (cachedAgencies && cachedAgencies.length > 0) {
            dispatch({ type: 'SET_AGENCIES', payload: cachedAgencies });
          }
        });
      }
    }

    // Cleanup listeners on unmount
    return () => {
      unsubscribeTransactions();
      unsubscribeMultiTransactions();
      unsubscribeResources();
      unsubscribeBorrowers();
      if (unsubscribeAgencies) {
        unsubscribeAgencies();
      }
    };
  }, [user, isOnline, cacheManager]);

  const addResource = async (resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      let newResource: Resource;
      
      if (isOnline && user) {
        // Create in Firebase - the listener will handle adding to state
        const resourceId = await resourceService.createResource({
          ...resourceData,
          createdBy: user.id,
          updatedBy: user.id,
        });
        
        newResource = {
          ...resourceData,
          id: resourceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: user.id,
          updatedBy: user.id,
        };
        
        // Don't dispatch ADD_RESOURCE here - let the Firebase listener handle it
        // This prevents duplicate resources in the state
      } else {
        // Create locally
        newResource = {
          ...resourceData,
          id: generateUniqueId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: user?.id || 'local',
          updatedBy: user?.id || 'local',
        };
        
        // Only dispatch for offline mode
        dispatch({ type: 'ADD_RESOURCE', payload: newResource });
        
        // Queue for sync when online
        if (user) {
          await syncManager.queueOperation(
            'create',
            'resources',
            newResource.id,
            newResource
          );
        }
      }

      // Cache the updated resources (only for offline mode)
      if (!isOnline || !user) {
        const updatedResources = [...state.resources, newResource];
        await cacheManager.set('resources', updatedResources);
      }
      
      // Add to history
      await addHistoryEntry(newResource.id, 'created', 'Resource created');
    } catch (error) {
      console.error('Error adding resource:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add resource';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error; // Re-throw to let UI handle the error
    }
  };

  const updateResource = useCallback(async (id: string, updates: Partial<Resource>, addHistory: boolean = true) => {
    try {
      const currentResource = state.resources.find(r => r.id === id);
      if (!currentResource) {
        throw new Error('Resource not found');
      }

      // Check if images were removed and delete them from Cloudinary
      if (updates.images && currentResource.images) {
        const removedImages = currentResource.images.filter(img => !updates.images!.includes(img));
        if (removedImages.length > 0) {
          // Extract public IDs from removed image URLs
          const removedPublicIds = removedImages
            .map(url => extractPublicIdFromUrl(url))
            .filter(Boolean) as string[];

          // Delete removed images from Cloudinary
          if (removedPublicIds.length > 0) {
            try {
              await deleteResourceImages(removedPublicIds);
              // Clear image cache after successful deletion
              await clearImageCache(removedImages);
            } catch (error) {
              console.warn('Failed to delete some images from Cloudinary:', error);
              // Continue with the update even if image deletion fails
            }
          }
        }
      }

      const updatedResource = {
        ...currentResource,
        ...updates,
        updatedAt: new Date(),
        updatedBy: user?.id || 'local',
      } as Resource;

      if (isOnline && user) {
        // Update in Firebase
        await resourceService.updateResource(id, {
          ...updates,
          updatedBy: user.id,
        });
      } else {
        // Queue for sync when online
        if (user) {
          await syncManager.queueOperation(
            'update',
            'resources',
            id,
            updatedResource
          );
        }
      }

      dispatch({ type: 'UPDATE_RESOURCE', payload: updatedResource });
      
      // Cache the updated resources
      const updatedResources = state.resources.map(r => r.id === id ? updatedResource : r);
      await cacheManager.set('resources', updatedResources);
      
      // Add to history only if requested (for manual updates)
      if (addHistory) {
        await addHistoryEntry(id, 'updated', 'Resource updated');
      }
    } catch (error) {
      console.error('Error updating resource:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update resource';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error; // Re-throw to let UI handle the error
    }
  }, [state.resources, isOnline, user, cacheManager, syncManager]);

  const deleteResource = async (id: string) => {
    try {
      const resource = state.resources.find(r => r.id === id);
      
      // Delete all images from Cloudinary before deleting the resource
      if (resource && resource.images && resource.images.length > 0) {
        const publicIds = resource.images
          .map(url => extractPublicIdFromUrl(url))
          .filter(Boolean) as string[];

        if (publicIds.length > 0) {
          try {
            await deleteResourceImages(publicIds);
            // Clear image cache after successful deletion
            await clearImageCache(resource.images);
          } catch (error) {
            console.warn('Failed to delete some images from Cloudinary:', error);
            // Continue with resource deletion even if image deletion fails
          }
        }
      }

      if (isOnline && user) {
        // Delete from Firebase
        await resourceService.deleteResource(id);
      } else {
        // Queue for sync when online
        if (user) {
          await syncManager.queueOperation(
            'delete',
            'resources',
            id,
            { id }
          );
        }
      }

      dispatch({ type: 'DELETE_RESOURCE', payload: id });
      
      // Cache the updated resources
      const updatedResources = state.resources.filter(r => r.id !== id);
      await cacheManager.set('resources', updatedResources);
      
      // Add to history
      await addHistoryEntry(id, 'deleted', 'Resource deleted');
    } catch (error) {
      console.error('Error deleting resource:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete resource';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error; // Re-throw to let UI handle the error
    }
  };

  const getResource = (id: string) => {
    return state.resources.find(r => r.id === id);
  };

  const borrowResource = async (resourceId: string, quantity: number, notes?: string, dueDate?: Date, borrowerInfo?: {
    borrowerName: string;
    borrowerContact?: string;
    borrowerDepartment?: string;
    borrowerPicture?: string;
  }) => {
    try {
      const resource = getResource(resourceId);
      if (!resource || resource.availableQuantity < quantity) {
        throw new Error('Insufficient quantity available');
      }

      // Upload borrower image if provided
      let borrowerPictureUrl = borrowerInfo?.borrowerPicture;
      if (borrowerInfo?.borrowerPicture && typeof borrowerInfo.borrowerPicture === 'string') {
        try {
          // Check if it's already a URL or needs to be uploaded
          if (!borrowerInfo.borrowerPicture.startsWith('http')) {
            borrowerPictureUrl = await uploadBorrowerImage(borrowerInfo.borrowerPicture, borrowerInfo.borrowerName);
          }
        } catch (error) {
          console.warn('Failed to upload borrower image:', error);
          // Continue without image if upload fails
        }
      }

      // Use resilient transaction service
      const transactionId = await resilientTransactionService.createTransaction({
        resourceId,
        userId: user?.id || '',
        type: 'borrow',
        quantity,
        status: 'active',
        notes,
        dueDate,
        borrowerName: borrowerInfo?.borrowerName || 'Unknown',
        borrowerContact: borrowerInfo?.borrowerContact,
        borrowerDepartment: borrowerInfo?.borrowerDepartment,
        borrowerPicture: borrowerPictureUrl,
      });

      // Get the created transaction to add to local state
      const transaction = await resilientTransactionService.getTransactionById(transactionId);
      if (transaction) {
        dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
        
        // Cache the updated transactions
        const updatedTransactions = [...state.transactions, transaction];
        await cacheManager.set('transactions', updatedTransactions);
      }
      
      // Update resource availability
      await updateResource(resourceId, {
        availableQuantity: resource.availableQuantity - quantity
      }, false);
      
      // Update or create borrower profile
      if (transaction) {
        await updateBorrowerProfile(borrowerInfo?.borrowerName || 'Unknown', {
          name: borrowerInfo?.borrowerName || 'Unknown',
          contact: borrowerInfo?.borrowerContact,
          department: borrowerInfo?.borrowerDepartment,
          picture: borrowerPictureUrl,
          lastBorrowDate: new Date(),
        });
      }
      
      // Add to history
      await addHistoryEntry(resourceId, 'borrowed', `Borrowed ${quantity} units by ${borrowerInfo?.borrowerName || 'Unknown'}`);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to borrow resource' });
    }
  };

  const returnResource = async (transactionId: string, returnData: {
    quantity: number;
    condition: ResourceCondition;
    notes?: string;
  }) => {
    let originalResourceQuantity: number | null = null;
    let originalTransaction: ResourceTransaction | null = null;
    let originalResource: Resource | null = null;
    
    try {
      const transaction = state.transactions.find(t => t.id === transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Validate return quantity
      if (returnData.quantity <= 0) {
        throw new Error('Return quantity must be greater than 0');
      }
      if (returnData.quantity > transaction.quantity) {
        throw new Error('Cannot return more than borrowed quantity');
      }

      // Store original state for potential rollback
      originalTransaction = { ...transaction };
      const resource = getResource(transaction.resourceId);
      if (resource) {
        originalResourceQuantity = resource.availableQuantity;
        originalResource = { ...resource };
      }

      const isPartialReturn = returnData.quantity < transaction.quantity;
      const updatedTransaction = {
        ...transaction,
        status: isPartialReturn ? 'active' as TransactionStatus : 'completed' as TransactionStatus,
        returnedDate: new Date(),
        returnedQuantity: returnData.quantity,
        returnedCondition: returnData.condition,
        returnNotes: returnData.notes,
        quantity: isPartialReturn ? transaction.quantity - returnData.quantity : transaction.quantity,
        updatedAt: new Date(),
        notes: returnData.notes || transaction.notes,
      };

      // Optimistic update: Update UI immediately
      dispatch({ type: 'UPDATE_TRANSACTION', payload: updatedTransaction });
      
      // Update resource availability optimistically
      if (resource) {
        const updatedResource = {
          ...resource,
          availableQuantity: resource.availableQuantity + returnData.quantity,
          updatedAt: new Date(),
        };
        dispatch({ type: 'UPDATE_RESOURCE', payload: updatedResource });
      }

      // Use resilient transaction service for update
      await resilientTransactionService.updateTransaction(transactionId, {
        status: isPartialReturn ? 'active' : 'completed',
        returnedDate: new Date(),
        returnedQuantity: returnData.quantity,
        returnedCondition: returnData.condition,
        returnNotes: returnData.notes,
        quantity: isPartialReturn ? transaction.quantity - returnData.quantity : transaction.quantity,
        notes: returnData.notes || transaction.notes,
      });

      // Cache the updated transactions
      const updatedTransactions = state.transactions.map(t => t.id === transactionId ? updatedTransaction : t);
      await cacheManager.set('transactions', updatedTransactions);
      
      // Update resource availability in Firebase (parallel with other operations)
      const resourceUpdatePromise = resource ? updateResource(transaction.resourceId, {
        availableQuantity: resource.availableQuantity + returnData.quantity
      }, false) : Promise.resolve();
      
      // Update borrower profile (parallel with other operations)
      const borrowerUpdatePromise = updateBorrowerProfile(transaction.borrowerName, {
        // Only include defined values to avoid Firebase errors
        ...(transaction.borrowerContact && { contact: transaction.borrowerContact }),
        ...(transaction.borrowerDepartment && { department: transaction.borrowerDepartment }),
        ...(transaction.borrowerPicture && { picture: transaction.borrowerPicture }),
      });
      
      // Add to history (parallel with other operations)
      const historyPromise = addHistoryEntry(
        transaction.resourceId, 
        'returned', 
        `Returned ${returnData.quantity} units${isPartialReturn ? ` (${transaction.quantity - returnData.quantity} remaining)` : ''} - Condition: ${returnData.condition}`, 
        transaction.userId
      );

      // Execute all operations in parallel
      await Promise.all([
        resourceUpdatePromise,
        borrowerUpdatePromise,
        historyPromise
      ]);

    } catch (error) {
      console.error('Error returning resource:', error);
      
      // Rollback: Restore original state
      if (originalTransaction) {
        dispatch({ type: 'UPDATE_TRANSACTION', payload: originalTransaction });
        
        if (originalResource && originalResourceQuantity !== null) {
          const rolledBackResource = {
            ...originalResource,
            availableQuantity: originalResourceQuantity,
            updatedAt: new Date(),
          };
          dispatch({ type: 'UPDATE_RESOURCE', payload: rolledBackResource });
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to return resource';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error; // Re-throw to let the UI handle the error
    }
  };

  const getActiveTransactions = useCallback(() => {
    return state.transactions.filter(t => t.status === 'active');
  }, [state.transactions]);

  const getUserTransactions = useCallback((userId: string) => {
    return state.transactions.filter(t => t.userId === userId);
  }, [state.transactions]);

  // Multi-resource borrowing functions
  const borrowMultipleResources = async (
    items: Array<{
      resourceId: string;
      quantity: number;
      dueDate?: Date;
      notes?: string;
    }>, 
    borrowerInfo: {
      borrowerName: string;
      borrowerContact?: string;
      borrowerDepartment?: string;
      borrowerPicture?: string;
    }
  ) => {
    try {
      // Validate all resources have sufficient quantity
      for (const item of items) {
        const resource = getResource(item.resourceId);
        if (!resource || resource.availableQuantity < item.quantity) {
          throw new Error(`Insufficient quantity available for ${resource?.name || 'unknown resource'}`);
        }
      }

      // Upload borrower image if provided
      let borrowerPictureUrl = borrowerInfo.borrowerPicture;
      if (borrowerInfo.borrowerPicture && typeof borrowerInfo.borrowerPicture === 'string') {
        try {
          // Check if it's already a URL or needs to be uploaded
          if (!borrowerInfo.borrowerPicture.startsWith('http')) {
            borrowerPictureUrl = await uploadBorrowerImage(borrowerInfo.borrowerPicture, borrowerInfo.borrowerName);
          }
        } catch (error) {
          console.warn('Failed to upload borrower image:', error);
          // Continue without image if upload fails
        }
      }

      const multiTransaction: MultiResourceTransaction = {
        id: generateUniqueId(),
        userId: user?.id || '',
        type: 'borrow',
        status: 'active',
        notes: undefined,
        borrowerName: borrowerInfo.borrowerName,
        borrowerContact: borrowerInfo.borrowerContact,
        borrowerDepartment: borrowerInfo.borrowerDepartment,
        borrowerPicture: borrowerPictureUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: items.map((item, index) => ({
          id: generateMultiItemId(index),
          resourceId: item.resourceId,
          quantity: item.quantity,
          dueDate: item.dueDate,
          status: 'active' as TransactionStatus,
          notes: item.notes,
        }))
      };

      // Save to Firebase if online
      let firebaseSuccess = false;
      if (isOnline && user) {
        try {
          const transactionId = await resilientTransactionService.createMultiTransaction(multiTransaction);
          multiTransaction.id = transactionId;
          firebaseSuccess = true;
        } catch (error) {
          console.warn('Failed to save multi-transaction to Firebase:', error);
          // Continue with local state
        }
      } else {
        firebaseSuccess = true; // Consider offline as success
      }

      // Only update local state and resources if Firebase succeeded or we're offline
      if (firebaseSuccess) {
        dispatch({ type: 'ADD_MULTI_TRANSACTION', payload: multiTransaction });

        // Cache the updated multi-transactions
        const updatedMultiTransactions = [...state.multiTransactions, multiTransaction];
        await cacheManager.set('multiTransactions', updatedMultiTransactions);

        // Update resource availability for each item
        for (const item of items) {
          const resource = getResource(item.resourceId);
          if (resource) {
            await updateResource(item.resourceId, {
              availableQuantity: resource.availableQuantity - item.quantity
            }, false);
          }
        }
      } else {
        // Rollback: Don't update resources if Firebase failed
        throw new Error('Failed to create multi-transaction in Firebase');
      }

      // Update or create borrower profile
      await updateBorrowerProfile(borrowerInfo.borrowerName, {
        name: borrowerInfo.borrowerName,
        contact: borrowerInfo.borrowerContact,
        department: borrowerInfo.borrowerDepartment,
        picture: borrowerPictureUrl,
        lastBorrowDate: new Date(),
      });

      // Add to history for each resource
      for (const item of items) {
        await addHistoryEntry(item.resourceId, 'borrowed', `Borrowed ${item.quantity} units (Multi-borrow) by ${borrowerInfo.borrowerName}`);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to borrow multiple resources' });
    }
  };

  const returnMultiResourceItem = async (multiTransactionId: string, itemId: string, returnData: {
    quantity: number;
    condition: ResourceCondition;
    notes?: string;
  }) => {
    let originalResourceQuantity: number | null = null;
    let originalMultiTransaction: MultiResourceTransaction | null = null;
    let originalResource: Resource | null = null;
    
    try {
      const multiTransaction = state.multiTransactions.find(t => t.id === multiTransactionId);
      if (!multiTransaction) {
        throw new Error('Multi-transaction not found');
      }

      const item = multiTransaction.items.find(i => i.id === itemId);
      if (!item) {
        throw new Error('Item not found in transaction');
      }

      // Validate return quantity
      if (returnData.quantity <= 0) {
        throw new Error('Return quantity must be greater than 0');
      }
      if (returnData.quantity > item.quantity) {
        throw new Error('Cannot return more than borrowed quantity');
      }

      // Store original state for potential rollback
      originalMultiTransaction = { ...multiTransaction };
      const resource = getResource(item.resourceId);
      if (resource) {
        originalResourceQuantity = resource.availableQuantity;
        originalResource = { ...resource };
      }

      const isPartialReturn = returnData.quantity < item.quantity;
      
      // Update the specific item
      const updatedItem = {
        ...item,
        status: isPartialReturn ? 'active' as TransactionStatus : 'completed' as TransactionStatus,
        returnedDate: new Date(),
        returnedQuantity: returnData.quantity,
        returnedCondition: returnData.condition,
        returnNotes: returnData.notes,
        quantity: isPartialReturn ? item.quantity - returnData.quantity : item.quantity,
        notes: returnData.notes || item.notes,
      };

      const updatedItems = multiTransaction.items.map(i => i.id === itemId ? updatedItem : i);
      const allItemsReturned = updatedItems.every(i => i.status === 'completed');

      const updatedMultiTransaction = {
        ...multiTransaction,
        items: updatedItems,
        status: allItemsReturned ? 'completed' as TransactionStatus : multiTransaction.status,
        updatedAt: new Date(),
      };

      // Optimistic update: Update UI immediately
      dispatch({ type: 'UPDATE_MULTI_TRANSACTION', payload: updatedMultiTransaction });
      
      // Update resource availability optimistically
      if (resource) {
        const updatedResource = {
          ...resource,
          availableQuantity: resource.availableQuantity + returnData.quantity,
          updatedAt: new Date(),
        };
        dispatch({ type: 'UPDATE_RESOURCE', payload: updatedResource });
      }

      // Use resilient transaction service for update
      await resilientTransactionService.updateMultiTransaction(multiTransactionId, {
        items: updatedItems,
        status: allItemsReturned ? 'completed' : multiTransaction.status,
      });

      // Cache the updated multi-transactions
      const updatedMultiTransactions = state.multiTransactions.map(t => t.id === multiTransactionId ? updatedMultiTransaction : t);
      await cacheManager.set('multiTransactions', updatedMultiTransactions);

      // Update resource availability in Firebase (parallel with other operations)
      const resourceUpdatePromise = resource ? updateResource(item.resourceId, {
        availableQuantity: resource.availableQuantity + returnData.quantity
      }, false) : Promise.resolve();

      // Update borrower profile (parallel with other operations)
      const borrowerUpdatePromise = updateBorrowerProfile(multiTransaction.borrowerName, {
        // Only include defined values to avoid Firebase errors
        ...(multiTransaction.borrowerContact && { contact: multiTransaction.borrowerContact }),
        ...(multiTransaction.borrowerDepartment && { department: multiTransaction.borrowerDepartment }),
        ...(multiTransaction.borrowerPicture && { picture: multiTransaction.borrowerPicture }),
      });

      // Add to history (parallel with other operations)
      const historyPromise = addHistoryEntry(
        item.resourceId, 
        'returned', 
        `Returned ${returnData.quantity} units (Multi-borrow)${isPartialReturn ? ` (${item.quantity - returnData.quantity} remaining)` : ''} - Condition: ${returnData.condition}`, 
        multiTransaction.userId
      );

      // Execute all operations in parallel
      await Promise.all([
        resourceUpdatePromise,
        borrowerUpdatePromise,
        historyPromise
      ]);

    } catch (error) {
      console.error('Error returning multi-resource item:', error);
      
      // Rollback: Restore original state
      if (originalMultiTransaction) {
        dispatch({ type: 'UPDATE_MULTI_TRANSACTION', payload: originalMultiTransaction });
        
        if (originalResource && originalResourceQuantity !== null) {
          const item = originalMultiTransaction.items.find(i => i.id === itemId);
          if (item) {
            const rolledBackResource = {
              ...originalResource,
              availableQuantity: originalResourceQuantity,
              updatedAt: new Date(),
            };
            dispatch({ type: 'UPDATE_RESOURCE', payload: rolledBackResource });
          }
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to return multi-resource item';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error; // Re-throw to let the UI handle the error
    }
  };

  const getActiveMultiTransactions = () => {
    return state.multiTransactions.filter(t => t.status === 'active');
  };

  const getUserMultiTransactions = (userId: string) => {
    return state.multiTransactions.filter(t => t.userId === userId);
  };

  // Borrower management functions
  const getBorrowerProfile = useCallback(async (borrowerName: string): Promise<BorrowerProfile | null> => {
    try {
      // First check local state
      const localBorrower = state.borrowers.find(b => b.name === borrowerName);
      if (localBorrower) {
        return localBorrower;
      }

      // If not found locally, try to get from resilient service
      const borrower = await resilientBorrowerService.getBorrowerByName(borrowerName);
      if (borrower) {
        // Add to local state
        dispatch({ type: 'ADD_BORROWER', payload: borrower });
        // Cache the result
        await cacheManager.set('borrowers', [...state.borrowers, borrower]);
      }
      
      return borrower;
    } catch (error) {
      console.error('Error getting borrower profile:', error);
      return null;
    }
  }, [state.borrowers, cacheManager]);

  const getAllBorrowers = useCallback(async (): Promise<BorrowerProfile[]> => {
    try {
      // If we have local data, return it
      if (state.borrowers.length > 0) {
        return state.borrowers;
      }

      // Otherwise, get from resilient service
      const borrowers = await resilientBorrowerService.getAllBorrowers();
      if (borrowers.length > 0) {
        dispatch({ type: 'SET_BORROWERS', payload: borrowers });
        await cacheManager.set('borrowers', borrowers);
      }
      
      return borrowers;
    } catch (error) {
      console.error('Error getting all borrowers:', error);
      return state.borrowers;
    }
  }, [state.borrowers, cacheManager]);

  const getBorrowerTransactions = useCallback((borrowerName: string) => {
    const single = state.transactions.filter(t => t.borrowerName === borrowerName);
    const multi = state.multiTransactions.filter(t => t.borrowerName === borrowerName);
    return { single, multi };
  }, [state.transactions, state.multiTransactions]);

  // Real-time calculation of borrower statistics (transaction counts only)
  const getBorrowerStats = useCallback((borrowerName: string) => {
    const borrowerTransactions = getBorrowerTransactions(borrowerName);
    
    // Transaction-based metrics only
    const totalTransactions = borrowerTransactions.single.length + borrowerTransactions.multi.length;
    
    const activeSingle = borrowerTransactions.single.filter(t => t.status === 'active');
    const activeMulti = borrowerTransactions.multi.filter(t => t.status === 'active');
    const activeTransactions = activeSingle.length + activeMulti.length;
    
    const completedSingle = borrowerTransactions.single.filter(t => t.status === 'completed');
    const completedMulti = borrowerTransactions.multi.filter(t => t.status === 'completed');
    const completedTransactions = completedSingle.length + completedMulti.length;
    
    const overdueSingle = activeSingle.filter(t => t.dueDate && t.dueDate < new Date()).length;
    const overdueMulti = activeMulti.reduce((count, multiT) => {
      const overdueItems = multiT.items.filter(item => 
        item.status === 'active' && item.dueDate && item.dueDate < new Date()
      ).length;
      return count + overdueItems;
    }, 0);
    const overdueTransactions = overdueSingle + overdueMulti;
    
    return {
      totalTransactions,
      activeTransactions,
      completedTransactions,
      overdueTransactions,
    };
  }, [getBorrowerTransactions]);

  const updateBorrowerProfile = useCallback(async (borrowerName: string, updates: Partial<BorrowerProfile>) => {
    try {
      const existingBorrower = await getBorrowerProfile(borrowerName);
      
      // Filter out undefined values to avoid Firebase errors
      const borrowerData = {
        name: borrowerName,
        lastBorrowDate: updates.lastBorrowDate || new Date(),
        // Only include defined values
        ...(updates.contact !== undefined && { contact: updates.contact }),
        ...(updates.department !== undefined && { department: updates.department }),
        ...(updates.picture !== undefined && { picture: updates.picture }),
      };

      // Use resilient service for upsert
      const borrowerId = await resilientBorrowerService.upsertBorrower(borrowerData);
      
      // Get the updated borrower data
      const updatedBorrower = await resilientBorrowerService.getBorrowerById(borrowerId);
      
      if (updatedBorrower) {
        // Update local state
        if (existingBorrower) {
          dispatch({ type: 'UPDATE_BORROWER', payload: updatedBorrower });
        } else {
          dispatch({ type: 'ADD_BORROWER', payload: updatedBorrower });
        }
        
        // Update cache
        const updatedBorrowers = existingBorrower 
          ? state.borrowers.map(b => b.id === existingBorrower.id ? updatedBorrower : b)
          : [...state.borrowers, updatedBorrower];
        await cacheManager.set('borrowers', updatedBorrowers);
      }
    } catch (error) {
      console.error('Error updating borrower profile:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update borrower profile' });
    }
  }, [getBorrowerProfile, cacheManager]);

  // Agency management functions
  const addAgency = useCallback(async (agencyData: Omit<Agency, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      // Use ResilientAgencyService to save to database
      const agencyId = await resilientAgencyService.upsertAgency(agencyData);
      
      // The listener will update the local state automatically
      console.log('Agency saved successfully with ID:', agencyId);
      
      return agencyId;

    } catch (error) {
      console.error('Error adding agency:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add agency' });
      throw error;
    }
  }, [resilientAgencyService]);

  const updateAgency = useCallback(async (id: string, updates: Partial<Agency>) => {
    try {
      const existingAgency = state.agencies.find(a => a.id === id);
      if (!existingAgency) {
        throw new Error('Agency not found');
      }

      // Use ResilientAgencyService to update in database
      const updatedAgencyData = {
        ...existingAgency,
        ...updates,
      };
      
      await resilientAgencyService.upsertAgency(updatedAgencyData);
      
      // The listener will update the local state automatically
      console.log('Agency updated successfully');

    } catch (error) {
      console.error('Error updating agency:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update agency' });
      throw error;
    }
  }, [state.agencies, resilientAgencyService]);

  const getAllAgencies = useCallback(async (): Promise<Agency[]> => {
    try {
      // If we have local data, return it
      if (state.agencies.length > 0) {
        return state.agencies;
      }

      // Load from database using ResilientAgencyService
      const agencies = await resilientAgencyService.getAllAgencies();
      dispatch({ type: 'SET_AGENCIES', payload: agencies });
      return agencies;
    } catch (error) {
      console.error('Error getting agencies:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to get agencies' });
      return [];
    }
  }, [state.agencies, resilientAgencyService]);

  const getAgency = useCallback((id: string): Agency | undefined => {
    return state.agencies.find(a => a.id === id);
  }, [state.agencies]);

  const setFilters = (filters: Partial<ResourceFilters>) => {
    const newFilters = { ...state.filters, ...filters };
    dispatch({ type: 'SET_FILTERS', payload: newFilters });
  };

  const getFilteredResources = useCallback(() => {
    let filtered = state.resources;

    if (state.filters.category) {
      filtered = filtered.filter(r => r.category === state.filters.category);
    }

    if (state.filters.status) {
      filtered = filtered.filter(r => r.status === state.filters.status);
    }

    if (state.filters.condition) {
      filtered = filtered.filter(r => r.condition === state.filters.condition);
    }

    if (state.filters.available) {
      filtered = filtered.filter(r => r.availableQuantity > 0);
    }

    if (state.filters.agencyId) {
      filtered = filtered.filter(r => r.agencyId === state.filters.agencyId);
    }

    if (state.filters.resourceType) {
      filtered = filtered.filter(r => r.resourceType === state.filters.resourceType);
    }

    if (state.filters.search && state.filters.search.trim()) {
      const searchLower = state.filters.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower) ||
        r.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        (r.agencyName && r.agencyName.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [state.resources, state.filters.category, state.filters.status, state.filters.condition, state.filters.available, state.filters.agencyId, state.filters.resourceType, state.filters.search]);

  const searchResources = (query: string) => {
    const searchLower = query.toLowerCase();
    return state.resources.filter(r => 
      r.name.toLowerCase().includes(searchLower) ||
      r.description.toLowerCase().includes(searchLower) ||
      r.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  };

  const getStats = (): ResourceStats => {
    const totalResources = state.resources.length;
    const availableResources = state.resources.reduce((sum, r) => sum + r.availableQuantity, 0);
    const borrowedResources = state.resources.reduce((sum, r) => sum + (r.totalQuantity - r.availableQuantity), 0);
    
    // Use MaintenanceUtils to calculate maintenance due
    const maintenanceStats = MaintenanceUtils.getMaintenanceStats(state.resources);
    
    const categories = state.resources.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {} as Record<ResourceCategory, number>);

    return {
      totalResources,
      availableResources,
      borrowedResources,
      maintenanceDue: maintenanceStats.overdue,
      categories,
    };
  };

  const refreshStats = async () => {
    const stats = getStats();
    dispatch({ type: 'SET_STATS', payload: stats });
  };

  const getResourceHistory = (resourceId: string) => {
    return state.history.filter(h => h.resourceId === resourceId);
  };


  const selectResource = (resource: Resource | null) => {
    dispatch({ type: 'SET_SELECTED_RESOURCE', payload: resource });
  };

  const getLocationSuggestions = (query?: string): string[] => {
    // Get all unique locations from existing resources
    const allLocations = state.resources
      .map(resource => resource.location)
      .filter(location => location && location.trim().length > 0)
      .map(location => location.trim());
    
    // Remove duplicates
    const uniqueLocations = Array.from(new Set(allLocations));
    
    // If query is provided, filter locations that contain the query
    if (query && query.trim().length > 0) {
      const queryLower = query.toLowerCase();
      return uniqueLocations
        .filter(location => location.toLowerCase().includes(queryLower))
        .sort();
    }
    
    // Return all unique locations sorted alphabetically
    return uniqueLocations.sort();
  };

  const getBorrowerNameSuggestions = (query?: string): string[] => {
    // Get all unique borrower names from existing borrowers and transactions
    const allBorrowerNames = [
      ...(state.borrowers || []).map(borrower => borrower.name),
      ...(state.transactions || []).map(transaction => transaction.borrowerName),
      ...(state.multiTransactions || []).map(transaction => transaction.borrowerName)
    ]
      .filter(name => name && name.trim().length > 0)
      .map(name => name.trim());
    
    // Remove duplicates
    const uniqueNames = Array.from(new Set(allBorrowerNames));
    
    // If query is provided, filter names that contain the query
    if (query && query.trim().length > 0) {
      const queryLower = query.toLowerCase();
      return uniqueNames
        .filter(name => name.toLowerCase().includes(queryLower))
        .sort();
    }
    
    // Return all unique names sorted alphabetically
    return uniqueNames.sort();
  };

  const syncResources = async (): Promise<Resource[]> => {
    try {
      if (!isOnline || !user) return [];
      
      // Load resources from Firebase
      const firebaseResources = await resourceService.getAllResources();
      dispatch({ type: 'SET_RESOURCES', payload: firebaseResources });
      
      // Cache the resources
      await cacheManager.set('resources', firebaseResources);
      
      // Load ALL transactions (not just active ones) using resilient service
      const transactions = await resilientTransactionService.getAllTransactions();
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      
      // Cache transactions
      await cacheManager.set('transactions', transactions);
      
      // Load ALL multi-transactions (not just active ones) using resilient service
      const multiTransactions = await resilientTransactionService.getAllMultiTransactions();
      dispatch({ type: 'SET_MULTI_TRANSACTIONS', payload: multiTransactions });
      
      // Cache multi-transactions
      await cacheManager.set('multiTransactions', multiTransactions);
      
      // Load borrowers using resilient service
      const borrowers = await resilientBorrowerService.getAllBorrowers();
      dispatch({ type: 'SET_BORROWERS', payload: borrowers });
      
      // Cache borrowers
      await cacheManager.set('borrowers', borrowers);
      
      console.log('Successfully synced resources with Firebase');
      return firebaseResources;
    } catch (error) {
      console.error('Failed to sync resources:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sync with server' });
      return [];
    }
  };

  const refreshResources = async () => {
    await loadResources();
    await refreshStats();
  };

  // Refresh all transaction data from database
  const refreshAllTransactions = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Load ALL transactions from database
      const transactions = await resilientTransactionService.getAllTransactions();
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      
      // Load ALL multi-transactions from database
      const multiTransactions = await resilientTransactionService.getAllMultiTransactions();
      dispatch({ type: 'SET_MULTI_TRANSACTIONS', payload: multiTransactions });
      
      // Update cache
      await cacheManager.set('transactions', transactions);
      await cacheManager.set('multiTransactions', multiTransactions);
    } catch (error) {
      console.error('Failed to refresh transaction data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh transaction data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const syncBorrowerData = async () => {
    try {
      await resilientBorrowerService.syncBorrowerData();
      const borrowers = await resilientBorrowerService.getAllBorrowers();
      dispatch({ type: 'SET_BORROWERS', payload: borrowers });
      await cacheManager.set('borrowers', borrowers);
    } catch (error) {
      console.error('Failed to sync borrower data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sync borrower data' });
    }
  };


  // Image management functions
  const uploadResourceImage = async (file: File | Blob | string, resourceId: string): Promise<string> => {
    try {
      const result = await imageUtils.uploadResourceImage(file, resourceId);
      return result.secure_url;
    } catch (error) {
      console.error('Error uploading resource image:', error);
      throw error;
    }
  };

  const uploadBorrowerImage = async (file: File | Blob | string, borrowerName: string): Promise<string> => {
    try {
      const result = await imageUtils.uploadBorrowerImage(file, borrowerName);
      return result.secure_url;
    } catch (error) {
      console.error('Error uploading borrower image:', error);
      throw error;
    }
  };

  const deleteResourceImage = async (publicId: string): Promise<void> => {
    try {
      await cloudinaryService.deleteImage(publicId);
    } catch (error) {
      console.warn('Error deleting resource image (continuing anyway):', error);
      // Don't throw - just log and continue
      // This prevents resource operations from failing due to image deletion issues
    }
  };

  const deleteResourceImages = async (publicIds: string[]): Promise<void> => {
    try {
      if (publicIds.length > 0) {
        await cloudinaryService.deleteMultipleImages(publicIds);
      }
    } catch (error) {
      console.warn('Error deleting resource images (continuing anyway):', error);
      // Don't throw - just log and continue
      // This prevents resource operations from failing due to image deletion issues
    }
  };

  const generateImageUrl = (publicId: string, options?: any): string => {
    try {
      return imageUtils.generateResourceImageUrl(publicId, options);
    } catch (error) {
      console.error('Error generating image URL:', error);
      return publicId; // Fallback to original URL
    }
  };

  // Helper function to extract public ID from Cloudinary URL
  const extractPublicIdFromUrl = (url: string): string | null => {
    try {
      // Handle different Cloudinary URL formats
      const patterns = [
        /\/v\d+\/(.+?)(?:\.[^.]+)?$/, // Standard format: /v1234567890/folder/image
        /\/image\/upload\/(.+?)(?:\.[^.]+)?$/, // Upload format: /image/upload/folder/image
        /\/image\/fetch\/(.+?)(?:\.[^.]+)?$/, // Fetch format: /image/fetch/folder/image
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }

      // If no pattern matches, try to extract from the end of the URL
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      const withoutExtension = lastPart.split('.')[0];
      
      return withoutExtension || null;
    } catch (error) {
      console.warn('Failed to extract public ID from URL:', url, error);
      return null;
    }
  };

  // Helper function to clear image cache
  const clearImageCache = async (imageUrls: string[]) => {
    try {
      // Clear from memory cache
      for (const url of imageUrls) {
        cacheManager.delete(url);
      }
      
      // Clear from offline storage if it exists
      for (const url of imageUrls) {
        try {
          await cacheManager.delete(url);
        } catch (error) {
          // Ignore errors for cache clearing
        }
      }
    } catch (error) {
      console.warn('Failed to clear image cache:', error);
    }
  };

  // Helper function to validate and clean image URLs
  const validateImageUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    if (url.trim().length === 0) return false;
    if (!url.startsWith('http')) return false;
    return true;
  };

  // Function to clean up broken image URLs from a resource
  const cleanupBrokenImages = useCallback(async (resourceId: string) => {
    try {
      const resource = state.resources.find(r => r.id === resourceId);
      if (!resource || !resource.images) return;

      const validImages = resource.images.filter(validateImageUrl);
      
      // If some images were removed, update the resource
      if (validImages.length !== resource.images.length) {
        console.log(`Cleaning up ${resource.images.length - validImages.length} broken image URLs for resource ${resourceId}`);
        
        await updateResource(resourceId, {
          images: validImages
        }, false);
      }
    } catch (error) {
      console.warn('Failed to cleanup broken images:', error);
    }
  }, [state.resources, updateResource]);

  // Function to remove a specific broken image URL from a resource
  const removeBrokenImageUrl = async (resourceId: string, brokenImageUrl: string) => {
    try {
      const resource = state.resources.find(r => r.id === resourceId);
      if (!resource || !resource.images) return;

      const updatedImages = resource.images.filter(img => img !== brokenImageUrl);
      
      if (updatedImages.length !== resource.images.length) {
        console.log(`Removing broken image URL from resource ${resourceId}:`, brokenImageUrl);
        
        await updateResource(resourceId, {
          images: updatedImages
        }, false);
      }
    } catch (error) {
      console.warn('Failed to remove broken image URL:', error);
    }
  };

  const value: ResourceContextType = {
    state,
    addResource,
    updateResource,
    deleteResource,
    getResource,
    uploadResourceImage,
    uploadBorrowerImage,
    deleteResourceImage,
    deleteResourceImages,
    generateImageUrl,
    borrowResource,
    returnResource,
    getActiveTransactions,
    getUserTransactions,
    borrowMultipleResources,
    returnMultiResourceItem,
    getActiveMultiTransactions,
    getUserMultiTransactions,
    getBorrowerProfile,
    getAllBorrowers,
    getBorrowerTransactions,
    getBorrowerStats,
    updateBorrowerProfile,
    addAgency,
    updateAgency,
    getAllAgencies,
    getAgency,
    setFilters,
    getFilteredResources,
    searchResources,
    getStats,
    refreshStats,
    getResourceHistory,
    addHistoryEntry,
    selectResource,
    getLocationSuggestions,
    getBorrowerNameSuggestions,
    cleanupBrokenImages,
    removeBrokenImageUrl,
    syncResources,
    refreshResources,
    refreshAllTransactions,
    syncBorrowerData,
  };

  return (
    <ResourceContext.Provider value={value}>
      {children}
    </ResourceContext.Provider>
  );
}

export function useResources() {
  const context = useContext(ResourceContext);
  if (context === undefined) {
    throw new Error('useResources must be used within a ResourceProvider');
  }
  return context;
}


import { Agency } from '@/types/Resource';
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

export class ResilientAgencyService {
  private static instance: ResilientAgencyService;
  private offlineStorage: OfflineStorage;
  private syncManager: SyncManager;
  private networkManager: NetworkManager;
  private readonly AGENCIES_COLLECTION = 'agencies';

  private constructor() {
    this.offlineStorage = OfflineStorage.getInstance();
    this.syncManager = SyncManager.getInstance();
    this.networkManager = NetworkManager.getInstance();
  }

  static getInstance(): ResilientAgencyService {
    if (ResilientAgencyService.instance) {
      return ResilientAgencyService.instance;
    }
    ResilientAgencyService.instance = new ResilientAgencyService();
    return ResilientAgencyService.instance;
  }

  // Validate agency data
  private validateAgencyData(agencyData: Omit<Agency, 'id' | 'createdAt' | 'updatedAt'>): void {
    if (!agencyData.name || agencyData.name.trim().length === 0) {
      throw new Error('Agency name is required');
    }
    if (!agencyData.address || agencyData.address.trim().length === 0) {
      throw new Error('Agency address is required');
    }
    if (!agencyData.contactNumbers || agencyData.contactNumbers.length === 0) {
      throw new Error('At least one contact number is required');
    }
    
    // Validate contact numbers format (Philippine 11-digit format)
    const phoneRegex = /^09\d{9}$/;
    for (const contactNumber of agencyData.contactNumbers) {
      if (!phoneRegex.test(contactNumber)) {
        throw new Error(`Invalid contact number format: ${contactNumber}. Must be 11 digits starting with 09`);
      }
    }
  }

  // Create or update an agency with offline support
  async upsertAgency(agencyData: Omit<Agency, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Validate agency data
      this.validateAgencyData(agencyData);

      // Check if agency already exists by name
      const existingAgency = await this.findAgencyByName(agencyData.name);
      
      if (existingAgency) {
        // Update existing agency
        return await this.updateAgency(existingAgency.id, agencyData);
      } else {
        // Create new agency
        return await this.createAgency(agencyData);
      }
    } catch (error) {
      console.error('Error upserting agency:', error);
      throw error;
    }
  }

  // Create a new agency
  private async createAgency(agencyData: Omit<Agency, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const agencyId = this.generateAgencyId();
    const now = new Date();
    
    const newAgency: Agency = {
      ...agencyData,
      id: agencyId,
      createdAt: now,
      updatedAt: now,
    };

    // Try to save to Firebase first
    try {
      await withRetry(async () => {
        const agencyRef = doc(db, this.AGENCIES_COLLECTION, agencyId);
        await setDoc(agencyRef, {
          ...newAgency,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      // If successful, add to sync queue for offline operations
      await this.syncManager.queueOperation('create', 'agencies', agencyId, newAgency);
      
      return agencyId;
    } catch (error) {
      console.log('Failed to save agency to Firebase, storing offline:', error);
      
      // Store offline for later sync
      await this.offlineStorage.storeOfflineData('agencies', agencyId, {
        ...newAgency,
        _offline: true,
        _pendingSync: true,
      });

      // Add to sync queue
      await this.syncManager.queueOperation('create', 'agencies', agencyId, newAgency);
      
      return agencyId;
    }
  }

  // Update an existing agency
  private async updateAgency(agencyId: string, updates: Omit<Agency, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    const updatedAgency: Agency = {
      ...updates,
      id: agencyId,
      createdAt: new Date(), // Will be overridden by existing data
      updatedAt: now,
    };

    try {
      await withRetry(async () => {
        const agencyRef = doc(db, this.AGENCIES_COLLECTION, agencyId);
        await updateDoc(agencyRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      });

      // Add to sync queue
      await this.syncManager.queueOperation('update', 'agencies', agencyId, updatedAgency);
      
      return agencyId;
    } catch (error) {
      console.log('Failed to update agency in Firebase, storing offline:', error);
      
      // Store offline for later sync
      await this.offlineStorage.storeOfflineData('agencies', agencyId, {
        ...updatedAgency,
        _offline: true,
        _pendingSync: true,
      });

      // Add to sync queue
      await this.syncManager.queueOperation('update', 'agencies', agencyId, updatedAgency);
      
      return agencyId;
    }
  }

  // Find agency by name
  async findAgencyByName(name: string): Promise<Agency | null> {
    try {
      // Try Firebase first
      const q = query(
        collection(db, this.AGENCIES_COLLECTION),
        where('name', '==', name.trim())
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Agency;
      }

      return null;
    } catch (error) {
      console.log('Failed to find agency by name in Firebase, checking offline storage:', error);
      
      // Check offline storage
      const offlineAgencies = await this.offlineStorage.getAllOfflineData('agencies');
      const agency = offlineAgencies.find(a => a.name === name.trim());
      
      return agency ? { ...agency, id: agency.id } as Agency : null;
    }
  }

  // Get all agencies
  async getAllAgencies(): Promise<Agency[]> {
    try {
      // Try Firebase first
      const q = query(
        collection(db, this.AGENCIES_COLLECTION),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const agencies: Agency[] = [];
      
      querySnapshot.forEach((doc) => {
        agencies.push({ id: doc.id, ...doc.data() } as Agency);
      });

      // Merge with offline data
      const offlineAgencies = await this.offlineStorage.getAllOfflineData('agencies');
      const offlineAgencyMap = new Map(offlineAgencies.map(a => [a.id, a]));
      
      // Add offline agencies that aren't in Firebase
      offlineAgencies.forEach(offlineAgency => {
        if (!agencies.find(a => a.id === offlineAgency.id)) {
          agencies.push({ ...offlineAgency, id: offlineAgency.id } as Agency);
        }
      });

      return agencies.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.log('Failed to get agencies from Firebase, using offline storage:', error);
      
      // Fallback to offline storage
      const offlineAgencies = await this.offlineStorage.getAllOfflineData('agencies');
      return offlineAgencies.map(a => ({ ...a, id: a.id } as Agency))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  // Get agency by ID
  async getAgencyById(agencyId: string): Promise<Agency | null> {
    try {
      // Try Firebase first
      const agencyRef = doc(db, this.AGENCIES_COLLECTION, agencyId);
      const agencySnap = await getDoc(agencyRef);
      
      if (agencySnap.exists()) {
        return { id: agencySnap.id, ...agencySnap.data() } as Agency;
      }

      return null;
    } catch (error) {
      console.log('Failed to get agency from Firebase, checking offline storage:', error);
      
      // Check offline storage
      const offlineAgency = await this.offlineStorage.getOfflineData('agencies', agencyId);
      return offlineAgency ? { ...offlineAgency, id: agencyId } as Agency : null;
    }
  }

  // Set up real-time listener for agencies
  setupAgenciesListener(callback: (agencies: Agency[]) => void): () => void {
    try {
      const q = query(
        collection(db, this.AGENCIES_COLLECTION),
        orderBy('name', 'asc')
      );

      return onSnapshot(q, async (querySnapshot) => {
        try {
          const agencies: Agency[] = [];
          
          querySnapshot.forEach((doc) => {
            agencies.push({ id: doc.id, ...doc.data() } as Agency);
          });

          // Merge with offline data
          try {
            const offlineAgencies = await this.offlineStorage.getAllOfflineData('agencies');
            
            // Add offline agencies that aren't in Firebase
            offlineAgencies.forEach(offlineAgency => {
              if (!agencies.find(a => a.id === offlineAgency.id)) {
                agencies.push({ ...offlineAgency, id: offlineAgency.id } as Agency);
              }
            });
          } catch (offlineError) {
            console.log('Failed to merge offline agencies data:', offlineError);
            // Continue with just Firebase data
          }

          callback(agencies.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
          console.error('Error processing agencies snapshot:', error);
          // Try to get offline data as fallback
          try {
            const offlineAgencies = await this.offlineStorage.getAllOfflineData('agencies');
            const agencies = offlineAgencies.map(a => ({ ...a, id: a.id } as Agency))
              .sort((a, b) => a.name.localeCompare(b.name));
            callback(agencies);
          } catch (offlineError) {
            console.error('Failed to get offline agencies data:', offlineError);
            callback([]);
          }
        }
      }, (error) => {
        console.error('Agencies listener error:', error);
        // Try to get offline data as fallback
        this.offlineStorage.getAllOfflineData('agencies').then(offlineAgencies => {
          const agencies = offlineAgencies.map(a => ({ ...a, id: a.id } as Agency))
            .sort((a, b) => a.name.localeCompare(b.name));
          callback(agencies);
        }).catch(offlineError => {
          console.error('Failed to get offline agencies data:', offlineError);
          callback([]);
        });
      });
    } catch (error) {
      console.error('Error setting up agencies listener:', error);
      
      // Fallback to offline data
      this.offlineStorage.getAllOfflineData('agencies').then(offlineAgencies => {
        const agencies = offlineAgencies.map(a => ({ ...a, id: a.id } as Agency))
          .sort((a, b) => a.name.localeCompare(b.name));
        callback(agencies);
      }).catch(offlineError => {
        console.error('Failed to get offline agencies data:', offlineError);
        callback([]);
      });
      
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Generate unique agency ID
  private generateAgencyId(): string {
    return `agency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Sync offline agencies when connection is restored
  async syncOfflineAgencies(): Promise<void> {
    try {
      const offlineAgencies = await this.offlineStorage.getAllOfflineData('agencies');
      
      for (const agency of offlineAgencies) {
        if (agency._pendingSync) {
          try {
            const agencyRef = doc(db, this.AGENCIES_COLLECTION, agency.id);
            
            if (agency._offlineOperation === 'create') {
              await setDoc(agencyRef, {
                ...agency,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } else if (agency._offlineOperation === 'update') {
              await updateDoc(agencyRef, {
                ...agency,
                updatedAt: serverTimestamp(),
              });
            }
            
            // Remove from offline storage after successful sync
            await this.offlineStorage.removeOfflineData('agencies', agency.id);
          } catch (error) {
            console.error(`Failed to sync agency ${agency.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing offline agencies:', error);
    }
  }
}

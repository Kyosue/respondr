import { isNetworkError, NetworkManager, withRetry } from '@/utils/networkUtils';
import { OfflineStorage } from '@/utils/offlineStorage';
import { SyncManager } from '@/utils/syncManager';
import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    UserCredential
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { UserData, UserType } from './auth';
import { auth, db } from './config';
import { checkUsernameExists } from './username';

export class ResilientAuthService {
  private static instance: ResilientAuthService;
  private offlineStorage: OfflineStorage;
  private syncManager: SyncManager;
  private networkManager: NetworkManager;

  private constructor() {
    this.offlineStorage = OfflineStorage.getInstance();
    this.syncManager = SyncManager.getInstance();
    this.networkManager = NetworkManager.getInstance();
  }

  static getInstance(): ResilientAuthService {
    if (!ResilientAuthService.instance) {
      ResilientAuthService.instance = new ResilientAuthService();
    }
    return ResilientAuthService.instance;
  }

  // Register a new user with offline support
  async registerUser(
    email: string,
    password: string,
    fullName: string,
    username: string,
    userType: UserType
  ): Promise<UserData> {
    try {
      // Create user in Firebase Auth with retry
      const userCredential: UserCredential = await withRetry(
        () => createUserWithEmailAndPassword(auth, email, password),
        undefined,
        'User registration'
      );
      const user = userCredential.user;
      
      // Update profile with display name
      await withRetry(
        () => updateProfile(user, { displayName: fullName }),
        undefined,
        'Update user profile'
      );
      
      // Check username availability with retry
      try {
        const usernameExists = await withRetry(
          () => checkUsernameExists(username),
          undefined,
          'Check username availability'
        );
        
        if (usernameExists) {
          await user.delete();
          throw new Error('Username already exists');
        }
      } catch (error) {
        await user.delete();
        if (isNetworkError(error)) {
          throw new Error('Unable to verify username availability. Please check your connection and try again.');
        }
        throw error;
      }
      
      // Create user data
      const userData: UserData = {
        id: user.uid,
        username,
        fullName,
        email,
        userType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Save user data with offline support
      await this.saveUserData(userData);
      
      // Create username document for uniqueness
      await this.saveUsernameDocument(username, user.uid);
      
      return userData;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  // Sign in user with offline support
  async signInUser(email: string, password: string): Promise<UserData> {
    try {
      // Sign in with Firebase Auth with retry
      const userCredential: UserCredential = await withRetry(
        () => signInWithEmailAndPassword(auth, email, password),
        undefined,
        'User sign in'
      );
      const user = userCredential.user;
      
      // Get user data with offline fallback
      const userData = await this.getUserData(user.uid);
      
      if (!userData) {
        throw new Error('User data not found');
      }
      
      // Update last login timestamp
      await this.updateLastLogin(user.uid);
      
      return userData;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  // Sign out user
  async signOutUser(): Promise<void> {
    try {
      await withRetry(
        () => signOut(auth),
        undefined,
        'User sign out'
      );
      
      // Clear offline data
      await this.offlineStorage.clearUserData();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get current user data with offline support
  async getCurrentUserData(user: FirebaseUser): Promise<UserData | null> {
    return await this.getUserData(user.uid);
  }

  // Get user data with offline fallback
  private async getUserData(userId: string): Promise<UserData | null> {
    try {
      // Try to get from Firestore first if online
      if (this.networkManager.isOnline()) {
        try {
          const userDoc = await withRetry(
            () => getDoc(doc(db, 'users', userId)),
            undefined,
            'Get user data from Firestore'
          );
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            // Cache the data locally
            await this.offlineStorage.saveUserData(userData);
            return userData;
          }
        } catch (error) {
          console.warn('Failed to get user data from Firestore, trying offline storage:', error);
        }
      }

      // Fallback to offline storage
      return await this.offlineStorage.getUserData();
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Save user data with offline support
  private async saveUserData(userData: UserData): Promise<void> {
    try {
      // Save to offline storage first
      await this.offlineStorage.saveUserData(userData);

      // Try to save to Firestore if online
      if (this.networkManager.isOnline()) {
        try {
          await withRetry(
            () => setDoc(doc(db, 'users', userData.id), userData),
            undefined,
            'Save user data to Firestore'
          );
        } catch (error) {
          console.warn('Failed to save user data to Firestore, will sync later:', error);
          // Queue for later sync
          await this.syncManager.queueOperation('create', 'users', userData.id, userData);
        }
      } else {
        // Queue for later sync
        await this.syncManager.queueOperation('create', 'users', userData.id, userData);
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  // Save username document with offline support
  private async saveUsernameDocument(username: string, userId: string): Promise<void> {
    try {
      const usernameData = {
        userId,
        createdAt: serverTimestamp()
      };

      if (this.networkManager.isOnline()) {
        try {
          await withRetry(
            () => setDoc(doc(db, 'usernames', username), usernameData),
            undefined,
            'Save username document'
          );
        } catch (error) {
          console.warn('Failed to save username document to Firestore, will sync later:', error);
          await this.syncManager.queueOperation('create', 'usernames', username, usernameData);
        }
      } else {
        await this.syncManager.queueOperation('create', 'usernames', username, usernameData);
      }
    } catch (error) {
      console.error('Error saving username document:', error);
      throw error;
    }
  }

  // Update last login with offline support
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      const updateData = {
        lastLoginAt: serverTimestamp()
      };

      if (this.networkManager.isOnline()) {
        try {
          await withRetry(
            () => setDoc(doc(db, 'users', userId), updateData, { merge: true }),
            undefined,
            'Update last login'
          );
        } catch (error) {
          console.warn('Failed to update last login in Firestore, will sync later:', error);
          await this.syncManager.queueOperation('update', 'users', userId, updateData);
        }
      } else {
        await this.syncManager.queueOperation('update', 'users', userId, updateData);
      }
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Update user data with offline support
  async updateUserData(userId: string, updates: Partial<UserData>): Promise<void> {
    try {
      // Get current user data
      const currentUserData = await this.getUserData(userId);
      if (!currentUserData) {
        throw new Error('User data not found');
      }

      // Merge updates
      const updatedUserData = {
        ...currentUserData,
        ...updates,
        updatedAt: serverTimestamp()
      };

      // Save to offline storage
      await this.offlineStorage.saveUserData(updatedUserData);

      // Try to update Firestore if online
      if (this.networkManager.isOnline()) {
        try {
          await withRetry(
            () => setDoc(doc(db, 'users', userId), updatedUserData, { merge: true }),
            undefined,
            'Update user data in Firestore'
          );
        } catch (error) {
          console.warn('Failed to update user data in Firestore, will sync later:', error);
          await this.syncManager.queueOperation('update', 'users', userId, updatedUserData);
        }
      } else {
        await this.syncManager.queueOperation('update', 'users', userId, updatedUserData);
      }
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  // Get sync status
  async getSyncStatus() {
    return await this.syncManager.getSyncStatus();
  }

  // Force sync
  async forceSync() {
    return await this.syncManager.forceSync();
  }
}

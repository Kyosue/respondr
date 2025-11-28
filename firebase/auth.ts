import {
  EmailAuthProvider,
  User as FirebaseUser,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  UserCredential
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from './config';

// User types
export type UserType = 'admin' | 'supervisor' | 'operator';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserData {
  id: string;
  fullName: string;
  displayName: string; // First + last name only
  email: string;
  userType: UserType;
  status?: UserStatus; // Made optional for backward compatibility
  lastLoginAt?: any;
  lastActivityAt?: any;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
  permissions?: string[];
  avatarUrl?: string;
}

// Removed legacy registerUser in favor of self-signup flow

// Sign in user
export const signInUser = async (
  email: string,
  password: string
): Promise<UserData> => {
  try {
    // Sign in with Firebase Auth
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      // Update last login timestamp
      await setDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp()
      }, { merge: true });
      
      return userDoc.data() as UserData;
    } else {
      throw new Error('User data not found');
    }
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign out user
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current user data
export const getCurrentUserData = async (user: FirebaseUser): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// Get all users from the database
export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const users: UserData[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserData;
      users.push(userData);
    });
    
    // Sort users by creation date (newest first)
    users.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
      }
      return 0;
    });
    
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Update user data
export const updateUser = async (
  userId: string,
  userData: Partial<UserData>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const updateData = {
      ...userData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Re-authenticate current user with password
export const reauthenticateUser = async (password: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No authenticated user found');
    }

    // Create credential with current user's email and provided password
    const credential = EmailAuthProvider.credential(user.email, password);
    
    // Re-authenticate the user
    await reauthenticateWithCredential(user, credential);
  } catch (error) {
    console.error('Error re-authenticating user:', error);
    if (error instanceof Error) {
      if (error.message.includes('wrong-password')) {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.message.includes('user-mismatch')) {
        throw new Error('User mismatch. Please try again.');
      } else if (error.message.includes('user-not-found')) {
        throw new Error('User not found.');
      } else if (error.message.includes('invalid-credential')) {
        throw new Error('Invalid credentials. Please check your password.');
      } else if (error.message.includes('too-many-requests')) {
        throw new Error('Too many failed attempts. Please try again later.');
      }
    }
    throw error;
  }
};

// Delete user with password verification (secure delete)
export const deleteUserSecure = async (
  userId: string,
  currentUserPassword: string,
  hardDelete: boolean = true
): Promise<void> => {
  try {
    // First, re-authenticate the current user with their password
    await reauthenticateUser(currentUserPassword);

    if (hardDelete) {
      // Hard delete - remove from Firebase Auth and Firestore
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === userId) {
        // Can't delete current user
        throw new Error('Cannot delete your own account');
      }
      
      // Delete from Firestore first
      await deleteDoc(doc(db, 'users', userId));
      
      // Note: For deleting other users from Firebase Auth, you would typically use Admin SDK
      // This would be done via Cloud Functions in a production environment
      console.warn('Hard delete: User document removed from Firestore. Firebase Auth deletion requires Admin SDK.');
    } else {
      // Soft delete - mark as inactive
      await updateUser(userId, { status: 'inactive' });
    }
  } catch (error) {
    console.error('Error deleting user securely:', error);
    throw error;
  }
};

// Delete user (soft delete by default) - kept for backward compatibility
export const deleteUser = async (
  userId: string,
  hardDelete: boolean = false
): Promise<void> => {
  try {
    if (hardDelete) {
      // Hard delete - remove from Firebase Auth and Firestore
      const user = auth.currentUser;
      if (user && user.uid === userId) {
        // Can't delete current user
        throw new Error('Cannot delete current user');
      }
      
      // Delete from Firestore first
      await deleteDoc(doc(db, 'users', userId));
      
      // Note: Firebase Auth user deletion requires admin SDK
      // This would typically be done via Cloud Functions
      console.warn('Hard delete requires admin SDK - user document removed from Firestore');
    } else {
      // Soft delete - mark as inactive
      await updateUser(userId, { status: 'inactive' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Toggle user status
export const toggleUserStatus = async (
  userId: string,
  status: UserStatus
): Promise<void> => {
  try {
    await updateUser(userId, { status });
  } catch (error) {
    console.error('Error toggling user status:', error);
    throw error;
  }
};

// Get users with filters
export const getUsersWithFilters = async (filters: {
  userType?: UserType;
  status?: UserStatus;
  searchQuery?: string;
  limitCount?: number;
}): Promise<UserData[]> => {
  try {
    let q = query(collection(db, 'users'));
    
    // Apply filters
    if (filters.userType) {
      q = query(q, where('userType', '==', filters.userType));
    }
    
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    // Only use orderBy if we don't have multiple where clauses (to avoid index requirements)
    // If we have filters, we'll sort in memory instead
    const hasMultipleFilters = (filters.userType ? 1 : 0) + (filters.status ? 1 : 0) > 1;
    if (!hasMultipleFilters) {
      q = query(q, orderBy('createdAt', 'desc'));
    }
    
    if (filters.limitCount) {
      q = query(q, limit(filters.limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    let users: UserData[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserData;
      users.push(userData);
    });
    
    // Sort in memory if we have multiple filters (to avoid index requirement)
    if (hasMultipleFilters) {
      users.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
        return bTime - aTime; // Descending order
      });
    }
    
    // Apply search filter if provided
    if (filters.searchQuery) {
      const searchTerm = filters.searchQuery.toLowerCase();
      users = users.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }
    
    return users;
  } catch (error: any) {
    // Handle index building error gracefully
    if (error?.message?.includes('index') || error?.code === 'failed-precondition') {
      console.warn('Firestore index may be building. Fetching without orderBy...');
      // Retry without orderBy
      try {
        let q = query(collection(db, 'users'));
        if (filters.userType) {
          q = query(q, where('userType', '==', filters.userType));
        }
        if (filters.status) {
          q = query(q, where('status', '==', filters.status));
        }
        const querySnapshot = await getDocs(q);
        let users: UserData[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data() as UserData;
          users.push(userData);
        });
        // Sort in memory
        users.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
          return bTime - aTime;
        });
        return users;
      } catch (retryError) {
        console.error('Error getting filtered users (retry failed):', retryError);
        throw retryError;
      }
    }
    console.error('Error getting filtered users:', error);
    throw error;
  }
};

// Bulk update users
export const bulkUpdateUsers = async (
  userIds: string[],
  updates: Partial<UserData>
): Promise<void> => {
  try {
    const promises = userIds.map(userId => updateUser(userId, updates));
    await Promise.all(promises);
  } catch (error) {
    console.error('Error bulk updating users:', error);
    throw error;
  }
};

// Get user activity (placeholder - would need to be implemented based on your activity tracking)
export const getUserActivity = async (userId: string): Promise<any[]> => {
  try {
    // This would typically query an activities collection
    // For now, return empty array
    return [];
  } catch (error) {
    console.error('Error getting user activity:', error);
    throw error;
  }
};
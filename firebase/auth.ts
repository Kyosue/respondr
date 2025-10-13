import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    UserCredential
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { checkUsernameExists } from './username';

// User types
export type UserType = 'admin' | 'supervisor' | 'operator';

export interface UserData {
  id: string;
  username: string;
  fullName: string;
  email: string;
  userType: UserType;
  createdAt?: any;
  updatedAt?: any;
}

// Register a new user
export const registerUser = async (
  email: string,
  password: string,
  fullName: string,
  username: string,
  userType: UserType
): Promise<UserData> => {
  try {
    // Create user in Firebase Auth
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name
    await updateProfile(user, {
      displayName: fullName
    });
    
    // Now that user is authenticated, check if username exists
    try {
      const usernameExists = await checkUsernameExists(username);
      if (usernameExists) {
        // Delete the created user and throw error
        await user.delete();
        throw new Error('Username already exists');
      }
    } catch (error) {
      // If we can't check username (permission error), delete user and throw error
      await user.delete();
      throw new Error('Unable to verify username availability. Please try again.');
    }
    
    // Create user document in Firestore
    const userData: UserData = {
      id: user.uid,
      username,
      fullName,
      email,
      userType,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), userData);
    
    // Create username document for uniqueness
    await setDoc(doc(db, 'usernames', username), {
      userId: user.uid,
      createdAt: serverTimestamp()
    });
    
    return userData;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

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
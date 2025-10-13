import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, browserLocalPersistence, getAuth, initializeAuth } from 'firebase/auth';
import { disableNetwork, enableNetwork, Firestore, getFirestore } from 'firebase/firestore';
import { getStorage, Storage } from 'firebase/storage';
import { Platform } from 'react-native';

// Import React Native persistence for mobile platforms
let getReactNativePersistence: any;
if (Platform.OS !== 'web') {
  try {
    getReactNativePersistence = require('firebase/auth').getReactNativePersistence;
  } catch (error) {
    console.warn('Could not import getReactNativePersistence:', error);
  }
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAkNMUq2I6WpUH1OcTFrX9PAaMpuEmm_mI",
  authDomain: "respondr-da5cb.firebaseapp.com",
  projectId: "respondr-da5cb",
  storageBucket: "respondr-da5cb.firebasestorage.app",
  messagingSenderId: "944507190892",
  appId: "1:944507190892:web:d0737fa77ad89786d7a249",
  measurementId: "G-5G1YF12FQW"
};

// Initialize Firebase with error handling
let app: FirebaseApp;
let firebaseAuth: Auth;
let db: Firestore;
let storage: Storage;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth with platform-specific persistence
    if (Platform.OS === 'web') {
      // For web, use browser local persistence
      firebaseAuth = initializeAuth(app, {
        persistence: browserLocalPersistence
      });
    } else {
      // For mobile, use AsyncStorage persistence
      if (getReactNativePersistence) {
        firebaseAuth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
      } else {
        // Fallback to default initialization if persistence is not available
        firebaseAuth = initializeAuth(app);
      }
    }
  } else {
    app = getApp();
    firebaseAuth = getAuth(app);
  }

  // Initialize Firestore with offline persistence
  db = getFirestore(app);
  
  // Initialize Firebase Storage
  storage = getStorage(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Fallback initialization for web
  if (Platform.OS === 'web') {
    try {
      app = getApp();
      firebaseAuth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
    } catch (fallbackError) {
      console.error('Firebase fallback initialization failed:', fallbackError);
      throw fallbackError;
    }
  } else {
    throw error;
  }
}

// Network management functions
export const enableFirestoreNetwork = () => enableNetwork(db);
export const disableFirestoreNetwork = () => disableNetwork(db);

export { app, firebaseAuth as auth, db, storage };


import { auth } from '@/firebase/config';
import { customWeatherStationService } from '@/firebase/weatherStations';
import { WeatherStation } from '@/types/WeatherStation';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'customWeatherStations';
const LAST_SYNC_KEY = 'customWeatherStations_lastSync';

/**
 * Save stations to local storage (cache)
 */
const saveToLocalStorage = async (stations: WeatherStation[]): Promise<void> => {
  try {
    const data = JSON.stringify(stations);
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEY, data);
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    } else {
      await SecureStore.setItemAsync(STORAGE_KEY, data);
      await SecureStore.setItemAsync(LAST_SYNC_KEY, Date.now().toString());
    }
  } catch (error) {
    // Silently fail for local storage - it's just a cache
  }
};

/**
 * Load stations from local storage (cache)
 */
const loadFromLocalStorage = async (): Promise<WeatherStation[]> => {
  try {
    let data: string | null = null;
    if (Platform.OS === 'web') {
      data = localStorage.getItem(STORAGE_KEY);
    } else {
      data = await SecureStore.getItemAsync(STORAGE_KEY);
    }
    
    if (!data) {
      return [];
    }
    
    const stations = JSON.parse(data) as WeatherStation[];
    
    if (!Array.isArray(stations)) {
      return [];
    }
    
    // Convert date strings back to Date objects
    return stations.map(station => ({
      ...station,
      lastSeen: station.lastSeen ? new Date(station.lastSeen) : undefined,
    }));
  } catch (error) {
    return [];
  }
};

/**
 * Load custom weather stations from Firebase (primary) with local storage fallback
 */
export const loadCustomStations = async (): Promise<WeatherStation[]> => {
  try {
    const currentUser = auth.currentUser;
    
    // Try Firebase first if user is authenticated
    if (currentUser) {
      try {
        const firebaseStations = await customWeatherStationService.getAllStations();
        
        // Always update local cache with Firebase data (even if empty, to clear old data)
        await saveToLocalStorage(firebaseStations);
        
        return firebaseStations;
      } catch (firebaseError) {
        // If Firebase fails, try local storage as fallback
        const localStations = await loadFromLocalStorage();
        
        // If we have local data, try to sync it back to Firebase in the background
        if (localStations.length > 0) {
          // Don't await - sync in background
          customWeatherStationService.syncStations(localStations).catch(() => {
            // Silently fail background sync
          });
        }
        
        return localStations;
      }
    } else {
      // Not authenticated - use local storage only
      return await loadFromLocalStorage();
    }
  } catch (error) {
    // Final fallback to local storage
    return await loadFromLocalStorage();
  }
};

/**
 * Save custom weather stations to Firebase (primary) and local storage (cache)
 */
export const saveCustomStations = async (stations: WeatherStation[]): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    
    // Always save to local storage first (fast, works offline)
    await saveToLocalStorage(stations);
    
    // Try to save to Firebase if authenticated
    if (currentUser) {
      try {
        await customWeatherStationService.syncStations(stations);
      } catch (firebaseError) {
        // If Firebase fails, local storage already has the data
        // The data will be synced on next load
      }
    }
  } catch (error) {
    // If everything fails, at least we tried
    throw error;
  }
};

/**
 * Add a custom weather station
 */
export const addCustomStation = async (station: WeatherStation): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    
    // Check if station already exists
    const existing = await loadCustomStations();
    const exists = existing.some(s => s.id === station.id);
    
    if (exists) {
      // Station already exists, just update it
      await updateCustomStation(station);
      return;
    }
    
    // Add to Firebase if authenticated
    if (currentUser) {
      try {
        await customWeatherStationService.addStation(station);
        // If Firebase succeeds, also save to local storage as cache
        const updated = [...existing, station];
        await saveToLocalStorage(updated);
      } catch (firebaseError) {
        // If Firebase fails, add to local storage and sync later
        // But also re-throw the error so the UI can show it
        const updated = [...existing, station];
        await saveToLocalStorage(updated);
        // Re-throw so caller knows Firebase save failed
        throw new Error(`Failed to sync to Firebase: ${firebaseError instanceof Error ? firebaseError.message : String(firebaseError)}. Station saved locally and will sync when online.`);
      }
    }
    
    // Also save to local storage (for offline support and fallback)
    const updated = [...existing, station];
    await saveToLocalStorage(updated);
  } catch (error) {
    throw error;
  }
};

/**
 * Update a custom weather station
 */
export const updateCustomStation = async (station: WeatherStation): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    
    // Update in Firebase if authenticated
    if (currentUser) {
      try {
        await customWeatherStationService.updateStation(station);
      } catch (firebaseError) {
        // If Firebase fails, update local storage
        const existing = await loadFromLocalStorage();
        const updated = existing.map(s => s.id === station.id ? station : s);
        await saveToLocalStorage(updated);
        return;
      }
    }
    
    // Also update local storage
    const existing = await loadFromLocalStorage();
    const updated = existing.map(s => s.id === station.id ? station : s);
    await saveToLocalStorage(updated);
  } catch (error) {
    throw error;
  }
};

/**
 * Remove a custom weather station
 */
export const removeCustomStation = async (stationId: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    
    // Remove from Firebase if authenticated
    if (currentUser) {
      try {
        await customWeatherStationService.removeStation(stationId);
      } catch (firebaseError) {
        // If Firebase fails, remove from local storage
        const existing = await loadFromLocalStorage();
        const filtered = existing.filter(s => s.id !== stationId);
        await saveToLocalStorage(filtered);
        return;
      }
    }
    
    // Also remove from local storage
    const existing = await loadFromLocalStorage();
    const filtered = existing.filter(s => s.id !== stationId);
    await saveToLocalStorage(filtered);
  } catch (error) {
    throw error;
  }
};

/**
 * Clear all custom weather stations
 */
/**
 * Clear all custom weather stations from Firebase and local storage
 */
export const clearCustomStations = async (): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    
    // Clear from Firebase if authenticated
    if (currentUser) {
      try {
        const existing = await customWeatherStationService.getAllStations();
        for (const station of existing) {
          await customWeatherStationService.removeStation(station.id);
        }
      } catch (firebaseError) {
        // If Firebase fails, continue to clear local storage
      }
    }
    
    // Clear local storage
    if (Platform.OS === 'web') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LAST_SYNC_KEY);
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      await SecureStore.deleteItemAsync(LAST_SYNC_KEY);
    }
  } catch (error) {
    // Silently fail
  }
};

/**
 * Clear only the local cache (useful for debugging or forcing a refresh from Firebase)
 * This will NOT delete stations from Firebase, only clear the local cache
 */
export const clearLocalCache = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LAST_SYNC_KEY);
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      await SecureStore.deleteItemAsync(LAST_SYNC_KEY);
    }
  } catch (error) {
    // Silently fail
  }
};


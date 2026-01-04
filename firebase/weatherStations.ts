import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { WeatherStation } from '@/types/WeatherStation';
import { auth } from './config';

const CUSTOM_WEATHER_STATIONS_COLLECTION = 'custom_weather_stations';

/**
 * Helper function to convert Firestore timestamps to Date objects
 */
const convertTimestamps = (data: any): any => {
  const converted = { ...data };
  
  // Convert Firestore timestamps to Date objects
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    }
  });
  
  return converted;
};

/**
 * Convert WeatherStation to Firestore-compatible format
 * Note: We store a simplified municipality object (without coordinates array) to avoid Firestore size limits
 */
const stationToFirestore = (station: WeatherStation): any => {
  const data: any = {
    id: station.id,
    name: station.name,
    // Store simplified municipality (without large coordinates array)
    municipality: {
      id: station.municipality.id,
      name: station.municipality.name,
      type: station.municipality.type,
      area: station.municipality.area,
      center: station.municipality.center,
      // Don't store coordinates array - it's too large and can be reconstructed from GeoJSON
    },
    isActive: station.isActive,
    deviceId: station.deviceId || null,
    locationName: station.locationName || null,
    apiAvailable: station.apiAvailable ?? null,
  };

  // Only include lastSeen if it exists
  if (station.lastSeen) {
    data.lastSeen = station.lastSeen instanceof Date 
      ? Timestamp.fromDate(station.lastSeen)
      : Timestamp.fromDate(new Date(station.lastSeen));
  }

  // Remove null values (Firestore doesn't like null for optional fields)
  Object.keys(data).forEach(key => {
    if (data[key] === null) {
      delete data[key];
    }
  });

  return data;
};

/**
 * Convert Firestore document to WeatherStation
 * Note: Municipality coordinates are reconstructed from GeoJSON data when needed
 */
const firestoreToStation = (docData: any): WeatherStation => {
  const converted = convertTimestamps(docData);
  
  // Reconstruct full municipality object from stored data
  // If coordinates are missing, we'll need to get them from GeoJSON
  let municipality = converted.municipality;
  
  // If municipality doesn't have coordinates, try to get them from GeoJSON
  if (municipality && !municipality.coordinates) {
    try {
      const { getMunicipalities } = require('@/data/davaoOrientalData');
      const municipalities = getMunicipalities();
      const fullMunicipality = municipalities.find(m => m.id === municipality.id);
      if (fullMunicipality) {
        municipality = fullMunicipality;
      }
    } catch (error) {
      // If we can't reconstruct, use what we have (coordinates will be undefined)
    }
  }
  
  return {
    id: converted.id,
    name: converted.name,
    municipality: municipality,
    isActive: converted.isActive ?? true,
    lastSeen: converted.lastSeen ? (converted.lastSeen instanceof Date ? converted.lastSeen : new Date(converted.lastSeen)) : undefined,
    apiAvailable: converted.apiAvailable ?? undefined,
    deviceId: converted.deviceId ?? undefined,
    locationName: converted.locationName ?? undefined,
  };
};

/**
 * Firebase service for custom weather stations
 */
export const customWeatherStationService = {
  /**
   * Get all custom weather stations from Firestore
   */
  async getAllStations(): Promise<WeatherStation[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        // If not authenticated, return empty array
        return [];
      }

      const stationsRef = collection(db, CUSTOM_WEATHER_STATIONS_COLLECTION);
      const q = query(stationsRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);

      const stations: WeatherStation[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stations.push(firestoreToStation({ ...data, id: doc.id }));
      });

      return stations;
    } catch (error) {
      // Return empty array on error to prevent crashes
      return [];
    }
  },

  /**
   * Get a single custom weather station by ID
   */
  async getStationById(stationId: string): Promise<WeatherStation | null> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return null;
      }

      const stationRef = doc(db, CUSTOM_WEATHER_STATIONS_COLLECTION, stationId);
      const stationSnap = await getDoc(stationRef);

      if (!stationSnap.exists()) {
        return null;
      }

      const data = stationSnap.data();
      return firestoreToStation({ ...data, id: stationSnap.id });
    } catch (error) {
      return null;
    }
  },

  /**
   * Add a custom weather station to Firestore
   */
  async addStation(station: WeatherStation): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to add weather stations');
      }

      // Use station.id as the document ID for easier lookup
      const stationRef = doc(db, CUSTOM_WEATHER_STATIONS_COLLECTION, station.id);
      const firestoreData = stationToFirestore(station);
      
      // Add metadata
      firestoreData.createdAt = serverTimestamp();
      firestoreData.updatedAt = serverTimestamp();
      firestoreData.createdBy = currentUser.uid;

      await setDoc(stationRef, firestoreData, { merge: false });
    } catch (error) {
      // Re-throw with more context
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to add weather station to Firebase: ${errorMessage}`);
    }
  },

  /**
   * Update a custom weather station in Firestore
   */
  async updateStation(station: WeatherStation): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to update weather stations');
      }

      const stationRef = doc(db, CUSTOM_WEATHER_STATIONS_COLLECTION, station.id);
      const firestoreData = stationToFirestore(station);
      
      // Add metadata
      firestoreData.updatedAt = serverTimestamp();

      await setDoc(stationRef, firestoreData, { merge: true });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove a custom weather station from Firestore
   */
  async removeStation(stationId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to remove weather stations');
      }

      const stationRef = doc(db, CUSTOM_WEATHER_STATIONS_COLLECTION, stationId);
      await deleteDoc(stationRef);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Sync multiple stations to Firestore (batch operation)
   */
  async syncStations(stations: WeatherStation[]): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to sync weather stations');
      }

      // Get all existing stations
      const existingStations = await this.getAllStations();
      const existingIds = new Set(existingStations.map(s => s.id));

      // Add or update each station
      for (const station of stations) {
        const stationRef = doc(db, CUSTOM_WEATHER_STATIONS_COLLECTION, station.id);
        const firestoreData = stationToFirestore(station);
        
        if (existingIds.has(station.id)) {
          // Update existing
          firestoreData.updatedAt = serverTimestamp();
          await setDoc(stationRef, firestoreData, { merge: true });
        } else {
          // Create new
          firestoreData.createdAt = serverTimestamp();
          firestoreData.updatedAt = serverTimestamp();
          firestoreData.createdBy = currentUser.uid;
          await setDoc(stationRef, firestoreData, { merge: false });
        }
      }
    } catch (error) {
      throw error;
    }
  },
};


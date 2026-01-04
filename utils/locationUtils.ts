import * as Location from 'expo-location';
import { getMunicipalities, Municipality } from '@/data/davaoOrientalData';
import { WeatherStation } from '@/types/WeatherStation';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Get user's current location
 * Returns null if permission denied or location unavailable
 */
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      return null;
    }
    
    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced, // Good balance between accuracy and speed
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Normalize municipality name for matching
 */
function normalizeMunicipalityName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^city\s+of\s+/i, '')
    .replace(/\s+city$/i, '')
    .trim();
}

/**
 * Find the nearest weather station to the given coordinates
 * Uses hardcoded coordinates for accuracy, with GeoJSON as fallback
 */
export function findNearestStation(
  latitude: number,
  longitude: number,
  stations: WeatherStation[]
): WeatherStation | null {
  if (stations.length === 0) return null;
  
  // Hardcoded coordinates for better accuracy (from weatherApi.ts)
  const HARDCODED_COORDS: Record<string, { lat: number; lon: number }> = {
    'mati': { lat: 6.9551, lon: 126.2167 },
    'city of mati': { lat: 6.9551, lon: 126.2167 },
    'mati city': { lat: 6.9551, lon: 126.2167 },
    'baganga': { lat: 7.5731, lon: 126.5600 },
    'banaybanay': { lat: 6.9667, lon: 126.0167 },
    'boston': { lat: 7.8667, lon: 126.3667 },
    'caraga': { lat: 7.3333, lon: 126.5667 },
    'cateel': { lat: 7.7833, lon: 126.4500 },
    'governor generoso': { lat: 6.6500, lon: 126.0833 },
    'governorgeneroso': { lat: 6.6500, lon: 126.0833 },
    'lupon': { lat: 6.9000, lon: 126.0167 },
    'manay': { lat: 7.2167, lon: 126.5333 },
    'san isidro': { lat: 6.8333, lon: 126.0833 },
    'sanisidro': { lat: 6.8333, lon: 126.0833 },
    'tarragona': { lat: 7.0500, lon: 126.4500 },
  };
  
  let nearestStation: WeatherStation | null = null;
  let minDistance = Infinity;
  const municipalities = getMunicipalities();
  
  // First, check if user is near Mati (within 15km)
  const matiCoords = HARDCODED_COORDS['mati'] || HARDCODED_COORDS['city of mati'];
  let isNearMati = false;
  if (matiCoords) {
    const distanceToMati = calculateDistance(
      latitude,
      longitude,
      matiCoords.lat,
      matiCoords.lon
    );
    isNearMati = distanceToMati <= 15;
  }
  
  stations.forEach(station => {
    const normalizedStationName = normalizeMunicipalityName(station.municipality.name);
    let coords: { lat: number; lon: number } | null = null;
    
    // Try hardcoded coordinates first (more accurate)
    const hardcodedKey = Object.keys(HARDCODED_COORDS).find(
      key => normalizeMunicipalityName(key) === normalizedStationName
    );
    
    if (hardcodedKey) {
      coords = HARDCODED_COORDS[hardcodedKey];
    } else {
      // Fallback to GeoJSON center coordinates
      const municipality = municipalities.find(m => {
        const normalizedGeoName = normalizeMunicipalityName(m.name);
        return normalizedGeoName === normalizedStationName;
      });
      
      if (municipality) {
        coords = {
          lat: municipality.center.latitude,
          lon: municipality.center.longitude,
        };
      }
    }
    
    if (coords) {
      const distance = calculateDistance(
        latitude,
        longitude,
        coords.lat,
        coords.lon
      );
      
      const isMati = normalizedStationName === 'mati';
      
      // If user is near Mati, always prefer Mati station
      if (isNearMati && isMati) {
        minDistance = distance;
        nearestStation = station;
      } else if (!isNearMati && distance < minDistance) {
        // If not near Mati, use normal nearest station logic
        minDistance = distance;
        nearestStation = station;
      }
    }
  });
  
  return nearestStation;
}

/**
 * Get location-based default station
 * Falls back to City of Mati if location is unavailable
 */
export async function getLocationBasedDefaultStation(
  stations: WeatherStation[]
): Promise<WeatherStation | null> {
  // Try to get user's location
  const location = await getCurrentLocation();
  
  if (location) {
    // Find nearest station
    const nearestStation = findNearestStation(
      location.latitude,
      location.longitude,
      stations
    );
    
    if (nearestStation) {
      return nearestStation;
    }
  }
  
  // Fallback to City of Mati or first active station
  const matiStation = stations.find(s => 
    s.municipality.name === 'City of Mati' || 
    s.municipality.name === 'Mati City' ||
    s.municipality.name === 'Mati'
  );
  
  return matiStation || stations.find(s => s.isActive) || stations[0] || null;
}


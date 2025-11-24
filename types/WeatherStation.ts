import { Municipality, getMunicipalities } from '@/data/davaoOrientalData';

export interface WeatherStation {
  id: string;
  name: string;
  municipality: Municipality;
  isActive: boolean;
  lastSeen?: Date;
  // API connection status (optional, can be updated from parent)
  apiAvailable?: boolean;
}

// Generate stations for all municipalities
// All stations are considered active by default (API will determine actual status)
export const generateStations = (): WeatherStation[] => {
  const municipalities = getMunicipalities();
  return municipalities.map((municipality) => ({
    id: `station-${municipality.id}`,
    name: `${municipality.name} Weather Station`,
    municipality,
    isActive: true, // All stations are active (API availability determines actual status)
    lastSeen: undefined, // Will be updated when data is fetched
  }));
};


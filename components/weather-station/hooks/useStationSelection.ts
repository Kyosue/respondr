import { useEffect, useState } from 'react';
import { WeatherStation } from '@/types/WeatherStation';

/**
 * Custom hook for managing station selection with location-based defaults
 */
export function useStationSelection(stations: WeatherStation[]) {
  const [defaultStation, setDefaultStation] = useState<WeatherStation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(null);

  // Get location-based default station on mount
  useEffect(() => {
    const loadDefaultStation = async () => {
      setIsLoadingLocation(true);
      try {
        const { getLocationBasedDefaultStation } = await import('@/utils/locationUtils');
        const station = await getLocationBasedDefaultStation(stations);
        setDefaultStation(station);
      } catch (error) {
        // Fallback to City of Mati if location fails
        const matiStation = stations.find(s => 
          s.municipality.name === 'City of Mati' || 
          s.municipality.name === 'Mati City' ||
          s.municipality.name === 'Mati'
        );
        setDefaultStation(matiStation || stations.find(s => s.isActive) || stations[0] || null);
      } finally {
        setIsLoadingLocation(false);
      }
    };
    
    if (stations.length > 0) {
      loadDefaultStation();
    }
  }, [stations]);

  // Update selected station when default station is determined
  useEffect(() => {
    if (defaultStation && !selectedStation) {
      setSelectedStation(defaultStation);
    }
  }, [defaultStation, selectedStation]);

  const selectStation = (station: WeatherStation) => {
    // Update selected station reference to match current stations state
    const updatedStation = stations.find(s => s.id === station.id);
    setSelectedStation(updatedStation || station);
  };

  return {
    selectedStation,
    setSelectedStation: selectStation,
    isLoadingLocation,
  };
}


import { useEffect, useMemo, useState } from 'react';
import { checkStationsAvailability } from '@/services/weatherApi';
import { generateStations, WeatherStation } from '@/types/WeatherStation';
import { loadCustomStations } from '@/utils/weatherStationStorage';

/**
 * Custom hook for managing weather stations
 * Handles loading, availability checking, and merging base/custom stations
 */
export function useWeatherStations() {
  const [baseStations, setBaseStations] = useState<WeatherStation[]>(generateStations());
  const [customStations, setCustomStations] = useState<WeatherStation[]>([]);

  // Merge base stations with custom stations
  const stations = useMemo(() => {
    const stationMap = new Map<string, WeatherStation>();
    
    // Add base stations first
    baseStations.forEach(station => {
      stationMap.set(station.id, station);
    });
    
    // Add custom stations (they will override base stations if same ID)
    customStations.forEach(station => {
      stationMap.set(station.id, station);
    });
    
    return Array.from(stationMap.values());
  }, [baseStations, customStations]);

  // Load custom stations on mount
  useEffect(() => {
    const loadStations = async () => {
      try {
        const custom = await loadCustomStations();
        setCustomStations(custom);
      } catch (error) {
        setCustomStations([]);
      }
    };
    
    loadStations();
  }, []);

  // Check all stations' availability on mount and when stations change
  useEffect(() => {
    const checkAvailability = async () => {
      if (stations.length === 0) return;
      
      try {
        const availability = await checkStationsAvailability(stations);
        
        // Update base stations
        setBaseStations(prevStations =>
          prevStations.map(station => {
            const status = availability.get(station.id);
            if (status) {
              return {
                ...station,
                isActive: status.isActive,
                lastSeen: status.lastSeen,
                apiAvailable: status.isActive,
              };
            }
            return {
              ...station,
              isActive: false,
              apiAvailable: false,
            };
          })
        );
        
        // Update custom stations
        setCustomStations(prevStations =>
          prevStations.map(station => {
            const status = availability.get(station.id);
            if (status) {
              return {
                ...station,
                isActive: status.isActive,
                lastSeen: status.lastSeen,
                apiAvailable: status.isActive,
              };
            }
            return {
              ...station,
              isActive: false,
              apiAvailable: false,
            };
          })
        );
      } catch (error) {
        // Error checking availability - mark all as inactive
        setBaseStations(prevStations =>
          prevStations.map(station => ({
            ...station,
            isActive: false,
            apiAvailable: false,
          }))
        );
        setCustomStations(prevStations =>
          prevStations.map(station => ({
            ...station,
            isActive: false,
            apiAvailable: false,
          }))
        );
      }
    };
    
    checkAvailability();
  }, [stations.length]);

  const updateStationStatus = (
    stationId: string,
    updates: Partial<Pick<WeatherStation, 'isActive' | 'lastSeen' | 'apiAvailable'>>
  ) => {
    const isCustom = stationId.startsWith('custom-');
    
    if (isCustom) {
      setCustomStations(prevStations =>
        prevStations.map(station =>
          station.id === stationId ? { ...station, ...updates } : station
        )
      );
    } else {
      setBaseStations(prevStations =>
        prevStations.map(station =>
          station.id === stationId ? { ...station, ...updates } : station
        )
      );
    }
  };

  const reloadCustomStations = async () => {
    try {
      const custom = await loadCustomStations();
      setCustomStations(custom);
      return custom;
    } catch (error) {
      throw error;
    }
  };

  return {
    stations,
    baseStations,
    customStations,
    setBaseStations,
    setCustomStations,
    updateStationStatus,
    reloadCustomStations,
  };
}


import { WeatherLandingPage } from '@/components/landing/WeatherLandingPage';
import { HistoricalDataPoint } from '@/components/weather-station/HistoricalDataView';
import { WeatherData } from '@/components/weather-station/WeatherMetrics';
import { calculateRainfallAnalytics, RainfallAnalytics } from '@/services/pagasaAdvisoryService';
import { checkStationsAvailability, fetchWeatherData as fetchApiWeather, fetchHistoricalWeatherData, WeatherApiResponse } from '@/services/weatherApi';
import { generateStations, WeatherStation } from '@/types/WeatherStation';
import { loadCustomStations } from '@/utils/weatherStationStorage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  
  // Redirect native app users to login (home page is web-only, but works on mobile browsers)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      router.replace('/login');
    }
  }, [router]);

  // Don't render on native apps
  if (Platform.OS !== 'web') {
    return null;
  }
  
  // Initialize stations - will be merged with custom stations (same structure as WeatherStation.tsx)
  const [baseStations, setBaseStations] = useState<WeatherStation[]>(generateStations());
  const [customStations, setCustomStations] = useState<WeatherStation[]>([]);
  
  // Merge base stations with custom stations
  const stations = useMemo(() => {
    // Combine base and custom stations, avoiding duplicates
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
  
  // Location-based default station selection
  const [defaultStation, setDefaultStation] = useState<WeatherStation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
  // Load custom stations on mount
  useEffect(() => {
    const loadStations = async () => {
      try {
        const custom = await loadCustomStations();
        setCustomStations(custom);
      } catch (error) {
        // Error loading custom stations - set empty array to prevent issues
        setCustomStations([]);
      }
    };
    
    loadStations();
  }, []);

  // Check all stations' availability on mount, when stations change, and periodically
  useEffect(() => {
    const checkAvailability = async () => {
      if (stations.length === 0) return;
      
      try {
        const availability = await checkStationsAvailability(stations);
        
        // Update base stations - only update if status changed to avoid unnecessary re-renders
        setBaseStations(prevStations =>
          prevStations.map(station => {
            const status = availability.get(station.id);
            if (status) {
              // Only update if status actually changed
              if (station.isActive !== status.isActive || 
                  station.lastSeen?.getTime() !== status.lastSeen?.getTime()) {
                return {
                  ...station,
                  isActive: status.isActive,
                  lastSeen: status.lastSeen,
                  apiAvailable: status.isActive,
                };
              }
              return station; // No change, return as-is
            }
            // If no status found but station was active, keep it active (might be from successful fetch)
            if (station.isActive && station.apiAvailable) {
              return station; // Keep current status if it was set by successful data fetch
            }
            return {
              ...station,
              isActive: false,
              apiAvailable: false,
            };
          })
        );
        
        // Update custom stations - only update if status changed
        setCustomStations(prevStations =>
          prevStations.map(station => {
            const status = availability.get(station.id);
            if (status) {
              // Only update if status actually changed
              if (station.isActive !== status.isActive || 
                  station.lastSeen?.getTime() !== status.lastSeen?.getTime()) {
                return {
                  ...station,
                  isActive: status.isActive,
                  lastSeen: status.lastSeen,
                  apiAvailable: status.isActive,
                };
              }
              return station; // No change, return as-is
            }
            // If no status found but station was active, keep it active (might be from successful fetch)
            if (station.isActive && station.apiAvailable) {
              return station; // Keep current status if it was set by successful data fetch
            }
            return {
              ...station,
              isActive: false,
              apiAvailable: false,
            };
          })
        );
      } catch (error) {
        // Error checking availability - only mark as inactive if they weren't already active from data fetch
        setBaseStations(prevStations =>
          prevStations.map(station => {
            // If station was marked active from successful data fetch, keep it active
            if (station.isActive && station.apiAvailable && station.lastSeen) {
              // Check if lastSeen is recent (within last 2 hours) to keep it active
              const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
              if (station.lastSeen.getTime() >= twoHoursAgo) {
                return station;
              }
            }
            return {
              ...station,
              isActive: false,
              apiAvailable: false,
            };
          })
        );
        setCustomStations(prevStations =>
          prevStations.map(station => {
            // If station was marked active from successful data fetch, keep it active
            if (station.isActive && station.apiAvailable && station.lastSeen) {
              // Check if lastSeen is recent (within last 2 hours) to keep it active
              const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
              if (station.lastSeen.getTime() >= twoHoursAgo) {
                return station;
              }
            }
            return {
              ...station,
              isActive: false,
              apiAvailable: false,
            };
          })
        );
      }
    };
    
    // Check immediately
    checkAvailability();
    
    // Also check periodically (every 5 minutes) to update availability status
    const intervalId = setInterval(() => {
      checkAvailability();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, [stations.length]); // Only check when station count changes to avoid infinite loops
  
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
        const matiStation = stations.find((s: WeatherStation) => 
          s.municipality.name === 'City of Mati' || 
          s.municipality.name === 'Mati City' ||
          s.municipality.name === 'Mati'
        );
        setDefaultStation(matiStation || stations.find((s: WeatherStation) => s.isActive) || stations[0] || null);
      } finally {
        setIsLoadingLocation(false);
      }
    };
    
    if (stations.length > 0) {
      loadDefaultStation();
    }
  }, [stations]);
  
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(defaultStation);
  
  // Update selected station when default station is determined
  useEffect(() => {
    if (defaultStation && !selectedStation) {
      setSelectedStation(defaultStation);
    }
  }, [defaultStation, selectedStation]);
  const [currentData, setCurrentData] = useState<WeatherData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [rainfallAnalytics, setRainfallAnalytics] = useState<RainfallAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use ref to store the latest selectedStation to avoid stale closures
  const selectedStationRef = useRef(selectedStation);
  useEffect(() => {
    selectedStationRef.current = selectedStation;
  }, [selectedStation]);

  // Fetch weather data for selected station
  const fetchWeatherData = useCallback(async (stationId: string, isRefresh: boolean = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const currentStation = selectedStationRef.current;
      const municipalityName = currentStation?.municipality.name;
      const exactDeviceId = currentStation?.deviceId; // Get exact device ID for custom stations
      
      // Fetch current weather data
      const current = await fetchApiWeather(municipalityName, exactDeviceId);
      
      if (current) {
        setCurrentData({
          temperature: current.temperature,
          humidity: current.humidity,
          rainfall: current.rainfall,
          windSpeed: current.windSpeed,
          windDirection: current.windDirection || 0,
          lastUpdated: current.timestamp,
          dataSource: current.source,
        });

        // Update station status with API data
        if (currentStation) {
          // Check if it's a custom station by checking the ID prefix
          const isCustom = currentStation.id.startsWith('custom-');
          
          if (isCustom) {
            setCustomStations(prevStations => 
              prevStations.map((station: WeatherStation) => 
                station.id === currentStation.id
                  ? {
                      ...station,
                      isActive: true,
                      lastSeen: current.timestamp,
                      apiAvailable: true,
                    }
                  : station
              )
            );
          } else {
            setBaseStations(prevStations => 
              prevStations.map((station: WeatherStation) => 
                station.id === currentStation.id
                  ? {
                      ...station,
                      isActive: true,
                      lastSeen: current.timestamp,
                      apiAvailable: true,
                    }
                  : station
              )
            );
          }
        }

        // Fetch historical data (last 7 days)
        const historical = await fetchHistoricalWeatherData(municipalityName, exactDeviceId, 7);
        
        if (historical.length > 0) {
          const transformedHistorical = historical.map((h: WeatherApiResponse) => ({
            timestamp: h.timestamp,
            temperature: h.temperature,
            humidity: h.humidity,
            rainfall: h.rainfall,
            windSpeed: h.windSpeed,
            windDirection: h.windDirection || 0,
          }));
          setHistoricalData(transformedHistorical);
          
          // Calculate PAGASA rainfall analytics
          const analytics = calculateRainfallAnalytics(transformedHistorical);
          setRainfallAnalytics(analytics);
        } else {
          // If no historical data, create a single point from current data
          const singlePoint = [{
            timestamp: current.timestamp,
            temperature: current.temperature,
            humidity: current.humidity,
            rainfall: current.rainfall,
            windSpeed: current.windSpeed,
            windDirection: current.windDirection || 0,
          }];
          setHistoricalData(singlePoint);
          
          const analytics = calculateRainfallAnalytics(singlePoint);
          setRainfallAnalytics(analytics);
        }
      } else {
        setCurrentData(null);
        setHistoricalData([]);
        setRainfallAnalytics(null);
        
        // Update station status to reflect API unavailability
        if (currentStation) {
          // Check if it's a custom station by checking the ID prefix
          const isCustom = currentStation.id.startsWith('custom-');
          
          if (isCustom) {
            setCustomStations(prevStations => 
              prevStations.map(station => 
                station.id === currentStation.id
                  ? {
                      ...station,
                      isActive: false,
                      apiAvailable: false,
                    }
                  : station
              )
            );
          } else {
            setBaseStations(prevStations => 
              prevStations.map(station => 
                station.id === currentStation.id
                  ? {
                      ...station,
                      isActive: false,
                      apiAvailable: false,
                    }
                  : station
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setCurrentData(null);
      setHistoricalData([]);
      setRainfallAnalytics(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch data when station is selected
  useEffect(() => {
    if (selectedStation) {
      fetchWeatherData(selectedStation.id);
    }
  }, [selectedStation, fetchWeatherData]);

  const handleRefresh = () => {
    if (selectedStation) {
      fetchWeatherData(selectedStation.id, true);
    }
  };

  const handleSelectStation = (station: WeatherStation) => {
    setCurrentData(null);
    setHistoricalData([]);
    setRainfallAnalytics(null);
    
    const updatedStation = stations.find((s: WeatherStation) => s.id === station.id);
    if (updatedStation) {
      setSelectedStation(updatedStation);
    } else {
      setSelectedStation(station);
    }
  };

  return (
    <WeatherLandingPage
      stations={stations}
      selectedStation={selectedStation}
      currentData={currentData}
      historicalData={historicalData}
      rainfallAnalytics={rainfallAnalytics}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
      onSelectStation={handleSelectStation}
    />
  );
}

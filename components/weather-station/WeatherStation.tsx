import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Municipality } from '@/data/davaoOrientalData';
import { getUsersWithFilters } from '@/firebase/auth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePermissions } from '@/hooks/usePermissions';
import { useScreenSize } from '@/hooks/useScreenSize';
import { calculateRainfallAnalytics, PAGASAAdvisory as PAGASAAdvisoryType, RainfallAnalytics } from '@/services/pagasaAdvisoryService';
import { checkStationsAvailability, fetchWeatherData as fetchApiWeather, fetchHistoricalWeatherData, subscribeToHistoricalWeatherUpdates, subscribeToWeatherUpdates } from '@/services/weatherApi';
import { generateStations, WeatherStation } from '@/types/WeatherStation';
import { notifyAdvisoryLevelChange } from '@/utils/notificationHelpers';
import { addCustomStation, loadCustomStations } from '@/utils/weatherStationStorage';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AddWeatherStationModal } from './AddWeatherStationModal';
import { HistoricalDataPoint, HistoricalDataView } from './HistoricalDataView';
import { PAGASAAdvisory } from './PAGASAAdvisory';
import { AlertThreshold, WeatherAlert } from './WeatherAlert';
import { WeatherAnalyticsDashboard } from './WeatherAnalyticsDashboard';
import { WeatherData, WeatherMetrics } from './WeatherMetrics';
import { WeatherPredictiveAnalysis } from './WeatherPredictiveAnalysis';
import { WeatherStationSwitcher } from './WeatherStationSwitcher';

// Default alert thresholds (can be configured later)
const DEFAULT_THRESHOLDS: AlertThreshold = {
  temperature: { min: 15, max: 35 },
  humidity: { min: 30, max: 90 },
  rainfall: { max: 50 }, // Alert if exceeds 50mm
  windSpeed: { max: 60 }, // Alert if exceeds 60 km/h
};

const WeatherStationScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  const { isAdminOrSupervisor } = usePermissions();
  
  // Initialize stations - will be merged with custom stations
  const [baseStations, setBaseStations] = useState<WeatherStation[]>(generateStations());
  const [customStations, setCustomStations] = useState<WeatherStation[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
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
  }, [stations.length]); // Only run when number of stations changes
  
  // Location-based default station selection
  const [defaultStation, setDefaultStation] = useState<WeatherStation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
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
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  
  // Track previous advisory levels to detect changes
  const previousCurrentAdvisory = useRef<PAGASAAdvisoryType | null>(null);
  const previousPredictedAdvisory = useRef<PAGASAAdvisoryType | null>(null);
  
  // Use ref to store the latest selectedStation to avoid stale closures in interval
  const selectedStationRef = useRef(selectedStation);
  useEffect(() => {
    selectedStationRef.current = selectedStation;
  }, [selectedStation]);

  // Fetch weather data from real API
  const fetchWeatherData = useCallback(async (stationId: string, isRefresh: boolean = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Use ref to get the latest selectedStation to avoid stale closures
      const currentStation = selectedStationRef.current;
      const municipalityName = currentStation?.municipality.name;
      // For custom stations, use the exact deviceId; for base stations, use municipality name
      const exactDeviceId = currentStation?.deviceId;
      
      // Fetch current weather data from Firebase Realtime Database
      // For custom stations, use exact deviceId; for base stations, use municipality name patterns
      const current = await fetchApiWeather(municipalityName, exactDeviceId);
      
      if (current) {
        // Set current weather data
        setCurrentData({
          temperature: current.temperature,
          humidity: current.humidity,
          rainfall: current.rainfall,
          windSpeed: current.windSpeed,
          windDirection: current.windDirection || 0,
          lastUpdated: current.timestamp,
        });
        setIsConnected(true);

        // Update station status with API data
        if (currentStation) {
          // Check if it's a custom station by checking the ID prefix
          const isCustom = currentStation.id.startsWith('custom-');
          
          if (isCustom) {
            setCustomStations(prevStations => 
              prevStations.map(station => 
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
              prevStations.map(station => 
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

        // Fetch historical data (last 7 days) from Firebase, filtered by municipality/device_id
        const historical = await fetchHistoricalWeatherData(municipalityName, exactDeviceId, 7);
        
        if (historical.length > 0) {
          // Transform historical data to match expected format
          const transformedHistorical = historical.map(h => ({
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
          
          // Calculate PAGASA analytics even with single point
          const analytics = calculateRainfallAnalytics(singlePoint);
          setRainfallAnalytics(analytics);
        }
        
        // Note: Advisory level change detection and notification will be handled in useEffect below
      } else {
        // If API call failed or no data found for this municipality, clear all data
        setCurrentData(null);
        setHistoricalData([]);
        setRainfallAnalytics(null);
        setIsConnected(false);
        
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
        
        // No weather data found
      }
    } catch (error) {
      // Error fetching weather data
      // Clear data on error to prevent showing stale data
      setCurrentData(null);
      setHistoricalData([]);
      setRainfallAnalytics(null);
      setIsConnected(false);
      
      // Update station status on error
      const currentStation = selectedStationRef.current;
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
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []); // Remove baseStations and customStations from dependencies to prevent infinite loop

  // Detect advisory level changes and notify all users
  useEffect(() => {
    if (!rainfallAnalytics) return;

    const checkAndNotifyAdvisoryChange = async () => {
      try {
        const currentAdvisory = rainfallAnalytics.currentAdvisory;
        const predictedAdvisory = rainfallAnalytics.predictedAdvisory;
        const municipalityName = selectedStation?.municipality.name;

        // Check current advisory level change
        if (previousCurrentAdvisory.current) {
          const prev = previousCurrentAdvisory.current;
          const curr = currentAdvisory;
          
          // Only notify if level or color changed
          if (prev.level !== curr.level || prev.color !== curr.color) {
            // Get all active users
            const allActiveUsers = await getUsersWithFilters({ status: 'active' });
            const userIds = allActiveUsers.map(user => user.id);
            
            if (userIds.length > 0) {
              await notifyAdvisoryLevelChange(
                userIds,
                prev.level,
                prev.color,
                curr.level,
                curr.color,
                municipalityName,
                false // isPredicted = false for current advisory
              );
            }
          }
        }
        
        // Check predicted advisory level change (if available)
        if (predictedAdvisory && rainfallAnalytics.continuationPrediction.willContinue) {
          if (previousPredictedAdvisory.current) {
            const prev = previousPredictedAdvisory.current;
            const curr = predictedAdvisory;
            
            // Only notify if level or color changed
            if (prev.level !== curr.level || prev.color !== curr.color) {
              // Get all active users
              const allActiveUsers = await getUsersWithFilters({ status: 'active' });
              const userIds = allActiveUsers.map(user => user.id);
              
              if (userIds.length > 0) {
                await notifyAdvisoryLevelChange(
                  userIds,
                  prev.level,
                  prev.color,
                  curr.level,
                  curr.color,
                  municipalityName,
                  true // isPredicted = true for predicted advisory
                );
              }
            }
          }
        }
        
        // Update previous advisory levels
        previousCurrentAdvisory.current = { ...currentAdvisory };
        if (predictedAdvisory && rainfallAnalytics.continuationPrediction.willContinue) {
          previousPredictedAdvisory.current = { ...predictedAdvisory };
        } else {
          previousPredictedAdvisory.current = null;
        }
      } catch (error) {
        // Don't throw - this is a background notification process
      }
    };

    // Only check for changes after initial load (skip first render)
    if (previousCurrentAdvisory.current !== null || previousPredictedAdvisory.current !== null) {
      checkAndNotifyAdvisoryChange();
    } else {
      // Initialize previous values on first load (don't notify)
      previousCurrentAdvisory.current = { ...rainfallAnalytics.currentAdvisory };
      if (rainfallAnalytics.predictedAdvisory && rainfallAnalytics.continuationPrediction.willContinue) {
        previousPredictedAdvisory.current = { ...rainfallAnalytics.predictedAdvisory };
      }
    }
  }, [rainfallAnalytics, selectedStation]);

  // Set up real-time listeners when station is selected
  useEffect(() => {
    if (!selectedStation) return;

    // Reset previous advisory levels when switching stations
    previousCurrentAdvisory.current = null;
    previousPredictedAdvisory.current = null;

    const municipalityName = selectedStation.municipality.name;
    // For custom stations, use the exact deviceId; for base stations, use undefined
    const exactDeviceId = selectedStation.deviceId;
    
    // Initial fetch to load current data
    fetchWeatherData(selectedStation.id);

    // Set up real-time listener for current weather data
    // This will automatically update when new data arrives in the database
    const unsubscribeCurrent = subscribeToWeatherUpdates(
      municipalityName,
      exactDeviceId,
      (data) => {
        // Update current weather data when new data is detected
        setCurrentData({
          temperature: data.temperature,
          humidity: data.humidity,
          rainfall: data.rainfall,
          windSpeed: data.windSpeed,
          windDirection: data.windDirection || 0,
          lastUpdated: data.timestamp,
        });
        setIsConnected(true);
        
        // Update station status
        const currentStation = selectedStationRef.current;
        if (currentStation) {
          // Check if it's a custom station by checking the ID prefix
          const isCustom = currentStation.id.startsWith('custom-');
          
          if (isCustom) {
            setCustomStations(prevStations => 
              prevStations.map(station => 
                station.id === currentStation.id
                  ? {
                      ...station,
                      isActive: true,
                      lastSeen: data.timestamp,
                      apiAvailable: true,
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
                      isActive: true,
                      lastSeen: data.timestamp,
                      apiAvailable: true,
                    }
                  : station
              )
            );
          }
        }
      },
      (error) => {
        // Real-time listener error
        setIsConnected(false);
      }
    );

    // Set up real-time listener for historical data
    // This will automatically update when new historical entries are added
    const unsubscribeHistorical = subscribeToHistoricalWeatherUpdates(
      municipalityName,
      exactDeviceId,
      (historicalData) => {
        if (historicalData.length > 0) {
          // Transform historical data to match expected format
          const transformedHistorical = historicalData.map(h => ({
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
        }
      },
      (error) => {
        // Historical listener error
      }
    );

    // Cleanup: unsubscribe when station changes or component unmounts
    return () => {
      unsubscribeCurrent();
      unsubscribeHistorical();
    };
  }, [selectedStation, fetchWeatherData]);

  const handleRefresh = () => {
    if (selectedStation) {
      fetchWeatherData(selectedStation.id, true);
    }
  };

  const handleSelectStation = (station: WeatherStation) => {
    // Clear existing data immediately when switching stations to prevent showing stale data
    setCurrentData(null);
    setHistoricalData([]);
    setRainfallAnalytics(null);
    
    // Update selected station reference to match current stations state
    const updatedStation = stations.find(s => s.id === station.id);
    if (updatedStation) {
      setSelectedStation(updatedStation);
    } else {
      setSelectedStation(station);
    }
    setDismissedAlerts(new Set()); // Reset alerts when switching stations
  };

  const handleMetricPress = (metric: string) => {
    // Could navigate to detailed view or show more info
  };

  const handleAlertDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set(Array.from(prev).concat(alertId)));
  };

  const handleAddStation = async (deviceId: string, municipality: Municipality, locationName?: string) => {
    try {
      // Build station name with location if provided
      let stationName = `${municipality.name} Weather Station`;
      if (locationName) {
        stationName = `${municipality.name} - ${locationName}`;
      }
      stationName += ` (${deviceId})`;
      
      // Create a new custom station
      const newStation: WeatherStation = {
        id: `custom-${deviceId}`,
        name: stationName,
        municipality,
        isActive: true,
        lastSeen: undefined,
        apiAvailable: undefined,
        deviceId: deviceId, // Store the actual device ID
        locationName: locationName, // Store location name to distinguish multiple stations
      };
      
      // Add to custom stations (this will sync to Firebase)
      await addCustomStation(newStation);
      
      // Reload stations from Firebase to get the latest data
      const updatedCustomStations = await loadCustomStations();
      setCustomStations(updatedCustomStations);
    } catch (error) {
      // Re-throw error so modal can display it
      const errorMessage = error instanceof Error ? error.message : 'Failed to add weather station';
      throw new Error(errorMessage);
    }
  };


  if (isLoading && !currentData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={[styles.loadingText, { color: colors.text, opacity: 0.7 }]}>
          Loading weather data{selectedStation ? ` from ${selectedStation.municipality.name}` : ''}...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.scrollContentMobile,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
                Weather Stations
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.text, opacity: 0.7 }]}>
                Real-time atmospheric monitoring across Davao Oriental
              </ThemedText>
            </View>
            {selectedStation && !isMobile && (
              <View style={[styles.currentStationBadge, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="location" size={16} color={colors.primary} />
                <View style={styles.badgeContent}>
                  <ThemedText style={[styles.currentStationText, { color: colors.primary }]}>
                    {(() => {
                      // Count stations in same municipality to show number
                      const sameMunicipalityStations = stations.filter(
                        s => s.municipality.name === selectedStation.municipality.name
                      );
                      const stationIndex = sameMunicipalityStations.findIndex(s => s.id === selectedStation.id);
                      return sameMunicipalityStations.length > 1 
                        ? `${selectedStation.municipality.name} ${stationIndex + 1}`
                        : selectedStation.municipality.name;
                    })()}
                  </ThemedText>
                  {selectedStation.locationName && (
                    <ThemedText style={[styles.currentStationLocation, { color: colors.primary, opacity: 0.7 }]}>
                      {selectedStation.locationName}
                    </ThemedText>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Station Switcher */}
        {selectedStation && (
          <WeatherStationSwitcher
            stations={stations}
            selectedStation={selectedStation}
            onSelectStation={handleSelectStation}
            onAddStation={isAdminOrSupervisor ? () => setShowAddModal(true) : undefined}
            showAddButton={isAdminOrSupervisor}
          />
        )}

        {/* Add Weather Station Modal */}
        {isAdminOrSupervisor && (
          <AddWeatherStationModal
            visible={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAddStation={handleAddStation}
            existingStations={stations.map(s => ({
              municipality: s.municipality,
              deviceId: s.deviceId, // Pass the deviceId if it's a custom station
            }))}
          />
        )}

        {/* PAGASA Rainfall Advisory */}
        {rainfallAnalytics && (
          <PAGASAAdvisory analytics={rainfallAnalytics} showPrediction={true} />
        )}

        {/* Alerts */}
        {currentData && (
          <WeatherAlert
            data={currentData}
            thresholds={DEFAULT_THRESHOLDS}
            dismissedAlerts={dismissedAlerts}
            onDismiss={handleAlertDismiss}
          />
        )}

        {/* Current Weather Metrics */}
        <WeatherMetrics 
          historicalData={historicalData} 
          onMetricPress={handleMetricPress}
          onRefresh={() => {
            if (selectedStation) {
              fetchWeatherData(selectedStation.id, true);
            }
          }}
        />

        {/* Analytics Dashboard */}
        <WeatherAnalyticsDashboard currentData={currentData} historicalData={historicalData} />

        {/* Predictive Analysis */}
        <WeatherPredictiveAnalysis 
          historicalData={historicalData} 
          currentData={currentData}
        />

        {/* Historical Data */}
        <HistoricalDataView
          data={historicalData}
          loading={isLoading}
          municipalityName={selectedStation?.municipality.name}
          onRefresh={() => {
            if (selectedStation) {
              fetchWeatherData(selectedStation.id, true);
            }
          }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'web' ? 20 : 100,
  },
  scrollContentMobile: {
    paddingBottom: Platform.OS === 'web' ? 20 : 100,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  currentStationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  badgeContent: {
    flexDirection: 'column',
    gap: 2,
  },
  currentStationText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  currentStationLocation: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default WeatherStationScreen;


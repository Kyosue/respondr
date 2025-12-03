import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { getUsersWithFilters } from '@/firebase/auth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { calculateRainfallAnalytics, PAGASAAdvisory as PAGASAAdvisoryType, RainfallAnalytics } from '@/services/pagasaAdvisoryService';
import { fetchWeatherData as fetchApiWeather, fetchHistoricalWeatherData, subscribeToHistoricalWeatherUpdates, subscribeToWeatherUpdates } from '@/services/weatherApi';
import { generateStations, WeatherStation } from '@/types/WeatherStation';
import { notifyAdvisoryLevelChange } from '@/utils/notificationHelpers';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { HistoricalDataPoint, HistoricalDataView } from './HistoricalDataView';
import { PAGASAAdvisory } from './PAGASAAdvisory';
import { AlertThreshold, WeatherAlert } from './WeatherAlert';
import { WeatherAnalyticsDashboard } from './WeatherAnalyticsDashboard';
import { WeatherData, WeatherMetrics } from './WeatherMetrics';
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
  
  
  // Initialize stations
  const [stations, setStations] = useState<WeatherStation[]>(generateStations());
  
  // Auto-select City of Mati as default, or first active station, or first station if none are active
  const defaultStation = useMemo(() => {
    // First, try to find City of Mati
    const matiStation = stations.find(s => 
      s.municipality.name === 'City of Mati' || 
      s.municipality.name === 'Mati City' ||
      s.municipality.name === 'Mati'
    );
    if (matiStation) return matiStation;
    
    // Fallback to first active station, or first station
    return stations.find(s => s.isActive) || stations[0];
  }, [stations]);
  
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(defaultStation);
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
      
      // Fetch current weather data from Firebase Realtime Database
      // Filter by municipality name to get data for the selected station's device_id
      const current = await fetchApiWeather(municipalityName);
      
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
          setStations(prevStations => 
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

        // Fetch historical data (last 7 days) from Firebase, filtered by municipality/device_id
        const historical = await fetchHistoricalWeatherData(municipalityName, 7);
        
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
          setStations(prevStations => 
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
        
        if (municipalityName) {
          console.warn(`No weather data found for ${municipalityName} - no matching device_id in database`);
        } else {
          console.warn('Failed to fetch weather data from API');
        }
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Clear data on error to prevent showing stale data
      setCurrentData(null);
      setHistoricalData([]);
      setRainfallAnalytics(null);
      setIsConnected(false);
      
      // Update station status on error
      const currentStation = selectedStationRef.current;
      if (currentStation) {
        setStations(prevStations => 
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
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedStation]);

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
            console.log(`[Advisory Change] Current advisory changed: ${prev.color} (${prev.level}) → ${curr.color} (${curr.level})`);
            
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
              console.log(`[Advisory Change] Notified ${userIds.length} users about current advisory change`);
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
              console.log(`[Advisory Change] Predicted advisory changed: ${prev.color} (${prev.level}) → ${curr.color} (${curr.level})`);
              
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
                console.log(`[Advisory Change] Notified ${userIds.length} users about predicted advisory change`);
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
        console.error('[Advisory Change] Error checking and notifying advisory change:', error);
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
    
    // Initial fetch to load current data
    fetchWeatherData(selectedStation.id);

    // Set up real-time listener for current weather data
    // This will automatically update when new data arrives in the database
    const unsubscribeCurrent = subscribeToWeatherUpdates(
      municipalityName,
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
          setStations(prevStations => 
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
        
        console.log(`[Weather Station] Real-time update received for ${municipalityName}`);
      },
      (error) => {
        console.error('[Weather Station] Real-time listener error:', error);
        setIsConnected(false);
      }
    );

    // Set up real-time listener for historical data
    // This will automatically update when new historical entries are added
    const unsubscribeHistorical = subscribeToHistoricalWeatherUpdates(
      municipalityName,
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
          
          console.log(`[Weather Station] Historical data updated: ${historicalData.length} entries for ${municipalityName}`);
        }
      },
      (error) => {
        console.error('[Weather Station] Historical listener error:', error);
      }
    );

    // Cleanup: unsubscribe when station changes or component unmounts
    return () => {
      unsubscribeCurrent();
      unsubscribeHistorical();
      console.log(`[Weather Station] Unsubscribed from real-time updates for ${municipalityName}`);
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
    console.log('Metric pressed:', metric);
  };

  const handleAlertDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
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
                <ThemedText style={[styles.currentStationText, { color: colors.primary }]}>
                  {selectedStation.municipality.name}
                </ThemedText>
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
  currentStationText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default WeatherStationScreen;


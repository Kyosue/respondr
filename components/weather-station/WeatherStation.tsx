import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { fetchWeatherData as fetchApiWeather, fetchHistoricalWeatherData } from '@/services/weatherApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { HistoricalDataPoint, HistoricalDataView } from './HistoricalDataView';
import { AlertThreshold, WeatherAlert } from './WeatherAlert';
import { WeatherAnalyticsDashboard } from './WeatherAnalyticsDashboard';
import { WeatherData, WeatherMetrics } from './WeatherMetrics';
import { WeatherStation, generateStations } from '@/types/WeatherStation';
import { WeatherStationSwitcher } from './WeatherStationSwitcher';
import { PAGASAAdvisory } from './PAGASAAdvisory';
import { calculateRainfallAnalytics, RainfallAnalytics } from '@/services/pagasaAdvisoryService';

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
  
  // Auto-select Mati City as default (prefer active Mati, otherwise any Mati, then first active)
  const defaultStation = useMemo(() => {
    // First, try to find an active Mati City station
    const matiStation = stations.find(s => 
      s.municipality.name.toLowerCase().includes('mati') && s.isActive
    );
    if (matiStation) return matiStation;
    
    // If no active Mati, try to find any Mati station
    const anyMatiStation = stations.find(s => 
      s.municipality.name.toLowerCase().includes('mati')
    );
    if (anyMatiStation) return anyMatiStation;
    
    // Fallback to first active station, or first station if none are active
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
      const municipalityName = currentStation?.municipality.name || 'Mati';
      
      // Fetch current weather data
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

        // Fetch historical data (last 7 days)
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
      } else {
        // If API call failed, set connection status
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
        
        console.warn('Failed to fetch weather data from API');
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
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

  // Fetch data when station is selected and set up auto-refresh
  useEffect(() => {
    if (!selectedStation) return;

    // Initial fetch
    fetchWeatherData(selectedStation.id);

    // Set up auto-refresh every 10 minutes (matching transmission frequency)
    const interval = setInterval(() => {
      // Use ref to get the latest selectedStation to avoid stale closures
      const currentStation = selectedStationRef.current;
      if (currentStation) {
        fetchWeatherData(currentStation.id, true);
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      clearInterval(interval);
    };
  }, [selectedStation, fetchWeatherData]);

  const handleRefresh = () => {
    if (selectedStation) {
      fetchWeatherData(selectedStation.id, true);
    }
  };

  const handleSelectStation = (station: WeatherStation) => {
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
        <WeatherMetrics data={currentData} onMetricPress={handleMetricPress} />

        {/* Analytics Dashboard */}
        <WeatherAnalyticsDashboard currentData={currentData} historicalData={historicalData} />

        {/* Historical Data */}
        <HistoricalDataView
          data={historicalData}
          loading={isLoading}
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


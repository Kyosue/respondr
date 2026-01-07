import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Municipality } from '@/data/davaoOrientalData';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePermissions } from '@/hooks/usePermissions';
import { useScreenSize } from '@/hooks/useScreenSize';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { AddWeatherStationModal } from './AddWeatherStationModal';
import { HistoricalDataView } from './HistoricalDataView';
import { PAGASAAdvisory } from './PAGASAAdvisory';
import { AlertThreshold, WeatherAlert } from './WeatherAlert';
import { WeatherAnalyticsDashboard } from './WeatherAnalyticsDashboard';
import { WeatherMetrics } from './WeatherMetrics';
import { WeatherPredictiveAnalysis } from './WeatherPredictiveAnalysis';
import { WeatherStationSwitcher } from './WeatherStationSwitcher';
import { WeatherStation } from '@/types/WeatherStation';
import { addCustomStation } from '@/utils/weatherStationStorage';
import {
  useWeatherStations,
  useWeatherData,
  useAdvisoryNotifications,
  useWeatherSubscriptions,
  useStationSelection,
} from './hooks';

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
  
  // Station management
  const {
    stations,
    updateStationStatus,
    reloadCustomStations,
  } = useWeatherStations();

  // Station selection
  const {
    selectedStation,
    setSelectedStation,
  } = useStationSelection(stations);

  // Weather data management
  const {
    currentData,
    historicalData,
    rainfallAnalytics,
    isConnected,
    isLoading,
    isRefreshing,
    fetchWeatherData,
    clearData,
    updateCurrentData,
    updateHistoricalData,
    setIsConnected,
  } = useWeatherData(selectedStation);

  // Advisory notifications
  const { resetAdvisoryTracking } = useAdvisoryNotifications(
    rainfallAnalytics,
    selectedStation
  );

  // Real-time subscriptions
  useWeatherSubscriptions(
    selectedStation,
    updateCurrentData,
    updateHistoricalData,
    setIsConnected,
    (stationId, updates) => {
      updateStationStatus(stationId, updates);
    }
  );

  // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Handlers
  const handleRefresh = () => {
    if (selectedStation) {
      fetchWeatherData(selectedStation.id, true);
    }
  };

  const handleSelectStation = (station: WeatherStation) => {
    // Clear existing data immediately when switching stations
    clearData();
    resetAdvisoryTracking();
    setSelectedStation(station);
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
        deviceId: deviceId,
        locationName: locationName,
      };
      
      // Add to custom stations (this will sync to Firebase)
      await addCustomStation(newStation);
      
      // Reload stations from Firebase to get the latest data
      await reloadCustomStations();
    } catch (error) {
      // Re-throw error so modal can display it
      const errorMessage = error instanceof Error ? error.message : 'Failed to add weather station';
      throw new Error(errorMessage);
    }
  };

  // Initial fetch when station is selected
  useEffect(() => {
    if (selectedStation) {
      fetchWeatherData(selectedStation.id);
    }
  }, [selectedStation?.id, fetchWeatherData]); // Only refetch when station ID changes

  // Loading state
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
              deviceId: s.deviceId,
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
          onRefresh={handleRefresh}
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
          onRefresh={handleRefresh}
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

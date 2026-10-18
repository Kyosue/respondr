import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Municipality } from '@/data/davaoOrientalData';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePermissions } from '@/hooks/usePermissions';
import { useScreenSize } from '@/hooks/useScreenSize';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  const { isDark } = useTheme();
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

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? '#0E1821' : '#F2F6F6' }]}>
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
        <View style={styles.content}>
          <View style={[styles.hero, isMobile && styles.heroMobile]}>
            <View style={styles.heroCopy}>
              <View style={styles.heroEyebrow}>
                <Ionicons name="radio-outline" size={14} color="#8FE0D4" />
                <ThemedText style={styles.heroEyebrowText}>PDRRMO · WEATHER INTELLIGENCE</ThemedText>
              </View>
              <ThemedText style={styles.heroTitle}>Weather monitoring</ThemedText>
              <ThemedText style={styles.heroSubtitle}>Local station observations, rainfall advisories, and trends for operational awareness.</ThemedText>
            </View>
            <View style={[styles.heroStatus, isMobile && styles.heroStatusMobile]}>
              <View style={styles.heroStatusTop}>
                <View style={[styles.liveDot, { backgroundColor: isConnected ? '#5DE0A1' : '#F6B85A' }]} />
                <ThemedText style={styles.heroStatusLabel}>{isConnected ? 'STATION CONNECTED' : isLoading ? 'CONNECTING TO STATION' : 'NO LIVE CONNECTION'}</ThemedText>
              </View>
              <ThemedText style={styles.heroStatusLocation} numberOfLines={1}>{selectedStation?.municipality.name || 'No station selected'}</ThemedText>
              {selectedStation?.locationName ? <ThemedText style={styles.heroStatusSub}>{selectedStation.locationName}</ThemedText> : null}
              <View style={styles.heroStatusFooter}>
                <Ionicons name="time-outline" size={13} color="#AFC2CE" />
                <ThemedText style={styles.heroStatusUpdated}>
                  {currentData?.lastUpdated ? `Updated ${currentData.lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Waiting for latest observation'}
                </ThemedText>
                {isLoading && <ActivityIndicator size="small" color="#AFC2CE" />}
              </View>
            </View>
          </View>

          {selectedStation && (
            <WeatherStationSwitcher
              stations={stations}
              selectedStation={selectedStation}
              onSelectStation={handleSelectStation}
              onAddStation={isAdminOrSupervisor ? () => setShowAddModal(true) : undefined}
              showAddButton={isAdminOrSupervisor}
            />
          )}

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

          {isLoading && !currentData && (
            <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <ThemedText style={[styles.loadingText, { color: colors.text }]}>Loading weather data{selectedStation ? ` from ${selectedStation.municipality.name}` : ''}…</ThemedText>
            </View>
          )}

          {!isLoading && !currentData && (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.emptyIcon}><Ionicons name="cloud-offline-outline" size={21} color="#C9822B" /></View>
              <View style={styles.emptyCopy}>
                <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No current report available</ThemedText>
                <ThemedText style={[styles.emptySubtitle, { color: colors.text, opacity: 0.66 }]}>Refresh this station or choose another location in the network.</ThemedText>
              </View>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefresh} activeOpacity={0.85}>
                <Ionicons name="refresh" size={15} color="#FFFFFF" />
                <ThemedText style={styles.retryText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.sectionHeading}>
            <View>
              <ThemedText style={[styles.sectionEyebrow, { color: colors.primary }]}>SITUATION OVERVIEW</ThemedText>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Current conditions and analysis</ThemedText>
            </View>
          </View>

          {rainfallAnalytics && (
            <View style={styles.widgetWrap}>
              <PAGASAAdvisory analytics={rainfallAnalytics} showPrediction />
            </View>
          )}

          {currentData && (
            <View style={styles.widgetWrap}>
              <WeatherAlert
                data={currentData}
                thresholds={DEFAULT_THRESHOLDS}
                dismissedAlerts={dismissedAlerts}
                onDismiss={handleAlertDismiss}
              />
            </View>
          )}

          <View style={styles.widgetWrap}>
            <View style={styles.widgetHeading}>
              <ThemedText style={[styles.widgetTitle, { color: colors.text }]}>Weather measurements</ThemedText>
              <ThemedText style={[styles.widgetNote, { color: colors.text, opacity: 0.58 }]}>Latest station observation</ThemedText>
            </View>
            <WeatherMetrics
              historicalData={historicalData}
              dataSource={currentData?.dataSource}
              onMetricPress={handleMetricPress}
              onRefresh={handleRefresh}
            />
          </View>

          <View style={styles.widgetWrap}>
            <WeatherAnalyticsDashboard currentData={currentData} historicalData={historicalData} />
          </View>

          <View style={styles.widgetWrap}>
            <WeatherPredictiveAnalysis historicalData={historicalData} currentData={currentData} />
          </View>

          <View style={styles.widgetWrap}>
            <HistoricalDataView
              data={historicalData}
              loading={isLoading}
              municipalityName={selectedStation?.municipality.name}
              stationName={selectedStation?.name}
              onRefresh={handleRefresh}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollView: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 20, paddingBottom: Platform.OS === 'web' ? 28 : 110 },
  scrollContentMobile: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: Platform.OS === 'web' ? 24 : 110 },
  content: { width: '100%', maxWidth: 1320, alignSelf: 'center' },
  hero: { minHeight: 158, borderRadius: 14, padding: 22, backgroundColor: '#102A3D', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginBottom: 16, ...Platform.select({ web: { boxShadow: '0 12px 32px rgba(16,42,61,0.15)' } as any, default: {} }) },
  heroMobile: { flexDirection: 'column', alignItems: 'stretch', padding: 17, gap: 17 },
  heroCopy: { flex: 1 },
  heroEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 11 },
  heroEyebrowText: { color: '#B9D0D8', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.35, marginBottom: 5 },
  heroSubtitle: { maxWidth: 610, color: '#C5D2D8', fontSize: 14, lineHeight: 20 },
  heroStatus: { width: 285, borderRadius: 10, borderWidth: 1, borderColor: '#2B4A5B', backgroundColor: '#173648', padding: 14 },
  heroStatusMobile: { width: '100%' },
  heroStatusTop: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  heroStatusLabel: { color: '#BCD0D8', fontSize: 14, fontWeight: '800', letterSpacing: 0.65 },
  heroStatusLocation: { color: '#FFFFFF', fontSize: 16, lineHeight: 21, fontWeight: '700' },
  heroStatusSub: { color: '#AFC2CE', fontSize: 14, marginTop: 3 },
  heroStatusFooter: { borderTopWidth: 1, borderTopColor: '#315263', paddingTop: 9, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroStatusUpdated: { color: '#AFC2CE', flex: 1, fontSize: 14 },
  loadingCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 9, padding: 14, marginBottom: 15 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderRadius: 9, padding: 13, marginBottom: 15 },
  emptyIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  emptyCopy: { flex: 1 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  emptySubtitle: { fontSize: 14, lineHeight: 20 },
  retryButton: { height: 34, borderRadius: 7, paddingHorizontal: 11, backgroundColor: '#164E63', flexDirection: 'row', alignItems: 'center', gap: 5 },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  sectionHeading: { marginTop: 9, marginBottom: 11, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionEyebrow: { fontSize: 14, letterSpacing: 1.1, fontWeight: '800', marginBottom: 4 },
  sectionTitle: { fontSize: 20, lineHeight: 26, fontWeight: '800' },
  widgetWrap: { marginBottom: 14 },
  widgetHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  widgetTitle: { fontSize: 16, fontWeight: '800' },
  widgetNote: { fontSize: 14, fontWeight: '600' },
});

export default WeatherStationScreen;

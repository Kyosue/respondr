import { ThemedText } from '@/components/ThemedText';
import { HistoricalDataPoint, HistoricalDataView } from '@/components/weather-station/HistoricalDataView';
import { WeatherAnalyticsDashboard } from '@/components/weather-station/WeatherAnalyticsDashboard';
import { WeatherData, WeatherMetrics } from '@/components/weather-station/WeatherMetrics';
import { WeatherStationSwitcher } from '@/components/weather-station/WeatherStationSwitcher';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { calculateRainfallAnalytics, RainfallAnalytics } from '@/services/pagasaAdvisoryService';
import { checkStationsAvailability, fetchWeatherData as fetchApiWeather, fetchHistoricalWeatherData, WeatherApiResponse } from '@/services/weatherApi';
import { generateStations, WeatherStation } from '@/types/WeatherStation';
import { loadCustomStations } from '@/utils/weatherStationStorage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { isDark } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { isMobile, width } = useScreenSize();
  
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

  const handleMetricPress = (metric: string) => {
    // Could navigate to detailed view
    console.log('Metric pressed:', metric);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Background gradient */}
      <LinearGradient
        colors={isDark ? 
          ['#121212', '#1E1E1E', '#121212'] : 
          [colors.background, '#f5f7fa', colors.background]}
        style={styles.backgroundGradient}
      />
      
      {/* Decorative elements */}
      <View style={styles.decorationContainer}>
        <View style={[styles.decorationCircle, { backgroundColor: `${colors.primary}15` }]} />
        <View style={[styles.decorationCircle, styles.decorationCircle2, { backgroundColor: `${colors.secondary}10` }]} />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Top Navigation Bar */}
        <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.navContent, isMobile && styles.navContentMobile]}>
            {/* Logo and App Name */}
            <TouchableOpacity 
              style={styles.navLeft}
              onPress={() => {
                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[
                styles.navLogoContainer, 
                { backgroundColor: `${colors.primary}10` },
                isMobile && styles.navLogoContainerMobile
              ]}>
                <Image
                  source={require('@/assets/images/respondr_foreground.png')}
                  style={[styles.navLogo, isMobile && styles.navLogoMobile]}
                  resizeMode="contain"
                />
              </View>
              {!isMobile && (
                <View style={styles.navTitleContainer}>
                  <ThemedText type="title" style={[styles.navTitle, { color: colors.text }]}>
                    Respondr
                  </ThemedText>
                  <ThemedText style={[styles.navSubtitle, { color: colors.text }]}>
                    Weather Monitoring
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>

            {/* Sign In and Sign Up Buttons */}
            <View style={[styles.navRight, isMobile && styles.navRightMobile]}>
              {isMobile ? (
                <>
                  <TouchableOpacity 
                    style={[styles.navSignInButton, { borderColor: colors.primary }, styles.navButtonMobile]}
                    onPress={() => router.push('/login')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="log-in-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.navSignUpButton, { backgroundColor: colors.primary }, styles.navButtonMobile]}
                    onPress={() => router.push('/signup')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    style={[styles.navSignInButton, { borderColor: colors.primary }]}
                    onPress={() => router.push('/login')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="log-in-outline" size={18} color={colors.primary} />
                    <ThemedText style={[styles.navSignInText, { color: colors.primary }]}>
                      Sign In
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.navSignUpButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/signup')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
                    <ThemedText style={styles.navSignUpText}>
                      Sign Up
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={[styles.scrollView, isMobile && styles.scrollViewMobile]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Hero Section */}
            <View style={[styles.heroSection, isMobile && styles.heroSectionMobile]}>
              <View style={[styles.heroIconContainer, { backgroundColor: `${colors.primary}15` }, isMobile && styles.heroIconContainerMobile]}>
                <Ionicons name="partly-sunny" size={isMobile ? 48 : 64} color={colors.primary} />
              </View>
              <ThemedText type="title" style={[styles.heroTitle, { color: colors.text }, isMobile && styles.heroTitleMobile]}>
                PDRRMO Real-time Weather Monitoring
              </ThemedText>
              <ThemedText style={[styles.heroSubtitle, { color: colors.text }, isMobile && styles.heroSubtitleMobile]}>
                Track weather conditions across all municipalities in Davao Oriental. Get instant access to temperature, humidity, rainfall, and wind data to stay informed and prepared.
              </ThemedText>
              
              {/* Feature Highlights */}
              {isMobile ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featureGridMobile}
                  style={{ width: '100%' }}
                >
                  <View style={[styles.featureCard, styles.featureCardMobile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="time-outline" size={20} color={colors.primary} />
                    <ThemedText style={[styles.featureTitle, { color: colors.text }, styles.featureTitleMobile]}>
                      Real-time Data
                    </ThemedText>
                    <ThemedText style={[styles.featureDescription, { color: colors.text }, styles.featureDescriptionMobile]}>
                      Live updates every hour
                    </ThemedText>
                  </View>
                  <View style={[styles.featureCard, styles.featureCardMobile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="location-outline" size={20} color={colors.primary} />
                    <ThemedText style={[styles.featureTitle, { color: colors.text }, styles.featureTitleMobile]}>
                      All Municipalities
                    </ThemedText>
                    <ThemedText style={[styles.featureDescription, { color: colors.text }, styles.featureDescriptionMobile]}>
                      Coverage across Davao Oriental
                    </ThemedText>
                  </View>
                  <View style={[styles.featureCard, styles.featureCardMobile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="analytics-outline" size={20} color={colors.primary} />
                    <ThemedText style={[styles.featureTitle, { color: colors.text }, styles.featureTitleMobile]}>
                      Historical Analytics
                    </ThemedText>
                    <ThemedText style={[styles.featureDescription, { color: colors.text }, styles.featureDescriptionMobile]}>
                      7-day trends and patterns
                    </ThemedText>
                  </View>
                  <View style={[styles.featureCard, styles.featureCardMobile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
                    <ThemedText style={[styles.featureTitle, { color: colors.text }, styles.featureTitleMobile]}>
                      PAGASA Alerts
                    </ThemedText>
                    <ThemedText style={[styles.featureDescription, { color: colors.text }, styles.featureDescriptionMobile]}>
                      Official rainfall advisories
                    </ThemedText>
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.featureGrid}>
                  <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="time-outline" size={24} color={colors.primary} />
                    <ThemedText style={[styles.featureTitle, { color: colors.text }]}>
                      Real-time Data
                    </ThemedText>
                    <ThemedText style={[styles.featureDescription, { color: colors.text }]}>
                      Live updates every hour
                    </ThemedText>
                  </View>
                  <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="location-outline" size={24} color={colors.primary} />
                    <ThemedText style={[styles.featureTitle, { color: colors.text }]}>
                      All Municipalities
                    </ThemedText>
                    <ThemedText style={[styles.featureDescription, { color: colors.text }]}>
                      Coverage across Davao Oriental
                    </ThemedText>
                  </View>
                  <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="analytics-outline" size={24} color={colors.primary} />
                    <ThemedText style={[styles.featureTitle, { color: colors.text }]}>
                      Historical Analytics
                    </ThemedText>
                    <ThemedText style={[styles.featureDescription, { color: colors.text }]}>
                      7-day trends and patterns
                    </ThemedText>
                  </View>
                  <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
                    <ThemedText style={[styles.featureTitle, { color: colors.text }]}>
                      PAGASA Alerts
                    </ThemedText>
                    <ThemedText style={[styles.featureDescription, { color: colors.text }]}>
                      Official rainfall advisories
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>

            {/* Section Header */}
            <View style={[styles.sectionHeader, isMobile && styles.sectionHeaderMobile]}>
              <View style={styles.sectionHeaderContent}>
                <Ionicons name="map-outline" size={isMobile ? 20 : 24} color={colors.primary} />
                <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }, isMobile && styles.sectionTitleMobile]}>
                  Select Weather Station
                </ThemedText>
              </View>
              {!isMobile && (
                <ThemedText style={[styles.sectionDescription, { color: colors.text }]}>
                  Choose a municipality to view detailed weather information
                </ThemedText>
              )}
            </View>

            {/* Weather Station Selector */}
            {selectedStation && (
              <View style={styles.componentContainer}>
                <WeatherStationSwitcher
                  stations={stations}
                  selectedStation={selectedStation}
                  onSelectStation={handleSelectStation}
                />
              </View>
            )}

            {/* Loading State */}
            {isLoading && !currentData ? (
              <View style={[styles.weatherCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.loadingContainer}>
                  <View style={[styles.loadingIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name="cloud-download-outline" size={48} color={colors.primary} />
                  </View>
                  <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
                  <ThemedText style={[styles.loadingText, { color: colors.text }]}>
                    Loading weather data{selectedStation ? ` from ${selectedStation.municipality.name}` : ''}...
                  </ThemedText>
                  <ThemedText style={[styles.loadingSubtext, { color: colors.text }]}>
                    Please wait while we fetch the latest information
                  </ThemedText>
                </View>
              </View>
            ) : currentData ? (
              <>
                {/* Section Header for Weather Data */}
                <View style={[styles.sectionHeader, isMobile && styles.sectionHeaderMobile]}>
                  <View style={styles.sectionHeaderContent}>
                    <Ionicons name="stats-chart-outline" size={isMobile ? 20 : 24} color={colors.primary} />
                    <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }, isMobile && styles.sectionTitleMobile]}>
                      {isMobile ? 'Weather Data' : `Weather Data for ${selectedStation?.municipality.name}`}
                    </ThemedText>
                  </View>
                  {!isMobile && (
                    <ThemedText style={[styles.sectionDescription, { color: colors.text }]}>
                      Comprehensive weather metrics and historical analysis
                    </ThemedText>
                  )}
                </View>

                {/* Current Weather Metrics */}
                <View style={styles.componentContainer}>
                  <WeatherMetrics 
                    historicalData={historicalData} 
                    onMetricPress={handleMetricPress}
                    onRefresh={handleRefresh}
                  />
                </View>

                {/* Analytics Dashboard */}
                <View style={styles.componentContainer}>
                  <WeatherAnalyticsDashboard currentData={currentData} historicalData={historicalData} />
                </View>

                {/* Historical Data Table */}
                <View style={styles.componentContainer}>
                  <HistoricalDataView
                    data={historicalData}
                    loading={isLoading}
                    municipalityName={selectedStation?.municipality.name}
                    onRefresh={handleRefresh}
                  />
                </View>


              </>
            ) : (
              <View style={[styles.weatherCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.errorContainer}>
                  <View style={[styles.errorIconContainer, { backgroundColor: `${colors.text}10` }]}>
                    <Ionicons name="cloud-offline-outline" size={56} color={colors.text} />
                  </View>
                  <ThemedText style={[styles.errorTitle, { color: colors.text }]}>
                    No Data Available
                  </ThemedText>
                  <ThemedText style={[styles.errorText, { color: colors.text }]}>
                    Weather data is currently unavailable for {selectedStation?.municipality.name || 'this location'}. Please try again later or select a different station.
                  </ThemedText>
                  {selectedStation && (
                    <TouchableOpacity 
                      style={[styles.retryButton, { backgroundColor: colors.primary }]}
                      onPress={handleRefresh}
                    >
                      <Ionicons name="refresh" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.retryButtonText}>
                        Retry
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const navLogoSize = Math.min(width * 0.08, 40);

const styles = StyleSheet.create({
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorationContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decorationCircle: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    top: -width * 0.2,
    right: -width * 0.2,
    opacity: 0.8,
  },
  decorationCircle2: {
    width: width * 0.6,
    height: width * 0.6,
    top: height * 0.6,
    left: -width * 0.3,
    opacity: 0.6,
  },
  navBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
    }),
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
    ...Platform.select({
      web: {
        paddingHorizontal: 32,
        paddingVertical: 18,
      },
    }),
  },
  navContentMobile: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'opacity 0.2s ease',
      } as any,
    }),
  },
  navLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...Platform.select({
      web: {
        width: 52,
        height: 52,
        borderRadius: 14,
        marginRight: 14,
      },
    }),
  },
  navLogoContainerMobile: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 0,
  },
  navLogo: {
    width: navLogoSize,
    height: navLogoSize,
  },
  navLogoMobile: {
    width: 32,
    height: 32,
  },
  navTitleContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Gabarito',
    lineHeight: 24,
    ...Platform.select({
      web: {
        fontSize: 26,
        lineHeight: 28,
      },
    }),
  },
  navSubtitle: {
    fontSize: 11,
    opacity: 0.6,
    fontWeight: '500',
    marginTop: -2,
    ...Platform.select({
      web: {
        fontSize: 12,
        marginTop: -1,
      },
    }),
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navRightMobile: {
    gap: 8,
  },
  navSignInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    minHeight: 44,
    marginRight: 10,
    ...Platform.select({
      web: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        minHeight: 48,
        marginRight: 12,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      } as any,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
  },
  navButtonMobile: {
    width: 40,
    height: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 40,
    marginRight: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navSignInText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
    ...Platform.select({
      web: {
        fontSize: 16,
        marginLeft: 8,
      },
    }),
  },
  navSignUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    minHeight: 44,
    ...Platform.select({
      web: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        minHeight: 48,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      } as any,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  navSignUpText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
    ...Platform.select({
      web: {
        fontSize: 16,
        marginLeft: 8,
      },
    }),
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'web' ? 40 : 100,
  },
  scrollViewMobile: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 48,
    width: '100%',
    maxWidth: 1200,
  },
  heroSectionMobile: {
    marginBottom: 32,
  },
  heroIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...Platform.select({
      web: {
        width: 140,
        height: 140,
        borderRadius: 70,
      },
    }),
  },
  heroIconContainerMobile: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Gabarito',
    ...Platform.select({
      web: {
        fontSize: 52,
        marginBottom: 20,
      },
    }),
  },
  heroTitleMobile: {
    fontSize: 24,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    opacity: 0.75,
    textAlign: 'center',
    maxWidth: 700,
    lineHeight: 26,
    marginBottom: 40,
    ...Platform.select({
      web: {
        fontSize: 20,
        lineHeight: 30,
        marginBottom: 48,
      },
    }),
  },
  heroSubtitleMobile: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginHorizontal: -8,
    ...Platform.select({
      web: {
        marginHorizontal: -12,
      },
    }),
  },
  featureGridMobile: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 16,
    ...Platform.select({
      web: {
        minWidth: '22%',
        marginHorizontal: 12,
        padding: 24,
        borderRadius: 20,
      },
    }),
  },
  featureCardMobile: {
    flex: 0,
    minWidth: 140,
    width: 140,
    padding: 16,
    marginHorizontal: 8,
    marginBottom: 0,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: 'Gabarito',
    ...Platform.select({
      web: {
        fontSize: 18,
        marginTop: 16,
      },
    }),
  },
  featureDescription: {
    fontSize: 13,
    opacity: 0.7,
    textAlign: 'center',
    ...Platform.select({
      web: {
        fontSize: 14,
      },
    }),
  },
  featureTitleMobile: {
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
  },
  featureDescriptionMobile: {
    fontSize: 11,
    lineHeight: 14,
  },
  sectionHeader: {
    width: '100%',
    maxWidth: 1200,
    marginBottom: 24,
    alignSelf: 'center',
    ...Platform.select({
      web: {
        marginBottom: 32,
      },
    }),
  },
  sectionHeaderMobile: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Gabarito',
    ...Platform.select({
      web: {
        fontSize: 28,
        marginLeft: 12,
      },
    }),
  },
  sectionTitleMobile: {
    fontSize: 18,
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginLeft: 34,
    ...Platform.select({
      web: {
        fontSize: 16,
        marginLeft: 40,
      },
    }),
  },
  ctaSection: {
    width: '100%',
    maxWidth: 1200,
    borderRadius: 24,
    padding: 32,
    marginTop: 16,
    marginBottom: 32,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'center',
    ...Platform.select({
      web: {
        padding: 48,
        borderRadius: 28,
        marginTop: 24,
      },
    }),
  },
  ctaContent: {
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Gabarito',
    ...Platform.select({
      web: {
        fontSize: 32,
        marginTop: 20,
        marginBottom: 16,
      },
    }),
  },
  ctaDescription: {
    fontSize: 15,
    opacity: 0.75,
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 24,
    marginBottom: 24,
    ...Platform.select({
      web: {
        fontSize: 17,
        lineHeight: 28,
        marginBottom: 32,
      },
    }),
  },
  ctaButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -8,
    ...Platform.select({
      web: {
        marginHorizontal: -10,
      },
    }),
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginHorizontal: 8,
    minHeight: 48,
    ...Platform.select({
      web: {
        paddingHorizontal: 28,
        paddingVertical: 16,
        borderRadius: 18,
        marginHorizontal: 10,
        minHeight: 52,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      } as any,
    }),
  },
  ctaButtonPrimary: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ctaButtonSecondary: {
    borderWidth: 2,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    ...Platform.select({
      web: {
        fontSize: 17,
        marginRight: 10,
      },
    }),
  },
  ctaButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    ...Platform.select({
      web: {
        fontSize: 17,
      },
    }),
  },
  componentContainer: {
    width: '100%',
    maxWidth: 1200,
    marginBottom: 32,
    alignSelf: 'center',
  },
  weatherCard: {
    width: '100%',
    maxWidth: 1200,
    borderRadius: 20,
    padding: 32,
    marginBottom: 32,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    alignSelf: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        padding: 64,
      },
    }),
  },
  loadingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...Platform.select({
      web: {
        width: 120,
        height: 120,
        borderRadius: 60,
      },
    }),
  },
  loadingSpinner: {
    marginTop: 8,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    ...Platform.select({
      web: {
        fontSize: 19,
      },
    }),
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    ...Platform.select({
      web: {
        fontSize: 15,
      },
    }),
  },
  errorContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        padding: 64,
      },
    }),
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    opacity: 0.8,
    ...Platform.select({
      web: {
        width: 140,
        height: 140,
        borderRadius: 70,
      },
    }),
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Gabarito',
    ...Platform.select({
      web: {
        fontSize: 26,
        marginBottom: 16,
      },
    }),
  },
  errorText: {
    marginTop: 8,
    marginBottom: 32,
    fontSize: 15,
    opacity: 0.75,
    textAlign: 'center',
    maxWidth: 500,
    lineHeight: 24,
    ...Platform.select({
      web: {
        fontSize: 16,
        marginBottom: 40,
        lineHeight: 26,
      },
    }),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    minHeight: 48,
    ...Platform.select({
      web: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 18,
        minHeight: 52,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      } as any,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    ...Platform.select({
      web: {
        fontSize: 17,
        marginLeft: 10,
      },
    }),
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  locationText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 32,
  },
  temperature: {
    fontSize: 64,
    fontWeight: 'bold',
    fontFamily: 'Gabarito',
  },
  temperatureUnit: {
    fontSize: 20,
    marginLeft: 8,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  metricItem: {
    flex: 1,
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    marginBottom: 12,
  },
  metricIcon: {
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Gabarito',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});


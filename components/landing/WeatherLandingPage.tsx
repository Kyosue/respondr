import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { RainfallAnalytics } from '@/services/pagasaAdvisoryService';
import { WeatherStation } from '@/types/WeatherStation';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HistoricalDataPoint, HistoricalDataView } from '@/components/weather-station/HistoricalDataView';
import { PAGASAAdvisory } from '@/components/weather-station/PAGASAAdvisory';
import { WeatherData, WeatherMetrics } from '@/components/weather-station/WeatherMetrics';
import { WeatherAnalyticsDashboard } from '@/components/weather-station/WeatherAnalyticsDashboard';
import { WeatherStationSwitcher } from '@/components/weather-station/WeatherStationSwitcher';

interface WeatherLandingPageProps {
  stations: WeatherStation[];
  selectedStation: WeatherStation | null;
  currentData: WeatherData | null;
  historicalData: HistoricalDataPoint[];
  rainfallAnalytics: RainfallAnalytics | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onSelectStation: (station: WeatherStation) => void;
}

const formatUpdatedTime = (date?: Date) => {
  if (!date || Number.isNaN(date.getTime())) return 'Waiting for station update';
  return `Updated ${date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
};

export function WeatherLandingPage({
  stations,
  selectedStation,
  currentData,
  historicalData,
  rainfallAnalytics,
  isLoading,
  isRefreshing,
  onRefresh,
  onSelectStation,
}: WeatherLandingPageProps) {
  const colorScheme = useColorScheme();
  const { isDark } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  const router = useRouter();
  const activeCount = stations.filter(station => station.isActive).length;

  return (
    <View style={[styles.page, { backgroundColor: isDark ? '#0D1720' : '#F2F6F6' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.navBar, { backgroundColor: isDark ? '#101E2A' : '#FFFFFF', borderBottomColor: isDark ? '#263643' : '#DCE5E5' }]}>
          <View style={[styles.navInner, isMobile && styles.navInnerMobile]}>
            <View style={styles.brand}>
              <View style={[styles.logoFrame, { backgroundColor: isDark ? '#1A3444' : '#E9F2F2' }]}>
                <Image source={require('@/assets/images/respondr_foreground.png')} style={styles.logo} resizeMode="contain" />
              </View>
              <View>
                <ThemedText style={[styles.brandTitle, { color: colors.text }]}>RESPONDR</ThemedText>
                {!isMobile && <ThemedText style={[styles.brandSub, { color: colors.text, opacity: 0.62 }]}>Davao Oriental · PDRRMO</ThemedText>}
              </View>
            </View>
            <View style={styles.navActions}>
              <TouchableOpacity style={[styles.signInButton, { borderColor: isDark ? '#3A5362' : '#CCD9D9' }]} onPress={() => router.push('/login')} activeOpacity={0.8}>
                <ThemedText style={[styles.signInText, { color: colors.text }]}>Sign in</ThemedText>
              </TouchableOpacity>
              {!isMobile && (
                <TouchableOpacity style={styles.accountButton} onPress={() => router.push('/signup')} activeOpacity={0.85}>
                  <ThemedText style={styles.accountButtonText}>Request access</ThemedText>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={[styles.hero, isMobile && styles.heroMobile]}>
              <View style={styles.heroCopy}>
                <View style={[styles.eyebrow, { backgroundColor: isDark ? '#1B343E' : '#E3F0EF' }]}>
                  <View style={styles.eyebrowDot} />
                  <ThemedText style={[styles.eyebrowText, { color: isDark ? '#A2DDD4' : '#246B70' }]}>PROVINCIAL OPERATIONS · WEATHER INTELLIGENCE</ThemedText>
                </View>
                <ThemedText style={[styles.heroTitle, { color: colors.text }, isMobile && styles.heroTitleMobile]}>
                  See the conditions.{ '\n' }
                  <ThemedText style={[styles.heroTitleAccent, { color: isDark ? '#62D2C3' : '#167D79' }]}>Support the response.</ThemedText>
                </ThemedText>
                <ThemedText style={[styles.heroDescription, { color: colors.text, opacity: 0.72 }]}>
                  Weather observations and rainfall advisories for Davao Oriental, gathered to help teams stay informed and ready.
                </ThemedText>
                <View style={styles.heroActions}>
                  <TouchableOpacity style={styles.heroPrimary} onPress={() => router.push('/signup')} activeOpacity={0.85}>
                    <ThemedText style={styles.heroPrimaryText}>Access the operations system</ThemedText>
                    <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.heroSecondary} onPress={() => router.push('/login')} activeOpacity={0.8}>
                    <Ionicons name="log-in-outline" size={17} color={colors.primary} />
                    <ThemedText style={[styles.heroSecondaryText, { color: colors.text }]}>Staff sign in</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.snapshot, isMobile && styles.snapshotMobile]}>
                <View style={styles.snapshotHeader}>
                  <View style={styles.snapshotLabelWrap}>
                    <Ionicons name="pulse" size={17} color="#82D8D0" />
                    <ThemedText style={styles.snapshotKicker}>FIELD CONDITIONS</ThemedText>
                  </View>
                  <View style={styles.snapshotStatus}>
                    <View style={[styles.snapshotStatusDot, { backgroundColor: currentData ? '#5DE0A1' : '#F6B85A' }]} />
                    <ThemedText style={styles.snapshotStatusText}>{currentData ? 'STATION REPORTING' : isLoading ? 'CONNECTING' : 'AWAITING DATA'}</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.snapshotLocation} numberOfLines={1}>
                  {selectedStation?.municipality.name || 'Davao Oriental'}
                </ThemedText>
                <View style={styles.temperatureRow}>
                  <Ionicons name="partly-sunny-outline" size={isMobile ? 34 : 42} color="#F7C873" />
                  <ThemedText style={styles.temperatureValue}>{currentData ? currentData.temperature.toFixed(1) : '—'}°</ThemedText>
                  <ThemedText style={styles.temperatureUnit}>C</ThemedText>
                </View>
                <View style={styles.snapshotMetrics}>
                  <SnapshotMetric label="Rainfall" value={currentData ? `${currentData.rainfall.toFixed(1)} mm` : '—'} icon="rainy-outline" />
                  <SnapshotMetric label="Humidity" value={currentData ? `${Math.round(currentData.humidity)}%` : '—'} icon="water-outline" />
                  <SnapshotMetric label="Wind" value={currentData ? `${currentData.windSpeed.toFixed(1)} km/h` : '—'} icon="navigate-outline" />
                </View>
                <View style={styles.snapshotFooter}>
                  <Ionicons name="time-outline" size={14} color="#AFC2CE" />
                  <ThemedText style={styles.snapshotUpdated}>{formatUpdatedTime(currentData?.lastUpdated)}</ThemedText>
                  <TouchableOpacity onPress={onRefresh} style={styles.snapshotRefresh} activeOpacity={0.8} accessibilityLabel="Refresh weather data">
                    <Ionicons name="refresh" size={15} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={[styles.statusStrip, isMobile && styles.statusStripMobile, { backgroundColor: isDark ? '#14232E' : '#FFFFFF', borderColor: isDark ? '#263643' : '#DCE5E5' }]}>
              <StatusItem icon="radio-outline" label="Stations reporting" value={`${activeCount} / ${stations.length}`} tone={activeCount > 0 ? '#159A73' : '#C98627'} mobile={isMobile} dark={isDark} />
              <View style={[styles.statusDivider, isMobile && styles.statusDividerMobile, { backgroundColor: isDark ? '#304451' : '#E2E9E9' }]} />
              <StatusItem icon="map-outline" label="Coverage" value="Davao Oriental" tone={colors.primary} mobile={isMobile} dark={isDark} />
              <View style={[styles.statusDivider, isMobile && styles.statusDividerMobile, { backgroundColor: isDark ? '#304451' : '#E2E9E9' }]} />
              <StatusItem icon="shield-checkmark-outline" label="Advisories" value="PAGASA rainfall levels" tone="#D88932" mobile={isMobile} dark={isDark} />
            </View>

            <View style={styles.sectionHeading}>
              <View>
                <ThemedText style={[styles.sectionEyebrow, { color: colors.primary }]}>MONITORING NETWORK</ThemedText>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Weather across the province</ThemedText>
                <ThemedText style={[styles.sectionDescription, { color: colors.text, opacity: 0.66 }]}>Choose a station to review its latest observations and trends.</ThemedText>
              </View>
            </View>

            {selectedStation && (
              <View style={styles.widgetWrap}>
                <WeatherStationSwitcher stations={stations} selectedStation={selectedStation} onSelectStation={onSelectStation} />
              </View>
            )}

            {isLoading && !currentData && (
              <View style={[styles.loadingCard, { backgroundColor: isDark ? '#14232E' : '#FFFFFF', borderColor: isDark ? '#263643' : '#DCE5E5' }]}>
                <Ionicons name="cloud-download-outline" size={22} color={colors.primary} />
                <ThemedText style={[styles.loadingText, { color: colors.text }]}>Connecting to {selectedStation?.municipality.name || 'the selected weather station'}…</ThemedText>
              </View>
            )}

            {!isLoading && !currentData && (
              <View style={[styles.emptyCard, { backgroundColor: isDark ? '#14232E' : '#FFFFFF', borderColor: isDark ? '#263643' : '#DCE5E5' }]}>
                <View style={styles.emptyIcon}><Ionicons name="cloud-offline-outline" size={22} color="#C9822B" /></View>
                <View style={styles.emptyCopy}>
                  <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No current report available</ThemedText>
                  <ThemedText style={[styles.emptyDescription, { color: colors.text, opacity: 0.67 }]}>Try refreshing this station or select another location in the network.</ThemedText>
                </View>
                <TouchableOpacity style={styles.retryButton} onPress={onRefresh} activeOpacity={0.85}>
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.retryText}>Retry</ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {currentData && (
              <>
                {rainfallAnalytics && <View style={styles.widgetWrap}><PAGASAAdvisory analytics={rainfallAnalytics} showPrediction /></View>}
                <View style={styles.widgetWrap}>
                  <View style={styles.widgetHeading}>
                    <ThemedText style={[styles.widgetTitle, { color: colors.text }]}>Current observations</ThemedText>
                    <ThemedText style={[styles.widgetNote, { color: colors.text, opacity: 0.58 }]}>{formatUpdatedTime(currentData.lastUpdated)}</ThemedText>
                  </View>
                  <WeatherMetrics historicalData={historicalData} dataSource={currentData.dataSource} onRefresh={onRefresh} />
                </View>
                <View style={styles.widgetWrap}><WeatherAnalyticsDashboard currentData={currentData} historicalData={historicalData} /></View>
                <View style={styles.widgetWrap}>
                  <HistoricalDataView data={historicalData} loading={isLoading} municipalityName={selectedStation?.municipality.name} stationName={selectedStation?.name} onRefresh={onRefresh} />
                </View>
              </>
            )}
            <View style={styles.footer}>
              <Ionicons name="information-circle-outline" size={15} color={isDark ? '#9DB0BB' : '#6C7E89'} />
              <ThemedText style={[styles.footerText, { color: colors.text, opacity: 0.58 }]}>Weather observations are provided by connected local stations. Follow official PAGASA and PDRRMO advisories for response decisions.</ThemedText>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SnapshotMetric({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.snapshotMetric}>
      <View style={styles.snapshotMetricLabelRow}>
        <Ionicons name={icon} size={13} color="#AFC2CE" />
        <ThemedText style={styles.snapshotMetricLabel}>{label}</ThemedText>
      </View>
      <ThemedText style={styles.snapshotMetricValue}>{value}</ThemedText>
    </View>
  );
}

function StatusItem({ icon, label, value, tone, mobile, dark }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tone: string; mobile: boolean; dark: boolean }) {
  return (
    <View style={[styles.statusItem, mobile && styles.statusItemMobile]}>
      <View style={[styles.statusIcon, { backgroundColor: `${tone}15` }]}><Ionicons name={icon} size={17} color={tone} /></View>
      <View style={styles.statusCopy}>
        <ThemedText style={[styles.statusLabel, { color: dark ? '#A8BBC4' : '#74838B' }]}>{label}</ThemedText>
        <ThemedText style={[styles.statusValue, { color: tone }]}>{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  navBar: { borderBottomWidth: 1 },
  mainScroll: { flex: 1 },
  navInner: { width: '100%', maxWidth: 1320, alignSelf: 'center', paddingHorizontal: 32, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navInnerMobile: { paddingHorizontal: 16, paddingVertical: 10 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoFrame: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 34, height: 34 },
  brandTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1.3, lineHeight: 20 },
  brandSub: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  signInButton: { minHeight: 40, paddingHorizontal: 17, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  signInText: { fontSize: 14, fontWeight: '700' },
  accountButton: { minHeight: 40, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#164E63', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  accountButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 32, paddingTop: 32, paddingBottom: 48 },
  scrollContentMobile: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 32 },
  content: { width: '100%', maxWidth: 1256, alignSelf: 'center' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 28, marginBottom: 24 },
  heroMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 22, marginBottom: 18 },
  heroCopy: { flex: 1, paddingVertical: 12, maxWidth: 650 },
  eyebrow: { alignSelf: 'flex-start', borderRadius: 5, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  eyebrowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D5783B' },
  eyebrowText: { color: '#246B70', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.6, marginBottom: 12 },
  heroTitleMobile: { fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  heroTitleAccent: { color: '#167D79' },
  heroDescription: { maxWidth: 560, fontSize: 14, lineHeight: 20, marginBottom: 19 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  heroPrimary: { minHeight: 46, borderRadius: 8, paddingHorizontal: 16, backgroundColor: '#164E63', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  heroPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  heroSecondary: { minHeight: 44, borderRadius: 8, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7 },
  heroSecondaryText: { fontSize: 14, fontWeight: '700' },
  snapshot: { width: 410, minHeight: 290, padding: 21, borderRadius: 14, backgroundColor: '#102A3D', borderWidth: 1, borderColor: '#25485C', ...Platform.select({ web: { boxShadow: '0 16px 40px rgba(16,42,61,0.18)' } as any, default: {} }) },
  snapshotMobile: { width: '100%', minHeight: 0, padding: 17 },
  snapshotHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  snapshotLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  snapshotKicker: { color: '#B9D0D8', fontSize: 14, fontWeight: '800', letterSpacing: 1.1 },
  snapshotStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  snapshotStatusDot: { width: 7, height: 7, borderRadius: 4 },
  snapshotStatusText: { color: '#C9D7DD', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  snapshotLocation: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 3 },
  temperatureRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 18 },
  temperatureValue: { color: '#FFFFFF', fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.5 },
  temperatureUnit: { color: '#B9CAD3', fontSize: 16, fontWeight: '600', alignSelf: 'flex-start', marginTop: 6 },
  snapshotMetrics: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#2C4A5C', borderBottomWidth: 1, borderBottomColor: '#2C4A5C', paddingVertical: 13, gap: 10 },
  snapshotMetric: { flex: 1 },
  snapshotMetricLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  snapshotMetricLabel: { color: '#AFC2CE', fontSize: 14, fontWeight: '600' },
  snapshotMetricValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  snapshotFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  snapshotUpdated: { flex: 1, color: '#AFC2CE', fontSize: 14 },
  snapshotRefresh: { width: 29, height: 29, borderRadius: 7, backgroundColor: '#23485C', alignItems: 'center', justifyContent: 'center' },
  statusStrip: { minHeight: 78, borderRadius: 11, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 35, gap: 17 },
  statusStripMobile: { minHeight: 0, flexDirection: 'column', alignItems: 'stretch', paddingHorizontal: 13, paddingVertical: 12, marginBottom: 25, gap: 10 },
  statusItem: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusItemMobile: { flex: 0 },
  statusIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  statusCopy: { flex: 1 },
  statusLabel: { color: '#74838B', fontSize: 14, fontWeight: '600', marginBottom: 3 },
  statusValue: { fontSize: 14, fontWeight: '800' },
  statusDivider: { width: 1, height: 34 },
  statusDividerMobile: { width: '100%', height: 1 },
  sectionHeading: { marginBottom: 14 },
  sectionEyebrow: { fontSize: 14, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  sectionTitle: { fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -0.4 },
  sectionDescription: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  widgetWrap: { marginBottom: 15 },
  widgetHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  widgetTitle: { fontSize: 16, fontWeight: '800' },
  widgetNote: { fontSize: 14, fontWeight: '600' },
  loadingCard: { borderRadius: 10, borderWidth: 1, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 16 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  emptyCard: { borderWidth: 1, borderRadius: 10, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  emptyIcon: { width: 39, height: 39, borderRadius: 10, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  emptyCopy: { flex: 1 },
  emptyTitle: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  emptyDescription: { fontSize: 14, lineHeight: 18 },
  retryButton: { height: 36, paddingHorizontal: 12, borderRadius: 7, backgroundColor: '#164E63', flexDirection: 'row', alignItems: 'center', gap: 6 },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, paddingTop: 8, maxWidth: 900 },
  footerText: { flex: 1, fontSize: 14, lineHeight: 18 },
});

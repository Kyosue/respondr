import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { RainfallAnalytics } from '@/services/pagasaAdvisoryService';
import { WeatherStation } from '@/types/WeatherStation';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Linking, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HistoricalDataPoint, HistoricalDataView } from '@/components/weather-station/HistoricalDataView';
import { PAGASAAdvisory } from '@/components/weather-station/PAGASAAdvisory';
import { WeatherData, WeatherMetrics } from '@/components/weather-station/WeatherMetrics';
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
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  // same card tokens as the dashboard
  const card = { backgroundColor: isDark ? '#171A21' : '#FFFFFF', borderColor: isDark ? '#2A2F3A' : '#EAECF0' };
  const { isMobile } = useScreenSize();
  const router = useRouter();

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.navBar, card]}>
          <View style={[styles.navInner, isMobile && styles.navInnerMobile]}>
            <View style={styles.brand}>
              <View style={styles.logoFrame}>
                <Image source={require('@/assets/images/respondr_foreground.png')} style={styles.logo} resizeMode="contain" />
              </View>
              <View>
                <ThemedText style={[styles.brandTitle, { color: colors.text }]}>RESPONDR</ThemedText>
                {!isMobile && <ThemedText style={[styles.brandSub, { color: colors.text }]}>Davao Oriental · PDRRMO</ThemedText>}
              </View>
            </View>
            <TouchableOpacity style={styles.signInButton} onPress={() => router.push('/login')} activeOpacity={0.85}>
              <Ionicons name="log-in-outline" size={17} color="#FFFFFF" />
              <ThemedText style={styles.signInText}>Staff sign in</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, isMobile && styles.contentMobile]}>
            <View style={[styles.hero, isMobile && styles.heroMobile]}>
              <View style={styles.heroCopy}>
                <View style={styles.heroBadge}>
                  <Ionicons name="partly-sunny-outline" size={15} color="#4361EE" />
                  <ThemedText style={styles.heroBadgeText}>Davao Oriental · Public weather</ThemedText>
                </View>
                <ThemedText style={[styles.heroTitle, { color: colors.text }, isMobile && styles.heroTitleMobile]}>
                  {'Know the weather,\nstay prepared.'}
                </ThemedText>
                <ThemedText style={[styles.heroDescription, { color: colors.text }]}>
                  Live rainfall, temperature and wind readings from weather stations across the province, with PAGASA rainfall advisories for your area.
                </ThemedText>
              </View>

              <View style={[styles.snapshot, card, isMobile && styles.snapshotMobile]}>
                <View style={styles.snapshotHeader}>
                  <ThemedText style={[styles.snapshotLocation, { color: colors.text }]} numberOfLines={1}>
                    {selectedStation?.municipality.name || 'Davao Oriental'}
                  </ThemedText>
                  <View style={[styles.snapshotStatus, { backgroundColor: currentData ? '#16805F14' : '#C67A2E14' }]}>
                    <View style={[styles.snapshotDot, { backgroundColor: currentData ? '#16805F' : '#C67A2E' }]} />
                    <ThemedText style={[styles.snapshotStatusText, { color: currentData ? '#16805F' : '#C67A2E' }]}>
                      {currentData ? 'Live' : isLoading ? 'Connecting' : 'No data'}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.temperatureRow}>
                  <ThemedText style={[styles.temperatureValue, { color: colors.text }]}>{currentData ? currentData.temperature.toFixed(1) : '—'}</ThemedText>
                  <ThemedText style={[styles.temperatureUnit, { color: colors.text }]}>°C</ThemedText>
                </View>
                <View style={styles.snapshotMetrics}>
                  <SnapshotMetric icon="rainy" color="#00BCD4" label="Rainfall" value={currentData ? `${currentData.rainfall.toFixed(1)} mm` : '—'} />
                  <SnapshotMetric icon="water" color="#2196F3" label="Humidity" value={currentData ? `${Math.round(currentData.humidity)}%` : '—'} />
                  <SnapshotMetric icon="flag" color="#4CAF50" label="Wind" value={currentData ? `${currentData.windSpeed.toFixed(1)} km/h` : '—'} />
                </View>
                <ThemedText style={[styles.snapshotUpdated, { color: colors.text }]}>{formatUpdatedTime(currentData?.lastUpdated)}</ThemedText>
              </View>
            </View>

            <View style={styles.sectionHeading}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Monitoring network</ThemedText>
              <ThemedText style={[styles.sectionDescription, { color: colors.text }]}>Choose a station to see its latest observations and rainfall advisory.</ThemedText>
            </View>

            {selectedStation && (
              <WeatherStationSwitcher stations={stations} selectedStation={selectedStation} onSelectStation={onSelectStation} />
            )}

            {isLoading && !currentData && (
              <View style={[styles.stateCard, card]}>
                <View style={[styles.stateIcon, { backgroundColor: '#4361EE14' }]}><Ionicons name="cloud-download-outline" size={18} color="#4361EE" /></View>
                <ThemedText style={[styles.stateTitle, { color: colors.text }]}>Connecting to {selectedStation?.municipality.name || 'the selected station'}…</ThemedText>
              </View>
            )}

            {!isLoading && !currentData && (
              <View style={[styles.stateCard, card]}>
                <View style={[styles.stateIcon, { backgroundColor: '#C67A2E14' }]}><Ionicons name="cloud-offline-outline" size={18} color="#C67A2E" /></View>
                <View style={styles.stateCopy}>
                  <ThemedText style={[styles.stateTitle, { color: colors.text }]}>No current report available</ThemedText>
                  <ThemedText style={[styles.stateDescription, { color: colors.text }]}>Try refreshing, or select another station.</ThemedText>
                </View>
                <TouchableOpacity style={styles.retryButton} onPress={onRefresh} activeOpacity={0.85}>
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.retryText}>Retry</ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {currentData && (
              <>
                {rainfallAnalytics && <PAGASAAdvisory analytics={rainfallAnalytics} showPrediction />}
                <View style={styles.widgetHeading}>
                  <ThemedText style={[styles.widgetTitle, { color: colors.text }]}>Current observations</ThemedText>
                  <ThemedText style={[styles.widgetNote, { color: colors.text }]}>{formatUpdatedTime(currentData.lastUpdated)}</ThemedText>
                </View>
                <WeatherMetrics historicalData={historicalData} onRefresh={onRefresh} />
                <HistoricalDataView data={historicalData} loading={isLoading} municipalityName={selectedStation?.municipality.name} stationName={selectedStation?.name} onRefresh={onRefresh} hideExport />
              </>
            )}

          </View>

          <View style={[styles.footer, card, isMobile && { paddingHorizontal: 16 }]}>
            <View style={[styles.footerInner, isMobile && styles.footerInnerMobile]}>
              <View style={styles.footerBrand}>
                <View style={styles.logoFrame}>
                  <Image source={require('@/assets/images/respondr_foreground.png')} style={styles.logo} resizeMode="contain" />
                </View>
                <View style={styles.footerCopy}>
                  <ThemedText style={[styles.brandTitle, { color: colors.text }]}>RESPONDR</ThemedText>
                  <ThemedText style={[styles.footerText, { color: colors.text }]}>
                    Provincial Disaster Risk Reduction and Management Office, Davao Oriental. Readings come from connected local stations and are for public information. Always follow official PAGASA and PDRRMO advisories.
                  </ThemedText>
                </View>
              </View>
              <View style={styles.footerLinks}>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.pagasa.dost.gov.ph')} accessibilityRole="link">
                  <ThemedText style={styles.footerLink}>PAGASA website</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/login')} accessibilityRole="link">
                  <ThemedText style={styles.footerLink}>Staff sign in</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            <ThemedText style={[styles.copyright, { color: colors.text }]}>{`© ${new Date().getFullYear()} PDRRMO Davao Oriental`}</ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SnapshotMetric({ icon, color, label, value }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; value: string }) {
  return (
    <View style={styles.snapshotMetric}>
      <View style={[styles.snapshotMetricIcon, { backgroundColor: `${color}14` }]}><Ionicons name={icon} size={16} color={color} /></View>
      <View>
        <ThemedText style={styles.snapshotMetricLabel}>{label}</ThemedText>
        <ThemedText style={styles.snapshotMetricValue}>{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  navBar: { borderBottomWidth: 1 },
  mainScroll: { flex: 1 },
  navInner: { width: '100%', maxWidth: 1320, alignSelf: 'center', paddingHorizontal: 32, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navInnerMobile: { paddingHorizontal: 16, paddingVertical: 10 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoFrame: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4361EE14' },
  logo: { width: 32, height: 32 },
  brandTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 1.2, lineHeight: 20, fontFamily: 'Gabarito' },
  brandSub: { fontSize: 12, opacity: 0.62, marginTop: 1, fontFamily: 'Gabarito' },
  signInButton: { minHeight: 40, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#4361EE', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  signInText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', fontFamily: 'Gabarito' },
  scrollContent: { paddingTop: 28 },
  scrollContentMobile: { paddingTop: 20 },
  content: { width: '100%', maxWidth: 1320, alignSelf: 'center', paddingHorizontal: 32, paddingBottom: 40 },
  contentMobile: { paddingHorizontal: 16, paddingBottom: 28 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 28, marginBottom: 28 },
  heroMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 18, marginBottom: 22 },
  heroCopy: { flex: 1, maxWidth: 600 },
  heroBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 14, backgroundColor: '#4361EE14' },
  heroBadgeText: { color: '#4361EE', fontSize: 12, fontWeight: '700', fontFamily: 'Gabarito' },
  heroTitle: { fontSize: 38, lineHeight: 44, fontWeight: '700', marginBottom: 12, fontFamily: 'Gabarito' },
  heroTitleMobile: { fontSize: 28, lineHeight: 34 },
  heroDescription: { fontSize: 16, lineHeight: 24, opacity: 0.68, fontFamily: 'Gabarito' },
  snapshot: { width: 400, borderRadius: 12, borderWidth: 1, padding: 18 },
  snapshotMobile: { width: '100%' },
  snapshotHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  snapshotLocation: { flex: 1, fontSize: 16, fontWeight: '700', fontFamily: 'Gabarito' },
  snapshotStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  snapshotDot: { width: 6, height: 6, borderRadius: 3 },
  snapshotStatusText: { fontSize: 12, fontWeight: '700', fontFamily: 'Gabarito' },
  temperatureRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 10 },
  temperatureValue: { fontSize: 52, lineHeight: 58, fontWeight: '700', fontFamily: 'Gabarito' },
  temperatureUnit: { fontSize: 20, fontWeight: '600', opacity: 0.6, marginTop: 8, marginLeft: 2, fontFamily: 'Gabarito' },
  snapshotMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingVertical: 12, marginBottom: 6, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.18)' },
  snapshotMetric: { flex: 1, minWidth: 100, flexDirection: 'row', alignItems: 'center', gap: 8 },
  snapshotMetricIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  snapshotMetricLabel: { fontSize: 12, opacity: 0.62, fontFamily: 'Gabarito' },
  snapshotMetricValue: { fontSize: 14, fontWeight: '700', fontFamily: 'Gabarito' },
  snapshotUpdated: { fontSize: 12, opacity: 0.55, fontFamily: 'Gabarito' },
  sectionHeading: { marginBottom: 16 },
  sectionTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700', fontFamily: 'Gabarito' },
  sectionDescription: { fontSize: 14, lineHeight: 20, marginTop: 4, opacity: 0.62, fontFamily: 'Gabarito' },
  widgetHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  widgetTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Gabarito' },
  widgetNote: { fontSize: 12, opacity: 0.62, fontFamily: 'Gabarito' },
  stateCard: { borderRadius: 12, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  stateIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stateCopy: { flex: 1 },
  stateTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Gabarito' },
  stateDescription: { fontSize: 12, opacity: 0.62, marginTop: 2, fontFamily: 'Gabarito' },
  retryButton: { height: 36, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#4361EE', flexDirection: 'row', alignItems: 'center', gap: 6 },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', fontFamily: 'Gabarito' },
  footer: { borderTopWidth: 1, paddingHorizontal: 32, paddingVertical: 24, gap: 16 },
  footerInner: { width: '100%', maxWidth: 1256, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 },
  footerInnerMobile: { flexDirection: 'column' },
  footerBrand: { flex: 1, flexDirection: 'row', gap: 12, maxWidth: 640 },
  footerCopy: { flex: 1, gap: 4 },
  footerText: { fontSize: 12, lineHeight: 18, opacity: 0.62, fontFamily: 'Gabarito' },
  footerLinks: { gap: 8 },
  footerLink: { color: '#4361EE', fontSize: 14, fontWeight: '600', fontFamily: 'Gabarito' },
  copyright: { width: '100%', maxWidth: 1256, alignSelf: 'center', fontSize: 12, opacity: 0.5, fontFamily: 'Gabarito' },
});

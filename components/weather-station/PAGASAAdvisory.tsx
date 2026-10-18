import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { RainfallAnalytics } from '@/services/pagasaAdvisoryService';

interface PAGASAAdvisoryProps {
  analytics: RainfallAnalytics;
  showPrediction?: boolean;
}

export function PAGASAAdvisory({ analytics, showPrediction = true }: PAGASAAdvisoryProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  const { currentAdvisory, predictedAdvisory, continuationPrediction, oneHourTotal } = analytics;

  const getAdvisoryColor = (color: string) => {
    switch (color) {
      case 'RED': return '#C43D3D';
      case 'ORANGE': return '#CF702C';
      case 'YELLOW': return '#B8871B';
      case 'GREY': return '#697984';
      default: return colors.text;
    }
  };
  const advisoryColor = getAdvisoryColor(currentAdvisory.color);
  const projectedColor = predictedAdvisory ? getAdvisoryColor(predictedAdvisory.color) : colors.primary;
  const trendColor = analytics.trend.direction === 'increasing'
    ? '#C43D3D'
    : analytics.trend.direction === 'decreasing'
      ? '#17805F'
      : colors.text;
  const trendIcon: keyof typeof Ionicons.glyphMap = analytics.trend.direction === 'increasing'
    ? 'trending-up'
    : analytics.trend.direction === 'decreasing'
      ? 'trending-down'
      : 'remove';

  return (
    <View style={styles.container}>
      <View style={[styles.advisoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.severityRail, { backgroundColor: advisoryColor }]} />
        <View style={styles.advisoryBody}>
          <View style={[styles.advisoryHeader, isMobile && styles.advisoryHeaderMobile]}>
            <View style={styles.titleGroup}>
              <View style={[styles.colorBadge, { backgroundColor: advisoryColor }]}>
                <Ionicons name="warning" size={13} color="#FFFFFF" />
                <ThemedText style={styles.colorBadgeText}>{currentAdvisory.color}</ThemedText>
              </View>
              <View style={styles.advisoryTitleContainer}>
                <ThemedText style={[styles.eyebrow, { color: advisoryColor }]}>PAGASA RAINFALL ADVISORY</ThemedText>
                <ThemedText style={[styles.advisoryLevel, { color: colors.text }]}>{currentAdvisory.level}</ThemedText>
              </View>
            </View>
            <View style={[styles.advisoryTag, { backgroundColor: `${advisoryColor}12` }]}>
              <ThemedText style={[styles.advisoryTagText, { color: advisoryColor }]}>CURRENT LEVEL</ThemedText>
            </View>
          </View>

          <View style={[styles.summaryRow, isMobile && styles.summaryRowMobile]}>
            <View style={styles.rainfallReading}>
              <ThemedText style={[styles.readingLabel, { color: colors.text, opacity: 0.62 }]}>RAINFALL · LAST HOUR</ThemedText>
              <View style={styles.readingValueRow}>
                <ThemedText style={[styles.readingValue, { color: advisoryColor }]}>{oneHourTotal.toFixed(1)}</ThemedText>
                <ThemedText style={[styles.readingUnit, { color: colors.text, opacity: 0.6 }]}>mm</ThemedText>
              </View>
            </View>
            <View style={[styles.trendPill, { backgroundColor: `${trendColor}12` }]}>
              <Ionicons name={trendIcon} size={16} color={trendColor} />
              <View>
                <ThemedText style={[styles.trendLabel, { color: colors.text, opacity: 0.55 }]}>RAINFALL TREND</ThemedText>
                <ThemedText style={[styles.trendText, { color: trendColor }]}>{analytics.trend.direction.toUpperCase()}</ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.detailGrid, isMobile && styles.detailGridMobile]}>
            <View style={[styles.detailCard, { backgroundColor: colorScheme === 'dark' ? '#18242D' : '#F5F8F8', borderColor: colors.border }]}>
              <View style={[styles.detailIcon, { backgroundColor: `${advisoryColor}15` }]}>
                <Ionicons name="water-outline" size={16} color={advisoryColor} />
              </View>
              <View style={styles.detailCopy}>
                <ThemedText style={[styles.detailLabel, { color: colors.text, opacity: 0.55 }]}>FLOOD POTENTIAL</ThemedText>
                <ThemedText style={[styles.detailText, { color: colors.text }]}>{currentAdvisory.floodPossibility}</ThemedText>
              </View>
            </View>
            <View style={[styles.detailCard, { backgroundColor: colorScheme === 'dark' ? '#18242D' : '#F5F8F8', borderColor: colors.border }]}>
              <View style={[styles.detailIcon, { backgroundColor: '#EAF2F0' }]}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#176A67" />
              </View>
              <View style={styles.detailCopy}>
                <ThemedText style={[styles.detailLabel, { color: colors.text, opacity: 0.55 }]}>RESPONSE GUIDANCE</ThemedText>
                <ThemedText style={[styles.detailText, { color: colors.text }]}>{currentAdvisory.response}</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>

      {showPrediction && predictedAdvisory && continuationPrediction.willContinue && (
        <View style={[styles.predictionCard, { backgroundColor: '#102A3D', borderColor: '#25485C' }]}>
          <View style={[styles.predictionHeader, isMobile && styles.predictionHeaderMobile]}>
            <View style={styles.predictionHeading}>
              <View style={styles.predictionIcon}><Ionicons name="time-outline" size={16} color="#8FE0D4" /></View>
              <View>
                <ThemedText style={styles.predictionEyebrow}>SHORT-TERM OUTLOOK</ThemedText>
                <ThemedText style={styles.predictionTitle}>Rainfall advisory projection</ThemedText>
              </View>
            </View>
            <View style={[styles.predictionBadge, { backgroundColor: `${projectedColor}25` }]}>
              <View style={[styles.predictionDot, { backgroundColor: projectedColor }]} />
              <ThemedText style={[styles.predictionLevel, { color: '#FFFFFF' }]}>{predictedAdvisory.color} · {predictedAdvisory.level}</ThemedText>
            </View>
          </View>
          <View style={[styles.predictionStats, isMobile && styles.predictionStatsMobile]}>
            <PredictionStat label="EXPECTED DURATION" value={`${continuationPrediction.duration.toFixed(1)} hours`} />
            <PredictionStat label="CONFIDENCE" value={continuationPrediction.confidence} />
            <PredictionStat label="WINDOW" value="Next 2 hours" />
          </View>
          <View style={styles.continuationNote}>
            <Ionicons name="information-circle-outline" size={15} color="#A9C2CE" />
            <ThemedText style={styles.continuationText}>Rainfall is expected to continue. Treat this projection as situational guidance and follow official advisories.</ThemedText>
          </View>
        </View>
      )}
    </View>
  );
}

function PredictionStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.predictionStat}>
      <ThemedText style={styles.predictionStatLabel}>{label}</ThemedText>
      <ThemedText style={styles.predictionStatValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 15, gap: 10 },
  advisoryCard: { borderRadius: 10, borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  severityRail: { width: 5 },
  advisoryBody: { flex: 1, padding: 15 },
  advisoryHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 9, marginBottom: 13 },
  advisoryHeaderMobile: { flexWrap: 'wrap', marginBottom: 11 },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  colorBadge: { minWidth: 66, height: 31, paddingHorizontal: 8, borderRadius: 5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  colorBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  advisoryTitleContainer: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 14, fontWeight: '800', letterSpacing: 0.9, marginBottom: 3 },
  advisoryLevel: { fontSize: 16, lineHeight: 22, fontWeight: '800' },
  advisoryTag: { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 5 },
  advisoryTagText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.45 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E3E9E9' },
  summaryRowMobile: { alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 },
  rainfallReading: { flex: 1 },
  readingLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
  readingValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  readingValue: { fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.5 },
  readingUnit: { fontSize: 14, fontWeight: '700' },
  trendPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8 },
  trendLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  trendText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.4 },
  detailGrid: { flexDirection: 'row', gap: 9, marginTop: 11 },
  detailGridMobile: { flexDirection: 'column' },
  detailCard: { flex: 1, minWidth: 0, borderRadius: 7, borderWidth: 1, padding: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailIcon: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  detailCopy: { flex: 1 },
  detailLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 0.55, marginBottom: 4 },
  detailText: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  predictionCard: { borderRadius: 10, borderWidth: 1, padding: 14 },
  predictionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 13 },
  predictionHeaderMobile: { flexWrap: 'wrap', marginBottom: 11 },
  predictionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  predictionIcon: { width: 32, height: 32, borderRadius: 7, backgroundColor: '#1B3A4B', alignItems: 'center', justifyContent: 'center' },
  predictionEyebrow: { color: '#AFC2CE', fontSize: 14, fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
  predictionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  predictionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 6 },
  predictionDot: { width: 6, height: 6, borderRadius: 3 },
  predictionLevel: { fontSize: 14, fontWeight: '800' },
  predictionStats: { flexDirection: 'row', gap: 0, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#2C4A5C', paddingVertical: 10 },
  predictionStatsMobile: { flexDirection: 'column', gap: 9 },
  predictionStat: { flex: 1 },
  predictionStatLabel: { color: '#AFC2CE', fontSize: 14, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  predictionStatValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  continuationNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingTop: 10 },
  continuationText: { flex: 1, color: '#B9CAD3', fontSize: 14, lineHeight: 18 },
});

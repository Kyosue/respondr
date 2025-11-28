import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PAGASAAdvisory as PAGASAAdvisoryType, RainfallAnalytics } from '@/services/pagasaAdvisoryService';

interface PAGASAAdvisoryProps {
  analytics: RainfallAnalytics;
  showPrediction?: boolean;
}

export function PAGASAAdvisory({ analytics, showPrediction = true }: PAGASAAdvisoryProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();

  const { currentAdvisory, predictedAdvisory, continuationPrediction, oneHourTotal } = analytics;

  // Get color values for PAGASA colors
  const getColorValue = (color: string) => {
    switch (color) {
      case 'RED':
        return '#DC2626'; // Red-600
      case 'ORANGE':
        return '#F97316'; // Orange-500
      case 'YELLOW':
        return '#EAB308'; // Yellow-500
      case 'GREY':
        return '#6B7280'; // Gray-500
      default:
        return colors.text;
    }
  };

  const advisoryColor = getColorValue(currentAdvisory.color);
  const bgColor = `${advisoryColor}15`;
  const borderColor = advisoryColor;

  const getTrendIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (analytics.trend.direction) {
      case 'increasing':
        return 'trending-up';
      case 'decreasing':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendColor = () => {
    switch (analytics.trend.direction) {
      case 'increasing':
        return colors.error || '#DC2626';
      case 'decreasing':
        return colors.success || '#22C55E';
      default:
        return colors.text;
    }
  };

  return (
    <View style={styles.container}>
      {/* Current Advisory Card */}
      <View
        style={[
          styles.advisoryCard,
          {
            backgroundColor: bgColor,
            borderLeftColor: borderColor,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.advisoryHeader}>
          <View style={[styles.colorBadge, { backgroundColor: advisoryColor }]}>
            <ThemedText style={styles.colorBadgeText}>
              {currentAdvisory.color}
            </ThemedText>
          </View>
          <View style={styles.advisoryTitleContainer}>
            <ThemedText style={[styles.advisoryTitle, { color: advisoryColor }]}>
              {currentAdvisory.color} RAINFALL ADVISORY
            </ThemedText>
            <ThemedText style={[styles.advisoryLevel, { color: colors.text }]}>
              {currentAdvisory.level}
            </ThemedText>
          </View>
        </View>

        <View style={styles.advisoryContent}>
          {/* 1-Hour Total Display */}
          <View style={styles.oneHourTotalContainer}>
            <ThemedText style={[styles.oneHourLabel, { color: colors.text, opacity: 0.7 }]}>
              1-Hour Total
            </ThemedText>
            <View style={styles.oneHourValueRow}>
              <ThemedText style={[styles.oneHourValue, { color: advisoryColor }]}>
                {oneHourTotal.toFixed(1)}
              </ThemedText>
              <ThemedText style={[styles.oneHourUnit, { color: colors.text, opacity: 0.7 }]}>
                mm
              </ThemedText>
            </View>
          </View>

          {/* Trend Indicator */}
          <View style={styles.trendContainer}>
            <Ionicons
              name={getTrendIcon()}
              size={16}
              color={getTrendColor()}
            />
            <ThemedText style={[styles.trendText, { color: getTrendColor() }]}>
              {analytics.trend.direction.toUpperCase()}
            </ThemedText>
          </View>
        </View>

        {/* Flood Possibility */}
        <View style={[styles.floodPossibility, { borderTopColor: colors.border }]}>
          <Ionicons name="warning" size={18} color={advisoryColor} />
          <ThemedText style={[styles.floodText, { color: colors.text }]}>
            {currentAdvisory.floodPossibility}
          </ThemedText>
        </View>

        {/* Response Action */}
        <View style={[styles.responseContainer, { backgroundColor: `${advisoryColor}20` }]}>
          <ThemedText style={[styles.responseText, { color: advisoryColor }]}>
            {currentAdvisory.response}
          </ThemedText>
        </View>
      </View>

      {/* Predictive Advisory (if enabled and available) */}
      {showPrediction && predictedAdvisory && continuationPrediction.willContinue && (
        <View
          style={[
            styles.predictedCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.predictedHeader}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <ThemedText style={[styles.predictedTitle, { color: colors.text }]}>
              Projected Advisory (Next 2 Hours)
            </ThemedText>
          </View>
          <View style={styles.predictedContent}>
            <View style={[styles.predictedBadge, { backgroundColor: `${getColorValue(predictedAdvisory.color)}20` }]}>
              <ThemedText style={[styles.predictedLevel, { color: getColorValue(predictedAdvisory.color) }]}>
                {predictedAdvisory.color} - {predictedAdvisory.level}
              </ThemedText>
            </View>
            <ThemedText style={[styles.predictedText, { color: colors.text, opacity: 0.7 }]}>
              Confidence: {continuationPrediction.confidence}
            </ThemedText>
            <ThemedText style={[styles.predictedText, { color: colors.text, opacity: 0.7 }]}>
              Expected duration: {continuationPrediction.duration.toFixed(1)} hours
            </ThemedText>
          </View>
        </View>
      )}

      {/* Continuation Status */}
      {continuationPrediction.willContinue && (
        <View style={[styles.continuationCard, { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }]}>
          <Ionicons name="rainy" size={18} color={colors.primary} />
          <ThemedText style={[styles.continuationText, { color: colors.primary }]}>
            Rainfall expected to continue for the next {continuationPrediction.duration.toFixed(1)} hours
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    gap: 12,
  },
  advisoryCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  advisoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    gap: 12,
  },
  colorBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  colorBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Gabarito',
  },
  advisoryTitleContainer: {
    flex: 1,
  },
  advisoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  advisoryLevel: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    textTransform: 'uppercase',
  },
  advisoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  oneHourTotalContainer: {
    flex: 1,
  },
  oneHourLabel: {
    fontSize: 12,
    fontFamily: 'Gabarito',
    marginBottom: 4,
  },
  oneHourValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  oneHourValue: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    lineHeight: 40,
  },
  oneHourUnit: {
    fontSize: 16,
    fontFamily: 'Gabarito',
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Gabarito',
  },
  floodPossibility: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  floodText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  responseContainer: {
    padding: 12,
    alignItems: 'center',
  },
  responseText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  predictedCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  predictedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  predictedTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
  },
  predictedContent: {
    gap: 8,
  },
  predictedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  predictedLevel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Gabarito',
  },
  predictedText: {
    fontSize: 13,
    fontFamily: 'Gabarito',
  },
  continuationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  continuationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Gabarito',
  },
});


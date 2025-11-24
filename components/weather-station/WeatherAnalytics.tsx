import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { HistoricalDataPoint } from './HistoricalDataView';
import { WeatherData } from './WeatherMetrics';

interface WeatherAnalyticsProps {
  currentData: WeatherData | null;
  historicalData: HistoricalDataPoint[];
}

type MetricType = 'temperature' | 'humidity' | 'rainfall' | 'windSpeed';

interface MetricStats {
  current: number;
  average: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

export function WeatherAnalytics({ currentData, historicalData }: WeatherAnalyticsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  const { width } = Dimensions.get('window');
  const chartWidth = isMobile ? width - 64 : 600;
  const chartHeight = isMobile ? 120 : 150;

  // Calculate statistics for each metric
  const calculateStats = (metric: MetricType): MetricStats | null => {
    if (!currentData || historicalData.length === 0) return null;

    const values = historicalData.map(d => d[metric]);
    const current = currentData[metric];
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend (compare last 10% of data with previous 10%)
    const recentCount = Math.max(1, Math.floor(historicalData.length * 0.1));
    const previousCount = Math.max(1, Math.floor(historicalData.length * 0.1));
    
    const recentAvg = historicalData
      .slice(-recentCount)
      .reduce((sum, d) => sum + d[metric], 0) / recentCount;
    
    const previousAvg = historicalData
      .slice(-recentCount - previousCount, -recentCount)
      .reduce((sum, d) => sum + d[metric], 0) / previousCount;

    const trendPercent = previousAvg > 0 
      ? ((recentAvg - previousAvg) / previousAvg) * 100 
      : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(trendPercent) > 2) {
      trend = trendPercent > 0 ? 'up' : 'down';
    }

    return {
      current,
      average,
      min,
      max,
      trend,
      trendPercent: Math.abs(trendPercent),
    };
  };

  const tempStats = calculateStats('temperature');
  const humidityStats = calculateStats('humidity');
  const rainfallStats = calculateStats('rainfall');
  const windStats = calculateStats('windSpeed');

  // Generate sparkline data points
  const generateSparkline = (metric: MetricType, data: HistoricalDataPoint[]) => {
    if (data.length === 0) return [];
    
    const values = data.map(d => d[metric]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return values.map((value, index) => ({
      x: (index / (values.length - 1)) * chartWidth,
      y: chartHeight - ((value - min) / range) * chartHeight,
      value,
    }));
  };

  const tempSparkline = generateSparkline('temperature', historicalData.slice(-50));
  const humiditySparkline = generateSparkline('humidity', historicalData.slice(-50));
  const rainfallSparkline = generateSparkline('rainfall', historicalData.slice(-50));
  const windSparkline = generateSparkline('windSpeed', historicalData.slice(-50));

  const renderSparkline = (
    points: { x: number; y: number; value: number }[],
    color: string,
    fillColor: string
  ) => {
    if (points.length < 2) return null;

    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    const areaPath = `${pathData} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

    return (
      <Svg width={chartWidth} height={chartHeight}>
        <Path
          d={areaPath}
          fill={fillColor}
          opacity={0.2}
        />
        <Path
          d={pathData}
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={index === points.length - 1 ? 4 : 2}
            fill={color}
          />
        ))}
      </Svg>
    );
  };

  const renderStatCard = (
    title: string,
    icon: string,
    unit: string,
    stats: MetricStats | null,
    sparkline: { x: number; y: number; value: number }[],
    color: string,
    gradient: string[]
  ) => {
    if (!stats) return null;

    const formatValue = (value: number): string => {
      if (title === 'Temperature') return `${value.toFixed(1)}`;
      if (title === 'Humidity') return `${Math.round(value)}`;
      if (title === 'Rainfall') return `${value.toFixed(1)}`;
      return `${value.toFixed(1)}`;
    };

    return (
      <View
        style={[
          styles.statCard,
          isMobile && styles.statCardMobile,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <LinearGradient
          colors={gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCardGradient, isMobile && styles.statCardGradientMobile]}
        >
          <View style={styles.statCardHeader}>
            <View style={styles.statCardHeaderLeft}>
              <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon as any} size={20} color={color} />
              </View>
              <View style={styles.statCardTitleContainer}>
                <ThemedText style={styles.statCardTitle}>{title}</ThemedText>
                <View style={styles.statCardTrend}>
                  {stats.trend === 'up' && (
                    <Ionicons name="trending-up" size={14} color={colors.success || '#4CAF50'} />
                  )}
                  {stats.trend === 'down' && (
                    <Ionicons name="trending-down" size={14} color={colors.error} />
                  )}
                  {stats.trend === 'stable' && (
                    <Ionicons name="remove" size={14} color={colors.text} style={{ opacity: 0.5 }} />
                  )}
                  <ThemedText
                    style={[
                      styles.statCardTrendText,
                      {
                        color:
                          stats.trend === 'up'
                            ? colors.success || '#4CAF50'
                            : stats.trend === 'down'
                            ? colors.error
                            : colors.text,
                        opacity: stats.trend === 'stable' ? 0.5 : 1,
                      },
                    ]}
                  >
                    {stats.trendPercent.toFixed(1)}%
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.statCardValueContainer}>
              <ThemedText style={styles.statCardValue}>
                {formatValue(stats.current)}
              </ThemedText>
              <ThemedText style={styles.statCardUnit}>{unit}</ThemedText>
            </View>
          </View>

          {/* Sparkline Chart */}
          <View style={styles.sparklineContainer}>
            {renderSparkline(sparkline, color, color)}
          </View>

          {/* Stats Row */}
          <View style={styles.statCardFooter}>
            <View style={styles.statCardFooterItem}>
              <ThemedText style={styles.statCardFooterLabel}>Avg</ThemedText>
              <ThemedText style={styles.statCardFooterValue}>
                {formatValue(stats.average)}{unit}
              </ThemedText>
            </View>
            <View style={styles.statCardFooterItem}>
              <ThemedText style={styles.statCardFooterLabel}>Min</ThemedText>
              <ThemedText style={styles.statCardFooterValue}>
                {formatValue(stats.min)}{unit}
              </ThemedText>
            </View>
            <View style={styles.statCardFooterItem}>
              <ThemedText style={styles.statCardFooterLabel}>Max</ThemedText>
              <ThemedText style={styles.statCardFooterValue}>
                {formatValue(stats.max)}{unit}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  if (!currentData || historicalData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <ThemedText style={[styles.title, { color: colors.text }]}>
            Analytics Dashboard
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.text, opacity: 0.7 }]}>
            Trends, statistics, and insights
          </ThemedText>
        </View>
      </View>

      <View style={[styles.cardsContainer, isMobile && styles.cardsContainerMobile]}>
        {tempStats &&
          renderStatCard(
            'Temperature',
            'thermometer',
            '°C',
            tempStats,
            tempSparkline,
            '#F44336',
            colorScheme === 'dark' ? ['#F44336', '#B91C1C'] : ['#F44336', '#DC2626']
          )}

        {humidityStats &&
          renderStatCard(
            'Humidity',
            'water',
            '%',
            humidityStats,
            humiditySparkline,
            '#2196F3',
            colorScheme === 'dark' ? ['#2196F3', '#1565C0'] : ['#2196F3', '#1976D2']
          )}

        {rainfallStats &&
          renderStatCard(
            'Rainfall',
            'rainy',
            'mm',
            rainfallStats,
            rainfallSparkline,
            '#00BCD4',
            colorScheme === 'dark' ? ['#00BCD4', '#00838F'] : ['#00BCD4', '#0097A7']
          )}

        {windStats &&
          renderStatCard(
            'Wind Speed',
            'flag',
            'km/h',
            windStats,
            windSparkline,
            '#4CAF50',
            colorScheme === 'dark' ? ['#4CAF50', '#2E7D32'] : ['#4CAF50', '#388E3C']
          )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Gabarito',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Gabarito',
    lineHeight: 18,
  },
  cardsContainer: {
    gap: 16,
  },
  cardsContainerMobile: {
    gap: 12,
  },
  statCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
    }),
  },
  statCardMobile: {
    marginBottom: 0,
  },
  statCardGradient: {
    padding: 20,
    minHeight: 200,
  },
  statCardGradientMobile: {
    padding: 16,
    minHeight: 180,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCardTitleContainer: {
    flex: 1,
  },
  statCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Gabarito',
    lineHeight: 22,
  },
  statCardTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statCardTrendText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  statCardValueContainer: {
    alignItems: 'flex-end',
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Gabarito',
    lineHeight: 34,
  },
  statCardUnit: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'Gabarito',
    marginTop: 2,
    lineHeight: 20,
  },
  sparklineContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  statCardFooterItem: {
    flex: 1,
    alignItems: 'center',
  },
  statCardFooterLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
    fontFamily: 'Gabarito',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  statCardFooterValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
});


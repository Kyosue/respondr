import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { HistoricalDataPoint } from './HistoricalDataView';
import { WeatherData } from './WeatherMetrics';

interface WeatherSummaryProps {
  currentData: WeatherData | null;
  historicalData: HistoricalDataPoint[];
}

export function WeatherSummary({ currentData, historicalData }: WeatherSummaryProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();

  const summary = useMemo(() => {
    if (!currentData || historicalData.length === 0) return null;

    const last24h = historicalData.filter(
      d => new Date().getTime() - d.timestamp.getTime() <= 24 * 60 * 60 * 1000
    );

    const totalRainfall24h = last24h.reduce((sum, d) => sum + d.rainfall, 0);
    const avgTemp24h = last24h.length > 0
      ? last24h.reduce((sum, d) => sum + d.temperature, 0) / last24h.length
      : 0;
    const maxWind24h = last24h.length > 0
      ? Math.max(...last24h.map(d => d.windSpeed))
      : 0;

    // Calculate alerts count
    const alerts = [];
    if (currentData.temperature > 35) alerts.push('High Temperature');
    if (currentData.temperature < 15) alerts.push('Low Temperature');
    if (currentData.humidity > 90) alerts.push('High Humidity');
    if (currentData.rainfall > 50) alerts.push('Heavy Rainfall');
    if (currentData.windSpeed > 60) alerts.push('High Wind Speed');

    return {
      totalRainfall24h: totalRainfall24h.toFixed(1),
      avgTemp24h: avgTemp24h.toFixed(1),
      maxWind24h: maxWind24h.toFixed(1),
      dataPoints: historicalData.length,
      alertsCount: alerts.length,
      alerts,
    };
  }, [currentData, historicalData]);

  if (!summary) return null;

  const summaryItems = [
    {
      label: '24h Rainfall',
      value: `${summary.totalRainfall24h} mm`,
      icon: 'rainy',
      color: '#00BCD4',
    },
    {
      label: '24h Avg Temp',
      value: `${summary.avgTemp24h}°C`,
      icon: 'thermometer',
      color: '#F44336',
    },
    {
      label: '24h Max Wind',
      value: `${summary.maxWind24h} km/h`,
      icon: 'flag',
      color: '#4CAF50',
    },
    {
      label: 'Data Points',
      value: summary.dataPoints.toString(),
      icon: 'stats-chart',
      color: colors.primary,
    },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="analytics-outline" size={20} color={colors.primary} />
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
            Summary
          </ThemedText>
        </View>
        {summary.alertsCount > 0 && (
          <View style={[styles.alertBadge, { backgroundColor: `${colors.error}15` }]}>
            <Ionicons name="alert-circle" size={14} color={colors.error} />
            <ThemedText style={[styles.alertBadgeText, { color: colors.error }]}>
              {summary.alertsCount}
            </ThemedText>
          </View>
        )}
      </View>

      <View style={[styles.summaryGrid, isMobile && styles.summaryGridMobile]}>
        {summaryItems.map((item, index) => (
          <View
            key={index}
            style={[
              styles.summaryItem,
              isMobile && styles.summaryItemMobile,
              { backgroundColor: `${item.color}10` },
            ]}
          >
            <View style={[styles.summaryIcon, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon as any} size={18} color={item.color} />
            </View>
            <View style={styles.summaryContent}>
              <ThemedText style={[styles.summaryLabel, { color: colors.text, opacity: 0.7 }]}>
                {item.label}
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: colors.text }]}>
                {item.value}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      {summary.alerts.length > 0 && (
        <View style={[styles.alertsContainer, { borderTopColor: colors.border }]}>
          <ThemedText style={[styles.alertsTitle, { color: colors.text }]}>
            Active Alerts
          </ThemedText>
          <View style={styles.alertsList}>
            {summary.alerts.map((alert, index) => (
              <View
                key={index}
                style={[styles.alertItem, { backgroundColor: `${colors.error}10` }]}
              >
                <Ionicons name="warning" size={14} color={colors.error} />
                <ThemedText style={[styles.alertText, { color: colors.error }]}>
                  {alert}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 22,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 18,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryGridMobile: {
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
  },
  summaryItemMobile: {
    minWidth: '47%',
    flex: 0,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'Gabarito',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 22,
  },
  alertsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  alertsList: {
    gap: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
});


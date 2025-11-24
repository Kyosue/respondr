import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export interface WeatherData {
  temperature: number; // Celsius
  humidity: number; // Percentage
  rainfall: number; // mm
  windSpeed: number; // km/h
  lastUpdated: Date;
}

interface WeatherMetricsProps {
  data: WeatherData | null;
  onMetricPress?: (metric: string) => void;
}

interface MetricItem {
  key: keyof WeatherData;
  label: string;
  value: string | number;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  color: string;
}

export function WeatherMetrics({ data, onMetricPress }: WeatherMetricsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();

  const formatValue = (key: keyof WeatherData, value: number | Date | null): string => {
    if (value === null || value === undefined) return '--';
    if (key === 'lastUpdated') return '';
    
    // Type guard: ensure value is a number
    if (typeof value !== 'number') return String(value);
    
    if (key === 'temperature') {
      return `${value.toFixed(1)}`;
    }
    if (key === 'humidity') {
      return `${Math.round(value)}`;
    }
    if (key === 'rainfall') {
      return `${value.toFixed(1)}`;
    }
    if (key === 'windSpeed') {
      return `${value.toFixed(1)}`;
    }
    return String(value);
  };

  const metrics: MetricItem[] = data ? [
    {
      key: 'temperature',
      label: 'Temperature',
      value: formatValue('temperature', data.temperature),
      unit: '°C',
      icon: 'thermometer',
      gradient: colorScheme === 'dark' ? ['#F44336', '#B91C1C'] : ['#F44336', '#DC2626'],
      color: '#F44336'
    },
    {
      key: 'humidity',
      label: 'Humidity',
      value: formatValue('humidity', data.humidity),
      unit: '%',
      icon: 'water',
      gradient: colorScheme === 'dark' ? ['#2196F3', '#1565C0'] : ['#2196F3', '#1976D2'],
      color: '#2196F3'
    },
    {
      key: 'rainfall',
      label: 'Rainfall',
      value: formatValue('rainfall', data.rainfall),
      unit: 'mm',
      icon: 'rainy',
      gradient: colorScheme === 'dark' ? ['#00BCD4', '#00838F'] : ['#00BCD4', '#0097A7'],
      color: '#00BCD4'
    },
    {
      key: 'windSpeed',
      label: 'Wind Speed',
      value: formatValue('windSpeed', data.windSpeed),
      unit: 'km/h',
      icon: 'flag',
      gradient: colorScheme === 'dark' ? ['#4CAF50', '#2E7D32'] : ['#4CAF50', '#388E3C'],
      color: '#4CAF50'
    },
  ] : [];

  const handlePress = (metric: MetricItem) => {
    if (onMetricPress && data) {
      onMetricPress(metric.key);
    }
  };

  if (!data) {
    return (
      <View style={styles.container}>
        <View style={[styles.noDataCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.text} style={{ opacity: 0.3 }} />
          <ThemedText style={[styles.noDataText, { color: colors.text, opacity: 0.5 }]}>
            No weather data available
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.metricsContainer, isMobile && styles.metricsContainerMobile]}>
        {metrics.map((metric) => (
          <TouchableOpacity
            key={metric.key}
            activeOpacity={0.8}
            style={[styles.metricCard, isMobile && styles.metricCardMobile]}
            onPress={() => handlePress(metric)}
            disabled={!onMetricPress}
          >
            <LinearGradient
              colors={metric.gradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gradientCard, isMobile && styles.gradientCardMobile]}
            >
              <View style={styles.metricContent}>
                {isMobile ? (
                  <>
                    <View style={styles.mobileTopRow}>
                      <View style={[styles.iconBackground, styles.iconBackgroundMobile, { backgroundColor: `${metric.color}20` }]}>
                        <Ionicons name={metric.icon} size={20} color="#FFFFFF" />
                      </View>
                      <View style={styles.mobileValueContainer}>
                        <ThemedText style={styles.metricValueMobile}>
                          {metric.value}
                        </ThemedText>
                        <ThemedText style={styles.metricUnitMobile}>
                          {metric.unit}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.metricLabelMobile} numberOfLines={2}>
                      {metric.label}
                    </ThemedText>
                  </>
                ) : (
                  <View style={styles.metricRow}>
                    <View style={[styles.iconBackground, { backgroundColor: `${metric.color}20` }]}>
                      <Ionicons name={metric.icon} size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.metricTextContainer}>
                      <View style={styles.valueRow}>
                        <ThemedText style={styles.metricValue}>
                          {metric.value}
                        </ThemedText>
                        <ThemedText style={styles.metricUnit}>
                          {metric.unit}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.metricLabel}>
                        {metric.label}
                      </ThemedText>
                    </View>
                  </View>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metricsContainerMobile: {
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  metricCardMobile: {
    width: '48%',
    minWidth: '48%',
    flex: 0,
  },
  gradientCard: {
    padding: 16,
    borderRadius: 16,
    minHeight: 90,
    justifyContent: 'center',
  },
  gradientCardMobile: {
    padding: 12,
    minHeight: 100,
    justifyContent: 'flex-start',
  },
  metricContent: {
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mobileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    width: '100%',
  },
  mobileValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexShrink: 0,
  },
  iconBackgroundMobile: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  metricTextContainer: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Gabarito',
    lineHeight: 30,
  },
  metricValueMobile: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Gabarito',
    lineHeight: 26,
  },
  metricUnit: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
    lineHeight: 20,
  },
  metricUnitMobile: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
    lineHeight: 18,
  },
  metricLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
    fontFamily: 'Gabarito',
    lineHeight: 18,
  },
  metricLabelMobile: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  noDataCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 200,
  },
  noDataText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});


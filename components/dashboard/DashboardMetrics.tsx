import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface MetricItem {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  size?: 'large' | 'medium' | 'compact';
}

interface DashboardMetricsProps {
  activeOperations: number;
  resourceUtilization: number; // Percentage
  recentDocuments: number;
}

export function DashboardMetrics({
  activeOperations,
  resourceUtilization,
  recentDocuments,
}: DashboardMetricsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile, width } = useScreenSize();
  const isWeb = Platform.OS === 'web';
  const canFitHorizontal = isWeb && !isMobile && width >= 1280;

  const metrics: MetricItem[] = [
    { 
      label: 'Active Operations', 
      value: activeOperations,
      icon: 'location',
      color: '#4361EE',
      size: 'large',
    },
    { 
      label: 'Resource Utilization', 
      value: `${resourceUtilization}%`,
      icon: 'cube',
      color: '#4CAF50',
      size: 'medium',
    },
    { 
      label: 'Recent Documents', 
      value: recentDocuments,
      icon: 'document-text',
      color: '#FF9800',
      size: 'compact',
    },
  ];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.metricsContainer,
          canFitHorizontal && styles.metricsContainerHorizontal,
          isMobile && styles.metricsContainerMobile,
        ]}
      >
        {metrics.map((metric) => (
          <TouchableOpacity
            key={metric.label}
            activeOpacity={0.8}
            style={[
              styles.metricCard,
              canFitHorizontal && styles.metricCardHorizontal,
              !canFitHorizontal && isWeb && metric.size === 'large' && styles.metricCardLarge,
              !canFitHorizontal && isWeb && metric.size === 'medium' && styles.metricCardMedium,
              !canFitHorizontal && isWeb && metric.size === 'compact' && styles.metricCardCompact,
              isMobile && styles.metricCardMobile,
            {
              borderColor: colorScheme === 'dark' ? '#2A2F3A' : '#EAECF0',
              backgroundColor: colorScheme === 'dark' ? '#171A21' : '#FFFFFF',
            },
            ]}
          >
          <View style={styles.webCardContent}>
            <View style={[styles.webIconWrap, { backgroundColor: `${metric.color}14` }]}>
              <Ionicons name={metric.icon} size={18} color={metric.color} />
            </View>
            <View style={styles.metricTextContainer}>
              <ThemedText style={[styles.webMetricLabel, { color: colors.text }]}>
                {metric.label}
              </ThemedText>
              <ThemedText style={[styles.webMetricValue, { color: colors.text }]}>
                {metric.value}
              </ThemedText>
            </View>
          </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    paddingHorizontal: 0,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  metricsContainerHorizontal: {
    flexWrap: 'nowrap',
  },
  metricsContainerMobile: {
    gap: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    flexGrow: 1,
    minWidth: 180,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  metricCardLarge: {
    width: '100%',
    minHeight: 104,
  },
  metricCardHorizontal: {
    flex: 1,
    minWidth: 0,
    minHeight: 88,
  },
  metricCardMedium: {
    width: '58%',
    minHeight: 88,
  },
  metricCardCompact: {
    width: '38%',
    minHeight: 88,
  },
  metricCardMobile: {
    width: '48.5%',
    minWidth: '48.5%',
    flex: 0,
    marginBottom: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  metricTextContainer: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  webCardContent: {
    minHeight: 84,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  webIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMetricLabel: {
    fontSize: 12,
    opacity: 0.62,
    marginBottom: 2,
    fontFamily: 'Gabarito',
  },
  webMetricValue: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Gabarito',
  },
});


import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface MetricItem {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  color: string;
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
  const { isMobile } = useScreenSize();

  const metrics: MetricItem[] = [
    { 
      label: 'Active Operations', 
      value: activeOperations,
      icon: 'location',
      gradient: colorScheme === 'dark' ? ['#4361EE', '#3A0CA3'] : ['#4361EE', '#7209B7'],
      color: '#4361EE'
    },
    { 
      label: 'Resource Utilization', 
      value: `${resourceUtilization}%`,
      icon: 'cube',
      gradient: colorScheme === 'dark' ? ['#4CAF50', '#059669'] : ['#4CAF50', '#10B981'],
      color: '#4CAF50'
    },
    { 
      label: 'Recent Documents', 
      value: recentDocuments,
      icon: 'document-text',
      gradient: colorScheme === 'dark' ? ['#FF9800', '#F59E0B'] : ['#FF9800', '#F97316'],
      color: '#FF9800'
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.metricsContainer, isMobile && styles.metricsContainerMobile]}>
        {metrics.map((metric) => (
          <TouchableOpacity
            key={metric.label}
            activeOpacity={0.8}
            style={[styles.metricCard, isMobile && styles.metricCardMobile]}
          >
            <LinearGradient
              colors={metric.gradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gradientCard, isMobile && styles.gradientCardMobile]}
            >
              <View style={styles.metricContent}>
                {isMobile ? (
                  // Mobile: Icon and value on top, label below
                  <>
                    <View style={styles.mobileTopRow}>
                      <View style={[styles.iconBackground, styles.iconBackgroundMobile, { backgroundColor: `${metric.color}20` }]}>
                        <Ionicons name={metric.icon} size={20} color="#FFFFFF" />
                      </View>
                      <ThemedText style={styles.metricValueMobile}>
                        {metric.value}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.metricLabelMobile} numberOfLines={2}>
                      {metric.label}
                    </ThemedText>
                  </>
                ) : (
                  // Desktop: Icon and text side by side
                  <View style={styles.metricRow}>
                    <View style={[styles.iconBackground, { backgroundColor: `${metric.color}20` }]}>
                      <Ionicons name={metric.icon} size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.metricTextContainer}>
                      <ThemedText style={styles.metricValue}>
                        {metric.value}
                      </ThemedText>
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
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metricsContainerMobile: {
    gap: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
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
    marginBottom: 0,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  gradientCard: {
    padding: 16,
    borderRadius: 16,
    minHeight: 80,
    justifyContent: 'center',
  },
  gradientCardMobile: {
    padding: 12,
    minHeight: 95,
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
    marginBottom: 10,
    width: '100%',
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
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  metricTextContainer: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
    fontFamily: 'Gabarito',
  },
  metricValueMobile: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Gabarito',
    flexShrink: 0,
  },
  metricLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
    fontFamily: 'Gabarito',
    flexShrink: 1,
  },
  metricLabelMobile: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
    fontFamily: 'Gabarito',
    lineHeight: 14,
    textAlign: 'left',
  },
});


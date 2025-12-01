import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';

export function ResourceOverview() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state } = useResources();
  const { isMobile } = useScreenSize();

  const totalQuantity = state.resources.reduce((sum, r) => sum + (r.totalQuantity || 0), 0);
  const availableQuantity = state.resources.reduce((sum, r) => sum + (r.availableQuantity || 0), 0);
  const borrowedQuantity = totalQuantity - availableQuantity;
  const utilizationPercentage = totalQuantity > 0 
    ? Math.round((borrowedQuantity / totalQuantity) * 100)
    : 0;

  const lowStockCount = state.resources.filter(resource => {
    if (resource.totalQuantity === 0) return false;
    const availabilityPercent = (resource.availableQuantity / resource.totalQuantity) * 100;
    return availabilityPercent < 10 && resource.availableQuantity > 0;
  }).length;

  const stats = [
    {
      label: 'Total Resources',
      value: state.resources.length,
      icon: 'cube-outline' as const,
      color: '#4361EE',
    },
    {
      label: 'Available',
      value: availableQuantity,
      icon: 'checkmark-circle-outline' as const,
      color: '#10B981',
    },
    {
      label: 'In Use',
      value: borrowedQuantity,
      icon: 'arrow-forward-circle-outline' as const,
      color: '#F59E0B',
    },
    {
      label: 'Low Stock',
      value: lowStockCount,
      icon: 'warning-outline' as const,
      color: '#EF4444',
    },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: colors.text }]}>Resource Overview</ThemedText>
        <View style={[styles.utilizationBadge, { backgroundColor: `${colors.primary}15` }]}>
          <ThemedText style={[styles.utilizationText, { color: colors.primary }]}>
            {utilizationPercentage}% Utilized
          </ThemedText>
        </View>
      </View>
      <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
        {stats.map((stat) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: `${stat.color}10` }]}>
            <View style={[styles.statIconContainer, { backgroundColor: stat.color }]}>
              <Ionicons name={stat.icon} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.statContent}>
              <ThemedText style={[styles.statValue, { color: colors.text }]}>
                {stat.value}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.text }]} numberOfLines={2}>
                {stat.label}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    ...(Platform.OS !== 'web' && {
      padding: 14,
      marginBottom: 16,
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Gabarito',
  },
  utilizationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  utilizationText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Gabarito',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statsGridMobile: {
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...(Platform.OS !== 'web' && {
      padding: 10,
      minWidth: '48%',
      flex: 0,
      width: '48%',
    }),
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS !== 'web' && {
      width: 36,
      height: 36,
    }),
  },
  statContent: {
    flex: 1,
    minWidth: 0,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: 'Gabarito',
    ...(Platform.OS !== 'web' && {
      fontSize: 18,
    }),
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.8,
    fontFamily: 'Gabarito',
    ...(Platform.OS !== 'web' && {
      fontSize: 10,
      lineHeight: 13,
    }),
  },
});


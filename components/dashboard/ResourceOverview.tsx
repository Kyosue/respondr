import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';

interface StatCardProps {
  stat: {
    label: string;
    value: number;
    icon: string;
    color: string;
    subtitle: string;
  };
  colors: any;
}

function StatCard({ stat, colors }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: `${stat.color}10` }]}>
      <View style={styles.statCardMetaRow}>
        <ThemedText style={[styles.statMetaText, { color: colors.text }]}>{stat.subtitle}</ThemedText>
      </View>
      <View style={styles.statCardTop}>
        <View style={[styles.statIconContainer, { backgroundColor: stat.color }]}>
          <Ionicons name={stat.icon as any} size={20} color="#FFFFFF" />
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
    </View>
  );
}

export function ResourceOverview() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state } = useResources();
  const { isMobile } = useScreenSize();
  const sidebarBackground = colorScheme === 'dark' ? '#15171C' : '#FFFFFF';
  const sidebarBorder = colorScheme === 'dark' ? '#262A33' : '#EAECF0';

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

  const availablePercent = totalQuantity > 0 
    ? Math.round((availableQuantity / totalQuantity) * 100)
    : 0;
  const inUsePercent = utilizationPercentage;
  const totalResourcesCount = state.resources.length;

  const stats = [
    {
      label: 'Resource Types',
      value: totalResourcesCount,
      icon: 'cube-outline' as const,
      color: '#4361EE',
      subtitle: `${totalQuantity} units`,
    },
    {
      label: 'Available Units',
      value: availableQuantity,
      icon: 'checkmark-circle-outline' as const,
      color: '#10B981',
      subtitle: `${availablePercent}%`,
    },
    {
      label: 'In Use Units',
      value: borrowedQuantity,
      icon: 'arrow-forward-circle-outline' as const,
      color: '#F59E0B',
      subtitle: `${inUsePercent}%`,
    },
    {
      label: 'Low-Stock Types',
      value: lowStockCount,
      icon: 'warning-outline' as const,
      color: '#EF4444',
      subtitle: `${lowStockCount}/${totalResourcesCount}`,
    },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: sidebarBackground, borderColor: sidebarBorder }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: colors.text }]}>Resource Overview</ThemedText>
        <View style={[styles.utilizationBadge, { backgroundColor: `${colors.primary}15` }]}>
          <ThemedText style={[styles.utilizationText, { color: colors.primary }]}>
            {utilizationPercentage}% Utilized
          </ThemedText>
        </View>
      </View>

      <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
        {stats.map((stat) => {
          return (
            <StatCard
              key={stat.label}
              stat={stat}
              colors={colors}
            />
          );
        })}
      </View>

      <View style={[styles.compositionCard, { backgroundColor: colorScheme === 'dark' ? '#1B2029' : '#F8F9FC' }]}>
        <View style={styles.compositionHeader}>
          <ThemedText style={[styles.compositionTitle, { color: colors.text }]}>Inventory Composition</ThemedText>
          <ThemedText style={[styles.compositionPercent, { color: colors.text }]}>{availablePercent}% / {inUsePercent}%</ThemedText>
        </View>

        <View style={styles.compositionTrack}>
          <View style={[styles.compositionSegment, { flex: availableQuantity, backgroundColor: '#10B981' }]} />
          <View style={[styles.compositionSegment, { flex: borrowedQuantity, backgroundColor: '#F59E0B' }]} />
          {totalQuantity === 0 && <View style={[styles.compositionSegment, { flex: 1, backgroundColor: '#E5E7EB' }]} />}
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <ThemedText style={[styles.legendText, { color: colors.text }]}>Available ({availableQuantity})</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <ThemedText style={[styles.legendText, { color: colors.text }]}>In Use ({borrowedQuantity})</ThemedText>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    ...(Platform.OS !== 'web' && {
      padding: 12,
      marginBottom: 14,
    }),
    ...(Platform.OS === 'web' && {
      marginBottom: 0,
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    fontFamily: 'Gabarito',
  },
  utilizationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  utilizationText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Gabarito',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statsGridMobile: {
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    padding: 10,
    borderRadius: 10,
    ...(Platform.OS !== 'web' && {
      padding: 10,
      minWidth: '48.5%',
      flex: 0,
      width: '48.5%',
    }),
  },
  statCardMetaRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  statMetaText: {
    fontSize: 12,
    lineHeight: 15,
    opacity: 0.82,
    fontWeight: '700',
    fontFamily: 'Gabarito',
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS !== 'web' && {
      width: 32,
      height: 32,
    }),
  },
  statContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
    fontFamily: 'Gabarito',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.8,
    lineHeight: 15,
    fontWeight: '600',
    fontFamily: 'Gabarito',
  },
  compositionCard: {
    marginTop: 10,
    borderRadius: 10,
    padding: 10,
  },
  compositionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  compositionTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Gabarito',
  },
  compositionPercent: {
    fontSize: 12,
    opacity: 0.8,
    fontWeight: '600',
    fontFamily: 'Gabarito',
  },
  compositionTrack: {
    flexDirection: 'row',
    height: 10,
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  compositionSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendText: {
    fontSize: 12,
    opacity: 0.8,
    fontWeight: '600',
    fontFamily: 'Gabarito',
  },
});


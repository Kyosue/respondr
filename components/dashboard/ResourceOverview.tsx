import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

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

const StatCard = memo(function StatCard({ stat, colors }: StatCardProps) {
  const countAnimation = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);
  const previousRoundedValueRef = useRef<number>(0);

  useEffect(() => {
    countAnimation.stopAnimation();
    countAnimation.setValue(0);
    previousRoundedValueRef.current = 0;
    setDisplayValue(0);

    const listenerId = countAnimation.addListener(({ value }) => {
      const rounded = Math.round(value);
      // Prevent unnecessary state updates on every animation frame.
      if (rounded !== previousRoundedValueRef.current) {
        previousRoundedValueRef.current = rounded;
        setDisplayValue(rounded);
      }
    });

    Animated.timing(countAnimation, {
      toValue: stat.value,
      duration: 1600, // intentionally slower for readability
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      countAnimation.removeListener(listenerId);
    };
  }, [stat.value, countAnimation]);

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
            {displayValue}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.text }]} numberOfLines={2}>
            {stat.label}
          </ThemedText>
        </View>
      </View>
    </View>
  );
});

export function ResourceOverview() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state, overviewStats, refreshOverviewStats } = useResources();
  const { isMobile } = useScreenSize();
  const sidebarBackground = colorScheme === 'dark' ? '#15171C' : '#FFFFFF';
  const sidebarBorder = colorScheme === 'dark' ? '#262A33' : '#EAECF0';
  const fallbackStats = useMemo(() => {
    const totalQuantity = state.resources.reduce((sum, r) => sum + (r.totalQuantity || 0), 0);
    const availableQuantity = state.resources.reduce((sum, r) => sum + (r.availableQuantity || 0), 0);
    const borrowedQuantity = totalQuantity - availableQuantity;
    const inUsePercent = totalQuantity > 0
      ? Math.round((borrowedQuantity / totalQuantity) * 100)
      : 0;
    const lowStockCount = state.resources.filter(resource => {
      if (resource.totalQuantity === 0) return false;
      const availabilityPercent = (resource.availableQuantity / resource.totalQuantity) * 100;
      return availabilityPercent < 10 && resource.availableQuantity > 0;
    }).length;

    return {
      totalResourceTypes: state.resources.length,
      totalUnits: totalQuantity,
      availableUnits: availableQuantity,
      inUseUnits: borrowedQuantity,
      lowStockTypes: lowStockCount,
      availablePercent: totalQuantity > 0 ? Math.round((availableQuantity / totalQuantity) * 100) : 0,
      inUsePercent,
    };
  }, [state.resources]);

  const resolvedTotalResourcesCount = overviewStats?.totalResourceTypes ?? fallbackStats.totalResourceTypes;
  const resolvedTotalQuantity = overviewStats?.totalUnits ?? fallbackStats.totalUnits;
  const resolvedAvailableQuantity = overviewStats?.availableUnits ?? fallbackStats.availableUnits;
  const resolvedBorrowedQuantity = overviewStats?.inUseUnits ?? fallbackStats.inUseUnits;
  const resolvedLowStockCount = overviewStats?.lowStockTypes ?? fallbackStats.lowStockTypes;
  const resolvedAvailablePercent = overviewStats?.availablePercent ?? fallbackStats.availablePercent;
  const resolvedInUsePercent = overviewStats?.inUsePercent ?? fallbackStats.inUsePercent;
  const [trackWidth, setTrackWidth] = useState(0);
  const availableBarWidthAnim = useRef(new Animated.Value(0)).current;
  const inUseBarWidthAnim = useRef(new Animated.Value(0)).current;
  const lastBarSignatureRef = useRef<string>('');

  useEffect(() => {
    if (!overviewStats && state.resources.length > 0) {
      refreshOverviewStats();
    }
  }, [overviewStats, state.resources.length, refreshOverviewStats]);

  useEffect(() => {
    if (trackWidth <= 0) return;

    const nextSignature = `${trackWidth}-${resolvedTotalQuantity}-${resolvedBorrowedQuantity}`;
    if (lastBarSignatureRef.current === nextSignature) return;
    lastBarSignatureRef.current = nextSignature;

    availableBarWidthAnim.stopAnimation();
    inUseBarWidthAnim.stopAnimation();
    availableBarWidthAnim.setValue(0);
    inUseBarWidthAnim.setValue(0);

    if (resolvedTotalQuantity <= 0) return;

    const inUseRatio = Math.max(0, Math.min(1, resolvedBorrowedQuantity / resolvedTotalQuantity));
    const finalInUseWidth = trackWidth * inUseRatio;
    const finalAvailableWidth = Math.max(0, trackWidth - finalInUseWidth);

    const phaseOne = Animated.timing(availableBarWidthAnim, {
      toValue: trackWidth,
      duration: 850,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    const phaseTwo =
      finalInUseWidth > 0
        ? Animated.parallel([
            Animated.timing(availableBarWidthAnim, {
              toValue: finalAvailableWidth,
              duration: 850,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: false,
            }),
            Animated.timing(inUseBarWidthAnim, {
              toValue: finalInUseWidth,
              duration: 850,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: false,
            }),
          ])
        : Animated.delay(0);

    Animated.sequence([phaseOne, Animated.delay(180), phaseTwo]).start();
  }, [
    trackWidth,
    resolvedTotalQuantity,
    resolvedBorrowedQuantity,
    availableBarWidthAnim,
    inUseBarWidthAnim,
  ]);

  const stats = useMemo(() => [
    {
      label: 'Resource Types',
      value: resolvedTotalResourcesCount,
      icon: 'cube-outline' as const,
      color: '#4361EE',
      subtitle: `${resolvedTotalQuantity} units`,
    },
    {
      label: 'Available Units',
      value: resolvedAvailableQuantity,
      icon: 'checkmark-circle-outline' as const,
      color: '#10B981',
      subtitle: `${resolvedAvailablePercent}%`,
    },
    {
      label: 'In Use Units',
      value: resolvedBorrowedQuantity,
      icon: 'arrow-forward-circle-outline' as const,
      color: '#F59E0B',
      subtitle: `${resolvedInUsePercent}%`,
    },
    {
      label: 'Low-Stock Types',
      value: resolvedLowStockCount,
      icon: 'warning-outline' as const,
      color: '#EF4444',
      subtitle: `${resolvedLowStockCount}/${resolvedTotalResourcesCount}`,
    },
  ], [
    resolvedTotalResourcesCount,
    resolvedTotalQuantity,
    resolvedAvailableQuantity,
    resolvedAvailablePercent,
    resolvedBorrowedQuantity,
    resolvedInUsePercent,
    resolvedLowStockCount,
  ]);

  const handleTrackLayout = useCallback((event: any) => {
    const measuredWidth = event.nativeEvent.layout.width;
    if (Math.abs(measuredWidth - trackWidth) > 0.5) {
      setTrackWidth(measuredWidth);
    }
  }, [trackWidth]);

  return (
    <ThemedView style={[styles.container, { backgroundColor: sidebarBackground, borderColor: sidebarBorder }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: colors.text }]}>Resource Overview</ThemedText>
        <View style={[styles.utilizationBadge, { backgroundColor: `${colors.primary}15` }]}>
          <ThemedText style={[styles.utilizationText, { color: colors.primary }]}>
            {resolvedInUsePercent}% Utilized
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
          <ThemedText style={[styles.compositionPercent, { color: colors.text }]}>{resolvedAvailablePercent}% / {resolvedInUsePercent}%</ThemedText>
        </View>

        <View
          style={styles.compositionTrack}
          onLayout={handleTrackLayout}
        >
          <Animated.View
            style={[
              styles.availableSegmentAnimated,
              {
                width: availableBarWidthAnim,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.inUseSegmentAnimated,
              {
                width: inUseBarWidthAnim,
              },
            ]}
          />
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <ThemedText style={[styles.legendText, { color: colors.text }]}>Available ({resolvedAvailableQuantity})</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <ThemedText style={[styles.legendText, { color: colors.text }]}>In Use ({resolvedBorrowedQuantity})</ThemedText>
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
    position: 'relative',
    height: 10,
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#E5E7EB',
  },
  availableSegmentAnimated: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#10B981',
  },
  inUseSegmentAnimated: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#F59E0B',
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


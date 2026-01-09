import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

// Animated Stat Card Component
interface StatCardWithAnimationProps {
  stat: {
    label: string;
    value: number;
    icon: string;
    color: string;
    percentage: number;
  };
  activeBars: number;
  totalBars: number;
  colors: any;
}

function StatCardWithAnimation({ stat, activeBars, totalBars, colors }: StatCardWithAnimationProps) {
  const [cardWidth, setCardWidth] = useState(0);
  const [calculatedBars, setCalculatedBars] = useState(totalBars);
  
  // Calculate number of bars based on card width
  useEffect(() => {
    if (cardWidth > 0) {
      // Bar width + spacing (4px bar + 2px spacing = 6px per bar on web, 3px + 1.5px = 4.5px on mobile)
      const barWidth = Platform.OS === 'web' ? 4 : 3;
      const barSpacing = Platform.OS === 'web' ? 2 : 1.5;
      const padding = Platform.OS === 'web' ? 24 : 20; // Card padding * 2
      const availableWidth = cardWidth - padding;
      const barUnit = barWidth + barSpacing;
      const maxBars = Math.floor(availableWidth / barUnit);
      // Use at least 20 bars, but not more than what fits
      const bars = Math.max(20, Math.min(maxBars, 60));
      setCalculatedBars(bars);
    } else {
      setCalculatedBars(totalBars);
    }
  }, [cardWidth, totalBars]);

  const barAnimations = useRef(
    Array.from({ length: 60 }).map(() => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Number counting animation
  const countAnimation = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Number counting animation
    Animated.timing(countAnimation, {
      toValue: stat.value,
      duration: 1500,
      useNativeDriver: false, // We need to use false for number interpolation
    }).start();

    // Update display value as animation progresses
    const listener = countAnimation.addListener(({ value }) => {
      setDisplayValue(Math.floor(value));
    });

    return () => {
      countAnimation.removeListener(listener);
    };
  }, [stat.value, countAnimation]);

  useEffect(() => {
    // Staggered animation for each bar
    const activeBarsCount = Math.round((stat.percentage / 100) * calculatedBars);
    const animations = barAnimations.slice(0, calculatedBars).map((anim, index) => {
      const isActive = index < activeBarsCount;
      const delay = index * 15; // 15ms delay between each bar
      
      return Animated.parallel([
        Animated.timing(anim.scale, {
          toValue: isActive ? 1 : 0.3,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: isActive ? 1 : 0.3,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
      ]);
    });

    if (animations.length > 0) {
      Animated.stagger(0, animations).start();
    }
  }, [calculatedBars, stat.percentage, barAnimations]);

  const activeBarsCount = Math.round((stat.percentage / 100) * calculatedBars);

  return (
    <View 
      style={[styles.statCard, { backgroundColor: `${stat.color}10` }]}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setCardWidth(width);
      }}
    >
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
      
      {/* Individual Progress Bar with Vertical Bars - Auto Width */}
      <View style={styles.cardProgressBar}>
        {Array.from({ length: calculatedBars }).map((_, index) => {
          const isActive = index < activeBarsCount;
          const isLast = index === calculatedBars - 1;
          const anim = barAnimations[index];
          
          return (
            <Animated.View
              key={index}
              style={[
                styles.cardProgressBarItem,
                !isLast && styles.cardProgressBarItemSpacing,
                isActive && { backgroundColor: stat.color },
                {
                  transform: [{ scaleY: anim.scale }],
                  opacity: anim.opacity,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

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

  // Calculate percentages for each metric
  const totalResourcesPercent = state.resources.length > 0 ? 100 : 0;
  const availablePercent = totalQuantity > 0 
    ? Math.round((availableQuantity / totalQuantity) * 100)
    : 0;
  const inUsePercent = utilizationPercentage;
  const lowStockPercent = state.resources.length > 0
    ? Math.round((lowStockCount / state.resources.length) * 100)
    : 0;

  const stats = [
    {
      label: 'Total Resources',
      value: state.resources.length,
      icon: 'cube-outline' as const,
      color: '#4361EE',
      percentage: totalResourcesPercent,
    },
    {
      label: 'Available',
      value: availableQuantity,
      icon: 'checkmark-circle-outline' as const,
      color: '#10B981',
      percentage: availablePercent,
    },
    {
      label: 'In Use',
      value: borrowedQuantity,
      icon: 'arrow-forward-circle-outline' as const,
      color: '#F59E0B',
      percentage: inUsePercent,
    },
    {
      label: 'Low Stock',
      value: lowStockCount,
      icon: 'warning-outline' as const,
      color: '#EF4444',
      percentage: lowStockPercent,
    },
  ];

  // Default total bars (will be overridden by card width measurement)
  const totalBars = Platform.OS === 'web' ? 40 : 30;

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
        {stats.map((stat) => {
          return (
            <StatCardWithAnimation
              key={stat.label}
              stat={stat}
              activeBars={0} // Will be calculated inside component
              totalBars={totalBars}
              colors={colors}
            />
          );
        })}
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
    ...(Platform.OS === 'web' && {
      marginBottom: 0,
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
    ...(Platform.OS !== 'web' && {
      padding: 10,
      minWidth: '48%',
      flex: 0,
      width: '48%',
    }),
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
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
  cardProgressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 16,
    width: '100%',
    flexWrap: 'nowrap',
    ...(Platform.OS !== 'web' && {
      height: 14,
    }),
  },
  cardProgressBarItem: {
    width: 4,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 1.5,
    flexShrink: 0,
    ...(Platform.OS !== 'web' && {
      width: 3,
    }),
  },
  cardProgressBarItemSpacing: {
    marginRight: 2,
    ...(Platform.OS !== 'web' && {
      marginRight: 1.5,
    }),
  },
});


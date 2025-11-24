import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { WeatherStation } from '@/types/WeatherStation';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface WeatherStationSwitcherProps {
  stations: WeatherStation[];
  selectedStation: WeatherStation | null;
  onSelectStation: (station: WeatherStation) => void;
}

export function WeatherStationSwitcher({
  stations,
  selectedStation,
  onSelectStation,
}: WeatherStationSwitcherProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();

  // Sort stations: selected first in its group, others maintain original order
  const activeStations = useMemo(() => {
    const active = stations.filter(s => s.isActive);
    if (!selectedStation?.isActive) return active;
    
    // Move selected station to first position
    const selectedIndex = active.findIndex(s => s.id === selectedStation.id);
    if (selectedIndex > 0) {
      const reordered = [...active];
      const [selected] = reordered.splice(selectedIndex, 1);
      return [selected, ...reordered];
    }
    return active;
  }, [stations, selectedStation]);

  const inactiveStations = useMemo(() => {
    const inactive = stations.filter(s => !s.isActive);
    if (!selectedStation || selectedStation.isActive) return inactive;
    
    // Move selected station to first position
    const selectedIndex = inactive.findIndex(s => s.id === selectedStation.id);
    if (selectedIndex > 0) {
      const reordered = [...inactive];
      const [selected] = reordered.splice(selectedIndex, 1);
      return [selected, ...reordered];
    }
    return inactive;
  }, [stations, selectedStation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="location" size={20} color={colors.primary} />
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
            Weather Stations
          </ThemedText>
        </View>
        <ThemedText style={[styles.stationCount, { color: colors.text, opacity: 0.6 }]}>
          {activeStations.length} active
        </ThemedText>
      </View>

      <View style={styles.scrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={!isMobile}
          contentContainerStyle={styles.stationsScroll}
          {...(Platform.OS === 'web' && !isMobile && {
            // @ts-ignore - CSS scrollbar properties for web
            style: {
              scrollbarWidth: 'thin',
              scrollbarColor: `${colors.text}20 transparent`,
            } as any,
          })}
        >
        {/* Active Stations */}
        {activeStations.map((station) => {
          const isSelected = selectedStation?.id === station.id;
          return (
            <TouchableOpacity
              key={station.id}
              onPress={() => onSelectStation(station)}
              style={[
                styles.stationChip,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : `${colors.primary}15`,
                  borderColor: isSelected
                    ? colors.primary
                    : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isSelected
                      ? '#FFFFFF'
                      : colors.success || '#4CAF50',
                  },
                ]}
              />
              <ThemedText
                style={[
                  styles.stationName,
                  {
                    color: isSelected ? '#FFFFFF' : colors.text,
                    fontWeight: isSelected ? '600' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {station.municipality.name}
              </ThemedText>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Inactive Stations (if any) */}
        {inactiveStations.length > 0 && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            {inactiveStations.map((station) => {
              const isSelected = selectedStation?.id === station.id;
              return (
                <TouchableOpacity
                  key={station.id}
                  onPress={() => onSelectStation(station)}
                  style={[
                    styles.stationChip,
                    styles.inactiveChip,
                    {
                      backgroundColor: isSelected
                        ? colors.error
                        : `${colors.error}15`,
                      borderColor: isSelected
                        ? colors.error
                        : colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isSelected
                          ? '#FFFFFF'
                          : colors.error,
                      },
                    ]}
                  />
                  <ThemedText
                    style={[
                      styles.stationName,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        opacity: isSelected ? 1 : 0.6,
                        fontWeight: isSelected ? '600' : '500',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {station.municipality.name}
                  </ThemedText>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scrollContainer: {
    marginTop: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  stationCount: {
    fontSize: 13,
    lineHeight: 18,
  },
  stationsScroll: {
    gap: 8,
    paddingRight: 4,
    paddingBottom: Platform.select({
      web: 8,
      default: 0,
    }),
  },
  stationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 100,
  },
  inactiveChip: {
    opacity: 0.7,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stationName: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 4,
  },
});


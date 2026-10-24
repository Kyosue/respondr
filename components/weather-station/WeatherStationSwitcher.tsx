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
  onAddStation?: () => void;
  showAddButton?: boolean;
}

export function WeatherStationSwitcher({
  stations,
  selectedStation,
  onSelectStation,
  onAddStation,
  showAddButton = false,
}: WeatherStationSwitcherProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  const isDark = colorScheme === 'dark';
  const surface = isDark ? '#171A21' : '#FFFFFF';
  const border = isDark ? '#2A2F3A' : '#EAECF0';
  const tile = isDark ? '#1E222B' : '#F7F8FA';

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

  // Generate display names with incrementing numbers for stations in the same municipality
  const stationDisplayNames = useMemo(() => {
    const displayNames = new Map<string, string>();
    const municipalityGroups = new Map<string, WeatherStation[]>();

    // Group stations by municipality
    stations.forEach(station => {
      const key = station.municipality.name;
      if (!municipalityGroups.has(key)) {
        municipalityGroups.set(key, []);
      }
      municipalityGroups.get(key)!.push(station);
    });

    // Assign display names with numbers if multiple stations in same municipality
    municipalityGroups.forEach((groupStations, municipalityName) => {
      if (groupStations.length > 1) {
        groupStations.forEach((station, index) => {
          displayNames.set(station.id, `${municipalityName} ${index + 1}`);
        });
      } else {
        displayNames.set(groupStations[0].id, municipalityName);
      }
    });

    return displayNames;
  }, [stations]);

  const getStationDisplayName = (stationId: string) => {
    return stationDisplayNames.get(stationId) || '';
  };

  return (
    <View style={[styles.container, { backgroundColor: surface, borderColor: border }]}>
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View style={styles.headingGroup}>
          <View style={[styles.headingIcon, { backgroundColor: '#4361EE14' }]}><Ionicons name="radio-outline" size={18} color="#4361EE" /></View>
          <View>
            <ThemedText style={[styles.eyebrow, { color: colors.text }]}>Weather network</ThemedText>
            <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Monitoring sites</ThemedText>
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.onlineBadge, { backgroundColor: isDark ? '#16805F26' : '#16805F14' }]}>
            <View style={styles.onlineDot} />
            <ThemedText style={styles.onlineText}>{activeStations.length} / {stations.length} online</ThemedText>
          </View>
          {showAddButton && onAddStation && (
            <TouchableOpacity onPress={onAddStation} style={styles.addButton} activeOpacity={0.85}>
              <Ionicons name="add" size={17} color="#FFFFFF" />
              <ThemedText style={styles.addButtonText}>Add station</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {stations.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={!isMobile}
          contentContainerStyle={styles.stationsScroll}
          {...(Platform.OS === 'web' && !isMobile && {
            style: { scrollbarWidth: 'thin', scrollbarColor: `${colors.text}25 transparent` } as any,
          })}
        >
          {[...activeStations, ...inactiveStations].map((station) => {
            const isSelected = selectedStation?.id === station.id;
            const isActive = station.isActive;
            return (
              <TouchableOpacity
                key={station.id}
                onPress={() => onSelectStation(station)}
                style={[
                  styles.stationCard,
                  {
                    backgroundColor: isSelected ? '#4361EE14' : tile,
                    borderColor: isSelected ? '#4361EE' : border,
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.stationCardTop}>
                  <View style={[styles.stationState, { backgroundColor: isActive ? '#16805F1A' : '#C67A2E1A' }]}>
                    <View style={[styles.statusDot, { backgroundColor: isActive ? '#16805F' : '#C67A2E' }]} />
                    <ThemedText style={[styles.stationStateText, { color: isActive ? '#16805F' : '#C67A2E' }]}>{isActive ? 'Online' : 'Offline'}</ThemedText>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={19} color="#4361EE" />}
                </View>
                <ThemedText style={[styles.stationName, { color: colors.text }]} numberOfLines={1}>
                  {getStationDisplayName(station.id)}
                </ThemedText>
                <ThemedText style={[styles.stationLocation, { color: colors.text, opacity: 0.62 }]} numberOfLines={1}>
                  {station.locationName || station.municipality.name}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: tile, borderColor: border }]}>
          <Ionicons name="radio-outline" size={18} color="#4361EE" />
          <ThemedText style={[styles.emptyText, { color: colors.text, opacity: 0.65 }]}>No weather stations are configured yet.</ThemedText>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  headerMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 10 },
  headingGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 12, opacity: 0.62, marginBottom: 2, fontFamily: 'Gabarito' },
  headerTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22, fontFamily: 'Gabarito' },
  headerActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  onlineBadge: { minHeight: 30, paddingHorizontal: 9, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16805F' },
  onlineText: { color: '#16805F', fontSize: 13, fontWeight: '700', fontFamily: 'Gabarito' },
  addButton: { minHeight: 34, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#164E63', flexDirection: 'row', alignItems: 'center', gap: 5 },
  addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  stationsScroll: { gap: 10, paddingTop: 14, paddingRight: 3, paddingBottom: Platform.select({ web: 5, default: 0 }) },
  stationCard: { width: 174, minHeight: 98, padding: 12, borderRadius: 10, justifyContent: 'space-between' },
  stationCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  stationState: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  stationStateText: { fontSize: 12, fontWeight: '700', fontFamily: 'Gabarito' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  stationName: { fontSize: 15, fontWeight: '700', lineHeight: 20, fontFamily: 'Gabarito' },
  stationLocation: { fontSize: 12, marginTop: 3, fontFamily: 'Gabarito' },
  emptyState: { minHeight: 54, borderWidth: 1, borderRadius: 7, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 14 },
});

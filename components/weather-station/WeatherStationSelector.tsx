import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Municipality, getMunicipalities } from '@/data/davaoOrientalData';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export interface WeatherStation {
  id: string;
  name: string;
  municipality: Municipality;
  isActive: boolean;
  lastSeen?: Date;
  // API connection status (optional, can be updated from parent)
  apiAvailable?: boolean;
}

interface WeatherStationSelectorProps {
  selectedStation: WeatherStation | null;
  onSelectStation: (station: WeatherStation) => void;
}

// Generate stations for all municipalities
// All stations are considered active by default (API will determine actual status)
export const generateStations = (): WeatherStation[] => {
  const municipalities = getMunicipalities();
  return municipalities.map((municipality) => ({
    id: `station-${municipality.id}`,
    name: `${municipality.name} Weather Station`,
    municipality,
    isActive: true, // All stations are active (API availability determines actual status)
    lastSeen: undefined, // Will be updated when data is fetched
  }));
};

export function WeatherStationSelector({
  selectedStation,
  onSelectStation,
}: WeatherStationSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [stations] = useState<WeatherStation[]>(generateStations());

  const handleSelect = (station: WeatherStation) => {
    onSelectStation(station);
    setIsModalVisible(false);
  };

  const formatLastSeen = (date: Date | undefined): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    return `${Math.floor(diffMins / 60)} hr ago`;
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selector,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.selectorContent}>
          <View style={styles.selectorLeft}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: selectedStation?.isActive
                    ? `${colors.success || '#4CAF50'}20`
                    : `${colors.error}20`,
                },
              ]}
            >
              <Ionicons
                name="location"
                size={20}
                color={
                  selectedStation?.isActive
                    ? colors.success || '#4CAF50'
                    : colors.error
                }
              />
            </View>
            <View style={styles.selectorTextContainer}>
              <ThemedText
                style={[styles.selectorLabel, { color: colors.text, opacity: 0.7 }]}
              >
                Weather Station
              </ThemedText>
              <ThemedText
                style={[styles.selectorValue, { color: colors.text }]}
                numberOfLines={1}
              >
                {selectedStation
                  ? selectedStation.municipality.name
                  : 'Select a station'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.selectorRight}>
            {selectedStation && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: selectedStation.isActive
                      ? `${colors.success || '#4CAF50'}15`
                      : `${colors.error}15`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: selectedStation.isActive
                        ? colors.success || '#4CAF50'
                        : colors.error,
                    },
                  ]}
                />
                <ThemedText
                  style={[
                    styles.statusText,
                    {
                      color: selectedStation.isActive
                        ? colors.success || '#4CAF50'
                        : colors.error,
                    },
                  ]}
                >
                  {selectedStation.isActive ? 'Active' : 'Offline'}
                </ThemedText>
              </View>
            )}
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.text}
              style={{ opacity: 0.5 }}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Station Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                maxHeight: isMobile ? '80%' : '70%',
              },
            ]}
          >
            {/* Modal Header */}
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <View>
                <ThemedText
                  style={[styles.modalTitle, { color: colors.text }]}
                >
                  Select Weather Station
                </ThemedText>
                <ThemedText
                  style={[styles.modalSubtitle, { color: colors.text, opacity: 0.7 }]}
                >
                  {stations.length} stations across Davao Oriental
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={[
                  styles.closeButton,
                  { backgroundColor: `${colors.text}10` },
                ]}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Stations List */}
            <ScrollView
              style={styles.stationsList}
              contentContainerStyle={styles.stationsListContent}
              showsVerticalScrollIndicator={true}
            >
              {stations.map((station) => {
                const isSelected = selectedStation?.id === station.id;
                return (
                  <TouchableOpacity
                    key={station.id}
                    onPress={() => handleSelect(station)}
                    style={[
                      styles.stationItem,
                      {
                        backgroundColor:
                          isSelected
                            ? `${colors.primary}10`
                            : colors.surface,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.stationItemLeft}>
                      <View
                        style={[
                          styles.stationIconContainer,
                          {
                            backgroundColor: station.isActive
                              ? `${colors.success || '#4CAF50'}20`
                              : `${colors.error}20`,
                          },
                        ]}
                      >
                        <Ionicons
                          name="partly-sunny"
                          size={24}
                          color={
                            station.isActive
                              ? colors.success || '#4CAF50'
                              : colors.error
                          }
                        />
                      </View>
                      <View style={styles.stationItemText}>
                        <ThemedText
                          style={[styles.stationName, { color: colors.text }]}
                        >
                          {station.municipality.name}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.stationType,
                            { color: colors.text, opacity: 0.6 },
                          ]}
                        >
                          {station.municipality.type === 'City'
                            ? 'City'
                            : 'Municipality'}
                          {station.lastSeen && ` • ${formatLastSeen(station.lastSeen)}`}
                          {station.apiAvailable === false && ' • API unavailable'}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.stationItemRight}>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={colors.primary}
                        />
                      )}
                      <View
                        style={[
                          styles.stationStatusDot,
                          {
                            backgroundColor: station.isActive
                              ? colors.success || '#4CAF50'
                              : colors.error,
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
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
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 13,
    marginBottom: 2,
    lineHeight: 18,
  },
  selectorValue: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  selectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    ...Platform.select({
      web: {
        justifyContent: 'center',
        alignItems: 'center',
      },
    }),
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      web: {
        borderRadius: 16,
        width: '90%',
        maxWidth: 500,
      },
      ios: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      },
      android: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      },
    }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 28,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stationsList: {
    flex: 1,
  },
  stationsListContent: {
    padding: 16,
  },
  stationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  stationItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stationItemText: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 22,
  },
  stationType: {
    fontSize: 13,
    lineHeight: 18,
  },
  stationItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stationStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});


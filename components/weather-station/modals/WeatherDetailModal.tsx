import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HistoricalDataPoint } from '../HistoricalDataView';

interface WeatherDetailModalProps {
  visible: boolean;
  onClose: () => void;
  data: HistoricalDataPoint[];
  loading?: boolean;
}

type SortOption = 'time-asc' | 'time-desc' | 'temp-desc' | 'rainfall-desc';

export function WeatherDetailModal({ visible, onClose, data, loading }: WeatherDetailModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  const [sortOption, setSortOption] = useState<SortOption>('time-desc');

  const sortData = (dataToSort: HistoricalDataPoint[]): HistoricalDataPoint[] => {
    const sorted = [...dataToSort];
    
    switch (sortOption) {
      case 'time-asc':
        return sorted.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      case 'time-desc':
        return sorted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      case 'temp-desc':
        return sorted.sort((a, b) => b.temperature - a.temperature);
      case 'rainfall-desc':
        return sorted.sort((a, b) => b.rainfall - a.rainfall);
      default:
        return sorted;
    }
  };

  const sortedData = sortData(data);

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'time-desc', label: 'Newest First' },
    { value: 'time-asc', label: 'Oldest First' },
    { value: 'temp-desc', label: 'Highest Temp' },
    { value: 'rainfall-desc', label: 'Most Rainfall' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.surface,
              maxHeight: isMobile ? '90%' : '85%',
              width: isMobile ? '100%' : '80%',
              maxWidth: 800,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
                Weather Data Details
              </ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: colors.text, opacity: 0.7 }]}>
                {data.length} data points
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: `${colors.text}10` }]}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <ThemedText style={[styles.sortLabel, { color: colors.text, opacity: 0.7 }]}>
              Sort by:
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sortOptions}
              contentContainerStyle={styles.sortOptionsContent}
            >
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setSortOption(option.value)}
                  style={[
                    styles.sortButton,
                    {
                      backgroundColor:
                        sortOption === option.value
                          ? colors.primary
                          : `${colors.primary}15`,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.sortButtonText,
                      {
                        color: sortOption === option.value ? '#FFFFFF' : colors.primary,
                      },
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Data List */}
          <ScrollView
            style={styles.dataList}
            contentContainerStyle={styles.dataListContent}
            showsVerticalScrollIndicator={true}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText style={[styles.loadingText, { color: colors.text, opacity: 0.7 }]}>
                  Loading data...
                </ThemedText>
              </View>
            ) : sortedData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-outline" size={48} color={colors.text} style={{ opacity: 0.3 }} />
                <ThemedText style={[styles.emptyText, { color: colors.text, opacity: 0.5 }]}>
                  No data available
                </ThemedText>
              </View>
            ) : (
              sortedData.map((point, index) => (
                <View
                  key={index}
                  style={[
                    styles.dataRow,
                    {
                      backgroundColor: index % 2 === 0 ? 'transparent' : `${colors.primary}05`,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.dataRowLeft}>
                    <ThemedText style={[styles.dataTime, { color: colors.text }]}>
                      {formatDateTime(point.timestamp)}
                    </ThemedText>
                  </View>
                  <View style={styles.dataRowRight}>
                    <View style={styles.dataMetric}>
                      <Ionicons name="thermometer" size={16} color="#F44336" />
                      <ThemedText style={[styles.dataValue, { color: colors.text }]}>
                        {point.temperature.toFixed(1)}°C
                      </ThemedText>
                    </View>
                    <View style={styles.dataMetric}>
                      <Ionicons name="water" size={16} color="#2196F3" />
                      <ThemedText style={[styles.dataValue, { color: colors.text }]}>
                        {point.humidity.toFixed(0)}%
                      </ThemedText>
                    </View>
                    <View style={styles.dataMetric}>
                      <Ionicons name="rainy" size={16} color="#00BCD4" />
                      <ThemedText style={[styles.dataValue, { color: colors.text }]}>
                        {point.rainfall.toFixed(1)}mm
                      </ThemedText>
                    </View>
                    <View style={styles.dataMetric}>
                      <Ionicons name="flag" size={16} color="#4CAF50" />
                      <ThemedText style={[styles.dataValue, { color: colors.text }]}>
                        {point.windSpeed.toFixed(1)}km/h
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        padding: 20,
      },
    }),
  },
  modalContent: {
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortContainer: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  sortLabel: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  sortOptions: {
    marginTop: 4,
  },
  sortOptionsContent: {
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dataList: {
    flex: 1,
  },
  dataListContent: {
    padding: 16,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    marginBottom: 4,
  },
  dataRowLeft: {
    flex: 1,
  },
  dataTime: {
    fontSize: 13,
    fontWeight: '600',
  },
  dataRowRight: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  dataMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dataValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
});


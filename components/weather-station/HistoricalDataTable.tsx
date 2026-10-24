import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { fetchAllHistoricalWeatherFromFirebase, subscribeToHistoricalWeatherUpdates } from '@/services/weatherApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HistoricalDataPoint } from './HistoricalDataView';
import { ExportHistoricalDataModal } from './modals/ExportHistoricalDataModal';
import { exportHistoricalWeatherToExcel } from './utils/exportHistoricalWeatherToExcel';
import { filterHistoricalDataByDateRange } from './utils/filterHistoricalDataByDateRange';
import { degreesToCardinal } from './WeatherMetrics';

interface HistoricalDataTableProps {
  data?: HistoricalDataPoint[]; // Optional now, will fetch from Firebase if not provided
  loading?: boolean;
  municipalityName?: string; // Municipality name for device_id filtering when fetching from Firebase
  stationName?: string;
  onRefresh?: () => void;
  hideExport?: boolean; // public pages don't offer data export
}

export function HistoricalDataTable({ 
  data: propData, 
  loading: propLoading,
  municipalityName,
  stationName,
  onRefresh,
  hideExport = false,
}: HistoricalDataTableProps) {
  const colorScheme = useColorScheme();
  // dashboard card tokens
  const colors = { ...Colors[colorScheme ?? 'light'], surface: colorScheme === 'dark' ? '#171A21' : '#FFFFFF', border: colorScheme === 'dark' ? '#2A2F3A' : '#EAECF0' };
  const headBg = colorScheme === 'dark' ? '#1E222B' : '#F7F8FA';
  const { isMobile } = useScreenSize();
  const [currentPage, setCurrentPage] = useState(1);
  const [firebaseData, setFirebaseData] = useState<HistoricalDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(!propData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const itemsPerPage = isMobile ? 10 : 15;

  // Use ref to store the latest onRefresh callback to avoid stale closures
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // Fetch data from Firebase (for manual refresh)
  const fetchDataFromFirebase = useCallback(async (isRefresh: boolean = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Fetch data filtered by municipality/device_id if provided
      const weatherData = await fetchAllHistoricalWeatherFromFirebase(municipalityName);
      
      // Transform to HistoricalDataPoint format
      const historicalData: HistoricalDataPoint[] = weatherData.map(w => ({
        timestamp: w.timestamp,
        temperature: w.temperature,
        humidity: w.humidity,
        rainfall: w.rainfall,
        windSpeed: w.windSpeed,
        windDirection: w.windDirection || 0,
      }));

      setFirebaseData(historicalData);
      } catch (error) {
        // Error fetching historical data from Firebase
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [municipalityName]);

  // Set up real-time listener if propData is not provided
  useEffect(() => {
    if (!propData && municipalityName) {
      // Initial fetch
      fetchDataFromFirebase();
      
      // Set up real-time listener for automatic updates
      const unsubscribe = subscribeToHistoricalWeatherUpdates(
        municipalityName,
        (weatherData) => {
          // Transform to HistoricalDataPoint format
          const historicalData: HistoricalDataPoint[] = weatherData.map(w => ({
            timestamp: w.timestamp,
            temperature: w.temperature,
            humidity: w.humidity,
            rainfall: w.rainfall,
            windSpeed: w.windSpeed,
            windDirection: w.windDirection || 0,
          }));
          
          setFirebaseData(historicalData);
          // Real-time update received
        },
        (error) => {
          // Real-time listener error
        }
      );
      
      return () => {
        unsubscribe();
      };
    }
  }, [propData, municipalityName, fetchDataFromFirebase]);

  // Create a combined refresh handler (for manual refresh)
  const handleRefresh = useCallback(() => {
    // Call the original onRefresh if provided
    if (onRefreshRef.current) {
      onRefreshRef.current();
    }
    // Always fetch from Firebase if propData is not provided (manual refresh)
    if (!propData) {
      fetchDataFromFirebase(true);
    }
  }, [propData, fetchDataFromFirebase]);

  // Note: Real-time updates are handled by the subscription in the useEffect above
  // No need for polling intervals - the listener automatically detects new data

  // Use propData if provided, otherwise use firebaseData
  const data = propData || firebaseData;
  const loading = propLoading !== undefined ? propLoading : isLoading;

  // Sort data by newest first (no filtering, just display all data)
  const sortedData = [...data].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Calculate pagination
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);
  const showingCount = paginatedData.length;
  const startCount = startIndex + 1;
  const endCount = startIndex + showingCount;

  // Reset to page 1 if current page is out of bounds
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Reset to page 1 when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleExport = useCallback(
    async (start: Date, end: Date) => {
      if (sortedData.length === 0 || isExporting) {
        return;
      }

      setIsExporting(true);
      try {
        const filtered = filterHistoricalDataByDateRange(sortedData, start, end);
        await exportHistoricalWeatherToExcel(filtered, stationName, { start, end });
        setShowExportModal(false);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to export historical data';
        Alert.alert('Export failed', message);
      } finally {
        setIsExporting(false);
      }
    },
    [sortedData, stationName, isExporting]
  );

  const canExport = sortedData.length > 0;

  const renderExportModal = () => (
    <ExportHistoricalDataModal
      visible={showExportModal}
      onClose={() => setShowExportModal(false)}
      data={sortedData}
      stationName={stationName}
      isExporting={isExporting}
      onExport={handleExport}
    />
  );

  const renderExportButton = (compact = false) => hideExport ? null : (
    <TouchableOpacity
      style={[
        compact ? styles.exportButtonMobile : styles.exportButton,
        {
          backgroundColor: canExport ? '#164E63' : `${colors.text}08`,
          borderColor: canExport ? '#164E63' : colors.border,
          opacity: canExport ? 1 : 0.5,
        },
      ]}
      onPress={() => setShowExportModal(true)}
      disabled={!canExport}
    >
      <Ionicons
        name="download-outline"
        size={compact ? 16 : 18}
        color={canExport ? '#FFFFFF' : colors.text}
      />
      <ThemedText
        style={[
          compact ? styles.exportButtonTextMobile : styles.exportButtonText,
          { color: canExport ? '#FFFFFF' : colors.text },
        ]}
      >
        Export Excel
      </ThemedText>
    </TouchableOpacity>
  );

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage <= 3) {
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading && !isRefreshing) {
    return (
      <ThemedView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.text} style={{ opacity: 0.3 }} />
          <ThemedText style={[styles.loadingText, { color: colors.text, opacity: 0.7 }]}>
            Loading historical data from Firebase...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Check if we have no data
  const hasNoData = data.length === 0 && !loading;

  if (hasNoData) {
    return (
      <ThemedView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.text} style={{ opacity: 0.3 }} />
          <ThemedText style={[styles.emptyText, { color: colors.text, opacity: 0.5 }]}>
            No historical data available
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (isMobile) {
    return (
      <ThemedView style={[styles.card, styles.cardMobile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Header */}
        <View style={styles.headerSectionMobile}>
          <View style={styles.titleContainerMobile}>
            <View style={styles.titleRowMobile}>
              <View style={[styles.iconContainerMobile, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="time" size={18} color={colors.primary} />
              </View>
              <View style={styles.titleContentMobile}>
                <ThemedText style={[styles.historyEyebrow, { color: colors.text }]}>Observation archive</ThemedText>
                <ThemedText style={[styles.sectionTitleMobile, { color: colors.text }]}>
                  Station history
                </ThemedText>
                <ThemedText style={[styles.recordCountMobile, { color: colors.text, opacity: 0.6 }]}>
                  {stationName || municipalityName || 'Selected station'} · {totalItems} records
            </ThemedText>
          </View>
            </View>
          </View>
          {renderExportButton(true)}
        </View>

        {/* Compact Data List */}
        <ScrollView style={styles.scrollViewMobile} showsVerticalScrollIndicator={false}>
          {paginatedData.map((point, index) => {
            const isToday = new Date(point.timestamp).toDateString() === new Date().toDateString();
            const showDateHeader = index === 0 || 
              formatDate(paginatedData[index - 1].timestamp) !== formatDate(point.timestamp);
            
            return (
              <View
                key={index}
                style={[
                  styles.mobileItemCompact,
                  { 
                    borderColor: colors.border,
                    backgroundColor: index % 2 === 0 ? 'transparent' : `${colors.primary}02`,
                  },
                ]}
              >
                {/* Compact Date Header */}
                {showDateHeader && (
                  <View style={[styles.dateHeaderCompact, { backgroundColor: `${colors.primary}08` }]}>
                    <ThemedText style={[styles.dateHeaderTextCompact, { color: colors.primary }]}>
                      {isToday ? 'Today' : formatDate(point.timestamp)}
                    </ThemedText>
                  </View>
                )}

                {/* Compact Row Layout */}
                <View style={styles.mobileRowCompact}>
                  {/* Time Column */}
                  <View style={styles.timeColumn}>
                    <Ionicons name="time-outline" size={13} color={colors.primary} />
                    <ThemedText style={[styles.timeTextCompact, { color: colors.text, opacity: 0.9 }]}>
                      {point.timestamp.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </ThemedText>
                  </View>

                  {/* Metrics Row - Compact */}
                  <View style={styles.metricsRowCompact}>
                    <View style={[styles.metricCompact, { backgroundColor: colorScheme === 'dark' ? '#18242D' : '#F5F8F8' }]}>
                      <ThemedText style={[styles.metricLabelCompact, { color: colors.text, opacity: 0.55 }]}>TEMP</ThemedText>
                      <Ionicons name="thermometer" size={14} color="#F44336" />
                      <ThemedText style={[styles.metricTextCompact, { color: colors.text }]}>
                        {point.temperature.toFixed(1)}°C
                      </ThemedText>
                    </View>

                    <View style={[styles.metricCompact, { backgroundColor: colorScheme === 'dark' ? '#18242D' : '#F5F8F8' }]}>
                      <ThemedText style={[styles.metricLabelCompact, { color: colors.text, opacity: 0.55 }]}>HUMIDITY</ThemedText>
                      <Ionicons name="water" size={14} color="#2196F3" />
                      <ThemedText style={[styles.metricTextCompact, { color: colors.text }]}>
                        {point.humidity.toFixed(0)}%
                      </ThemedText>
                    </View>

                    <View style={[styles.metricCompact, { backgroundColor: colorScheme === 'dark' ? '#18242D' : '#F5F8F8' }]}>
                      <ThemedText style={[styles.metricLabelCompact, { color: colors.text, opacity: 0.55 }]}>RAINFALL</ThemedText>
                      <Ionicons name="rainy" size={14} color="#00BCD4" />
                      <ThemedText style={[styles.metricTextCompact, { color: colors.text }]}>
                        {point.rainfall.toFixed(1)} mm
                      </ThemedText>
                    </View>

                    <View style={[styles.metricCompact, { backgroundColor: colorScheme === 'dark' ? '#18242D' : '#F5F8F8' }]}>
                      <ThemedText style={[styles.metricLabelCompact, { color: colors.text, opacity: 0.55 }]}>WIND SPEED</ThemedText>
                      <Ionicons name="flag" size={14} color={colors.success || '#4CAF50'} />
                      <ThemedText style={[styles.metricTextCompact, { color: colors.text }]}>
                        {point.windSpeed.toFixed(0)} km/h
                      </ThemedText>
                    </View>

                    <View style={[styles.metricCompact, { backgroundColor: colorScheme === 'dark' ? '#18242D' : '#F5F8F8' }]}>
                      <ThemedText style={[styles.metricLabelCompact, { color: colors.text, opacity: 0.55 }]}>WIND DIR.</ThemedText>
                      <Ionicons name="compass" size={14} color="#FF9800" />
                      <ThemedText style={[styles.metricTextCompact, { color: colors.text }]}>
                        {degreesToCardinal(point.windDirection || 0)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Compact Pagination Footer */}
        {totalPages > 1 && (
          <View style={[styles.paginationFooterMobile, { borderTopColor: colors.border }]}>
            <ThemedText style={[styles.paginationCounterTextMobile, { color: colors.text, opacity: 0.7 }]}>
              {startCount}-{endCount} of {totalItems}
            </ThemedText>
            <View style={styles.paginationControlsMobile}>
              <TouchableOpacity
                style={[
                  styles.paginationButtonMobile,
                  {
                    backgroundColor: currentPage === 1 ? 'transparent' : '#EAF2F0',
                    opacity: currentPage === 1 ? 0.4 : 1,
                  },
                ]}
                onPress={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color="#164E63"
                />
              </TouchableOpacity>

              <ThemedText style={[styles.paginationPageTextMobile, { color: colors.text }]}>
                {currentPage} / {totalPages}
              </ThemedText>

              <TouchableOpacity
                style={[
                  styles.paginationButtonMobile,
                  {
                    backgroundColor: currentPage === totalPages ? 'transparent' : '#EAF2F0',
                    opacity: currentPage === totalPages ? 0.4 : 1,
                  },
                ]}
                onPress={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#164E63"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
        {renderExportModal()}
      </ThemedView>
    );
  }

  // Desktop view
  return (
    <ThemedView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="time" size={20} color={colors.primary} />
          </View>
          <View style={styles.titleContent}>
            <ThemedText style={[styles.historyEyebrow, { color: colors.text }]}>Observation archive</ThemedText>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Station history
            </ThemedText>
            <ThemedText style={[styles.recordCount, { color: colors.text, opacity: 0.6 }]}>
            {stationName || municipalityName || 'Selected station'} · {totalItems} records
          </ThemedText>
          </View>
        </View>
        {renderExportButton()}
      </View>

      {/* Table */}
      <View style={[styles.tableContainer, { borderColor: colors.border }]}>
        {/* Table Header */}
        <View style={[styles.tableHeader, { borderBottomColor: colors.border, backgroundColor: headBg }]}>
          <View style={[styles.tableHeaderCell, styles.tableHeaderCellTime]}>
            <Ionicons name="time-outline" size={14} color={colors.text} style={{ marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text, opacity: 0.7 }]}>
              Date & Time
            </ThemedText>
          </View>
          <View style={styles.tableHeaderCell}>
            <Ionicons name="thermometer-outline" size={14} color={colors.text} style={{ marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text, opacity: 0.7 }]}>
              Temperature
            </ThemedText>
          </View>
          <View style={styles.tableHeaderCell}>
            <Ionicons name="water-outline" size={14} color={colors.text} style={{ marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text, opacity: 0.7 }]}>
              Humidity
            </ThemedText>
          </View>
          <View style={styles.tableHeaderCell}>
            <Ionicons name="rainy-outline" size={14} color={colors.text} style={{ marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text, opacity: 0.7 }]}>
              Rainfall
            </ThemedText>
          </View>
          <View style={styles.tableHeaderCell}>
            <Ionicons name="flag-outline" size={14} color={colors.text} style={{ marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text, opacity: 0.7 }]}>
              Wind Speed
            </ThemedText>
          </View>
          <View style={styles.tableHeaderCell}>
            <Ionicons name="compass-outline" size={14} color={colors.text} style={{ marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text, opacity: 0.7 }]}>
              Wind Direction
            </ThemedText>
          </View>
        </View>

        {/* Table Body */}
        <ScrollView
          style={styles.tableBodyScroll}
          contentContainerStyle={styles.tableBodyContent}
          showsVerticalScrollIndicator={true}
        >
          {paginatedData.map((point, index) => {
            const isToday = new Date(point.timestamp).toDateString() === new Date().toDateString();
            
            return (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  {
                    borderBottomColor: colors.border,
                    backgroundColor: index % 2 === 0 ? 'transparent' : `${colors.primary}02`,
                  },
                ]}
              >
                <View style={[styles.tableCell, styles.tableCellTime]}>
                  <View>
                    <ThemedText style={[styles.tableCellText, { color: colors.text }]}>
                      {formatDateTime(point.timestamp)}
                    </ThemedText>
                    {isToday && (
                      <ThemedText style={[styles.todayBadge, { color: colors.primary }]}>
                        Today
                      </ThemedText>
                    )}
                  </View>
                </View>
                <View style={styles.tableCell}>
                  <View style={[styles.metricCell, { backgroundColor: `${colors.error}10` }]}>
                    <Ionicons name="thermometer" size={14} color="#F44336" />
                    <ThemedText style={[styles.tableCellText, { color: colors.text }]}>
                      {point.temperature.toFixed(1)}°C
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.tableCell}>
                  <View style={[styles.metricCell, { backgroundColor: `${colors.primary}10` }]}>
                    <Ionicons name="water" size={14} color="#2196F3" />
                    <ThemedText style={[styles.tableCellText, { color: colors.text }]}>
                      {point.humidity.toFixed(0)}%
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.tableCell}>
                  <View style={[styles.metricCell, { backgroundColor: '#00BCD410' }]}>
                    <Ionicons name="rainy" size={14} color="#00BCD4" />
                    <ThemedText style={[styles.tableCellText, { color: colors.text }]}>
                      {point.rainfall.toFixed(1)} mm
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.tableCell}>
                  <View style={[styles.metricCell, { backgroundColor: `${colors.success || '#4CAF50'}10` }]}>
                    <Ionicons name="flag" size={14} color={colors.success || '#4CAF50'} />
                    <ThemedText style={[styles.tableCellText, { color: colors.text }]}>
                      {point.windSpeed.toFixed(1)} km/h
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.tableCell}>
                  <View style={[styles.metricCell, { backgroundColor: '#FF980010' }]}>
                    <Ionicons name="compass" size={14} color="#FF9800" />
                    <ThemedText style={[styles.tableCellText, { color: colors.text }]}>
                      {degreesToCardinal(point.windDirection || 0)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <View style={[styles.paginationFooter, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.paginationCounter}>
            <ThemedText style={[styles.paginationCounterText, { color: colors.text }]}>
              {showingCount > 0 ? `${startCount}-${endCount}` : '0'} of {totalItems}
            </ThemedText>
          </View>
          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                {
                  backgroundColor: currentPage === 1 ? 'transparent' : '#EAF2F0',
                  borderColor: colors.border,
                  opacity: currentPage === 1 ? 0.5 : 1,
                },
              ]}
              onPress={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Ionicons
                name="chevron-back"
                size={16}
                color={currentPage === 1 ? colors.text : '#164E63'}
              />
            </TouchableOpacity>

            {getPageNumbers().map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <View key={`ellipsis-${index}`} style={styles.paginationEllipsis}>
                    <ThemedText style={[styles.paginationEllipsisText, { color: colors.text }]}>
                      ...
                    </ThemedText>
                  </View>
                );
              }

              const isActive = page === currentPage;
              return (
                <TouchableOpacity
                  key={page}
                  style={[
                    styles.paginationPageButton,
                    {
                      backgroundColor: isActive ? '#164E63' : 'transparent',
                      borderColor: isActive ? '#164E63' : colors.border,
                    },
                  ]}
                  onPress={() => handlePageChange(page as number)}
                >
                  <ThemedText
                    style={[
                      styles.paginationPageButtonText,
                      {
                        color: isActive ? '#FFFFFF' : colors.text,
                        fontWeight: isActive ? '700' : '500',
                      },
                    ]}
                  >
                    {page}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[
                styles.paginationButton,
                {
                  backgroundColor: currentPage === totalPages ? 'transparent' : '#EAF2F0',
                  borderColor: colors.border,
                  opacity: currentPage === totalPages ? 0.5 : 1,
                },
              ]}
              onPress={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Ionicons
                name="chevron-forward"
                size={16}
                color={currentPage === totalPages ? colors.text : '#164E63'}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
      {renderExportModal()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 15,
  },
  cardMobile: {
    padding: 12,
    marginBottom: 12,
  },
  headerSectionMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  titleContentMobile: {
    flex: 1,
    minWidth: 0,
  },
  titleContainerMobile: {
    flex: 1,
  },
  titleRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainerMobile: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordCountMobile: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    lineHeight: 16,
    marginTop: 2,
  },
  historyEyebrow: { fontSize: 12, fontFamily: 'Gabarito', opacity: 0.62, lineHeight: 16, marginBottom: 2 },
  sectionTitleMobile: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Gabarito',
    lineHeight: 21,
  },
  titleContent: {
    flex: 1,
  },
  recordCount: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    lineHeight: 16,
    marginTop: 2,
  },
  scrollViewMobile: {
    maxHeight: 400,
  },
  mobileItemCompact: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  dateHeaderCompact: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  dateHeaderTextCompact: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  mobileRowCompact: {
    gap: 8,
  },
  timeColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeTextCompact: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  metricsRowCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metricCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    width: '31%',
    minHeight: 48,
    justifyContent: 'space-around',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 5,
  },
  metricLabelCompact: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  metricTextCompact: {
    fontSize: 14, // Body
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  paginationFooterMobile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 4,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  paginationCounterTextMobile: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  paginationControlsMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paginationButtonMobile: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationPageTextMobile: {
    fontSize: 14, // Body
    fontWeight: '600',
    fontFamily: 'Gabarito',
    minWidth: 40,
    textAlign: 'center',
    lineHeight: 20,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E9E9',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Gabarito',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14, // Body
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14, // Body
    textAlign: 'center',
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  mobileItem: {
    padding: 16,
    borderBottomWidth: 1,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  lastItem: {
    marginBottom: 0,
    borderBottomWidth: 1,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  dateHeaderText: {
    fontSize: 14, // Small
    fontWeight: '700',
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  mobileItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mobileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mobileLabel: {
    fontSize: 14, // Body
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  mobileValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 20, // H3
    fontWeight: '700',
    fontFamily: 'Gabarito',
    lineHeight: 24,
  },
  metricLabel: {
    fontSize: 14, // Small
    fontFamily: 'Gabarito',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 7,
    overflow: 'hidden',
    flex: 1,
    minHeight: 400,
  },
  tableBodyScroll: {
    flex: 1,
  },
  tableBodyContent: {
    flexGrow: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tableHeaderCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableHeaderCellTime: {
    flex: 1.5,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.55,
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderBottomWidth: 1,
    alignItems: 'center',
    minHeight: 48,
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  tableCellTime: {
    flex: 1.5,
  },
  tableCellText: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  todayBadge: {
    fontSize: 14, // Small
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  metricCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
  },
  paginationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  paginationCounter: {
    flex: 1,
  },
  paginationCounterText: {
    fontSize: 14, // Body
    fontFamily: 'Gabarito',
    opacity: 0.7,
    lineHeight: 20,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationPageButton: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationPageButtonText: {
    fontSize: 14, // Body
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  paginationEllipsis: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationEllipsisText: {
    fontSize: 14, // Body
    fontFamily: 'Gabarito',
    opacity: 0.5,
    lineHeight: 20,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  exportButtonMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  exportButtonTextMobile: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 18,
  },
});


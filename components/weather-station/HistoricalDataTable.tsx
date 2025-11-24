import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HistoricalDataPoint } from './HistoricalDataView';

interface HistoricalDataTableProps {
  data: HistoricalDataPoint[];
  loading?: boolean;
  selectedRange?: '1h' | '6h' | '24h' | '7d';
  onRangeChange?: (range: '1h' | '6h' | '24h' | '7d') => void;
  timeRanges?: { value: '1h' | '6h' | '24h' | '7d'; label: string }[];
}

export function HistoricalDataTable({ 
  data, 
  loading,
  selectedRange = '24h',
  onRangeChange,
  timeRanges = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
  ],
}: HistoricalDataTableProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isMobile ? 10 : 15;

  // Sort by newest first (default)
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

  if (loading) {
    return (
      <ThemedView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.text} style={{ opacity: 0.3 }} />
          <ThemedText style={[styles.loadingText, { color: colors.text, opacity: 0.7 }]}>
            Loading historical data...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (data.length === 0) {
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
              <View>
                <ThemedText style={[styles.sectionTitleMobile, { color: colors.text }]}>
                  Historical Data
                </ThemedText>
                <ThemedText style={[styles.recordCountMobile, { color: colors.text, opacity: 0.6 }]}>
                  {totalItems} records
                </ThemedText>
              </View>
            </View>
          </View>
          
          {/* Time Range Selector */}
          <View style={styles.controlsContainerMobile}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.rangeSelectorMobile}
              contentContainerStyle={styles.rangeSelectorContentMobile}
            >
              {timeRanges.map((range) => (
                <TouchableOpacity
                  key={range.value}
                  onPress={() => onRangeChange?.(range.value)}
                  style={[
                    styles.rangeButtonMobile,
                    {
                      backgroundColor: selectedRange === range.value
                        ? colors.primary
                        : `${colors.primary}15`,
                      borderColor: colors.border,
                    }
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.rangeButtonTextMobile,
                      {
                        color: selectedRange === range.value ? '#FFFFFF' : colors.primary,
                      }
                    ]}
                  >
                    {range.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
                    <ThemedText style={[styles.timeTextCompact, { color: colors.text, opacity: 0.9 }]}>
                      {point.timestamp.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </ThemedText>
                  </View>

                  {/* Metrics Row - Compact */}
                  <View style={styles.metricsRowCompact}>
                    <View style={styles.metricCompact}>
                      <Ionicons name="thermometer" size={14} color="#F44336" />
                      <ThemedText style={[styles.metricTextCompact, { color: colors.text }]}>
                        {point.temperature.toFixed(1)}°
                      </ThemedText>
                    </View>

                    <View style={styles.metricCompact}>
                      <Ionicons name="water" size={14} color="#2196F3" />
                      <ThemedText style={[styles.metricTextCompact, { color: colors.text }]}>
                        {point.humidity.toFixed(0)}%
                      </ThemedText>
                    </View>

                    <View style={styles.metricCompact}>
                      <Ionicons name="rainy" size={14} color="#00BCD4" />
                      <ThemedText style={[styles.metricTextCompact, { color: colors.text }]}>
                        {point.rainfall.toFixed(1)}
                      </ThemedText>
                    </View>

                    <View style={styles.metricCompact}>
                      <Ionicons name="flag" size={14} color={colors.success || '#4CAF50'} />
                      <ThemedText style={[styles.metricTextCompact, { color: colors.text }]}>
                        {point.windSpeed.toFixed(0)}
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
                    backgroundColor: currentPage === 1 ? 'transparent' : `${colors.primary}15`,
                    opacity: currentPage === 1 ? 0.4 : 1,
                  },
                ]}
                onPress={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>

              <ThemedText style={[styles.paginationPageTextMobile, { color: colors.text }]}>
                {currentPage} / {totalPages}
              </ThemedText>

              <TouchableOpacity
                style={[
                  styles.paginationButtonMobile,
                  {
                    backgroundColor: currentPage === totalPages ? 'transparent' : `${colors.primary}15`,
                    opacity: currentPage === totalPages ? 0.4 : 1,
                  },
                ]}
                onPress={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
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
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Historical Data
            </ThemedText>
            <ThemedText style={[styles.recordCount, { color: colors.text, opacity: 0.6 }]}>
              {totalItems} records
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Time Range Selector */}
      <View style={[styles.controlsContainer, { borderBottomColor: colors.border }]}>
        <View style={styles.rangeSelectorContainer}>
          <Ionicons name="time-outline" size={16} color={colors.text} style={{ opacity: 0.7, marginRight: 8 }} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rangeSelector}
            contentContainerStyle={styles.rangeSelectorContent}
          >
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range.value}
                onPress={() => onRangeChange?.(range.value)}
                style={[
                  styles.rangeButton,
                  {
                    backgroundColor: selectedRange === range.value
                      ? colors.primary
                      : `${colors.primary}15`,
                    borderColor: colors.border,
                  }
                ]}
              >
                <ThemedText
                  style={[
                    styles.rangeButtonText,
                    {
                      color: selectedRange === range.value ? '#FFFFFF' : colors.primary,
                    }
                  ]}
                >
                  {range.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Table */}
      <View style={[styles.tableContainer, { borderColor: colors.border }]}>
        {/* Table Header */}
        <View style={[styles.tableHeader, { borderBottomColor: colors.border, backgroundColor: `${colors.primary}05` }]}>
          <View style={[styles.tableHeaderCell, styles.tableHeaderCellTime]}>
            <Ionicons name="time-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
              Date & Time
            </ThemedText>
          </View>
          <View style={styles.tableHeaderCell}>
            <Ionicons name="thermometer-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
              Temperature
            </ThemedText>
          </View>
          <View style={styles.tableHeaderCell}>
            <Ionicons name="water-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
              Humidity
            </ThemedText>
          </View>
          <View style={styles.tableHeaderCell}>
            <Ionicons name="rainy-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
              Rainfall
            </ThemedText>
          </View>
          <View style={styles.tableHeaderCell}>
            <Ionicons name="flag-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
              Wind Speed
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
                  backgroundColor: currentPage === 1 ? 'transparent' : `${colors.primary}20`,
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
                color={currentPage === 1 ? colors.text : colors.primary}
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
                      backgroundColor: isActive ? colors.primary : 'transparent',
                      borderColor: isActive ? colors.primary : colors.border,
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
                  backgroundColor: currentPage === totalPages ? 'transparent' : `${colors.primary}20`,
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
                color={currentPage === totalPages ? colors.text : colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  cardMobile: {
    padding: 12,
    marginBottom: 12,
  },
  headerSectionMobile: {
    marginBottom: 16,
  },
  titleContainerMobile: {
    marginBottom: 12,
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
    fontSize: 12,
    fontFamily: 'Gabarito',
    lineHeight: 16,
    marginTop: 2,
  },
  controlsContainerMobile: {
    gap: 10,
  },
  rangeSelectorMobile: {
    marginBottom: 0,
  },
  rangeSelectorContentMobile: {
    gap: 6,
    paddingRight: 4,
  },
  rangeButtonMobile: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rangeButtonTextMobile: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  sectionTitleMobile: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    lineHeight: 22,
  },
  titleContent: {
    flex: 1,
  },
  recordCount: {
    fontSize: 13,
    fontFamily: 'Gabarito',
    lineHeight: 18,
    marginTop: 2,
  },
  controlsContainer: {
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  rangeSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeSelector: {
    flex: 1,
  },
  rangeSelectorContent: {
    gap: 8,
    paddingRight: 4,
  },
  rangeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rangeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 18,
  },
  scrollViewMobile: {
    maxHeight: 400,
  },
  mobileItemCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateHeaderCompact: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  dateHeaderTextCompact: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  mobileRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeColumn: {
    minWidth: 50,
  },
  timeTextCompact: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 18,
  },
  metricsRowCompact: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 8,
  },
  metricCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  metricTextCompact: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 18,
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
    fontSize: 12,
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
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    minWidth: 40,
    textAlign: 'center',
    lineHeight: 18,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
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
    fontWeight: '700',
    fontFamily: 'Gabarito',
    lineHeight: 28,
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
    fontSize: 14,
    fontFamily: 'Gabarito',
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
    fontFamily: 'Gabarito',
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
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Gabarito',
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
    fontSize: 13,
    fontFamily: 'Gabarito',
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
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Gabarito',
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: 'Gabarito',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 8,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
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
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'Gabarito',
    opacity: 0.8,
    lineHeight: 18,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
    minHeight: 56,
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
    lineHeight: 20,
  },
  todayBadge: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'Gabarito',
    lineHeight: 14,
  },
  metricCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
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
    fontSize: 13,
    fontFamily: 'Gabarito',
    opacity: 0.7,
    lineHeight: 18,
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
    fontSize: 13,
    fontFamily: 'Gabarito',
    lineHeight: 18,
  },
  paginationEllipsis: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationEllipsisText: {
    fontSize: 13,
    fontFamily: 'Gabarito',
    opacity: 0.5,
    lineHeight: 18,
  },
});


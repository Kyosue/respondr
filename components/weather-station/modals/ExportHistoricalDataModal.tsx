import { ThemedText } from '@/components/ThemedText';
import { FormDatePicker } from '@/components/ui/FormComponents';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HistoricalDataPoint } from '../HistoricalDataView';
import {
  clampDateToBounds,
  filterHistoricalDataByDateRange,
  getDataDateBounds,
  startOfDay,
} from '../utils/filterHistoricalDataByDateRange';

interface ExportHistoricalDataModalProps {
  visible: boolean;
  onClose: () => void;
  data: HistoricalDataPoint[];
  stationName?: string;
  isExporting: boolean;
  onExport: (start: Date, end: Date) => void;
}

export function ExportHistoricalDataModal({
  visible,
  onClose,
  data,
  stationName,
  isExporting,
  onExport,
}: ExportHistoricalDataModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  const bounds = useMemo(() => getDataDateBounds(data), [data]);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date>(() => startOfDay(new Date()));

  useEffect(() => {
    if (visible) {
      setStartDate(null);
      setEndDate(startOfDay(new Date()));
    }
  }, [visible]);

  const hasStartDate = startDate !== null;

  const isValidRange =
    hasStartDate &&
    bounds !== null &&
    startOfDay(startDate).getTime() <= startOfDay(endDate).getTime();

  const filteredCount = useMemo(() => {
    if (!isValidRange || !startDate) {
      return 0;
    }
    return filterHistoricalDataByDateRange(data, startDate, endDate).length;
  }, [data, startDate, endDate, isValidRange]);

  const handleStartChange = (date: Date) => {
    if (!bounds) {
      return;
    }

    let next = clampDateToBounds(date, bounds.min, bounds.max);
    if (next.getTime() > startOfDay(endDate).getTime()) {
      next = startOfDay(endDate);
    }
    setStartDate(next);
  };

  const handleEndChange = (date: Date) => {
    let next = startOfDay(date);
    if (startDate && next.getTime() < startOfDay(startDate).getTime()) {
      next = startOfDay(startDate);
    }
    setEndDate(next);
  };

  const canExport = isValidRange && filteredCount > 0 && !isExporting && startDate !== null;

  const summaryText = !hasStartDate
    ? 'Select a start date to preview how many records will be exported.'
    : filteredCount === 0
      ? 'No records found in the selected date range.'
      : `${filteredCount} record${filteredCount === 1 ? '' : 's'} will be exported to Excel.`;

  const summaryTone: 'info' | 'error' | 'success' = !hasStartDate
    ? 'info'
    : !isValidRange || filteredCount === 0
      ? 'error'
      : 'success';

  const summaryColors = {
    info: {
      background: `${colors.primary}10`,
      border: `${colors.primary}25`,
      icon: colors.primary,
      text: colors.text,
    },
    error: {
      background: `${colors.error}10`,
      border: `${colors.error}25`,
      icon: colors.error,
      text: colors.error,
    },
    success: {
      background: `${colors.success}10`,
      border: `${colors.success}25`,
      icon: colors.success,
      text: colors.success,
    },
  }[summaryTone];

  const summaryIcon =
    summaryTone === 'success'
      ? 'checkmark-circle-outline'
      : summaryTone === 'error'
        ? 'alert-circle-outline'
        : 'information-circle-outline';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              width: isMobile ? '92%' : 520,
              maxWidth: 560,
              ...(Platform.OS === 'web'
                ? { boxShadow: '0 12px 40px rgba(0, 0, 0, 0.18)' as any }
                : {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.18,
                    shadowRadius: 16,
                    elevation: 10,
                  }),
            },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerMain}>
              <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="download-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.headerText}>
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
                  Export Historical Data
                </ThemedText>
                {stationName ? (
                  <ThemedText
                    style={[styles.headerSubtitle, { color: colors.text, opacity: 0.65 }]}
                  >
                    {stationName}
                  </ThemedText>
                ) : (
                  <ThemedText
                    style={[styles.headerSubtitle, { color: colors.text, opacity: 0.65 }]}
                  >
                    Choose a date range for your Excel file
                  </ThemedText>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              disabled={isExporting}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <ThemedText style={[styles.description, { color: colors.text, opacity: 0.72 }]}>
              Export weather readings for the selected period. The table on screen will stay the
              same.
            </ThemedText>

            {bounds ? (
              <View
                style={[
                  styles.dateRangeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View
                    style={[styles.sectionIcon, { backgroundColor: `${colors.primary}12` }]}
                  >
                    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  </View>
                  <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                    Date range
                  </ThemedText>
                </View>

                <View style={isMobile ? styles.dateFieldsStack : styles.dateFieldsRow}>
                  <View style={isMobile ? styles.dateFieldStack : styles.dateField}>
                    <FormDatePicker
                      label="Start date"
                      value={startDate}
                      onDateChange={handleStartChange}
                      minimumDate={bounds.min}
                      maximumDate={endDate}
                      placeholder="Select start date"
                      required
                    />
                  </View>
                  <View style={isMobile ? styles.dateFieldStack : styles.dateField}>
                    <FormDatePicker
                      label="End date"
                      value={endDate}
                      onDateChange={handleEndChange}
                      minimumDate={startDate ?? bounds.min}
                      required
                    />
                  </View>
                </View>
              </View>
            ) : null}

            <View
              style={[
                styles.summaryBox,
                {
                  backgroundColor: summaryColors.background,
                  borderColor: summaryColors.border,
                },
              ]}
            >
              <Ionicons name={summaryIcon} size={20} color={summaryColors.icon} />
              <ThemedText
                style={[
                  styles.summaryText,
                  {
                    color: summaryTone === 'info' ? summaryColors.text : summaryColors.icon,
                    opacity: summaryTone === 'info' ? 0.8 : 1,
                  },
                ]}
              >
                {hasStartDate && !isValidRange
                  ? 'Start date must be on or before end date.'
                  : summaryText}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.footerButton,
                styles.cancelButton,
                { borderColor: colors.border, backgroundColor: colors.background },
              ]}
              onPress={onClose}
              disabled={isExporting}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.footerButtonText, { color: colors.text }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.footerButton,
                styles.exportButton,
                {
                  backgroundColor: canExport ? colors.primary : colors.disabledButton,
                  opacity: canExport ? 1 : 0.75,
                },
              ]}
              onPress={() => startDate && onExport(startDate, endDate)}
              disabled={!canExport}
              activeOpacity={0.8}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="download-outline"
                    size={18}
                    color={canExport ? '#FFFFFF' : colors.disabledText}
                  />
                  <ThemedText
                    style={[
                      styles.exportButtonText,
                      { color: canExport ? '#FFFFFF' : colors.disabledText },
                    ]}
                  >
                    Export Excel
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 45, 66, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '90%',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingRight: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    lineHeight: 28,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 16,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    lineHeight: 22,
  },
  dateRangeCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    lineHeight: 22,
  },
  dateFieldsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dateFieldsStack: {
    gap: 0,
  },
  dateField: {
    flex: 1,
  },
  dateFieldStack: {
    width: '100%',
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  exportButton: {
    flexDirection: 'row',
    gap: 8,
  },
  footerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
});

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useNavigation } from '@/contexts/NavigationContext';
import { getMunicipalities } from '@/data/davaoOrientalData';
import { OperationRecord } from '@/firebase/operations';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface RecentOperationsProps {
  operations: OperationRecord[];
  onViewAll?: () => void;
  onOperationPress?: (operation: OperationRecord) => void;
  onNavigate?: (tab: string) => void;
}

const municipalities = getMunicipalities();

function getMunicipalityName(id: string): string {
  const municipality = municipalities.find(m => m.id.toString() === id);
  return municipality?.name || 'Unknown';
}

function formatDate(date: Date | string | number, includeTime: boolean = true): string {
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  if (includeTime) {
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } else {
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }
}

export function RecentOperations({ operations, onViewAll, onOperationPress, onNavigate }: RecentOperationsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  const { setMunicipalityToOpen } = useNavigation();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const recentOperations = operations
    .filter(op => op.status === 'active')
    .sort((a, b) => {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    })
    .slice(0, 10); // Show more operations in table view

  const handleOperationPress = (operation: OperationRecord) => {
    const municipality = municipalities.find(m => m.id.toString() === operation.municipalityId);
    if (municipality && onNavigate) {
      setMunicipalityToOpen(municipality);
      onNavigate('operations');
    }
    onOperationPress?.(operation);
  };

  if (recentOperations.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: colors.text }]}>Recent Operations</ThemedText>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="flash-outline" size={48} color={colors.text} style={{ opacity: 0.3 }} />
          <ThemedText style={[styles.emptyText, { color: colors.text }]}>
            No active operations
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Render table view for web
  if (Platform.OS === 'web' && !isMobile) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: colors.text }]}>Recent Operations</ThemedText>
          {onViewAll && (
            <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
              <ThemedText style={[styles.viewAll, { color: colors.primary }]}>View All</ThemedText>
            </TouchableOpacity>
          )}
        </View>
        {recentOperations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="flash-outline" size={48} color={colors.text} style={{ opacity: 0.3 }} />
            <ThemedText style={[styles.emptyText, { color: colors.text }]}>
              No active operations
            </ThemedText>
          </View>
        ) : (
          <View style={styles.tableContainer}>
            <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
              <View style={[styles.tableHeaderCell, styles.tableCellStatus]}>
                <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>Status</ThemedText>
              </View>
              <View style={[styles.tableHeaderCell, styles.tableCellTitle]}>
                <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>Operation</ThemedText>
              </View>
              <View style={[styles.tableHeaderCell, styles.tableCellLocation]}>
                <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>Location</ThemedText>
              </View>
              <View style={[styles.tableHeaderCell, styles.tableCellType]}>
                <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>Type</ThemedText>
              </View>
              <View style={[styles.tableHeaderCell, styles.tableCellDate]}>
                <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>Date</ThemedText>
              </View>
            </View>
            <View style={styles.tableBody}>
              {recentOperations.map((operation) => {
                const rowProps = Platform.OS === 'web' ? {
                  onMouseEnter: () => setHoveredRow(operation.id),
                  onMouseLeave: () => setHoveredRow(null),
                } : {};
                
                return (
                  <TouchableOpacity
                    key={operation.id}
                    style={[
                      styles.tableRow, 
                      { 
                        borderBottomColor: colors.border,
                        backgroundColor: hoveredRow === operation.id 
                          ? (Platform.OS === 'web' ? `${colors.primary}08` : 'transparent')
                          : 'transparent'
                      }
                    ]}
                    onPress={() => handleOperationPress(operation)}
                    {...(rowProps as any)}
                    activeOpacity={0.7}
                  >
                  <View style={[styles.tableCell, styles.tableCellStatus]}>
                    <View style={[styles.statusBadge, { backgroundColor: operation.status === 'active' ? '#10B981' : '#6B7280' }]}>
                      <ThemedText style={styles.statusBadgeText}>
                        {operation.status === 'active' ? 'Active' : 'Concluded'}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.tableCell, styles.tableCellTitle]}>
                    <ThemedText style={[styles.tableCellText, { color: colors.text }]} numberOfLines={2}>
                      {operation.title}
                    </ThemedText>
                  </View>
                  <View style={[styles.tableCell, styles.tableCellLocation]}>
                    <ThemedText style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
                      {getMunicipalityName(operation.municipalityId)}
                    </ThemedText>
                  </View>
                  <View style={[styles.tableCell, styles.tableCellType]}>
                    <ThemedText style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
                      {operation.operationType || 'N/A'}
                    </ThemedText>
                  </View>
                  <View style={[styles.tableCell, styles.tableCellDate]}>
                    <ThemedText style={[styles.tableCellText, { color: colors.text }]}>
                      {formatDate(operation.startDate, false)}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ThemedView>
    );
  }

  // Render list view for mobile
  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: colors.text }]}>Recent Operations</ThemedText>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
            <ThemedText style={[styles.viewAll, { color: colors.primary }]}>View All</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.operationsList}>
        {recentOperations.map((operation) => (
          <TouchableOpacity
            key={operation.id}
            style={[styles.operationItem, { borderBottomColor: colors.border }]}
            onPress={() => handleOperationPress(operation)}
            activeOpacity={0.7}
          >
            <View style={[styles.statusIndicator, { backgroundColor: operation.status === 'active' ? '#10B981' : '#6B7280' }]} />
            <View style={styles.operationContent}>
              <ThemedText style={[styles.operationTitle, { color: colors.text }]} numberOfLines={1}>
                {operation.title}
              </ThemedText>
              <View style={styles.operationMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="location" size={14} color={colors.text} style={{ opacity: 0.6 }} />
                  <ThemedText style={[styles.metaText, { color: colors.text }]} numberOfLines={1}>
                    {getMunicipalityName(operation.municipalityId)}
                  </ThemedText>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={14} color={colors.text} style={{ opacity: 0.6 }} />
                  <ThemedText style={[styles.metaText, { color: colors.text }]}>
                    {formatDate(operation.startDate)}
                  </ThemedText>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text} style={{ opacity: 0.4 }} />
          </TouchableOpacity>
        ))}
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
      borderRadius: 14,
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    ...(Platform.OS !== 'web' && {
      marginBottom: 12,
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    ...(Platform.OS !== 'web' && {
      fontSize: 16,
    }),
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
  },
  operationsList: {
    gap: 0,
  },
  operationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
    ...(Platform.OS !== 'web' && {
      paddingVertical: 10,
      gap: 10,
    }),
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  operationContent: {
    flex: 1,
    minWidth: 0,
  },
  operationTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Gabarito',
    ...(Platform.OS !== 'web' && {
      fontSize: 14,
      marginBottom: 3,
    }),
  },
  operationMeta: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    opacity: 0.7,
    fontFamily: 'Gabarito',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.6,
    fontFamily: 'Gabarito',
  },
  // Table styles for web
  tableContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  tableHeaderCell: {
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
    fontFamily: 'Gabarito',
  },
  tableBody: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'background-color 0.15s ease',
    } as any),
  },
  tableCell: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  tableCellText: {
    fontSize: 14,
    fontFamily: 'Gabarito',
  },
  tableCellStatus: {
    width: 100,
    minWidth: 100,
  },
  tableCellTitle: {
    flex: 2,
    minWidth: 200,
  },
  tableCellLocation: {
    flex: 1.5,
    minWidth: 150,
  },
  tableCellType: {
    flex: 1,
    minWidth: 120,
  },
  tableCellDate: {
    width: 140,
    minWidth: 140,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Gabarito',
  },
});


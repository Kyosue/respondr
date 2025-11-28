import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { getMunicipalities } from '@/data/davaoOrientalData';
import { OperationRecord } from '@/firebase/operations';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface OperationsTableProps {
  operations: OperationRecord[];
  onOperationPress?: (operation: OperationRecord) => void;
}

const municipalities = getMunicipalities();

function getMunicipalityName(id: string): string {
  const municipality = municipalities.find(m => m.id.toString() === id);
  return municipality?.name || 'Unknown';
}


function formatDate(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export function OperationsTable({ operations, onOperationPress }: OperationsTableProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();

  const activeOperations = operations
    .filter(op => op.status === 'active')
    .sort((a, b) => {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    })
    .slice(0, 10);

  if (activeOperations.length === 0) {
    return (
      <ThemedView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
          Active Operations
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: colors.text }]}>
          No active operations
        </ThemedText>
      </ThemedView>
    );
  }

  if (isMobile) {
    return (
      <ThemedView style={[styles.card, styles.cardMobile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerSection}>
          <View style={styles.titleContainer}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="location" size={20} color={colors.primary} />
            </View>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Active Operations
            </ThemedText>
          </View>
          <ThemedText style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            {activeOperations.length}
          </ThemedText>
        </View>
        <ScrollView 
          style={styles.mobileScrollContainer}
          contentContainerStyle={styles.mobileListContainer}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {activeOperations.map((operation, index) => (
            <TouchableOpacity
              key={operation.id}
              style={[
                styles.mobileItem,
                { 
                  borderLeftColor: colors.primary,
                  backgroundColor: index % 2 === 0 ? 'transparent' : `${colors.primary}02`,
                }
              ]}
              onPress={() => onOperationPress?.(operation)}
              activeOpacity={0.6}
            >
              <View style={styles.mobileItemContent}>
                <View style={styles.mobileItemTop}>
                  <View style={styles.mobileTitleRow}>
                    <ThemedText
                      style={[styles.mobileTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {operation.title}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.mobileItemBottom}>
                  <View style={styles.mobileMetaRow}>
                    <View style={styles.mobileMetaItem}>
                      <Ionicons name="location-outline" size={12} color={colors.text} style={{ opacity: 0.5, marginRight: 4 }} />
                      <ThemedText style={[styles.mobileText, { color: colors.text, opacity: 0.7 }]} numberOfLines={1}>
                        {getMunicipalityName(operation.municipalityId)}
                      </ThemedText>
                    </View>
                    {operation.exactLocation?.barangay && (
                      <View style={styles.mobileMetaItem}>
                        <Ionicons name="map-outline" size={12} color={colors.text} style={{ opacity: 0.5, marginRight: 4 }} />
                        <ThemedText style={[styles.mobileText, { color: colors.text, opacity: 0.7 }]} numberOfLines={1}>
                          {operation.exactLocation.barangay}
                        </ThemedText>
                      </View>
                    )}
                    <View style={styles.mobileMetaItem}>
                      <Ionicons name="calendar-outline" size={12} color={colors.text} style={{ opacity: 0.5, marginRight: 4 }} />
                      <ThemedText style={[styles.mobileText, { color: colors.text, opacity: 0.7 }]}>
                        {formatDate(operation.startDate)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerSection}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="location" size={20} color={colors.primary} />
          </View>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Active Operations
          </ThemedText>
        </View>
        <ThemedText style={[styles.countBadge, { backgroundColor: colors.primary }]}>
          {activeOperations.length}
        </ThemedText>
      </View>
      <View style={[styles.table, { borderColor: colors.border }]}>
        <View style={[styles.tableHeader, { borderBottomColor: colors.border, backgroundColor: `${colors.primary}05` }]}>
          <View style={[styles.tableHeaderCell, styles.tableHeaderCellTitle]}>
            <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
              Operation
            </ThemedText>
          </View>
          <View style={styles.tableHeaderCell}>
            <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
              Municipality
            </ThemedText>
          </View>
          <View style={styles.tableHeaderCell}>
            <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
              Barangay
            </ThemedText>
          </View>
          <View style={styles.tableHeaderCell}>
            <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
              Date
            </ThemedText>
          </View>
        </View>
        <ScrollView 
          style={styles.tableScrollContainer}
          contentContainerStyle={styles.tableScrollContent}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {activeOperations.map((operation, index) => (
            <TouchableOpacity
              key={operation.id}
              style={[
                styles.tableRow,
                { 
                  borderBottomColor: colors.border,
                  backgroundColor: index % 2 === 0 ? 'transparent' : `${colors.primary}02`
                }
              ]}
              onPress={() => onOperationPress?.(operation)}
              activeOpacity={0.7}
            >
              <View style={[styles.tableCell, styles.tableCellTitle]}>
                <ThemedText style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
                  {operation.title}
                </ThemedText>
              </View>
              <View style={styles.tableCell}>
                <View style={styles.municipalityCell}>
                  <Ionicons name="location-outline" size={14} color={colors.text} style={{ opacity: 0.5, marginRight: 6 }} />
                  <ThemedText style={[styles.tableCellText, { color: colors.text, opacity: 0.8 }]} numberOfLines={1}>
                    {getMunicipalityName(operation.municipalityId)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.tableCell}>
                <ThemedText style={[styles.tableCellText, { color: colors.text, opacity: 0.8 }]} numberOfLines={1}>
                  {operation.exactLocation?.barangay || 'N/A'}
                </ThemedText>
              </View>
              <View style={styles.tableCell}>
                <View style={styles.dateCell}>
                  <Ionicons name="calendar-outline" size={12} color={colors.text} style={{ opacity: 0.5, marginRight: 6 }} />
                  <ThemedText style={[styles.tableCellText, { color: colors.text, opacity: 0.7 }]}>
                    {formatDate(operation.startDate)}
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardMobile: {
    padding: 16,
    marginBottom: 16,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
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
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Gabarito',
  },
  table: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableScrollContainer: {
    maxHeight: 400, // Limit table height to 400px, then scroll
  },
  tableScrollContent: {
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
    alignItems: 'flex-start',
  },
  tableHeaderCellTitle: {
    flex: 2,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'Gabarito',
    opacity: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
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
  tableCellTitle: {
    flex: 2,
  },
  tableCellText: {
    fontSize: 14,
    fontFamily: 'Gabarito',
  },
  municipalityCell: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityBadgeMobile: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  priorityBadgeTable: {
    width: 'auto',
    height: 'auto',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Gabarito',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  mobileScrollContainer: {
    maxHeight: 400, // Limit mobile list height to 400px, then scroll
  },
  mobileListContainer: {
    gap: 0,
  },
  mobileItem: {
    borderLeftWidth: 3,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  mobileItemContent: {
    flex: 1,
  },
  mobileItemTop: {
    marginBottom: 8,
  },
  mobileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  mobileTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    flex: 1,
    lineHeight: 20,
  },
  mobileItemBottom: {
    marginTop: 4,
  },
  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  mobileMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  mobileText: {
    fontSize: 12,
    fontFamily: 'Gabarito',
  },
  mobilePriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  mobilePriorityText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
    opacity: 0.6,
    fontFamily: 'Gabarito',
  },
});


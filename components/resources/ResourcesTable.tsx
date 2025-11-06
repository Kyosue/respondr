import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Resource, ResourceCategory } from '@/types/Resource';
import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ResourcesTableProps {
  resources: Resource[];
  onResourcePress?: (resource: Resource) => void;
  onBorrow?: (resource: Resource) => void;
  onReturn?: (resource: Resource) => void;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

function getCategoryColor(category: ResourceCategory): string {
  switch (category) {
    case 'vehicles': return '#3B82F6';
    case 'medical': return '#EF4444';
    case 'equipment': return '#F97316';
    case 'communication': return '#8B5CF6';
    case 'personnel': return '#10B981';
    case 'tools': return '#F59E0B';
    case 'supplies': return '#6B7280';
    default: return '#6B7280';
  }
}

function getCategoryIcon(category: ResourceCategory): string {
  switch (category) {
    case 'vehicles': return 'car-outline';
    case 'medical': return 'medkit-outline';
    case 'equipment': return 'construct-outline';
    case 'communication': return 'radio-outline';
    case 'personnel': return 'people-outline';
    case 'tools': return 'hammer-outline';
    case 'supplies': return 'cube-outline';
    default: return 'cube-outline';
  }
}

function getConditionColor(condition: string): string {
  switch (condition) {
    case 'excellent': return '#059669';
    case 'good': return '#65A30D';
    case 'fair': return '#D97706';
    case 'poor': return '#DC2626';
    case 'needs_repair': return '#B91C1C';
    default: return '#6B7280';
  }
}

function getConditionText(condition: string): string {
  switch (condition) {
    case 'excellent': return 'EXCELLENT';
    case 'good': return 'GOOD';
    case 'fair': return 'FAIR';
    case 'poor': return 'POOR';
    case 'needs_repair': return 'NEEDS REPAIR';
    default: return 'UNKNOWN';
  }
}

function getStatusColor(availableQuantity: number, totalQuantity: number): string {
  const percentage = (availableQuantity / totalQuantity) * 100;
  if (percentage > 70) return '#10B981';
  if (percentage > 30) return '#F59E0B';
  return '#EF4444';
}

export function ResourcesTable({ 
  resources, 
  onResourcePress,
  onBorrow,
  onReturn,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false
}: ResourcesTableProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();

  if (resources.length === 0) {
    return null;
  }

  if (isMobile) {
    return (
      <ThemedView style={[styles.card, styles.cardMobile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerSection}>
          <View style={styles.titleContainer}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="cube" size={20} color={colors.primary} />
            </View>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Resources
            </ThemedText>
          </View>
          <ThemedText style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            {resources.length}
          </ThemedText>
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {resources.map((resource) => {
            const categoryColor = getCategoryColor(resource.category);
            const conditionColor = getConditionColor(resource.condition);
            const statusColor = getStatusColor(resource.availableQuantity, resource.totalQuantity);
            const isExternalResource = resource.resourceType === 'external';
            const isBorrowable = resource.isBorrowable !== false;
            const canBorrow = !isExternalResource && isBorrowable && resource.availableQuantity > 0;

            return (
              <TouchableOpacity
                key={resource.id}
                style={[styles.mobileItem, { borderColor: colors.border }]}
                onPress={() => onResourcePress?.(resource)}
                activeOpacity={0.7}
              >
                <View style={styles.mobileItemHeader}>
                  <View style={[styles.imageContainer, { backgroundColor: `${categoryColor}20` }]}>
                    {resource.images && resource.images.length > 0 ? (
                      <Image 
                        source={{ uri: resource.images[0] }} 
                        style={styles.resourceImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons 
                        name={getCategoryIcon(resource.category) as any} 
                        size={20} 
                        color={categoryColor} 
                      />
                    )}
                  </View>
                  <View style={styles.mobileTitleContainer}>
                    <ThemedText
                      style={[styles.mobileTitle, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {resource.name}
                    </ThemedText>
                    <View style={styles.mobileMetaRow}>
                      <View style={[styles.conditionBadge, { backgroundColor: `${conditionColor}20` }]}>
                        <ThemedText style={[styles.conditionText, { color: conditionColor }]}>
                          {getConditionText(resource.condition)}
                        </ThemedText>
                      </View>
                      {isExternalResource && (
                        <View style={[styles.externalBadge, { backgroundColor: '#FFB74D20' }]}>
                          <ThemedText style={[styles.externalText, { color: '#FF8F00' }]}>
                            EXTERNAL
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.mobileMeta}>
                  <View style={styles.mobileMetaItem}>
                    <Ionicons name={getCategoryIcon(resource.category) as any} size={14} color={categoryColor} style={{ marginRight: 6 }} />
                    <ThemedText style={[styles.mobileText, { color: colors.text, opacity: 0.7 }]} numberOfLines={1}>
                      {resource.category.toUpperCase()}
                    </ThemedText>
                  </View>
                  {resource.location && (
                    <View style={styles.mobileMetaItem}>
                      <Ionicons name="location-outline" size={14} color={colors.text} style={{ opacity: 0.6, marginRight: 6 }} />
                      <ThemedText style={[styles.mobileText, { color: colors.text, opacity: 0.7 }]} numberOfLines={1}>
                        {resource.location}
                      </ThemedText>
                    </View>
                  )}
                  <View style={styles.mobileMetaItem}>
                    <Ionicons name="stats-chart-outline" size={14} color={statusColor} style={{ marginRight: 6 }} />
                    <ThemedText style={[styles.mobileText, { color: colors.text, opacity: 0.7 }]}>
                      {resource.availableQuantity}/{resource.totalQuantity} Available
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.mobileFooter}>
                  <View style={styles.mobileActions}>
                    {canBorrow && onBorrow && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          onBorrow(resource);
                        }}
                      >
                        <Ionicons name="cart-outline" size={14} color="#fff" />
                        <ThemedText style={styles.actionButtonText}>Borrow</ThemedText>
                      </TouchableOpacity>
                    )}
                    {canEdit && onEdit && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryButton, { backgroundColor: `${colors.primary}20` }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          onEdit(resource);
                        }}
                      >
                        <Ionicons name="create-outline" size={14} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                    {canDelete && onDelete && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.dangerButton, { backgroundColor: `${colors.error}20` }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          onDelete(resource);
                        }}
                      >
                        <Ionicons name="trash-outline" size={14} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <View style={[styles.table, { borderColor: colors.border }]}>
        <View style={[styles.tableHeader, { borderBottomColor: colors.border, backgroundColor: `${colors.primary}05` }]}>
          <View style={[styles.tableHeaderCell, styles.tableHeaderCellName]}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="cube-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
              <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
                Resource
              </ThemedText>
            </View>
          </View>
          <View style={styles.tableHeaderCell}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="grid-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
              <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
                Category
              </ThemedText>
            </View>
          </View>
          <View style={styles.tableHeaderCell}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
              <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
                Condition
              </ThemedText>
            </View>
          </View>
          <View style={styles.tableHeaderCell}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="location-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
              <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
                Location
              </ThemedText>
            </View>
          </View>
          <View style={styles.tableHeaderCell}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="stats-chart-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
              <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
                Status
              </ThemedText>
            </View>
          </View>
          <View style={[styles.tableHeaderCell, styles.tableHeaderCellActions]}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="settings-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
              <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
                Actions
              </ThemedText>
            </View>
          </View>
        </View>
        {resources.map((resource, index) => {
          const categoryColor = getCategoryColor(resource.category);
          const conditionColor = getConditionColor(resource.condition);
          const statusColor = getStatusColor(resource.availableQuantity, resource.totalQuantity);
          const isExternalResource = resource.resourceType === 'external';
          const isBorrowable = resource.isBorrowable !== false;
          const canBorrow = !isExternalResource && isBorrowable && resource.availableQuantity > 0;
          const availabilityPercentage = (resource.availableQuantity / resource.totalQuantity) * 100;

          return (
            <TouchableOpacity
              key={resource.id}
              style={[
                styles.tableRow,
                { 
                  borderBottomColor: colors.border,
                  backgroundColor: index % 2 === 0 ? 'transparent' : `${colors.primary}02`
                }
              ]}
              onPress={() => onResourcePress?.(resource)}
              activeOpacity={0.7}
            >
              <View style={[styles.tableCell, styles.tableCellName]}>
                <View style={styles.resourceNameCell}>
                  <View style={[styles.imageContainer, styles.tableImageContainer, { backgroundColor: `${categoryColor}20` }]}>
                    {resource.images && resource.images.length > 0 ? (
                      <Image 
                        source={{ uri: resource.images[0] }} 
                        style={styles.resourceImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons 
                        name={getCategoryIcon(resource.category) as any} 
                        size={18} 
                        color={categoryColor} 
                      />
                    )}
                  </View>
                  <View style={styles.nameTextContainer}>
                    <ThemedText style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
                      {resource.name}
                    </ThemedText>
                    {isExternalResource && (
                      <View style={[styles.externalBadgeInline, { backgroundColor: '#FFB74D20' }]}>
                        <ThemedText style={[styles.externalTextInline, { color: '#FF8F00' }]}>
                          EXTERNAL
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.tableCell}>
                <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
                  <Ionicons name={getCategoryIcon(resource.category) as any} size={12} color={categoryColor} style={{ marginRight: 4 }} />
                  <ThemedText style={[styles.categoryText, { color: categoryColor }]}>
                    {resource.category.toUpperCase()}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.tableCell}>
                <View style={[styles.conditionBadge, { backgroundColor: `${conditionColor}20` }]}>
                  <ThemedText style={[styles.conditionText, { color: conditionColor }]}>
                    {getConditionText(resource.condition)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.tableCell}>
                {resource.location ? (
                  <View style={styles.locationCell}>
                    <Ionicons name="location-outline" size={12} color={colors.text} style={{ opacity: 0.5, marginRight: 6 }} />
                    <ThemedText style={[styles.tableCellText, { color: colors.text, opacity: 0.8 }]} numberOfLines={1}>
                      {resource.location}
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText style={[styles.tableCellText, { color: colors.text, opacity: 0.5 }]}>
                    —
                  </ThemedText>
                )}
              </View>
              <View style={styles.tableCell}>
                <View style={styles.statusCell}>
                  <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                  <ThemedText style={[styles.tableCellText, { color: colors.text, opacity: 0.8 }]}>
                    {resource.availableQuantity}/{resource.totalQuantity}
                  </ThemedText>
                </View>
                <View style={[styles.availabilityBar, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.availabilityFill, 
                      { 
                        backgroundColor: statusColor,
                        width: `${availabilityPercentage}%` 
                      }
                    ]} 
                  />
                </View>
              </View>
              <View style={[styles.tableCell, styles.tableCellActions]}>
                <View style={styles.actionsCell}>
                  {canBorrow && onBorrow && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        onBorrow(resource);
                      }}
                    >
                      <Ionicons name="cart-outline" size={14} color="#fff" />
                      <ThemedText style={styles.actionButtonText}>Borrow</ThemedText>
                    </TouchableOpacity>
                  )}
                  {canEdit && onEdit && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.iconButton, { backgroundColor: `${colors.primary}20` }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        onEdit(resource);
                      }}
                    >
                      <Ionicons name="create-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                  {canDelete && onDelete && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.iconButton, { backgroundColor: `${colors.error}20` }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        onDelete(resource);
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
    </View>
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
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  tableHeaderCellName: {
    flex: 2,
  },
  tableHeaderCellActions: {
    flex: 1.5,
    alignItems: 'center',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'Gabarito',
    opacity: 0.8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  tableCellName: {
    flex: 2,
  },
  tableCellActions: {
    flex: 1.5,
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: 14,
    fontFamily: 'Gabarito',
  },
  resourceNameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  imageContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableImageContainer: {
    width: 36,
    height: 36,
    marginRight: 10,
  },
  resourceImage: {
    width: '100%',
    height: '100%',
  },
  nameTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  locationCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    letterSpacing: 0.5,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    letterSpacing: 0.5,
  },
  statusCell: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availabilityBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  availabilityFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionsCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  successButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    // backgroundColor set dynamically
  },
  dangerButton: {
    // backgroundColor set dynamically
  },
  iconButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Gabarito',
  },
  externalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  externalText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    letterSpacing: 0.5,
  },
  externalBadgeInline: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  externalTextInline: {
    fontSize: 8,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  mobileItem: {
    padding: 16,
    borderBottomWidth: 1,
    marginBottom: 0,
    backgroundColor: 'transparent',
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 1,
  },
  mobileItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  mobileTitleContainer: {
    flex: 1,
    minWidth: 0,
  },
  mobileTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 22,
    marginBottom: 6,
  },
  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  mobileMeta: {
    flexDirection: 'column',
    marginBottom: 12,
    gap: 8,
    paddingLeft: 50,
  },
  mobileMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mobileText: {
    fontSize: 13,
    fontFamily: 'Gabarito',
    flex: 1,
  },
  mobileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 50,
    gap: 8,
  },
  mobileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
    opacity: 0.6,
    fontFamily: 'Gabarito',
  },
});


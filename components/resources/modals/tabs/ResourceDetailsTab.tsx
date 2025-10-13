import { Ionicons } from '@expo/vector-icons';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePlatform } from '@/hooks/usePlatform';
import { Resource, ResourceCondition, ResourceStatus } from '@/types/Resource';

interface ResourceDetailsTabProps {
  resource: Resource;
}

export function ResourceDetailsTab({ resource }: ResourceDetailsTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isWeb } = usePlatform();
  const availabilityPercentage = (resource.availableQuantity / resource.totalQuantity) * 100;

  const getStatusColor = (status: ResourceStatus) => {
    switch (status) {
      case 'active': return colors.success;
      case 'inactive': return colors.text;
      case 'maintenance': return colors.warning;
      case 'retired': return colors.error;
      default: return colors.text;
    }
  };

  const getConditionColor = (condition: ResourceCondition) => {
    switch (condition) {
      case 'excellent': return colors.success;
      case 'good': return colors.primary;
      case 'fair': return colors.warning;
      case 'poor': return colors.error;
      case 'needs_repair': return colors.error;
      default: return colors.text;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.contentWrapper, isWeb && styles.webContentWrapper]}>
        {/* Basic Information Section */}
        <SectionHeader icon="information-circle" title="Basic Information" />
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <DetailRow label="Name" value={resource.name} />
          <DetailRow label="Description" value={resource.description} />
          <DetailRow label="Category" value={resource.category} />
          <DetailRow label="Location" value={resource.location} />
        </View>

        {/* Two-column layout for web */}
        {isWeb ? (
          <View style={styles.webTwoColumn}>
            {/* Left Column */}
            <View style={styles.webColumn}>
              {/* Quantity & Availability Section */}
              <SectionHeader icon="bar-chart" title="Quantity & Availability" />
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <QuantityDisplay
                  totalQuantity={resource.totalQuantity}
                  availableQuantity={resource.availableQuantity}
                  availabilityPercentage={availabilityPercentage}
                />
              </View>

              {/* Status & Condition Section */}
              <SectionHeader icon="checkmark-circle" title="Status & Condition" />
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <StatusBadge
                  label="Status"
                  value={resource.status}
                  color={getStatusColor(resource.status)}
                />
                <StatusBadge
                  label="Condition"
                  value={resource.condition}
                  color={getConditionColor(resource.condition)}
                />
              </View>
            </View>

            {/* Right Column */}
            <View style={styles.webColumn}>
              {/* Tags Section */}
              {resource.tags.length > 0 && (
                <>
                  <SectionHeader icon="pricetag" title="Tags" />
                  <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <TagsDisplay tags={resource.tags} />
                  </View>
                </>
              )}

              {/* Maintenance Section */}
              <SectionHeader icon="construct" title="Maintenance" />
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                {resource.lastMaintenance ? (
                  <DetailRow
                    label="Last Maintenance"
                    value={resource.lastMaintenance ? new Date(resource.lastMaintenance).toLocaleDateString() : 'Never'}
                  />
                ) : (
                  <EmptyState text="No maintenance records" />
                )}
                {resource.nextMaintenance && (
                  <DetailRow
                    label="Next Maintenance"
                    value={resource.nextMaintenance ? new Date(resource.nextMaintenance).toLocaleDateString() : 'Not scheduled'}
                  />
                )}
              </View>
            </View>
          </View>
        ) : (
          /* Mobile layout - single column */
          <>
            {/* Quantity & Availability Section */}
            <SectionHeader icon="bar-chart" title="Quantity & Availability" />
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <QuantityDisplay
                totalQuantity={resource.totalQuantity}
                availableQuantity={resource.availableQuantity}
                availabilityPercentage={availabilityPercentage}
              />
            </View>

            {/* Status & Condition Section */}
            <SectionHeader icon="checkmark-circle" title="Status & Condition" />
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <StatusBadge
                label="Status"
                value={resource.status}
                color={getStatusColor(resource.status)}
              />
              <StatusBadge
                label="Condition"
                value={resource.condition}
                color={getConditionColor(resource.condition)}
              />
            </View>

            {/* Tags Section */}
            {resource.tags.length > 0 && (
              <>
                <SectionHeader icon="pricetag" title="Tags" />
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                  <TagsDisplay tags={resource.tags} />
                </View>
              </>
            )}

            {/* Maintenance Section */}
            <SectionHeader icon="construct" title="Maintenance" />
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              {resource.lastMaintenance ? (
                <DetailRow
                  label="Last Maintenance"
                  value={resource.lastMaintenance ? new Date(resource.lastMaintenance).toLocaleDateString() : 'Never'}
                />
              ) : (
                <EmptyState text="No maintenance records" />
              )}
              {resource.nextMaintenance && (
                <DetailRow
                  label="Next Maintenance"
                  value={resource.nextMaintenance ? new Date(resource.nextMaintenance).toLocaleDateString() : 'Not scheduled'}
                />
              )}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

interface SectionHeaderProps {
  icon: string;
  title: string;
}

function SectionHeader({ icon, title }: SectionHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={18} color={colors.primary} />
      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>{title}</ThemedText>
    </View>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <ThemedText style={styles.detailValue}>{value}</ThemedText>
    </View>
  );
}

interface EmptyStateProps {
  text: string;
}

function EmptyState({ text }: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.emptyState}>
      <Ionicons name="information-circle-outline" size={16} color={colors.text} style={{ opacity: 0.5 }} />
      <ThemedText style={[styles.emptyText, { color: colors.text }]}>{text}</ThemedText>
    </View>
  );
}

interface QuantityDisplayProps {
  totalQuantity: number;
  availableQuantity: number;
  availabilityPercentage: number;
}

function QuantityDisplay({ totalQuantity, availableQuantity, availabilityPercentage }: QuantityDisplayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <View style={styles.quantityContainer}>
        <QuantityItem 
          value={totalQuantity} 
          label="Total" 
          icon="cube-outline"
          color={colors.text}
        />
        <QuantityItem 
          value={availableQuantity} 
          label="Available" 
          icon="checkmark-circle-outline"
          color={colors.success}
        />
        <QuantityItem 
          value={totalQuantity - availableQuantity} 
          label="In Use" 
          icon="people-outline"
          color={colors.warning}
        />
      </View>
      
      <View style={styles.availabilityContainer}>
        <View style={styles.availabilityHeader}>
          <ThemedText style={styles.availabilityLabel}>Availability</ThemedText>
          <ThemedText style={[styles.availabilityPercentage, { 
            color: availabilityPercentage > 30 ? colors.success : colors.warning 
          }]}>
            {availabilityPercentage.toFixed(0)}%
          </ThemedText>
        </View>
        <View style={[styles.availabilityTrack, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.availabilityBar, 
              { 
                backgroundColor: availabilityPercentage > 30 ? colors.success : colors.warning,
                width: `${availabilityPercentage}%` 
              }
            ]} 
          />
        </View>
      </View>
    </>
  );
}

interface QuantityItemProps {
  value: number;
  label: string;
  icon: string;
  color: string;
}

function QuantityItem({ value, label, icon, color }: QuantityItemProps) {
  return (
    <View style={styles.quantityItem}>
      <View style={[styles.quantityIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <ThemedText style={[styles.quantityValue, { color }]}>{value}</ThemedText>
      <ThemedText style={styles.quantityLabel}>{label}</ThemedText>
    </View>
  );
}

interface StatusBadgeProps {
  label: string;
  value: string;
  color: string;
}

function StatusBadge({ label, value, color }: StatusBadgeProps) {
  return (
    <View style={styles.statusRow}>
      <ThemedText style={styles.statusLabel}>{label}</ThemedText>
      <View style={[styles.statusBadge, { backgroundColor: `${color}20`, borderColor: color }]}>
        <View style={[styles.statusIndicator, { backgroundColor: color }]} />
        <ThemedText style={[styles.statusText, { color }]}>
          {value.replace('_', ' ').charAt(0).toUpperCase() + value.replace('_', ' ').slice(1)}
        </ThemedText>
      </View>
    </View>
  );
}

interface TagsDisplayProps {
  tags: string[];
}

function TagsDisplay({ tags }: TagsDisplayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.tagsContainer}>
      {tags.map((tag, index) => (
        <View key={index} style={[styles.tag, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]}>
          <Ionicons name="pricetag" size={12} color={colors.primary} style={styles.tagIcon} />
          <ThemedText style={[styles.tagText, { color: colors.primary }]}>{tag}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contentWrapper: {
    flex: 1,
  },
  webContentWrapper: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  webTwoColumn: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  webColumn: {
    flex: 1,
  },
  
  // Section header styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
    ...Platform.select({
      web: {
        marginTop: 24,
        marginBottom: 12,
      },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    ...Platform.select({
      web: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 10,
      },
    }),
  },
  
  // Section styles
  section: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    ...Platform.select({
      web: {
        padding: 20,
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  
  // Detail row styles
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      web: {
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
    }),
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.6,
    flex: 1,
    fontWeight: '500',
    ...Platform.select({
      web: {
        fontSize: 15,
        fontWeight: '600',
      },
    }),
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
    lineHeight: 20,
    ...Platform.select({
      web: {
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 22,
      },
    }),
  },
  
  // Quantity display styles
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  quantityItem: {
    alignItems: 'center',
    flex: 1,
  },
  quantityIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  quantityLabel: {
    fontSize: 11,
    opacity: 0.6,
    textAlign: 'center',
  },
  
  // Availability styles
  availabilityContainer: {
    marginTop: 12,
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  availabilityLabel: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.6,
  },
  availabilityPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  availabilityTrack: {
    height: 6,
    borderRadius: 3,
  },
  availabilityBar: {
    height: 6,
    borderRadius: 3,
  },
  
  // Status badge styles
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.6,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Tags styles
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagIcon: {
    marginRight: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  
  // Empty state styles
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 13,
    opacity: 0.5,
    marginLeft: 6,
    fontStyle: 'italic',
  },
});

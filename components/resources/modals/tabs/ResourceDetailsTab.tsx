import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePlatform } from '@/hooks/usePlatform';
import { Resource } from '@/types/Resource';

interface ResourceDetailsTabProps {
  resource: Resource;
}

export function ResourceDetailsTab({ resource }: ResourceDetailsTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isWeb } = usePlatform();
  const availabilityPercentage = (resource.availableQuantity / resource.totalQuantity) * 100;
  const inUseCount = resource.totalQuantity - resource.availableQuantity;

  const getCategoryIcon = (category: string) => {
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
  };

  const toTitle = (value: string) => value.replace('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  const getStatusColor = () => {
    if (resource.status === 'active') return colors.success;
    if (resource.status === 'maintenance') return colors.warning;
    if (resource.status === 'retired') return colors.error;
    return colors.icon;
  };
  const getConditionColor = () => {
    if (resource.condition === 'excellent') return colors.success;
    if (resource.condition === 'good') return colors.primary;
    if (resource.condition === 'fair') return colors.warning;
    return colors.error;
  };
  const availabilityColor = availabilityPercentage >= 60 ? colors.success : availabilityPercentage >= 30 ? colors.warning : colors.error;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={[styles.contentWrapper, isWeb && styles.webContentWrapper]}>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}14`, borderColor: colors.border }]}>
              <Ionicons name={getCategoryIcon(resource.category) as any} size={20} color={colors.primary} />
            </View>
            <View style={styles.headerTextCol}>
              <ThemedText style={[styles.title, { color: colors.text }]} numberOfLines={2}>{resource.name}</ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.text }]} numberOfLines={1}>
                {toTitle(resource.category)}{resource.location ? ` • ${resource.location}` : ''}
              </ThemedText>
            </View>
          </View>

          <View style={styles.chipsRow}>
            <MetaChip label="Status" value={toTitle(resource.status)} color={getStatusColor()} />
            <MetaChip label="Condition" value={toTitle(resource.condition)} color={getConditionColor()} />
            {resource.resourceType ? <MetaChip label="Type" value={toTitle(resource.resourceType)} color={colors.primary} /> : null}
          </View>

          <View style={styles.availabilityHeader}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Availability</ThemedText>
            <ThemedText style={[styles.availabilityPercent, { color: availabilityColor }]}>
              {availabilityPercentage.toFixed(0)}%
            </ThemedText>
          </View>

          <View style={styles.metricGrid}>
            <StatCard icon="cube-outline" label="Total" value={resource.totalQuantity} tone={colors.icon} />
            <StatCard icon="checkmark-circle-outline" label="Available" value={resource.availableQuantity} tone={colors.success} />
            <StatCard icon="people-outline" label="In Use" value={inUseCount} tone={colors.warning} />
            <StatCard icon="stats-chart-outline" label="Availability" value={`${availabilityPercentage.toFixed(0)}%`} tone={availabilityColor} />
          </View>

          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBar, { width: `${Math.min(100, Math.max(0, availabilityPercentage))}%`, backgroundColor: availabilityColor }]} />
          </View>

          <View style={styles.progressMetaRow}>
            <ThemedText style={[styles.progressMetaText, { color: colors.text }]}>Available: {resource.availableQuantity}</ThemedText>
            <ThemedText style={[styles.progressMetaText, { color: colors.text }]}>In Use: {inUseCount}</ThemedText>
          </View>

          {resource.description ? (
            <View style={[styles.descriptionWrap, { borderTopColor: colors.border }]}>
              <ThemedText style={[styles.description, { color: colors.text }]}>{resource.description}</ThemedText>
            </View>
          ) : null}
        </View>

        {resource.tags.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Tags</ThemedText>
            <View style={styles.tagsContainer}>
              {resource.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}30` }]}>
                  <ThemedText style={[styles.tagText, { color: colors.primary }]} numberOfLines={1}>{tag}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Resource Images */}
        {resource.images && resource.images.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.imagesHeader}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Images ({resource.images.length})
              </ThemedText>
            </View>
            <View style={styles.imagesGrid}>
              {resource.images.map((imageUri, index) => (
                <View
                  key={index}
                  style={[styles.imageItem, { backgroundColor: colors.border, borderColor: colors.border }]}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: number | string;
  tone: string;
}

function StatCard({ icon, label, value, tone }: StatCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  return (
    <View style={[styles.statPill, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={[styles.statPillIconWrap, { backgroundColor: `${tone}14`, borderColor: colors.border }]}>
        <Ionicons name={icon as any} size={16} color={tone} />
      </View>
      <ThemedText style={[styles.statPillValue, { color: tone }]} numberOfLines={1}>{value}</ThemedText>
      <ThemedText style={[styles.statPillLabel, { color: colors.text }]} numberOfLines={1}>{label}</ThemedText>
    </View>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

function InfoRow({ label, value, valueColor }: InfoRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <ThemedText style={[styles.infoLabel, { color: colors.text }]}>{label}</ThemedText>
      <ThemedText style={[styles.infoValue, { color: valueColor ?? colors.text }]} numberOfLines={1}>{value}</ThemedText>
    </View>
  );
}

interface MetaChipProps {
  label: string;
  value: string;
  color: string;
}

function MetaChip({ label, value, color }: MetaChipProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  return (
    <View style={[styles.metaChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={[styles.metaChipDot, { backgroundColor: color }]} />
      <ThemedText style={[styles.metaChipLabel, { color: colors.text }]}>{label}</ThemedText>
      <ThemedText style={[styles.metaChipValue, { color: colors.text }]} numberOfLines={1}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    ...Platform.select({
      web: {
        padding: 16,
      },
    }),
  },
  contentWrapper: {
    flex: 1,
  },
  webContentWrapper: {
    maxWidth: 860,
    alignSelf: 'center',
    width: '100%',
  },
  sectionCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.75,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
    marginBottom: 10,
  },
  descriptionWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '100%',
  },
  metaChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaChipValue: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
    maxWidth: 140,
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  availabilityPercent: {
    fontSize: 16,
    fontWeight: '700',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  infoList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    opacity: 0.75,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
    flexShrink: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  
  // Hero Card
  heroCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        padding: 22,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
      },
      default: {},
    }),
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 26,
    letterSpacing: -0.2,
    ...Platform.select({
      web: {
        fontSize: 22,
        lineHeight: 28,
      },
    }),
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  locationText: {
    fontSize: 12,
    opacity: 0.85,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  descriptionContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.85,
    ...Platform.select({
      web: {
        fontSize: 15,
        lineHeight: 24,
      },
    }),
  },
  
  // Stats Grid (pills)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
    ...Platform.select({
      web: {
        gap: 12,
        marginBottom: 24,
      },
    }),
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    flex: 1,
    minWidth: '47%',
    ...Platform.select({ web: { minWidth: '48%' } }),
  },
  statPillIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  statPillValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statPillLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.75,
    letterSpacing: 0.2,
  },
  
  // Progress Card
  progressCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    ...Platform.select({
      web: {
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      },
      default: {},
    }),
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  progressIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressHeaderText: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 2,
    ...Platform.select({
      web: {
        fontSize: 16,
      },
    }),
  },
  progressPercentage: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    ...Platform.select({
      web: {
        fontSize: 24,
      },
    }),
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 0,
  },
  progressBar: {
    height: 6,
    borderRadius: 999,
  },
  progressMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  progressMetaText: {
    fontSize: 13,
    opacity: 0.75,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStatItem: {
    alignItems: 'center',
  },
  progressStatLabel: {
    fontSize: 11,
    opacity: 0.75,
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  progressStatValue: {
    fontSize: 16,
    fontWeight: '700',
    ...Platform.select({
      web: {
        fontSize: 18,
      },
    }),
  },
  
  // Condition & Status (pills)
  conditionStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
    ...Platform.select({
      web: {
        gap: 12,
        marginBottom: 20,
      },
    }),
  },
  conditionPill: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    gap: 12,
    ...Platform.select({
      web: {
        minWidth: 0,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 14,
      },
    }),
  },
  statusPill: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    gap: 12,
    ...Platform.select({
      web: {
        minWidth: 0,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 14,
      },
    }),
  },
  conditionPillIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conditionPillContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  conditionPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.75,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    marginBottom: 2,
    ...Platform.select({
      web: {
        fontSize: 12,
      },
    }),
  },
  conditionPillValue: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
    ...Platform.select({
      web: {
        fontSize: 15,
      },
    }),
  },
  
  // Tags Card
  tagsCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    ...Platform.select({
      web: {
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      },
      default: {},
    }),
  },
  tagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    ...Platform.select({
      web: {
        fontSize: 17,
      },
    }),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Images Card
  imagesCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    ...Platform.select({
      web: {
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      },
      default: {},
    }),
  },
  imagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    ...Platform.select({
      web: {
        fontSize: 17,
      },
    }),
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    ...Platform.select({
      web: {
        gap: 12,
      },
    }),
  },
  imageItem: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    aspectRatio: 1,
    ...Platform.select({
      web: {
        width: '31%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      },
      default: {
        width: '47%',
      },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

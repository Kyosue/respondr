import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, ScrollView, StyleSheet, View } from 'react-native';

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

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={[styles.contentWrapper, isWeb && styles.webContentWrapper]}>
        {/* Hero Section */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroContent}>
            <View style={[styles.heroIconContainer, { backgroundColor: `${colors.primary}12` }]}>
              <Ionicons name={getCategoryIcon(resource.category) as any} size={28} color={colors.primary} />
            </View>
            <View style={styles.heroTextContainer}>
              <ThemedText style={[styles.heroTitle, { color: colors.text }]} numberOfLines={2}>
                {resource.name}
              </ThemedText>
              <View style={styles.heroMeta}>
                <View style={[styles.categoryChip, { backgroundColor: `${colors.primary}14`, borderColor: `${colors.primary}30` }]}>
                  <Ionicons name={getCategoryIcon(resource.category) as any} size={12} color={colors.primary} />
                  <ThemedText style={[styles.categoryText, { color: colors.primary }]}>
                    {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
                  </ThemedText>
                </View>
                {resource.location && (
                  <View style={[styles.locationChip, { borderColor: colors.border }]}>
                    <Ionicons name="location-outline" size={12} color={colors.icon} />
                    <ThemedText style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                      {resource.location}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
            <View style={[styles.statusChip, {
              backgroundColor: `${getStatusColor(resource.status)}18`,
              borderColor: `${getStatusColor(resource.status)}50`,
            }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(resource.status) }]} />
              <ThemedText style={[styles.statusText, { color: getStatusColor(resource.status) }]} numberOfLines={1}>
                {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
              </ThemedText>
            </View>
          </View>
          {resource.description && (
            <View style={[styles.descriptionContainer, { borderTopColor: colors.border }]}>
              <ThemedText style={[styles.descriptionText, { color: colors.text }]}>
                {resource.description}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="cube"
            label="Total"
            value={resource.totalQuantity}
            color={colors.text}
            backgroundColor={`${colors.text}10`}
            borderColor={colors.border}
          />
          <StatCard
            icon="checkmark-circle"
            label="Available"
            value={resource.availableQuantity}
            color={colors.success}
            backgroundColor={`${colors.success}15`}
            borderColor={colors.border}
          />
          <StatCard
            icon="people"
            label="In Use"
            value={resource.totalQuantity - resource.availableQuantity}
            color={colors.warning}
            backgroundColor={`${colors.warning}15`}
            borderColor={colors.border}
          />
          <StatCard
            icon="trending-up"
            label="Availability"
            value={`${availabilityPercentage.toFixed(0)}%`}
            color={availabilityPercentage > 30 ? colors.success : colors.warning}
            backgroundColor={availabilityPercentage > 30 ? `${colors.success}15` : `${colors.warning}15`}
            borderColor={colors.border}
          />
        </View>

        {/* Availability */}
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.progressHeader}>
            <View style={[styles.progressIconWrap, { backgroundColor: `${colors.primary}12` }]}>
              <Ionicons name="bar-chart-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.progressHeaderText}>
              <ThemedText style={[styles.progressTitle, { color: colors.text }]}>
                Availability
              </ThemedText>
              <ThemedText style={[styles.progressPercentage, {
                color: availabilityPercentage > 30 ? colors.success : colors.warning,
              }]}>
                {availabilityPercentage.toFixed(1)}%
              </ThemedText>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: availabilityPercentage > 30 ? colors.success : colors.warning,
                  width: `${Math.min(100, Math.max(0, availabilityPercentage))}%`,
                },
              ]}
            />
          </View>
          <View style={styles.progressStats}>
            <View style={styles.progressStatItem}>
              <ThemedText style={[styles.progressStatLabel, { color: colors.text }]}>Available</ThemedText>
              <ThemedText style={[styles.progressStatValue, { color: colors.success }]}>
                {resource.availableQuantity}
              </ThemedText>
            </View>
            <View style={styles.progressStatItem}>
              <ThemedText style={[styles.progressStatLabel, { color: colors.text }]}>In Use</ThemedText>
              <ThemedText style={[styles.progressStatValue, { color: colors.warning }]}>
                {resource.totalQuantity - resource.availableQuantity}
              </ThemedText>
            </View>
            <View style={styles.progressStatItem}>
              <ThemedText style={[styles.progressStatLabel, { color: colors.text }]}>Total</ThemedText>
              <ThemedText style={[styles.progressStatValue, { color: colors.text }]}>
                {resource.totalQuantity}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Condition & Status (pills) */}
        <View style={styles.conditionStatusRow}>
          <View style={[styles.conditionPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.conditionPillIconWrap, { backgroundColor: `${getConditionColor(resource.condition)}18` }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={getConditionColor(resource.condition)} />
            </View>
            <View style={styles.conditionPillContent}>
              <ThemedText style={[styles.conditionPillLabel, { color: colors.text }]}>Condition</ThemedText>
              <ThemedText style={[styles.conditionPillValue, { color: getConditionColor(resource.condition) }]} numberOfLines={1}>
                {resource.condition.replace('_', ' ').charAt(0).toUpperCase() + resource.condition.replace('_', ' ').slice(1)}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.statusPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.conditionPillIconWrap, { backgroundColor: `${getStatusColor(resource.status)}18` }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={getStatusColor(resource.status)} />
            </View>
            <View style={styles.conditionPillContent}>
              <ThemedText style={[styles.conditionPillLabel, { color: colors.text }]}>Status</ThemedText>
              <ThemedText style={[styles.conditionPillValue, { color: getStatusColor(resource.status) }]} numberOfLines={1}>
                {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Tags */}
        {resource.tags.length > 0 && (
          <View style={[styles.tagsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.tagsHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: `${colors.primary}12` }]}>
                <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
              </View>
              <ThemedText style={[styles.tagsTitle, { color: colors.text }]}>Tags</ThemedText>
            </View>
            <View style={styles.tagsContainer}>
              {resource.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}35` }]}>
                  <ThemedText style={[styles.tagText, { color: colors.primary }]} numberOfLines={1}>{tag}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Resource Images */}
        {resource.images && resource.images.length > 0 && (
          <View style={[styles.imagesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.imagesHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: `${colors.primary}12` }]}>
                <Ionicons name="images-outline" size={18} color={colors.primary} />
              </View>
              <ThemedText style={[styles.imagesTitle, { color: colors.text }]}>
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
  color: string;
  backgroundColor: string;
  borderColor: string;
}

function StatCard({ icon, label, value, color, backgroundColor, borderColor }: StatCardProps) {
  return (
    <View style={[styles.statPill, { backgroundColor, borderColor }]}>
      <View style={[styles.statPillIconWrap, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.statPillContent}>
        <ThemedText style={[styles.statPillValue, { color }]} numberOfLines={1}>{value}</ThemedText>
        <ThemedText style={styles.statPillLabel} numberOfLines={1}>{label}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    ...Platform.select({
      web: {
        padding: 24,
      },
    }),
  },
  contentWrapper: {
    flex: 1,
  },
  webContentWrapper: {
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    gap: 12,
    flex: 1,
    minWidth: '47%',
    ...Platform.select({
      web: {
        minWidth: '22%',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 14,
      },
    }),
  },
  statPillIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statPillContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  statPillValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
    ...Platform.select({
      web: {
        fontSize: 22,
      },
    }),
  },
  statPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.75,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    ...Platform.select({
      web: {
        fontSize: 12,
      },
    }),
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
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
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
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    ...Platform.select({
      web: {
        paddingHorizontal: 14,
        paddingVertical: 7,
      },
    }),
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    ...Platform.select({
      web: {
        fontSize: 13,
      },
    }),
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

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
        {/* Hero Section with Key Info */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <View style={[styles.heroIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name={getCategoryIcon(resource.category) as any} size={32} color={colors.primary} />
              </View>
              <View style={styles.heroTextContainer}>
                <ThemedText style={styles.heroTitle}>{resource.name}</ThemedText>
                <View style={styles.heroMeta}>
                  <View style={[styles.categoryChip, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name={getCategoryIcon(resource.category) as any} size={14} color={colors.primary} />
                    <ThemedText style={[styles.categoryText, { color: colors.primary }]}>
                      {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
                    </ThemedText>
                  </View>
                  {resource.location && (
                    <View style={styles.locationChip}>
                      <Ionicons name="location-outline" size={14} color={colors.text} style={{ opacity: 0.6 }} />
                      <ThemedText style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                        {resource.location}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.heroRight}>
              <View style={[styles.statusChip, { 
                backgroundColor: `${getStatusColor(resource.status)}20`,
                borderColor: getStatusColor(resource.status)
              }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(resource.status) }]} />
                <ThemedText style={[styles.statusText, { color: getStatusColor(resource.status) }]}>
                  {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
                </ThemedText>
              </View>
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
          />
          <StatCard
            icon="checkmark-circle"
            label="Available"
            value={resource.availableQuantity}
            color={colors.success}
            backgroundColor={`${colors.success}15`}
          />
          <StatCard
            icon="people"
            label="In Use"
            value={resource.totalQuantity - resource.availableQuantity}
            color={colors.warning}
            backgroundColor={`${colors.warning}15`}
          />
          <StatCard
            icon="trending-up"
            label="Availability"
            value={`${availabilityPercentage.toFixed(0)}%`}
            color={availabilityPercentage > 30 ? colors.success : colors.warning}
            backgroundColor={availabilityPercentage > 30 ? `${colors.success}15` : `${colors.warning}15`}
          />
        </View>

        {/* Availability Progress */}
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.progressHeader}>
            <View style={styles.progressHeaderLeft}>
              <Ionicons name="bar-chart" size={20} color={colors.primary} />
              <ThemedText style={[styles.progressTitle, { color: colors.text }]}>
                Availability Overview
              </ThemedText>
            </View>
            <ThemedText style={[styles.progressPercentage, { 
              color: availabilityPercentage > 30 ? colors.success : colors.warning 
            }]}>
              {availabilityPercentage.toFixed(1)}%
            </ThemedText>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  backgroundColor: availabilityPercentage > 30 ? colors.success : colors.warning,
                  width: `${availabilityPercentage}%` 
                }
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

        {/* Condition & Status */}
        <View style={styles.conditionStatusRow}>
          <View style={[styles.conditionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.conditionHeader}>
              <Ionicons name="shield-checkmark" size={18} color={getConditionColor(resource.condition)} />
              <ThemedText style={[styles.conditionLabel, { color: colors.text }]}>Condition</ThemedText>
            </View>
            <View style={[styles.conditionBadge, { 
              backgroundColor: `${getConditionColor(resource.condition)}20`,
              borderColor: getConditionColor(resource.condition)
            }]}>
              <View style={[styles.conditionDot, { backgroundColor: getConditionColor(resource.condition) }]} />
              <ThemedText style={[styles.conditionText, { color: getConditionColor(resource.condition) }]}>
                {resource.condition.replace('_', ' ').charAt(0).toUpperCase() + resource.condition.replace('_', ' ').slice(1)}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statusHeader}>
              <Ionicons name="checkmark-circle" size={18} color={getStatusColor(resource.status)} />
              <ThemedText style={[styles.statusLabel, { color: colors.text }]}>Status</ThemedText>
            </View>
            <View style={[styles.statusBadge, { 
              backgroundColor: `${getStatusColor(resource.status)}20`,
              borderColor: getStatusColor(resource.status)
            }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(resource.status) }]} />
              <ThemedText style={[styles.statusText, { color: getStatusColor(resource.status) }]}>
                {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Tags */}
        {resource.tags.length > 0 && (
          <View style={[styles.tagsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.tagsHeader}>
              <Ionicons name="pricetag" size={20} color={colors.primary} />
              <ThemedText style={[styles.tagsTitle, { color: colors.text }]}>Tags</ThemedText>
            </View>
            <View style={styles.tagsContainer}>
              {resource.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]}>
                  <Ionicons name="pricetag" size={12} color={colors.primary} />
                  <ThemedText style={[styles.tagText, { color: colors.primary }]}>{tag}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Resource Images */}
        {resource.images && resource.images.length > 0 && (
          <View style={[styles.imagesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.imagesHeader}>
              <Ionicons name="images" size={20} color={colors.primary} />
              <ThemedText style={[styles.imagesTitle, { color: colors.text }]}>
                Resource Images ({resource.images.length})
              </ThemedText>
            </View>
            <View style={styles.imagesGrid}>
              {resource.images.map((imageUri, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.imageItem, 
                    { 
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    }
                  ]}
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
}

function StatCard({ icon, label, value, color, backgroundColor }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor }]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    ...Platform.select({
      web: {
        padding: 28,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLeft: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 16,
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 30,
    ...Platform.select({
      web: {
        fontSize: 28,
        lineHeight: 34,
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
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  locationText: {
    fontSize: 13,
    opacity: 0.7,
  },
  heroRight: {
    alignItems: 'flex-end',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  descriptionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.8,
    ...Platform.select({
      web: {
        fontSize: 16,
        lineHeight: 24,
      },
    }),
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    ...Platform.select({
      web: {
        gap: 16,
        marginBottom: 24,
      },
    }),
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      web: {
        minWidth: '23%',
        padding: 20,
      },
      default: {
      },
    }),
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    ...Platform.select({
      web: {
        fontSize: 32,
      },
    }),
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
    textAlign: 'center',
    ...Platform.select({
      web: {
        fontSize: 13,
      },
    }),
  },
  
  // Progress Card
  progressCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    ...Platform.select({
      web: {
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    ...Platform.select({
      web: {
        fontSize: 20,
      },
    }),
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
    ...Platform.select({
      web: {
        fontSize: 28,
      },
    }),
  },
  progressTrack: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStatItem: {
    alignItems: 'center',
  },
  progressStatLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
    fontWeight: '500',
  },
  progressStatValue: {
    fontSize: 18,
    fontWeight: '700',
    ...Platform.select({
      web: {
        fontSize: 20,
      },
    }),
  },
  
  // Condition & Status Row
  conditionStatusRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    ...Platform.select({
      web: {
        gap: 16,
        marginBottom: 24,
      },
    }),
  },
  conditionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    ...Platform.select({
      web: {
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      },
    }),
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  conditionLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
    ...Platform.select({
      web: {
        fontSize: 15,
      },
    }),
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    alignSelf: 'flex-start',
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
    ...Platform.select({
      web: {
        fontSize: 15,
      },
    }),
  },
  statusCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    ...Platform.select({
      web: {
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      },
    }),
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
    ...Platform.select({
      web: {
        fontSize: 15,
      },
    }),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    alignSelf: 'flex-start',
  },
  
  // Tags Card
  tagsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    ...Platform.select({
      web: {
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  tagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  tagsTitle: {
    fontSize: 18,
    fontWeight: '700',
    ...Platform.select({
      web: {
        fontSize: 20,
      },
    }),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
    ...Platform.select({
      web: {
        paddingHorizontal: 16,
        paddingVertical: 10,
      },
    }),
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    ...Platform.select({
      web: {
        fontSize: 14,
      },
    }),
  },
  
  // Images Card
  imagesCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    ...Platform.select({
      web: {
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  imagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  imagesTitle: {
    fontSize: 18,
    fontWeight: '700',
    ...Platform.select({
      web: {
        fontSize: 20,
      },
    }),
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    ...Platform.select({
      web: {
        gap: 16,
      },
    }),
  },
  imageItem: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    aspectRatio: 1,
    ...Platform.select({
      web: {
        width: '31%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      default: {
        width: '47%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

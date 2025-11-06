import { memo, useRef, useState } from 'react';
import {
    Animated,
    Image,
    Platform,
    TouchableOpacity,
    View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Resource, ResourceCategory } from '@/types/Resource';
import { Ionicons } from '@expo/vector-icons';

import { styles } from './ResourceCard.styles';
import { ResourceCardActions } from './ResourceCardActions';

interface ResourceCardProps {
  resource: Resource;
  onPress: (resource: Resource) => void;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  onBorrow: (resource: Resource) => void;
  onReturn: (resource: Resource) => void;
  isActionsMenuOpen: boolean;
  onActionsMenuToggle: (resourceId: string, cardPosition?: { x: number; y: number; width: number; height: number }) => void;
}

export const ResourceCard = memo(function ResourceCard({ 
  resource, 
  onPress, 
  onEdit, 
  onDelete, 
  onBorrow, 
  onReturn,
  isActionsMenuOpen,
  onActionsMenuToggle
}: ResourceCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [scaleValue] = useState(new Animated.Value(1));
  const cardRef = useRef<View>(null);
  
  const handleActionsMenuToggle = () => {
    if (cardRef.current) {
      cardRef.current.measure((x, y, width, height, pageX, pageY) => {
        onActionsMenuToggle(resource.id, { x: pageX, y: pageY, width, height });
      });
    } else {
      onActionsMenuToggle(resource.id);
    }
  };
  
  const availabilityPercentage = (resource.availableQuantity / resource.totalQuantity) * 100;
  const statusColor = availabilityPercentage > 70 
    ? '#10B981' // green
    : availabilityPercentage > 30 
      ? '#F59E0B' // orange
      : '#EF4444'; // red

  const getCategoryColor = (category: ResourceCategory) => {
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
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return '#059669';
      case 'good': return '#65A30D';
      case 'fair': return '#D97706';
      case 'poor': return '#DC2626';
      case 'needs_repair': return '#B91C1C';
      default: return '#6B7280';
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'EXCELLENT';
      case 'good': return 'GOOD';
      case 'fair': return 'FAIR';
      case 'poor': return 'POOR';
      case 'needs_repair': return 'NEEDS REPAIR';
      default: return 'UNKNOWN';
    }
  };

  const categoryColor = getCategoryColor(resource.category);
  const conditionColor = getConditionColor(resource.condition);
  
  // Check if this is an external resource
  const isExternalResource = resource.resourceType === 'external';
  const isBorrowable = resource.isBorrowable !== false; // Default to true for backward compatibility

  const getCategoryIcon = (category: ResourceCategory) => {
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
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity 
        ref={cardRef}
        style={[styles.resourceCard, { 
          backgroundColor: isExternalResource ? '#FFF8E1' : colors.surface,
          borderColor: isExternalResource ? '#FFB74D' : colors.border,
          borderLeftWidth: isExternalResource ? 4 : 1,
          ...Platform.select({
            ios: {
              shadowColor: isExternalResource ? '#FFB74D' : colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isExternalResource ? 0.15 : 0.1,
              shadowRadius: 4,
            },
            android: {
              elevation: isExternalResource ? 3 : 2,
            },
          }),
        }]}
        onPress={() => onPress(resource)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Image */}
          <View style={styles.imageContainer}>
            {resource.images && resource.images.length > 0 ? (
              <Image 
                source={{ uri: resource.images[0] }} 
                style={styles.resourceImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: categoryColor + '20' }]}>
                <Ionicons 
                  name={getCategoryIcon(resource.category)} 
                  size={20} 
                  color={categoryColor} 
                />
              </View>
            )}
          </View>

          {/* Main Content Section */}
          <View style={styles.contentSection}>
            {/* Row 1: Title + Condition + Actions */}
            <View style={styles.topRow}>
              <ThemedText style={[styles.resourceTitle, { color: colors.text }]} numberOfLines={1}>
                {resource.name}
              </ThemedText>
              <View style={styles.topRightGroup}>
                <View style={[styles.conditionChip, { backgroundColor: conditionColor + '20', marginRight: 6 }]}>
                  <ThemedText style={[styles.conditionText, { color: conditionColor }]}>
                    {getConditionText(resource.condition)}
                  </ThemedText>
                </View>
                <ResourceCardActions
                  resource={resource}
                  onBorrow={onBorrow}
                  onReturn={onReturn}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onActionsMenuToggle={handleActionsMenuToggle}
                  isActionsMenuOpen={isActionsMenuOpen}
                  colors={colors}
                />
              </View>
            </View>

            {/* Row 2: Meta Info (Category, Location, External) */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name={getCategoryIcon(resource.category)} size={12} color={categoryColor} style={{ marginRight: 4 }} />
                <ThemedText style={[styles.metaText, { color: colors.text }]}>
                  {resource.category.toUpperCase()}
                </ThemedText>
              </View>
              {resource.location && (
                <>
                  <ThemedText style={[styles.metaSeparator, { color: colors.text }]}>•</ThemedText>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={12} color={colors.text} style={{ opacity: 0.6, marginRight: 4 }} />
                    <ThemedText style={[styles.metaText, { color: colors.text }]} numberOfLines={1}>
                      {resource.location}
                    </ThemedText>
                  </View>
                </>
              )}
              {isExternalResource && (
                <>
                  <ThemedText style={[styles.metaSeparator, { color: colors.text }]}>•</ThemedText>
                  <View style={[styles.externalBadgeInline, { backgroundColor: '#FFB74D20' }]}>
                    <ThemedText style={[styles.externalTextInline, { color: '#FF8F00' }]}>
                      EXTERNAL
                    </ThemedText>
                  </View>
                </>
              )}
            </View>

            {/* Row 3: Availability */}
            <View style={styles.availabilityRow}>
              <ThemedText style={[styles.availabilityText, { color: colors.text }]}>
                {resource.availableQuantity}/{resource.totalQuantity} Available
              </ThemedText>
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
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

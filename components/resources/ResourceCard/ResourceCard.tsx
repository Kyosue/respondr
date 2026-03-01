import { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Resource, ResourceCategory } from '@/types/Resource';
import { Ionicons } from '@expo/vector-icons';

import { styles } from './ResourceCard.styles';
import { ResourceCardActions } from './ResourceCardActions';

// ---- Helpers ----
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

function getCategoryIcon(category: ResourceCategory): keyof typeof Ionicons.glyphMap {
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

function getConditionLabel(condition: string): string {
  switch (condition) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Good';
    case 'fair': return 'Fair';
    case 'poor': return 'Poor';
    case 'needs_repair': return 'Needs repair';
    default: return condition;
  }
}

// ---- Animated progress bar (vertical bars) ----
interface AnimatedProgressBarProps {
  percentage: number;
  color: string;
  totalBars?: number;
}

function AnimatedProgressBar({ percentage, color, totalBars = 20 }: AnimatedProgressBarProps) {
  const activeBars = Math.round((percentage / 100) * totalBars);
  const barAnimations = useRef(
    Array.from({ length: totalBars }).map(() => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const animations = barAnimations.map((anim, index) => {
      const isActive = index < activeBars;
      const delay = index * 8;
      return Animated.parallel([
        Animated.timing(anim.scale, {
          toValue: isActive ? 1 : 0.3,
          duration: 280,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: isActive ? 1 : 0.35,
          duration: 280,
          delay,
          useNativeDriver: true,
        }),
      ]);
    });
    Animated.stagger(0, animations).start();
  }, [activeBars, barAnimations]);

  return (
    <View style={styles.progressBarContainer}>
      {Array.from({ length: totalBars }).map((_, index) => {
        const isActive = index < activeBars;
        const isLast = index === totalBars - 1;
        const anim = barAnimations[index];
        return (
          <Animated.View
            key={index}
            style={[
              styles.progressBarItem,
              !isLast && styles.progressBarItemSpacing,
              isActive && { backgroundColor: color },
              {
                transform: [{ scaleY: anim.scale }],
                opacity: anim.opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// ---- Card component ----
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
  onActionsMenuToggle,
}: ResourceCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const cardRef = useRef<View>(null);

  const handleActionsMenuToggle = () => {
    if (cardRef.current) {
      cardRef.current.measure((_x, _y, width, height, pageX, pageY) => {
        onActionsMenuToggle(resource.id, { x: pageX, y: pageY, width, height });
      });
    } else {
      onActionsMenuToggle(resource.id);
    }
  };

  const availabilityPercentage = resource.totalQuantity > 0
    ? (resource.availableQuantity / resource.totalQuantity) * 100
    : 0;
  const statusColor =
    availabilityPercentage > 70 ? '#10B981'
    : availabilityPercentage > 30 ? '#F59E0B'
    : '#EF4444';

  const categoryColor = getCategoryColor(resource.category);
  const conditionColor = getConditionColor(resource.condition);
  const isExternal = resource.resourceType === 'external';

  const cardBg = isExternal ? (colors.warning ?? '#FF8F00') + '12' : colors.surface;
  const cardBorder = isExternal ? (colors.warning ?? '#FF8F00') + '50' : colors.border;
  const borderLeftWidth = isExternal ? 4 : 1;

  return (
    <TouchableOpacity
      ref={cardRef}
      style={[
        styles.resourceCard,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
          borderLeftWidth,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isExternal ? 0.12 : 0.08,
              shadowRadius: 4,
            },
            android: {
              elevation: isExternal ? 3 : 2,
            },
          }),
        },
      ]}
      onPress={() => onPress(resource)}
      activeOpacity={0.72}
    >
      <View style={styles.cardContent}>
        {/* Header: image + title + condition + actions */}
        <View style={styles.headerRow}>
          <View style={styles.imageWrapper}>
            {resource.images && resource.images.length > 0 ? (
              <Image
                source={{ uri: resource.images[0] }}
                style={styles.resourceImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: categoryColor + '22' }]}>
                <Ionicons name={getCategoryIcon(resource.category)} size={18} color={categoryColor} />
              </View>
            )}
          </View>

          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <ThemedText style={[styles.resourceTitle, { color: colors.text }]} numberOfLines={1}>
                {resource.name}
              </ThemedText>
              <View style={[styles.conditionPill, { backgroundColor: conditionColor + '20' }]}>
                <ThemedText style={[styles.conditionPillText, { color: conditionColor }]}>
                  {getConditionLabel(resource.condition)}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.actionsWrap}>
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

        {/* Meta: category · location (single line) */}
        <View style={styles.metaSection}>
          <View style={[styles.metaItem, { flexShrink: 0 }]}>
            <Ionicons name={getCategoryIcon(resource.category)} size={10} color={categoryColor} />
            <ThemedText style={[styles.metaText, { color: colors.text }]} numberOfLines={1}>
              {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
            </ThemedText>
          </View>
          {resource.location ? (
            <>
              <ThemedText style={[styles.metaDot, { color: colors.text }]}>·</ThemedText>
              <View style={[styles.metaItem, { flex: 1, minWidth: 0 }]}>
                <Ionicons name="location-outline" size={10} color={colors.text} style={{ opacity: 0.7 }} />
                <ThemedText style={[styles.metaText, { color: colors.text }]} numberOfLines={1}>
                  {resource.location}
                </ThemedText>
              </View>
            </>
          ) : null}
          {isExternal && (
            <View style={[styles.externalPill, { backgroundColor: (colors.warning ?? '#FF8F00') + '22' }]}>
              <ThemedText style={[styles.externalPillText, { color: colors.warning ?? '#E65100' }]}>
                Ext
              </ThemedText>
            </View>
          )}
        </View>

        {/* Availability */}
        <View style={styles.availabilitySection}>
          <ThemedText style={[styles.availabilityLabel, { color: colors.text }]}>
            {resource.availableQuantity} / {resource.totalQuantity}
          </ThemedText>
          <AnimatedProgressBar
            percentage={availabilityPercentage}
            color={statusColor}
            totalBars={Platform.OS === 'web' ? 32 : 24}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
});

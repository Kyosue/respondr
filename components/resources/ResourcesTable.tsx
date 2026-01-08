import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Resource, ResourceCategory } from '@/types/Resource';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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

// Animated Count Display Component
interface AnimatedCountProps {
  availableQuantity: number;
  totalQuantity: number;
  colors: any;
  textStyle?: any;
}

function AnimatedCount({ availableQuantity, totalQuantity, colors, textStyle }: AnimatedCountProps) {
  const availableCountAnimation = useRef(new Animated.Value(0)).current;
  const totalCountAnimation = useRef(new Animated.Value(0)).current;
  const [displayAvailable, setDisplayAvailable] = useState(0);
  const [displayTotal, setDisplayTotal] = useState(0);

  useEffect(() => {
    // Animate available quantity
    Animated.timing(availableCountAnimation, {
      toValue: availableQuantity,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Animate total quantity
    Animated.timing(totalCountAnimation, {
      toValue: totalQuantity,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Update display values as animation progresses
    const availableListener = availableCountAnimation.addListener(({ value }) => {
      setDisplayAvailable(Math.floor(value));
    });

    const totalListener = totalCountAnimation.addListener(({ value }) => {
      setDisplayTotal(Math.floor(value));
    });

    return () => {
      availableCountAnimation.removeListener(availableListener);
      totalCountAnimation.removeListener(totalListener);
    };
  }, [availableQuantity, totalQuantity, availableCountAnimation, totalCountAnimation]);

  const defaultStyle = textStyle || [styles.tableCellText, { color: colors.text, opacity: 0.8 }];
  
  return (
    <ThemedText style={defaultStyle}>
      {displayAvailable}/{displayTotal}
    </ThemedText>
  );
}

// Animated Progress Bar Component with Vertical Bars
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
      const delay = index * 10; // 10ms delay between each bar
      
      return Animated.parallel([
        Animated.timing(anim.scale, {
          toValue: isActive ? 1 : 0.3,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: isActive ? 1 : 0.3,
          duration: 300,
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate pagination
  const totalItems = resources.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResources = resources.slice(startIndex, endIndex);
  const showingCount = paginatedResources.length;
  const startCount = startIndex + 1;
  const endCount = startIndex + showingCount;

  // Reset to page 1 if current page is out of bounds or when resources list changes
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Reset to page 1 when resources list changes (e.g., filters applied)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [resources.length]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

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
                          {resource.agencyName && (
                            <>
                              <View style={styles.externalDivider} />
                              <ThemedText
                                style={[styles.externalAgencyText, { color: '#FF8F00' }]}
                                numberOfLines={1}
                              >
                                {resource.agencyName}
                              </ThemedText>
                            </>
                          )}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <AnimatedCount 
                        availableQuantity={resource.availableQuantity}
                        totalQuantity={resource.totalQuantity}
                        colors={colors}
                        textStyle={[styles.mobileText, { color: colors.text, opacity: 0.7 }]}
                      />
                      <ThemedText style={[styles.mobileText, { color: colors.text, opacity: 0.7, marginLeft: 4 }]}>
                        Available
                      </ThemedText>
                    </View>
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
        
        {/* Pagination Footer for Mobile */}
        {totalPages > 1 && (
          <View style={[styles.paginationFooter, styles.paginationFooterMobile, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={styles.paginationCounter}>
              <ThemedText style={[styles.paginationCounterText, { color: colors.text }]}>
                {showingCount > 0 ? `${startCount}-${endCount}` : '0'} of {totalItems}
              </ThemedText>
            </View>
            <View style={styles.paginationControls}>
              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  { 
                    backgroundColor: currentPage === 1 ? 'transparent' : `${colors.primary}20`,
                    borderColor: colors.border,
                    opacity: currentPage === 1 ? 0.5 : 1,
                  }
                ]}
                onPress={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Ionicons 
                  name="chevron-back" 
                  size={16} 
                  color={currentPage === 1 ? colors.text : colors.primary} 
                />
              </TouchableOpacity>

              {getPageNumbers().map((page, index) => {
                if (page === 'ellipsis') {
                  return (
                    <View key={`ellipsis-${index}`} style={styles.paginationEllipsis}>
                      <ThemedText style={[styles.paginationEllipsisText, { color: colors.text }]}>
                        ...
                      </ThemedText>
                    </View>
                  );
                }

                const isActive = page === currentPage;
                return (
                  <TouchableOpacity
                    key={page}
                    style={[
                      styles.paginationPageButton,
                      {
                        backgroundColor: isActive ? colors.primary : 'transparent',
                        borderColor: isActive ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => handlePageChange(page as number)}
                  >
                    <ThemedText
                      style={[
                        styles.paginationPageButtonText,
                        {
                          color: isActive ? '#FFFFFF' : colors.text,
                          fontWeight: isActive ? '700' : '500',
                        }
                      ]}
                    >
                      {page}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  { 
                    backgroundColor: currentPage === totalPages ? 'transparent' : `${colors.primary}20`,
                    borderColor: colors.border,
                    opacity: currentPage === totalPages ? 0.5 : 1,
                  }
                ]}
                onPress={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={currentPage === totalPages ? colors.text : colors.primary} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ThemedView>
    );
  }

  return (
    <View style={[styles.tableContainer, { borderColor: colors.border }]}>
      {/* Sticky Header */}
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
          <View style={[styles.tableHeaderCell, styles.tableHeaderCellCondition]}>
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
        
        {/* Scrollable Table Body */}
        <ScrollView 
          style={styles.tableBodyScroll}
          contentContainerStyle={styles.tableBodyContent}
          showsVerticalScrollIndicator={true}
        >
        {paginatedResources.map((resource, index) => {
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
                    <ThemedText 
                      style={[styles.tableCellText, { color: colors.text }]} 
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {resource.name}
                    </ThemedText>
                    {isExternalResource && (
                      <View style={[styles.externalBadgeInline, { backgroundColor: '#FFB74D20' }]}>
                        <ThemedText style={[styles.externalTextInline, { color: '#FF8F00' }]}>
                          EXTERNAL
                        </ThemedText>
                        {resource.agencyName && (
                          <>
                            <View style={styles.externalDivider} />
                            <ThemedText
                              style={[styles.externalAgencyTextInline, { color: '#FF8F00' }]}
                              numberOfLines={1}
                            >
                              {resource.agencyName}
                            </ThemedText>
                          </>
                        )}
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
              <View style={[styles.tableCell, styles.tableCellCondition]}>
                <View style={[styles.conditionBadge, { backgroundColor: `${conditionColor}20` }]}>
                  <ThemedText style={[styles.conditionText, { color: conditionColor }]}>
                    {getConditionText(resource.condition)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.tableCell}>
                {resource.location ? (
                  <View style={styles.locationCell}>
                    <Ionicons name="location-outline" size={12} color={colors.text} style={{ opacity: 0.5, marginRight: 6, flexShrink: 0 }} />
                    <ThemedText 
                      style={[styles.tableCellText, styles.locationText, { color: colors.text, opacity: 0.8 }]} 
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
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
                  <AnimatedCount 
                    availableQuantity={resource.availableQuantity}
                    totalQuantity={resource.totalQuantity}
                    colors={colors}
                  />
                </View>
                <AnimatedProgressBar 
                  percentage={availabilityPercentage} 
                  color={statusColor}
                  totalBars={Platform.OS === 'web' ? 30 : 20}
                />
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
        </ScrollView>

      {/* Sticky Pagination Footer */}
      {totalPages > 1 && (
        <View style={[styles.paginationFooter, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          {/* Counter on the left */}
          <View style={styles.paginationCounter}>
            <ThemedText style={[styles.paginationCounterText, { color: colors.text }]}>
              {showingCount > 0 ? `${startCount}-${endCount}` : '0'} of {totalItems}
            </ThemedText>
          </View>

          {/* Pagination controls on the right */}
          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                { 
                  backgroundColor: currentPage === 1 ? 'transparent' : `${colors.primary}20`,
                  borderColor: colors.border,
                  opacity: currentPage === 1 ? 0.5 : 1,
                }
              ]}
              onPress={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Ionicons 
                name="chevron-back" 
                size={16} 
                color={currentPage === 1 ? colors.text : colors.primary} 
              />
            </TouchableOpacity>

            {getPageNumbers().map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <View key={`ellipsis-${index}`} style={styles.paginationEllipsis}>
                    <ThemedText style={[styles.paginationEllipsisText, { color: colors.text }]}>
                      ...
                    </ThemedText>
                  </View>
                );
              }

              const isActive = page === currentPage;
              return (
                <TouchableOpacity
                  key={page}
                  style={[
                    styles.paginationPageButton,
                    {
                      backgroundColor: isActive ? colors.primary : 'transparent',
                      borderColor: isActive ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => handlePageChange(page as number)}
                >
                  <ThemedText
                    style={[
                      styles.paginationPageButtonText,
                      {
                        color: isActive ? '#FFFFFF' : colors.text,
                        fontWeight: isActive ? '700' : '500',
                      }
                    ]}
                  >
                    {page}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[
                styles.paginationButton,
                { 
                  backgroundColor: currentPage === totalPages ? 'transparent' : `${colors.primary}20`,
                  borderColor: colors.border,
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }
              ]}
              onPress={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Ionicons 
                name="chevron-forward" 
                size={16} 
                color={currentPage === totalPages ? colors.text : colors.primary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  tableContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
    minHeight: 400,
  },
  tableBodyScroll: {
    flex: 1,
  },
  tableBodyContent: {
    flexGrow: 1,
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
    position: 'sticky' as any,
    top: 0,
    zIndex: 10,
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
  tableHeaderCellCondition: {
    flex: 0.7,
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
    minWidth: 0,
    overflow: 'hidden',
  },
  tableCellName: {
    flex: 2,
  },
  tableCellActions: {
    flex: 1.5,
    alignItems: 'center',
  },
  tableCellCondition: {
    flex: 0.7,
  },
  tableCellText: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    flexShrink: 1,
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
    overflow: 'hidden',
  },
  locationCell: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  locationText: {
    flex: 1,
    minWidth: 0,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '100%',
    overflow: 'hidden',
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
    maxWidth: '100%',
    overflow: 'hidden',
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
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 12,
    width: '100%',
    marginTop: 4,
    ...(Platform.OS !== 'web' && {
      height: 10,
    }),
  },
  progressBarItem: {
    width: 3,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 1.5,
    ...(Platform.OS !== 'web' && {
      width: 2.5,
    }),
  },
  progressBarItemSpacing: {
    marginRight: 2,
    ...(Platform.OS !== 'web' && {
      marginRight: 1.5,
    }),
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  externalAgencyText: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  externalAgencyTextInline: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  externalDivider: {
    width: 3,
    height: 3,
    borderRadius: 3,
    backgroundColor: '#FF8F00',
    opacity: 0.85,
  },
  externalTextInline: {
    fontSize: 9,
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
  paginationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    position: 'sticky' as any,
    bottom: 0,
    zIndex: 10,
  },
  paginationFooterMobile: {
    position: 'relative' as any,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  paginationCounter: {
    flex: 1,
  },
  paginationCounterText: {
    fontSize: 13,
    fontFamily: 'Gabarito',
    opacity: 0.7,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationPageButton: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationPageButtonText: {
    fontSize: 13,
    fontFamily: 'Gabarito',
  },
  paginationEllipsis: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationEllipsisText: {
    fontSize: 13,
    fontFamily: 'Gabarito',
    opacity: 0.5,
  },
});


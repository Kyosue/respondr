import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { useHybridRamp } from '../../../hooks/useHybridRamp';
import { Resource, ResourceCategory } from '../../../types/Resource';
import { getModalConfig } from '../../../utils/modalUtils';
import { ThemedText } from '../../ThemedText';
import { WebOptimizedImage } from '../../ui/WebOptimizedImage';

interface OperationResource {
  resourceId: string;
  resourceName: string;
  category: ResourceCategory;
  quantity: number;
  status: 'requested' | 'allocated' | 'in_use' | 'returned';
}

interface ResourceSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedResources: OperationResource[]) => void;
  availableResources: Resource[];
  selectedResources: OperationResource[];
  colors: any;
}

export function ResourceSelectionModal({
  visible,
  onClose,
  onConfirm,
  availableResources,
  selectedResources,
  colors
}: ResourceSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelectedResources, setTempSelectedResources] = useState<OperationResource[]>(selectedResources);
  const colorScheme = useColorScheme();
  
  // Hybrid RAMP hook
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose: () => {
      setSearchQuery('');
      onClose();
    }
  });
  
  // Sync tempSelectedResources with selectedResources prop changes
  useEffect(() => {
    setTempSelectedResources(selectedResources);
  }, [selectedResources]);
  
  // Memoize filtered resources to prevent unnecessary recalculations
  const filteredResources = useMemo(() => {
    return availableResources.filter(resource =>
      resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [availableResources, searchQuery]);
  
  // Responsive grid logic
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth > 600 && screenWidth <= 768;
  
  // Calculate cards per row based on screen size
  const getCardsPerRow = () => {
    if (isWeb) return 4; // 4 cards per row on web
    if (isTablet) return 3; // 3 cards per row on tablet
    return 2; // 2 cards per row on mobile
  };
  
  const cardsPerRow = getCardsPerRow();
  const cardWidth = (100 / cardsPerRow) - 2; // 2% margin between cards

  const isResourceSelected = (resourceId: string) => {
    return tempSelectedResources.some(r => r.resourceId === resourceId);
  };

  const handleResourceSelect = (resource: Resource) => {
    const existingResource = tempSelectedResources.find(r => r.resourceId === resource.id);
    
    if (existingResource) {
      // If resource is already selected, remove it
      setTempSelectedResources(prev => prev.filter(r => r.resourceId !== resource.id));
    } else {
      // If resource is not selected, add it with quantity 1 (or max available if 0)
      // Ensure we don't exceed available quantity
      const initialQuantity = Math.min(1, resource.availableQuantity);
      
      if (initialQuantity > 0) {
        const newResource: OperationResource = {
          resourceId: resource.id,
          resourceName: resource.name,
          category: resource.category,
          quantity: initialQuantity,
          status: 'requested'
        };
        setTempSelectedResources(prev => [...prev, newResource]);
      }
    }
  };

  const handleResourceDeselect = (resourceId: string) => {
    setTempSelectedResources(prev => prev.filter(r => r.resourceId !== resourceId));
  };

  const handleQuantityChange = (resourceId: string, quantity: number) => {
    // Find the resource to get its availability
    const resource = availableResources.find(r => r.id === resourceId);
    if (!resource) return;

    // If quantity is 0 or less, remove the resource
    if (quantity <= 0) {
      setTempSelectedResources(prev => prev.filter(r => r.resourceId !== resourceId));
      return;
    }

    // Ensure quantity doesn't exceed available quantity
    const maxQuantity = resource.availableQuantity;
    const clampedQuantity = Math.min(quantity, maxQuantity);

    // Only update if the quantity is valid (at least 1 and not exceeding available)
    if (clampedQuantity >= 1 && clampedQuantity <= maxQuantity) {
      setTempSelectedResources(prev =>
        prev.map(r =>
          r.resourceId === resourceId ? { ...r, quantity: clampedQuantity } : r
        )
      );
    }
  };

  const handleQuantityInputChange = (resourceId: string, inputValue: string) => {
    // Find the resource to get its availability
    const resource = availableResources.find(r => r.id === resourceId);
    if (!resource) return;

    // Remove non-numeric characters
    const numericValue = inputValue.replace(/[^0-9]/g, '');
    
    // Allow empty input (don't auto-set to 1)
    if (numericValue === '') {
      // Set to empty string temporarily, will be validated on blur
      setTempSelectedResources(prev =>
        prev.map(r =>
          r.resourceId === resourceId ? { ...r, quantity: 0 } : r
        )
      );
      return;
    }

    const quantity = parseInt(numericValue, 10);
    const maxQuantity = resource.availableQuantity;
    const minQuantity = 1;
    
    // Clamp to valid range (1 to maxQuantity)
    let clampedQuantity = quantity;
    if (quantity < minQuantity) {
      clampedQuantity = minQuantity;
    } else if (quantity > maxQuantity) {
      clampedQuantity = maxQuantity;
    }

    // Update quantity
    setTempSelectedResources(prev =>
      prev.map(r =>
        r.resourceId === resourceId ? { ...r, quantity: clampedQuantity } : r
      )
    );
  };

  const handleQuantityInputBlur = (resourceId: string) => {
    // Find the resource to get its availability
    const resource = availableResources.find(r => r.id === resourceId);
    if (!resource) return;

    const selectedResource = tempSelectedResources.find(r => r.resourceId === resourceId);
    if (!selectedResource) return;

    // If quantity is 0 or less, set to minimum (1)
    if (selectedResource.quantity <= 0) {
      setTempSelectedResources(prev =>
        prev.map(r =>
          r.resourceId === resourceId ? { ...r, quantity: 1 } : r
        )
      );
    }
  };

  const handleConfirm = () => {
    onConfirm(tempSelectedResources);
    onClose();
  };

  const handleClose = rampHandleClose; // Use the handleClose from the hook

  // Platform-specific modal rendering
  if (isWeb) {
    // Hybrid RAMP implementation for web
    return (
      <Modal
        visible={visible}
        {...getModalConfig()}
        onRequestClose={handleClose}
        transparent={true}
        animationType="fade"
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.overlayCloseButton} 
            onPress={handleClose}
            activeOpacity={0.7}
          />
          <Animated.View style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ]
            }
          ]}>
            <View style={{
              backgroundColor: colors.background,
              borderRadius: 12,
              overflow: 'hidden',
              width: '100%',
              maxWidth: 900,
              maxHeight: '100%',
              height: '100%'
            }}>
              {/* Header */}
              <View style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                backgroundColor: colors.surface,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <View>
                  <ThemedText style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: colors.text
                  }}>
                    Select Resources
                  </ThemedText>
                  <ThemedText style={{
                    fontSize: 14,
                    color: colors.text + '80',
                    marginTop: 2
                  }}>
                    {tempSelectedResources.length} selected
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Search */}
              <View style={{
                padding: 16,
                backgroundColor: colors.surface,
                borderBottomWidth: 1,
                borderBottomColor: colors.border
              }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: colors.text,
                    backgroundColor: colors.background
                  }}
                  placeholder="Search resources by name, category, or tags..."
                  placeholderTextColor={colors.text + '60'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Resources Grid */}
              <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
              >
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 8
                }}>
                  {filteredResources.map((resource) => {
                    const isSelected = isResourceSelected(resource.id);
                    const selectedResource = tempSelectedResources.find(r => r.resourceId === resource.id);
                    
                    return (
                      <View
                        key={resource.id}
                        style={{
                          width: `${cardWidth}%`,
                          backgroundColor: colors.surface,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primary : colors.border,
                          marginBottom: 8,
                          overflow: 'hidden',
                          minHeight: isWeb ? 200 : 180
                        }}
                      >
                        {/* Clickable Top Section - for selection/deselection */}
                        <TouchableOpacity
                        onPress={() => handleResourceSelect(resource)}
                          activeOpacity={0.7}
                          style={{ flex: 1 }}
                      >
                        {/* Selection Indicator */}
                        {isSelected && (
                          <View style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            backgroundColor: colors.primary,
                            borderRadius: 10,
                            width: 20,
                            height: 20,
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1
                          }}>
                            <Ionicons name="checkmark" size={12} color="white" />
                          </View>
                        )}

                        {/* Resource Image */}
                        <View style={{
                          height: isWeb ? 100 : 90,
                          backgroundColor: colors.border
                        }}>
                          {resource.images && resource.images.length > 0 ? (
                            <WebOptimizedImage
                              source={{ uri: resource.images[0] }}
                              style={{
                                width: '100%',
                                height: '100%'
                              }}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={{
                              flex: 1,
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: colors.border
                            }}>
                              <Ionicons name="cube-outline" size={32} color={colors.text + '60'} />
                            </View>
                          )}
                        </View>

                        {/* Resource Info */}
                        <View style={{ padding: isWeb ? 10 : 8 }}>
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 4
                          }}>
                            <ThemedText style={{
                                fontSize: isWeb ? 13 : 13,
                              fontWeight: '600',
                              color: colors.text,
                              flex: 1
                            }} numberOfLines={1}>
                              {resource.name}
                            </ThemedText>
                            <View style={{
                              backgroundColor: colors.primary + '20',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              marginLeft: 8
                            }}>
                              <ThemedText style={{
                                  fontSize: isWeb ? 10 : 10,
                                color: colors.primary,
                                fontWeight: '600',
                                textTransform: 'uppercase'
                              }}>
                                {resource.category}
                              </ThemedText>
                            </View>
                          </View>

                          <ThemedText style={{
                              fontSize: isWeb ? 11 : 11,
                            color: colors.primary,
                            fontWeight: '600'
                          }}>
                            {resource.availableQuantity}/{resource.totalQuantity} available
                          </ThemedText>
                          </View>
                        </TouchableOpacity>

                        {/* Separate Quantity Selector Container - doesn't trigger deselection */}
                          {isSelected && selectedResource && (
                          <View 
                            style={{
                              padding: isWeb ? 10 : 8,
                              paddingTop: 6,
                              borderTopWidth: 1,
                              borderTopColor: colors.border,
                              backgroundColor: colors.surface
                            }}
                            {...(Platform.OS !== 'web' ? {
                              onStartShouldSetResponder: () => true,
                              onTouchEnd: (e: any) => e.stopPropagation()
                            } : {
                              onClick: (e: any) => e.stopPropagation(),
                              onMouseDown: (e: any) => e.stopPropagation()
                            })}
                          >
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6, gap: 4 }}>
                                <ThemedText style={{
                                fontSize: isWeb ? 11 : 11,
                                  color: colors.text + '80',
                                  textAlign: 'center'
                                }}>
                                  Quantity
                                </ThemedText>
                                {selectedResource.quantity >= resource.availableQuantity && (
                                  <ThemedText style={{
                                  fontSize: isWeb ? 10 : 10,
                                    color: '#EF4444',
                                    fontWeight: '600'
                                  }}>
                                    (Max: {resource.availableQuantity})
                                  </ThemedText>
                                )}
                              </View>
                              <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              width: '100%',
                              maxWidth: '100%',
                              gap: 4
                              }}>
                                <TouchableOpacity
                                  style={{
                                    backgroundColor: selectedResource.quantity <= 1 ? '#9CA3AF' : '#EF4444',
                                    borderRadius: 6,
                                  width: isWeb ? 40 : 36,
                                  height: isWeb ? 40 : 36,
                                  minHeight: isWeb ? 40 : 36,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    opacity: selectedResource.quantity <= 1 ? 0.6 : 1,
                                  }}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(resource.id, selectedResource.quantity - 1);
                                }}
                                  disabled={selectedResource.quantity <= 1}
                                >
                                  <Ionicons name="remove" size={isWeb ? 16 : 14} color="white" />
                                </TouchableOpacity>
                              <TextInput
                                style={{
                                  backgroundColor: colors.background,
                                  borderWidth: 1,
                                  borderColor: colors.border,
                                  borderRadius: 6,
                                  flex: 1,
                                  minWidth: 0,
                                  height: isWeb ? 40 : 36,
                                  minHeight: isWeb ? 40 : 36,
                                  textAlign: 'center',
                                  fontSize: isWeb ? 14 : 13,
                                    fontWeight: '700',
                                  color: colors.text,
                                  paddingHorizontal: 8,
                                  paddingVertical: 0,
                                  includeFontPadding: false,
                                  textAlignVertical: 'center'
                                }}
                                value={selectedResource.quantity > 0 ? selectedResource.quantity.toString() : ''}
                                onChangeText={(text) => {
                                  handleQuantityInputChange(resource.id, text);
                                }}
                                onBlur={() => {
                                  handleQuantityInputBlur(resource.id);
                                }}
                                keyboardType="numeric"
                                selectTextOnFocus
                                onFocus={(e) => e.stopPropagation()}
                                onPressIn={(e) => e.stopPropagation()}
                              />
                                <TouchableOpacity
                                  style={{
                                    backgroundColor: selectedResource.quantity >= resource.availableQuantity ? '#9CA3AF' : '#10B981',
                                    borderRadius: 6,
                                  width: isWeb ? 40 : 36,
                                  height: isWeb ? 40 : 36,
                                  minHeight: isWeb ? 40 : 36,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    opacity: selectedResource.quantity >= resource.availableQuantity ? 0.6 : 1,
                                  }}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(resource.id, selectedResource.quantity + 1);
                                }}
                                  disabled={selectedResource.quantity >= resource.availableQuantity}
                                >
                                  <Ionicons name="add" size={isWeb ? 16 : 14} color="white" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={{
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: colors.surface,
                flexDirection: 'row',
                gap: 12
              }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.border,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center'
                  }}
                  onPress={handleClose}
                >
                  <ThemedText style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center'
                  }}
                  onPress={handleConfirm}
                >
                  <ThemedText style={{
                    color: 'white',
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    Confirm ({tempSelectedResources.length})
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  // Original mobile implementation
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView 
        style={{
          flex: 1,
          backgroundColor: colors.background
        }}
        edges={['top']}
      >
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {/* Header */}
        <View style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <View>
            <ThemedText style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.text
            }}>
              Select Resources
            </ThemedText>
            <ThemedText style={{
              fontSize: 14,
              color: colors.text + '80',
              marginTop: 2
            }}>
              {tempSelectedResources.length} selected
            </ThemedText>
          </View>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{
          padding: 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border
        }}>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 16,
              color: colors.text,
              backgroundColor: colors.background
            }}
            placeholder="Search resources by name, category, or tags..."
            placeholderTextColor={colors.text + '60'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Resources Grid */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            gap: 8
          }}>
            {filteredResources.map((resource) => {
              const isSelected = isResourceSelected(resource.id);
              const selectedResource = tempSelectedResources.find(r => r.resourceId === resource.id);
              
              return (
                <View
                  key={resource.id}
                  style={{
                    width: `${cardWidth}%`,
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                    marginBottom: 8,
                    overflow: 'hidden',
                    minHeight: isWeb ? 200 : 180
                  }}
                >
                  {/* Clickable Top Section - for selection/deselection */}
                  <TouchableOpacity
                  onPress={() => handleResourceSelect(resource)}
                    activeOpacity={0.7}
                    style={{ flex: 1 }}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <View style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      backgroundColor: colors.primary,
                      borderRadius: 10,
                      width: 20,
                      height: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 1
                    }}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}

                  {/* Resource Image */}
                  <View style={{
                    height: isWeb ? 100 : 90,
                    backgroundColor: colors.border
                  }}>
                    {resource.images && resource.images.length > 0 ? (
                      <WebOptimizedImage
                        source={{ uri: resource.images[0] }}
                        style={{
                          width: '100%',
                          height: '100%'
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: colors.border
                      }}>
                        <Ionicons name="cube-outline" size={32} color={colors.text + '60'} />
                      </View>
                    )}
                  </View>

                  {/* Resource Info */}
                  <View style={{ padding: isWeb ? 10 : 8 }}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 4
                    }}>
                      <ThemedText style={{
                        fontSize: isWeb ? 13 : 12,
                        fontWeight: '600',
                        color: colors.text,
                        flex: 1
                      }} numberOfLines={1}>
                        {resource.name}
                      </ThemedText>
                      <View style={{
                        backgroundColor: colors.primary + '20',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        marginLeft: 8
                      }}>
                        <ThemedText style={{
                          fontSize: isWeb ? 10 : 9,
                          color: colors.primary,
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {resource.category}
                        </ThemedText>
                      </View>
                    </View>

                    <ThemedText style={{
                      fontSize: isWeb ? 11 : 10,
                      color: colors.primary,
                      fontWeight: '600'
                    }}>
                      {resource.availableQuantity}/{resource.totalQuantity} available
                    </ThemedText>
                    </View>
                  </TouchableOpacity>

                  {/* Separate Quantity Selector Container - doesn't trigger deselection */}
                    {isSelected && selectedResource && (
                    <View 
                      style={{
                        padding: isWeb ? 10 : 8,
                        paddingTop: 6,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        backgroundColor: colors.surface
                      }}
                      {...(Platform.OS !== 'web' ? {
                        onStartShouldSetResponder: () => true,
                        onTouchEnd: (e: any) => e.stopPropagation()
                      } : {
                        onClick: (e: any) => e.stopPropagation(),
                        onMouseDown: (e: any) => e.stopPropagation()
                      })}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6, gap: 4 }}>
                          <ThemedText style={{
                            fontSize: isWeb ? 11 : 10,
                            color: colors.text + '80',
                            textAlign: 'center'
                          }}>
                            Quantity
                          </ThemedText>
                          {selectedResource.quantity >= resource.availableQuantity && (
                            <ThemedText style={{
                              fontSize: isWeb ? 10 : 9,
                              color: '#EF4444',
                              fontWeight: '600'
                            }}>
                              (Max: {resource.availableQuantity})
                            </ThemedText>
                          )}
                        </View>
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        width: '100%',
                        maxWidth: '100%',
                        gap: 4
                        }}>
                          <TouchableOpacity
                            style={{
                              backgroundColor: selectedResource.quantity <= 1 ? '#9CA3AF' : '#EF4444',
                              borderRadius: 6,
                            width: isWeb ? 40 : 36,
                            height: isWeb ? 40 : 36,
                            minHeight: isWeb ? 40 : 36,
                              justifyContent: 'center',
                              alignItems: 'center',
                              opacity: selectedResource.quantity <= 1 ? 0.6 : 1,
                            }}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleQuantityChange(resource.id, selectedResource.quantity - 1);
                          }}
                            disabled={selectedResource.quantity <= 1}
                          >
                            <Ionicons name="remove" size={isWeb ? 16 : 14} color="white" />
                          </TouchableOpacity>
                        <TextInput
                          style={{
                            backgroundColor: colors.background,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 6,
                            flex: 1,
                            minWidth: 0,
                            height: isWeb ? 40 : 36,
                            minHeight: isWeb ? 40 : 36,
                            textAlign: 'center',
                              fontSize: isWeb ? 14 : 12,
                              fontWeight: '700',
                            color: colors.text,
                            paddingHorizontal: 8,
                            paddingVertical: 0,
                            includeFontPadding: false,
                            textAlignVertical: 'center'
                          }}
                          value={selectedResource.quantity > 0 ? selectedResource.quantity.toString() : ''}
                          onChangeText={(text) => {
                            handleQuantityInputChange(resource.id, text);
                          }}
                          onBlur={() => {
                            handleQuantityInputBlur(resource.id);
                          }}
                          keyboardType="numeric"
                          selectTextOnFocus
                          onFocus={(e) => e.stopPropagation()}
                          onPressIn={(e) => e.stopPropagation()}
                        />
                          <TouchableOpacity
                            style={{
                              backgroundColor: selectedResource.quantity >= resource.availableQuantity ? '#9CA3AF' : '#10B981',
                              borderRadius: 6,
                            width: isWeb ? 40 : 36,
                            height: isWeb ? 40 : 36,
                            minHeight: isWeb ? 40 : 36,
                              justifyContent: 'center',
                              alignItems: 'center',
                              opacity: selectedResource.quantity >= resource.availableQuantity ? 0.6 : 1,
                            }}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleQuantityChange(resource.id, selectedResource.quantity + 1);
                          }}
                            disabled={selectedResource.quantity >= resource.availableQuantity}
                          >
                            <Ionicons name="add" size={isWeb ? 16 : 14} color="white" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={{
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          gap: 12
        }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.border,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center'
            }}
            onPress={handleClose}
          >
            <ThemedText style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: '600'
            }}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center'
            }}
            onPress={handleConfirm}
          >
            <ThemedText style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600'
            }}>
              Confirm ({tempSelectedResources.length})
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// Hybrid RAMP styles
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  overlayCloseButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  container: {
    width: '100%',
    maxWidth: 900,
    maxHeight: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
    alignSelf: 'center',
  },
});

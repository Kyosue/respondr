import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
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
      // If resource is not selected, add it
      const newResource: OperationResource = {
        resourceId: resource.id,
        resourceName: resource.name,
        category: resource.category,
        quantity: 1,
        status: 'requested'
      };
      setTempSelectedResources(prev => [...prev, newResource]);
    }
  };

  const handleQuantityChange = (resourceId: string, quantity: number) => {
    if (quantity <= 0) {
      setTempSelectedResources(prev => prev.filter(r => r.resourceId !== resourceId));
    } else {
      setTempSelectedResources(prev =>
        prev.map(r =>
          r.resourceId === resourceId ? { ...r, quantity } : r
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
              maxHeight: '80%',
              height: '80%'
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
                  justifyContent: 'flex-start',
                  gap: 8
                }}>
                  {filteredResources.map((resource) => {
                    const isSelected = isResourceSelected(resource.id);
                    const selectedResource = tempSelectedResources.find(r => r.resourceId === resource.id);
                    
                    return (
                      <TouchableOpacity
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
                        onPress={() => handleResourceSelect(resource)}
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

                          {/* Quantity Selector for Selected Resources */}
                          {isSelected && selectedResource && (
                            <View style={{
                              marginTop: 6,
                              paddingTop: 6,
                              borderTopWidth: 1,
                              borderTopColor: colors.border
                            }}>
                              <ThemedText style={{
                                fontSize: isWeb ? 11 : 10,
                                color: colors.text + '80',
                                marginBottom: 6,
                                textAlign: 'center'
                              }}>
                                Quantity
                              </ThemedText>
                              <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%'
                              }}>
                                <TouchableOpacity
                                  style={{
                                    backgroundColor: '#EF4444',
                                    borderRadius: 6,
                                    flex: 1,
                                    height: isWeb ? 32 : 28,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 4
                                  }}
                                  onPress={() => handleQuantityChange(resource.id, selectedResource.quantity - 1)}
                                >
                                  <Ionicons name="remove" size={isWeb ? 16 : 14} color="white" />
                                </TouchableOpacity>
                                <View style={{
                                  backgroundColor: colors.primary,
                                  borderRadius: 6,
                                  flex: 1,
                                  height: isWeb ? 32 : 28,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  marginHorizontal: 4
                                }}>
                                  <ThemedText style={{
                                    fontSize: isWeb ? 14 : 12,
                                    fontWeight: '700',
                                    color: 'white'
                                  }}>
                                    {selectedResource.quantity}
                                  </ThemedText>
                                </View>
                                <TouchableOpacity
                                  style={{
                                    backgroundColor: '#10B981',
                                    borderRadius: 6,
                                    flex: 1,
                                    height: isWeb ? 32 : 28,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginLeft: 4
                                  }}
                                  onPress={() => handleQuantityChange(resource.id, selectedResource.quantity + 1)}
                                >
                                  <Ionicons name="add" size={isWeb ? 16 : 14} color="white" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
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
      <View style={{
        flex: 1,
        backgroundColor: colors.background
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
            justifyContent: 'flex-start',
            gap: 8
          }}>
            {filteredResources.map((resource) => {
              const isSelected = isResourceSelected(resource.id);
              const selectedResource = tempSelectedResources.find(r => r.resourceId === resource.id);
              
              return (
                <TouchableOpacity
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
                  onPress={() => handleResourceSelect(resource)}
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

                    {/* Quantity Selector for Selected Resources */}
                    {isSelected && selectedResource && (
                      <View style={{
                        marginTop: 6,
                        paddingTop: 6,
                        borderTopWidth: 1,
                        borderTopColor: colors.border
                      }}>
                        <ThemedText style={{
                          fontSize: isWeb ? 11 : 10,
                          color: colors.text + '80',
                          marginBottom: 6,
                          textAlign: 'center'
                        }}>
                          Quantity
                        </ThemedText>
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%'
                        }}>
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#EF4444',
                              borderRadius: 6,
                              flex: 1,
                              height: isWeb ? 32 : 28,
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginRight: 4
                            }}
                            onPress={() => handleQuantityChange(resource.id, selectedResource.quantity - 1)}
                          >
                            <Ionicons name="remove" size={isWeb ? 16 : 14} color="white" />
                          </TouchableOpacity>
                          <View style={{
                            backgroundColor: colors.primary,
                            borderRadius: 6,
                            flex: 1,
                            height: isWeb ? 32 : 28,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginHorizontal: 4
                          }}>
                            <ThemedText style={{
                              fontSize: isWeb ? 14 : 12,
                              fontWeight: '700',
                              color: 'white'
                            }}>
                              {selectedResource.quantity}
                            </ThemedText>
                          </View>
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#10B981',
                              borderRadius: 6,
                              flex: 1,
                              height: isWeb ? 32 : 28,
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginLeft: 4
                            }}
                            onPress={() => handleQuantityChange(resource.id, selectedResource.quantity + 1)}
                          >
                            <Ionicons name="add" size={isWeb ? 16 : 14} color="white" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
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
  },
});

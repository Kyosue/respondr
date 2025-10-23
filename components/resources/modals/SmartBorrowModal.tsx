import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FormButton } from '@/components/ui/FormComponents';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { Resource, ResourceTransaction } from '@/types/Resource';
import { getModalConfig } from '@/utils/modalUtils';
import { BorrowerForm, BorrowerInfo } from './BorrowerForm';
import { ResourceItem, ResourceItemRow } from './ResourceItemRow';

interface SmartBorrowModalProps {
  // For single resource borrowing
  resource?: Resource | null;
  // For multi-resource borrowing
  selectedResources?: Resource[];
  // Modal state
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // Mode: 'borrow' for borrowing, 'return' for returning
  mode: 'borrow' | 'return';
}

export function SmartBorrowModal({ 
  resource,
  selectedResources = [],
  visible, 
  onClose, 
  onSuccess,
  mode 
}: SmartBorrowModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { borrowResource, returnResource, borrowMultipleResources, getActiveTransactions, getUserTransactions, getFilteredResources } = useResources();
  const { user } = useAuth();
  
  // Constants
  const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  // Determine if this is single or multi-resource mode
  const isMultiResource = selectedResources.length > 0 || (!resource && mode === 'borrow');
  const isSingleResource = !isMultiResource && resource;

  // State management
  const [borrowerInfo, setBorrowerInfo] = useState<BorrowerInfo>({
    borrowerName: '',
    borrowerContact: '',
    borrowerDepartment: '',
    borrowerPicture: null,
  });
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ResourceTransaction | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'available'>('name');
  const [showSearchFilters, setShowSearchFilters] = useState(false);

  // Hybrid RAMP hook
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose: () => {
      // Reset form data
      setResourceItems([]);
      setBorrowerInfo({
        borrowerName: '',
        borrowerContact: '',
        borrowerDepartment: '',
        borrowerPicture: null,
      });
      setSelectedTransaction(null);
      setErrors({});
      setSearchQuery('');
      setSelectedCategory('all');
      setSortBy('name');
      setShowSearchFilters(false);
      onClose();
    }
  });

  // Resource items state - use refs to avoid re-render loops
  const [resourceItems, setResourceItems] = useState<ResourceItem[]>([]);
  const prevVisibleRef = useRef(false);
  const prevResourceRef = useRef<Resource | null>(null);
  const prevSelectedResourcesRef = useRef<Resource[]>([]);
  const prevModeRef = useRef<string>('');


  // Initialize resourceItems when modal opens or props change
  useEffect(() => {
    const shouldInitialize = visible && (
      !prevVisibleRef.current || // Modal just opened
      prevResourceRef.current?.id !== resource?.id || // Resource changed
      prevModeRef.current !== mode || // Mode changed
      prevSelectedResourcesRef.current.length !== selectedResources.length || // Selected resources changed
      prevSelectedResourcesRef.current.some((res, index) => res.id !== selectedResources[index]?.id) // Selected resources content changed
    );

    if (shouldInitialize) {
      if (resource && mode === 'borrow' && selectedResources.length === 0) {
        // Single resource mode - auto-fill the resource
        setResourceItems([{
          resource,
          quantity: 1,
          dueDate: defaultDueDate,
          notes: '',
        }]);
      } else if (selectedResources.length > 0) {
        // Multi-resource mode - initialize with selected resources
        setResourceItems(selectedResources.map(res => ({
          resource: res,
          quantity: 1,
          dueDate: defaultDueDate,
          notes: '',
        })));
      } else {
        setResourceItems([]);
      }
    }

    // Update refs
    prevVisibleRef.current = visible;
    prevResourceRef.current = resource || null;
    prevModeRef.current = mode;
    prevSelectedResourcesRef.current = [...selectedResources];
  }, [visible, resource, mode, selectedResources, defaultDueDate]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setResourceItems([]);
      setBorrowerInfo({
        borrowerName: '',
        borrowerContact: '',
        borrowerDepartment: '',
        borrowerPicture: null,
      });
      setErrors({});
      setSelectedTransaction(null);
      // Reset refs
      prevVisibleRef.current = false;
      prevResourceRef.current = null;
      prevModeRef.current = '';
      prevSelectedResourcesRef.current = [];
    }
  }, [visible]);


  // Handle return mode - find active transaction
  useEffect(() => {
    if (visible && resource && mode === 'return') {
      const activeTransactions = getActiveTransactions();
      if (!user?.id) {
        Alert.alert('Authentication Required', 'Please log in to view your transactions.');
        return;
      }
      
      const userTransactions = getUserTransactions(user.id);
      const transaction = activeTransactions.find(t => 
        t.resourceId === resource.id && 
        userTransactions.some(ut => ut.id === t.id)
      );
      setSelectedTransaction(transaction || null);
    } else {
      setSelectedTransaction(null);
    }
  }, [visible, resource, mode, getActiveTransactions, getUserTransactions]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'borrow') {
      if (!borrowerInfo.borrowerName.trim()) {
        newErrors.borrowerName = 'Borrower name is required';
      }
      
      if (resourceItems.length === 0) {
        newErrors.resources = 'Please select at least one resource';
      }

      resourceItems.forEach((item, index) => {
        if (item.quantity <= 0) {
          newErrors[`quantity_${index}`] = 'Quantity must be greater than 0';
        }
        if (item.quantity > item.resource.availableQuantity) {
          newErrors[`quantity_${index}`] = `Maximum available: ${item.resource.availableQuantity}`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      if (mode === 'borrow') {
        if (isSingleResource) {
          // Single resource borrowing
          const item = resourceItems[0];
          await borrowResource(
            item.resource.id, 
            item.quantity, 
            item.notes, 
            item.dueDate, 
            {
              borrowerName: borrowerInfo.borrowerName.trim(),
              borrowerContact: borrowerInfo.borrowerContact.trim(),
              borrowerDepartment: borrowerInfo.borrowerDepartment.trim(),
              borrowerPicture: borrowerInfo.borrowerPicture || undefined,
            }
          );
        } else {
          // Multi-resource borrowing
          const items = resourceItems.map(item => ({
            resourceId: item.resource.id,
            quantity: item.quantity,
            dueDate: item.dueDate,
            notes: item.notes,
          }));

          await borrowMultipleResources(
            items,
            {
              borrowerName: borrowerInfo.borrowerName.trim(),
              borrowerContact: borrowerInfo.borrowerContact.trim(),
              borrowerDepartment: borrowerInfo.borrowerDepartment.trim(),
              borrowerPicture: borrowerInfo.borrowerPicture || undefined,
            }
          );
        }
        
        Alert.alert('Success', 'Resource(s) borrowed successfully', [
          { text: 'OK', onPress: handleClose }
        ]);
      } else {
        // Return mode
        if (!selectedTransaction) {
          Alert.alert('Error', 'No active transaction found for this resource');
          return;
        }

        await returnResource(selectedTransaction.id, {
          quantity: selectedTransaction.quantity,
          condition: 'good',
          notes: 'Returned via Smart Borrow Modal'
        });
        
        Alert.alert('Success', 'Resource returned successfully', [
          { text: 'OK', onPress: handleClose }
        ]);
      }
      
      onSuccess();
    } catch {
      Alert.alert('Error', `Failed to ${mode} resource(s)`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = rampHandleClose;

  const addResource = (resource: Resource) => {
    // Check against the actual state
    if (resourceItems.some(item => item.resource.id === resource.id)) {
      Alert.alert('Already Added', 'This resource is already in your borrowing list');
      return;
    }

    const newItem: ResourceItem = {
      resource,
      quantity: 1,
      dueDate: defaultDueDate,
      notes: '',
    };

    setResourceItems(prev => [...prev, newItem]);
  };

  const updateResourceItem = (index: number, updatedItem: ResourceItem) => {
    setResourceItems(prev => {
      const newItems = [...prev];
      newItems[index] = updatedItem;
      return newItems;
    });
  };

  const removeResourceItem = (index: number) => {
    setResourceItems(prev => prev.filter((_, i) => i !== index));
  };

  const getAvailableResources = () => {
    return getFilteredResources().filter(r => 
      r.availableQuantity > 0 && 
      r.resourceType !== 'external' && 
      r.isBorrowable !== false
    );
  };

  // Filter and search resources
  const getFilteredAvailableResources = () => {
    let resources = getAvailableResources();
    
    // Filter by search query
    if (searchQuery.trim()) {
      resources = resources.filter(resource => 
        resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      resources = resources.filter(resource => resource.category === selectedCategory);
    }
    
    // Sort resources
    resources.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'available':
          return b.availableQuantity - a.availableQuantity;
        default:
          return 0;
      }
    });
    
    return resources;
  };

  // Get unique categories for filtering
  const availableCategories = useMemo(() => {
    const categories = getAvailableResources().map(r => r.category);
    return ['all', ...Array.from(new Set(categories))];
  }, [getAvailableResources]);

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

  if (!visible) return null;

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
            <ThemedView style={styles.modalContent}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <ThemedText type="subtitle" style={styles.title}>
                {mode === 'borrow' 
                  ? (isMultiResource ? 'Borrow Multiple Resources' : 'Borrow Single Resource')
                  : 'Return Resource'
                }
              </ThemedText>
              {isMultiResource && resourceItems.length > 0 && (
                <ThemedText style={[styles.headerSubtitle, { color: colors.text + '80' }]}>
                  {resourceItems.length} resource{resourceItems.length !== 1 ? 's' : ''} selected
                </ThemedText>
              )}
            </View>
            <View style={styles.headerButton}>
              <FormButton
                title={mode === 'borrow' 
                  ? (isMultiResource ? 'Borrow All' : 'Borrow Resource')
                  : 'Return Resource'
                }
                onPress={handleSubmit}
                variant={mode === 'borrow' ? 'primary' : 'success'}
                disabled={loading || (mode === 'return' && !selectedTransaction)}
                loading={loading}
              />
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Resource Information */}
          {isSingleResource && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Resource Information</ThemedText>
              <View style={[styles.resourceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.resourceHeader}>
                  <View style={styles.resourceImageContainer}>
                    {resource.images && resource.images.length > 0 ? (
                      <Image 
                        source={{ uri: resource.images[0] }} 
                        style={styles.resourceImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                        <Ionicons name={getCategoryIcon(resource.category) as any} size={32} color={colors.primary} />
                      </View>
                    )}
                  </View>
                  <View style={styles.resourceDetails}>
                    <ThemedText style={styles.resourceName}>{resource.name}</ThemedText>
                    <View style={styles.resourceCategoryContainer}>
                      <Ionicons name={getCategoryIcon(resource.category) as any} size={14} color={colors.primary} />
                      <ThemedText style={[styles.resourceCategory, { color: colors.primary }]}>
                        {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.resourceDescription} numberOfLines={2}>
                      {resource.description}
                    </ThemedText>
                  </View>
                </View>
                
                <View style={[styles.availabilityInfo, { backgroundColor: colors.background }]}>
                  <View style={styles.availabilityItem}>
                    <View style={[styles.availabilityIcon, { backgroundColor: colors.success + '20' }]}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    </View>
                    <View>
                      <ThemedText style={styles.availabilityLabel}>Available</ThemedText>
                      <ThemedText style={[styles.availabilityValue, { color: colors.success }]}>
                        {resource.availableQuantity} units
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.availabilityItem}>
                    <View style={[styles.availabilityIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="cube" size={16} color={colors.primary} />
                    </View>
                    <View>
                      <ThemedText style={styles.availabilityLabel}>Total</ThemedText>
                      <ThemedText style={styles.availabilityValue}>
                        {resource.totalQuantity} units
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Borrower Information - Only for borrow mode */}
          {mode === 'borrow' && (
            <BorrowerForm
              borrowerInfo={borrowerInfo}
              onBorrowerInfoChange={setBorrowerInfo}
              errors={errors}
              showImagePicker={true}
            />
          )}

          {/* Resource Items - Only for borrow mode */}
          {mode === 'borrow' && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                {isMultiResource 
                  ? (resourceItems.length > 0 
                      ? `Selected Resources (${resourceItems.length})` 
                      : 'Select Resources to Borrow')
                  : 'Borrow Details'
                }
              </ThemedText>
              
              {resourceItems.map((item, index) => (
                <ResourceItemRow
                  key={item.resource.id}
                  item={item}
                  onUpdate={(updatedItem) => updateResourceItem(index, updatedItem)}
                  onRemove={() => removeResourceItem(index)}
                  errors={{
                    quantity: errors[`quantity_${index}`],
                  }}
                  showRemoveButton={isMultiResource}
                />
              ))}

              {/* Add more resources button - Only in multi-resource mode */}
              {isMultiResource && (
                <View style={styles.addResourcesSection}>
                  <View style={styles.resourcesHeader}>
                    <ThemedText style={styles.addResourcesTitle}>
                      {resourceItems.length > 0 ? 'Add More Resources' : 'Available Resources'}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => setShowSearchFilters(!showSearchFilters)}
                      style={[styles.filterButton, { backgroundColor: colors.primary }]}
                    >
                      <Ionicons name="filter" size={16} color="#fff" />
                      <ThemedText style={styles.filterButtonText}>Filter</ThemedText>
                    </TouchableOpacity>
                  </View>

                  {/* Search and Filter Controls */}
                  {showSearchFilters && (
                    <View style={[styles.searchFiltersContainer, { backgroundColor: colors.surface }]}>
                      {/* Search Input */}
                      <View style={styles.searchInputContainer}>
                        <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
                        <TextInput
                          style={[styles.searchInput, { 
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text 
                          }]}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          placeholder="Search resources..."
                          placeholderTextColor={colors.text + '80'}
                        />
                        {searchQuery.length > 0 && (
                          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color={colors.text} />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Category Filter */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                        {availableCategories.map((category) => (
                          <TouchableOpacity
                            key={category}
                            onPress={() => setSelectedCategory(category)}
                            style={[
                              styles.categoryChip,
                              { 
                                backgroundColor: selectedCategory === category ? colors.primary : colors.background,
                                borderColor: colors.border 
                              }
                            ]}
                          >
                            <ThemedText style={[
                              styles.categoryChipText,
                              { color: selectedCategory === category ? '#fff' : colors.text }
                            ]}>
                              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      {/* Sort Options */}
                      <View style={styles.sortContainer}>
                        <ThemedText style={styles.sortLabel}>Sort by:</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
                          {[
                            { key: 'name', label: 'Name' },
                            { key: 'category', label: 'Category' },
                            { key: 'available', label: 'Available' }
                          ].map((option) => (
                            <TouchableOpacity
                              key={option.key}
                              onPress={() => setSortBy(option.key as any)}
                              style={[
                                styles.sortChip,
                                { 
                                  backgroundColor: sortBy === option.key ? colors.primary : colors.background,
                                  borderColor: colors.border 
                                }
                              ]}
                            >
                              <ThemedText style={[
                                styles.sortChipText,
                                { color: sortBy === option.key ? '#fff' : colors.text }
                              ]}>
                                {option.label}
                              </ThemedText>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  )}

                  {/* Resources Grid */}
                  <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    style={styles.resourcesScroll}
                    contentContainerStyle={styles.resourcesGridContent}
                  >
                    {(() => {
                      const availableResources = getFilteredAvailableResources()
                        .filter(r => !resourceItems.some((item: ResourceItem) => item.resource.id === r.id));
                      
                      if (availableResources.length === 0) {
                        return (
                          <View style={styles.noResourcesContainer}>
                            <Ionicons name="cube-outline" size={48} color={colors.text} style={{ opacity: 0.3 }} />
                            <ThemedText style={styles.noResourcesText}>
                              {searchQuery || selectedCategory !== 'all' 
                                ? 'No resources match your filters' 
                                : 'No available resources'
                              }
                            </ThemedText>
                            {(searchQuery || selectedCategory !== 'all') && (
                              <TouchableOpacity
                                onPress={() => {
                                  setSearchQuery('');
                                  setSelectedCategory('all');
                                }}
                                style={[styles.clearFiltersButton, { backgroundColor: colors.primary }]}
                              >
                                <ThemedText style={styles.clearFiltersText}>Clear Filters</ThemedText>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      }
                      
                      return (
                        <View style={styles.resourcesGrid}>
                          {availableResources.map((availableResource) => (
                            <TouchableOpacity
                              key={availableResource.id}
                              style={[styles.resourceGridCard, { 
                                backgroundColor: colors.surface,
                                borderColor: colors.border 
                              }]}
                              onPress={() => addResource(availableResource)}
                            >
                              <View style={styles.resourceGridImageContainer}>
                                {availableResource.images && availableResource.images.length > 0 ? (
                                  <Image 
                                    source={{ uri: availableResource.images[0] }} 
                                    style={styles.resourceGridImage}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <View style={[styles.resourceGridIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                                    <Ionicons name={getCategoryIcon(availableResource.category) as any} size={24} color={colors.primary} />
                                  </View>
                                )}
                              </View>
                              <ThemedText style={styles.resourceCardName} numberOfLines={2}>
                                {availableResource.name}
                              </ThemedText>
                              <ThemedText style={styles.resourceQuantity}>
                                Available: {availableResource.availableQuantity}
                              </ThemedText>
                            </TouchableOpacity>
                          ))}
                        </View>
                      );
                    })()}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Return Details - Only for return mode */}
          {mode === 'return' && selectedTransaction && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Return Details</ThemedText>
              
              <View style={styles.transactionInfo}>
                <View style={styles.transactionItem}>
                  <ThemedText style={styles.transactionLabel}>Borrowed Quantity:</ThemedText>
                  <ThemedText style={styles.transactionValue}>
                    {selectedTransaction.quantity}
                  </ThemedText>
                </View>
                <View style={styles.transactionItem}>
                  <ThemedText style={styles.transactionLabel}>Borrowed Date:</ThemedText>
                  <ThemedText style={styles.transactionValue}>
                    {selectedTransaction.createdAt ? new Date(selectedTransaction.createdAt).toLocaleDateString() : 'Unknown'}
                  </ThemedText>
                </View>
                {selectedTransaction.dueDate && (
                  <View style={styles.transactionItem}>
                    <ThemedText style={styles.transactionLabel}>Due Date:</ThemedText>
                    <ThemedText style={[
                      styles.transactionValue,
                      selectedTransaction.dueDate < new Date() && { color: colors.error }
                    ]}>
                      {selectedTransaction.dueDate ? new Date(selectedTransaction.dueDate).toLocaleDateString() : 'Unknown'}
                    </ThemedText>
                  </View>
                )}
                {selectedTransaction.notes && (
                  <View style={styles.transactionItem}>
                    <ThemedText style={styles.transactionLabel}>Original Notes:</ThemedText>
                    <ThemedText style={styles.transactionValue}>
                      {selectedTransaction.notes}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}


          {/* Terms & Conditions */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Terms & Conditions</ThemedText>
            <View style={[styles.termsContainer, { backgroundColor: colors.surface }]}>
              <ThemedText style={styles.termsText}>
                • Resources must be returned in the same condition as borrowed{'\n'}
                • Report any damage or issues immediately{'\n'}
                • Late returns may result in restricted access{'\n'}
                • Follow all safety protocols when using resources
                {isMultiResource && '\n• Each resource may have different due dates'}
              </ThemedText>
            </View>
          </View>
        </ScrollView>
            </ThemedView>
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
      <ThemedView style={styles.mobileContainer}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <ThemedText type="subtitle" style={styles.title}>
                {mode === 'borrow' 
                  ? (isMultiResource ? 'Borrow Multiple Resources' : 'Borrow Single Resource')
                  : 'Return Resource'
                }
              </ThemedText>
              {isMultiResource && resourceItems.length > 0 && (
                <ThemedText style={[styles.headerSubtitle, { color: colors.text + '80' }]}>
                  {resourceItems.length} resource{resourceItems.length !== 1 ? 's' : ''} selected
                </ThemedText>
              )}
            </View>
            <View style={styles.headerButton}>
              <FormButton
                title={mode === 'borrow' 
                  ? (isMultiResource ? 'Borrow All' : 'Borrow Resource')
                  : 'Return Resource'
                }
                onPress={handleSubmit}
                variant={mode === 'borrow' ? 'primary' : 'success'}
                disabled={loading || (mode === 'return' && !selectedTransaction)}
                loading={loading}
              />
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Resource Information */}
          {isSingleResource && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Resource Information</ThemedText>
              <View style={[styles.resourceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.resourceHeader}>
                  <View style={styles.resourceImageContainer}>
                    {resource.images && resource.images.length > 0 ? (
                      <Image 
                        source={{ uri: resource.images[0] }} 
                        style={styles.resourceImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                        <Ionicons name={getCategoryIcon(resource.category) as any} size={32} color={colors.primary} />
                      </View>
                    )}
                  </View>
                  <View style={styles.resourceDetails}>
                    <ThemedText style={styles.resourceName}>{resource.name}</ThemedText>
                    <View style={styles.resourceCategoryContainer}>
                      <Ionicons name={getCategoryIcon(resource.category) as any} size={14} color={colors.primary} />
                      <ThemedText style={[styles.resourceCategory, { color: colors.primary }]}>
                        {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.resourceDescription} numberOfLines={2}>
                      {resource.description}
                    </ThemedText>
                  </View>
                </View>
                
                <View style={[styles.availabilityInfo, { backgroundColor: colors.background }]}>
                  <View style={styles.availabilityItem}>
                    <View style={[styles.availabilityIcon, { backgroundColor: colors.success + '20' }]}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    </View>
                    <View>
                      <ThemedText style={styles.availabilityLabel}>Available</ThemedText>
                      <ThemedText style={[styles.availabilityValue, { color: colors.success }]}>
                        {resource.availableQuantity} units
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.availabilityItem}>
                    <View style={[styles.availabilityIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="cube" size={16} color={colors.primary} />
                    </View>
                    <View>
                      <ThemedText style={styles.availabilityLabel}>Total</ThemedText>
                      <ThemedText style={styles.availabilityValue}>
                        {resource.totalQuantity} units
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Borrower Information - Only for borrow mode */}
          {mode === 'borrow' && (
            <BorrowerForm
              borrowerInfo={borrowerInfo}
              onBorrowerInfoChange={setBorrowerInfo}
              errors={errors}
              showImagePicker={true}
            />
          )}

          {/* Resource Items - Only for borrow mode */}
          {mode === 'borrow' && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                {isMultiResource 
                  ? (resourceItems.length > 0 
                      ? `Selected Resources (${resourceItems.length})` 
                      : 'Select Resources to Borrow')
                  : 'Borrow Details'
                }
              </ThemedText>
              
              {resourceItems.map((item, index) => (
                <ResourceItemRow
                  key={item.resource.id}
                  item={item}
                  onUpdate={(updatedItem) => updateResourceItem(index, updatedItem)}
                  onRemove={() => removeResourceItem(index)}
                  errors={{
                    quantity: errors[`quantity_${index}`],
                  }}
                  showRemoveButton={isMultiResource}
                />
              ))}

              {/* Add more resources button - Only in multi-resource mode */}
              {isMultiResource && (
                <View style={styles.addResourcesSection}>
                  <View style={styles.resourcesHeader}>
                    <ThemedText style={styles.addResourcesTitle}>
                      {resourceItems.length > 0 ? 'Add More Resources' : 'Available Resources'}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => setShowSearchFilters(!showSearchFilters)}
                      style={[styles.filterButton, { backgroundColor: colors.primary }]}
                    >
                      <Ionicons name="filter" size={16} color="#fff" />
                      <ThemedText style={styles.filterButtonText}>Filter</ThemedText>
                    </TouchableOpacity>
                  </View>

                  {/* Search and Filter Controls */}
                  {showSearchFilters && (
                    <View style={[styles.searchFiltersContainer, { backgroundColor: colors.surface }]}>
                      {/* Search Input */}
                      <View style={styles.searchInputContainer}>
                        <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
                        <TextInput
                          style={[styles.searchInput, { 
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text 
                          }]}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          placeholder="Search resources..."
                          placeholderTextColor={colors.text + '80'}
                        />
                        {searchQuery.length > 0 && (
                          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color={colors.text} />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Category Filter */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                        {availableCategories.map((category) => (
                          <TouchableOpacity
                            key={category}
                            onPress={() => setSelectedCategory(category)}
                            style={[
                              styles.categoryChip,
                              { 
                                backgroundColor: selectedCategory === category ? colors.primary : colors.background,
                                borderColor: colors.border 
                              }
                            ]}
                          >
                            <ThemedText style={[
                              styles.categoryChipText,
                              { color: selectedCategory === category ? '#fff' : colors.text }
                            ]}>
                              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      {/* Sort Options */}
                      <View style={styles.sortContainer}>
                        <ThemedText style={styles.sortLabel}>Sort by:</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
                          {[
                            { key: 'name', label: 'Name' },
                            { key: 'category', label: 'Category' },
                            { key: 'available', label: 'Available' }
                          ].map((option) => (
                            <TouchableOpacity
                              key={option.key}
                              onPress={() => setSortBy(option.key as any)}
                              style={[
                                styles.sortChip,
                                { 
                                  backgroundColor: sortBy === option.key ? colors.primary : colors.background,
                                  borderColor: colors.border 
                                }
                              ]}
                            >
                              <ThemedText style={[
                                styles.sortChipText,
                                { color: sortBy === option.key ? '#fff' : colors.text }
                              ]}>
                                {option.label}
                              </ThemedText>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  )}

                  {/* Resources Grid */}
                  <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    style={styles.resourcesScroll}
                    contentContainerStyle={styles.resourcesGridContent}
                  >
                    {(() => {
                      const availableResources = getFilteredAvailableResources()
                        .filter(r => !resourceItems.some((item: ResourceItem) => item.resource.id === r.id));
                      
                      if (availableResources.length === 0) {
                        return (
                          <View style={styles.noResourcesContainer}>
                            <Ionicons name="cube-outline" size={48} color={colors.text} style={{ opacity: 0.3 }} />
                            <ThemedText style={styles.noResourcesText}>
                              {searchQuery || selectedCategory !== 'all' 
                                ? 'No resources match your filters' 
                                : 'No available resources'
                              }
                            </ThemedText>
                            {(searchQuery || selectedCategory !== 'all') && (
                              <TouchableOpacity
                                onPress={() => {
                                  setSearchQuery('');
                                  setSelectedCategory('all');
                                }}
                                style={[styles.clearFiltersButton, { backgroundColor: colors.primary }]}
                              >
                                <ThemedText style={styles.clearFiltersText}>Clear Filters</ThemedText>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      }
                      
                      return (
                        <View style={styles.resourcesGrid}>
                          {availableResources.map((availableResource) => (
                            <TouchableOpacity
                              key={availableResource.id}
                              style={[styles.resourceGridCard, { 
                                backgroundColor: colors.surface,
                                borderColor: colors.border 
                              }]}
                              onPress={() => addResource(availableResource)}
                            >
                              <View style={styles.resourceGridImageContainer}>
                                {availableResource.images && availableResource.images.length > 0 ? (
                                  <Image 
                                    source={{ uri: availableResource.images[0] }} 
                                    style={styles.resourceGridImage}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <View style={[styles.resourceGridIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                                    <Ionicons name={getCategoryIcon(availableResource.category) as any} size={24} color={colors.primary} />
                                  </View>
                                )}
                              </View>
                              <ThemedText style={styles.resourceCardName} numberOfLines={2}>
                                {availableResource.name}
                              </ThemedText>
                              <ThemedText style={styles.resourceQuantity}>
                                Available: {availableResource.availableQuantity}
                              </ThemedText>
                            </TouchableOpacity>
                          ))}
                        </View>
                      );
                    })()}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Return Details - Only for return mode */}
          {mode === 'return' && selectedTransaction && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Return Details</ThemedText>
              
              <View style={styles.transactionInfo}>
                <View style={styles.transactionItem}>
                  <ThemedText style={styles.transactionLabel}>Borrowed Quantity:</ThemedText>
                  <ThemedText style={styles.transactionValue}>
                    {selectedTransaction.quantity}
                  </ThemedText>
                </View>
                <View style={styles.transactionItem}>
                  <ThemedText style={styles.transactionLabel}>Borrowed Date:</ThemedText>
                  <ThemedText style={styles.transactionValue}>
                    {selectedTransaction.createdAt ? new Date(selectedTransaction.createdAt).toLocaleDateString() : 'Unknown'}
                  </ThemedText>
                </View>
                {selectedTransaction.dueDate && (
                  <View style={styles.transactionItem}>
                    <ThemedText style={styles.transactionLabel}>Due Date:</ThemedText>
                    <ThemedText style={[
                      styles.transactionValue,
                      selectedTransaction.dueDate < new Date() && { color: colors.error }
                    ]}>
                      {selectedTransaction.dueDate ? new Date(selectedTransaction.dueDate).toLocaleDateString() : 'Unknown'}
                    </ThemedText>
                  </View>
                )}
                {selectedTransaction.notes && (
                  <View style={styles.transactionItem}>
                    <ThemedText style={styles.transactionLabel}>Original Notes:</ThemedText>
                    <ThemedText style={styles.transactionValue}>
                      {selectedTransaction.notes}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Terms & Conditions */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Terms & Conditions</ThemedText>
            <View style={[styles.termsContainer, { backgroundColor: colors.surface }]}>
              <ThemedText style={styles.termsText}>
                • Resources must be returned in the same condition as borrowed{'\n'}
                • Report any damage or issues immediately{'\n'}
                • Late returns may result in restricted access{'\n'}
                • Follow all safety protocols when using resources
                {isMultiResource && '\n• Each resource may have different due dates'}
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}


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
    maxWidth: 800,
    maxHeight: '90%',
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
  modalContent: {
    flex: 1,
  },
  mobileContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    minWidth: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  resourceCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  resourceImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  resourceImage: {
    width: '100%',
    height: '100%',
  },
  resourceCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceCategory: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  availabilityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 8,
  },
  availabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  availabilityLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  availabilityValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
    overflow: 'visible', // Allow suggestions to extend beyond the scroll view
  },
  resourceInfo: {
    marginBottom: 24,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceDetails: {
    flex: 1,
  },
  resourceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  addResourcesSection: {
    marginTop: 16,
  },
  resourcesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addResourcesTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  searchFiltersContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
    opacity: 0.7,
  },
  sortScroll: {
    flex: 1,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resourcesScroll: {
    marginBottom: 16,
    maxHeight: 400,
  },
  resourcesGridContent: {
    paddingHorizontal: 4,
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  resourceGridCard: {
    width: '31%',
    aspectRatio: 1,
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceGridImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  resourceGridImage: {
    width: '100%',
    height: '100%',
  },
  resourceGridIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceCardName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 3,
    lineHeight: 14,
    flex: 1,
  },
  resourceQuantity: {
    fontSize: 9,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 'auto',
  },
  noResourcesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  noResourcesText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesContainer: {
    borderRadius: 8,
    padding: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.7,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
  },
  notesText: {
    fontSize: 16,
    opacity: 0.8,
  },
  termsContainer: {
    borderRadius: 8,
    padding: 16,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});

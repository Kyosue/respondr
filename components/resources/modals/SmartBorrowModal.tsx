import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FormButton } from '@/components/ui/FormComponents';
import { MobileModalSafeAreaWrapper, getMobileModalConfig } from '@/components/ui/MobileModalWrapper';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { Resource, ResourceTransaction } from '@/types/Resource';
import { getModalConfig } from '@/utils/modalUtils';
import { BorrowerForm, BorrowerInfo } from './BorrowerForm';
import { ResourceItem, ResourceItemRow } from './ResourceItemRow';
import { styles } from './SmartBorrowModal.styles';

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
  // Step state: 1 = borrower form, 2 = select resources, 3 = review selected resources (only for borrow mode)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  
  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'available'>('name');
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Hybrid RAMP hook
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose: () => {
      resetFormState();
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
      resetFormState();
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

  const validateBorrowerForm = () => {
    const newErrors: Record<string, string> = {};
    if (!borrowerInfo.borrowerName.trim()) {
      newErrors.borrowerName = 'Borrower name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'borrow') {
      // Validate borrower info
      if (!borrowerInfo.borrowerName.trim()) {
        newErrors.borrowerName = 'Borrower name is required';
      }
      
      // Validate resources
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

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateBorrowerForm()) {
        // For single resource mode, skip step 2 and go directly to step 3
        if (isSingleResource) {
          setCurrentStep(3);
        } else {
          setCurrentStep(2);
        }
        setErrors({}); // Clear errors when moving to next step
      }
    } else if (currentStep === 2) {
      // Move to review selected resources step
      if (resourceItems.length === 0) {
        Alert.alert('No Resources Selected', 'Please select at least one resource to continue.');
        return;
      }
      setCurrentStep(3);
      setErrors({});
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
    setErrors({});
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

  // Reset all form state
  const resetFormState = () => {
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
    setCurrentStep(1); // Reset to first step
    setViewMode('card');
    // Reset refs
    prevVisibleRef.current = false;
    prevResourceRef.current = null;
    prevModeRef.current = '';
    prevSelectedResourcesRef.current = [];
  };

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

  // Render modal content (shared between web and mobile)
  const renderModalContent = () => {
    // For borrow mode, show step-based flow
    if (mode === 'borrow') {
    return (
        <View style={styles.mobileContentContainer}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <ThemedText type="subtitle" style={styles.title}>
                  {currentStep === 1 
                    ? 'Borrower Information'
                    : currentStep === 2
                    ? 'Select Resources'
                    : 'Review Selection'
                }
              </ThemedText>
                {/* Step indicator */}
                <View style={styles.stepIndicator}>
                  <View style={[styles.stepDot, currentStep >= 1 && styles.stepDotActive, { backgroundColor: currentStep >= 1 ? colors.primary : colors.border }]} />
                  <View style={[styles.stepLine, { backgroundColor: (currentStep >= 2 && isMultiResource) || currentStep >= 3 ? colors.primary : colors.border }]} />
                  {isMultiResource && (
                    <>
                      <View style={[styles.stepDot, currentStep >= 2 && styles.stepDotActive, { backgroundColor: currentStep >= 2 ? colors.primary : colors.border }]} />
                      <View style={[styles.stepLine, { backgroundColor: currentStep >= 3 ? colors.primary : colors.border }]} />
                    </>
                  )}
                  <View style={[styles.stepDot, currentStep >= 3 && styles.stepDotActive, { backgroundColor: currentStep >= 3 ? colors.primary : colors.border }]} />
                </View>
                {currentStep === 2 && (
                  <ThemedText style={[styles.headerSubtitle, { color: colors.text + '80' }]}>
                    {resourceItems.length > 0 
                      ? `${resourceItems.length} selected - Tap to add more`
                      : 'Browse and select resources to borrow'
                    }
                  </ThemedText>
                )}
                {currentStep === 3 && (
                <ThemedText style={[styles.headerSubtitle, { color: colors.text + '80' }]}>
                  {resourceItems.length} resource{resourceItems.length !== 1 ? 's' : ''} selected
                </ThemedText>
              )}
            </View>
          </View>
        </View>

          {currentStep === 2 ? (
            // Step 2: Use View wrapper instead of ScrollView to prevent nested scroll conflicts
            <View style={styles.step2Wrapper}>
              {/* Resource Information - Only for single resource mode */}
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

              {/* Available Resources Section - Only for multi-resource mode */}
              {isMultiResource && (
            <View style={styles.section}>
                  <View style={styles.resourcesHeader}>
                    <View style={styles.resourcesHeaderLeft}>
                      <Ionicons name="cube-outline" size={20} color={colors.primary} />
                      <ThemedText style={styles.addResourcesTitle}>
                        Available Resources
                  </ThemedText>
                </View>
                    <View style={styles.resourcesHeaderRight}>
                      <View style={[styles.viewModeToggle, { borderColor: colors.border }]}>
                  <TouchableOpacity
                          onPress={() => setViewMode('card')}
                          style={[
                            styles.viewModeButton,
                            styles.viewModeButtonLeft,
                            {
                              backgroundColor: viewMode === 'card' ? colors.primary : colors.surface,
                              borderColor: colors.border,
                            }
                          ]}
                          activeOpacity={0.7}
                  >
                    <Ionicons 
                            name="grid" 
                            size={16} 
                            color={viewMode === 'card' ? "#fff" : colors.text} 
                          />
                  </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setViewMode('list')}
                          style={[
                            styles.viewModeButton,
                            styles.viewModeButtonRight,
                            {
                              backgroundColor: viewMode === 'list' ? colors.primary : colors.surface,
                              borderColor: colors.border,
                            }
                          ]}
                          activeOpacity={0.7}
                            >
                          <Ionicons 
                            name="list" 
                            size={16} 
                            color={viewMode === 'list' ? "#fff" : colors.text} 
                          />
                            </TouchableOpacity>
                          </View>
                    <TouchableOpacity
                      onPress={() => setShowSearchFilters(!showSearchFilters)}
                        style={[
                          styles.filterButton, 
                          { 
                            backgroundColor: showSearchFilters ? colors.primary : colors.surface,
                            borderColor: colors.border,
                            borderWidth: showSearchFilters ? 0 : 1,
                          }
                        ]}
                        activeOpacity={0.7}
                    >
                        <Ionicons 
                          name={showSearchFilters ? "filter" : "filter-outline"} 
                          size={16} 
                          color={showSearchFilters ? "#fff" : colors.text} 
                        />
                        <ThemedText style={[
                          styles.filterButtonText,
                          { color: showSearchFilters ? "#fff" : colors.text }
                        ]}>
                          {showSearchFilters ? 'Hide Filters' : 'Filter'}
                        </ThemedText>
                    </TouchableOpacity>
                    </View>
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

                  {/* Resources Grid - Scrollable */}
                  <View style={styles.resourcesScrollContainer}>
                  <ScrollView 
                      showsVerticalScrollIndicator={true}
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
                      
                      return viewMode === 'card' ? (
                        <View style={styles.resourcesGrid}>
                          {availableResources.map((availableResource) => (
                            <TouchableOpacity
                              key={availableResource.id}
                              style={[styles.resourceGridCard, { 
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                                shadowColor: colors.text,
                              }]}
                              onPress={() => addResource(availableResource)}
                              activeOpacity={0.7}
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
                                    <Ionicons name={getCategoryIcon(availableResource.category) as any} size={28} color={colors.primary} />
                                  </View>
                                )}
                              </View>
                              
                              <View style={styles.resourceCardContent}>
                              <ThemedText style={styles.resourceCardName} numberOfLines={2}>
                                {availableResource.name}
                              </ThemedText>
                                
                                <View style={styles.resourceCardMeta}>
                                  <View style={[styles.resourceCategoryBadge, { backgroundColor: `${colors.primary}15` }]}>
                                    <Ionicons name={getCategoryIcon(availableResource.category) as any} size={12} color={colors.primary} />
                                    <ThemedText style={[styles.resourceCategoryText, { color: colors.primary }]} numberOfLines={1}>
                                      {availableResource.category.charAt(0).toUpperCase() + availableResource.category.slice(1)}
                              </ThemedText>
                                  </View>
                                </View>
                                
                                <View style={styles.resourceAvailabilityContainer}>
                                  <View style={[styles.availabilityBadge, { backgroundColor: colors.success + '15' }]}>
                                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                                    <ThemedText style={[styles.resourceQuantity, { color: colors.success }]}>
                                      {availableResource.availableQuantity} available
                                    </ThemedText>
                                  </View>
                                </View>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.resourcesList}>
                          {availableResources.map((availableResource) => (
                            <TouchableOpacity
                              key={availableResource.id}
                              style={[styles.resourceListItem, { 
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                              }]}
                              onPress={() => addResource(availableResource)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.resourceListImageContainer}>
                                {availableResource.images && availableResource.images.length > 0 ? (
                                  <Image 
                                    source={{ uri: availableResource.images[0] }} 
                                    style={styles.resourceListImage}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <View style={[styles.resourceListIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                                    <Ionicons name={getCategoryIcon(availableResource.category) as any} size={24} color={colors.primary} />
                </View>
              )}
            </View>
                              
                              <View style={styles.resourceListContent}>
                                <View style={styles.resourceListHeader}>
                                  <ThemedText style={styles.resourceListItemName} numberOfLines={1}>
                                    {availableResource.name}
                  </ThemedText>
                                  <View style={[styles.availabilityBadge, { backgroundColor: colors.success + '15' }]}>
                                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                                    <ThemedText style={[styles.resourceQuantity, { color: colors.success }]}>
                                      {availableResource.availableQuantity}
                  </ThemedText>
                </View>
                  </View>
                                
                                <View style={styles.resourceListMeta}>
                                  <View style={[styles.resourceCategoryBadge, { backgroundColor: `${colors.primary}15` }]}>
                                    <Ionicons name={getCategoryIcon(availableResource.category) as any} size={12} color={colors.primary} />
                                    <ThemedText style={[styles.resourceCategoryText, { color: colors.primary }]} numberOfLines={1}>
                                      {availableResource.category.charAt(0).toUpperCase() + availableResource.category.slice(1)}
                    </ThemedText>
                  </View>
                                  {availableResource.description && (
                                    <ThemedText style={[styles.resourceListDescription, { color: colors.text + '80' }]} numberOfLines={1}>
                                      {availableResource.description}
                                    </ThemedText>
                )}
              </View>
            </View>
                              
                              <View style={styles.resourceListAction}>
                                <Ionicons name="add-circle" size={24} color={colors.primary} />
            </View>
                            </TouchableOpacity>
                          ))}
          </View>
                      );
                    })()}
                    </ScrollView>
            </View>
            </View>
              )}
          </View>
          ) : (
            // Step 1 and Step 3 - Use ScrollView for scrolling content
            <ScrollView 
              style={styles.content} 
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {currentStep === 1 ? (
                // Step 1: Borrower Information
                <BorrowerForm
                  borrowerInfo={borrowerInfo}
                  onBorrowerInfoChange={setBorrowerInfo}
                  errors={errors}
                  showImagePicker={true}
                />
              ) : (
                // Step 3: Review Selected Resources
                <>
                {/* Resource Information - Only for single resource mode */}
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

                {/* Selected Resources Review */}
            <View style={styles.section}>
                  <View style={styles.resourcesSectionHeader}>
                    <View>
                  <ThemedText style={styles.sectionTitle}>
                    {isMultiResource 
                          ? `Selected Resources (${resourceItems.length})` 
                      : 'Borrow Details'
                    }
                  </ThemedText>
                      {isMultiResource && (
                        <ThemedText style={[styles.sectionSubtitle, { color: colors.text + '80' }]}>
                          Review your selections and make any adjustments
                    </ThemedText>
                )}
              </View>
                </View>
                  
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

                  {isMultiResource && resourceItems.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setCurrentStep(2)}
                      style={[styles.addMoreButton, { 
                        backgroundColor: colors.surface,
                        borderColor: colors.border 
                      }]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                      <ThemedText style={[styles.addMoreButtonText, { color: colors.primary }]}>
                        Add More Resources
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                  </View>
              </>
            )}
          </ScrollView>
          )}

          {/* Footer with action buttons */}
          <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            {currentStep === 1 ? (
              <View style={styles.footerButtonContainer}>
                <FormButton
                  title="Next"
                  onPress={handleNext}
                  variant="primary"
                />
                      </View>
            ) : currentStep === 2 ? (
              <View style={styles.footerButtonsRow}>
                          <TouchableOpacity
                  onPress={handleBack}
                  style={[styles.backButton, { borderColor: colors.border }]}
                >
                  <Ionicons name="arrow-back" size={16} color={colors.text} />
                  <ThemedText style={[styles.backButtonText, { color: colors.text }]}>Back</ThemedText>
                          </TouchableOpacity>
                <View style={styles.footerButtonContainer}>
                  <FormButton
                    title="Next"
                    onPress={handleNext}
                    variant="primary"
                    disabled={resourceItems.length === 0}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.footerButtonsRow}>
                            <TouchableOpacity
                  onPress={handleBack}
                  style={[styles.backButton, { borderColor: colors.border }]}
                >
                  <Ionicons name="arrow-back" size={16} color={colors.text} />
                  <ThemedText style={[styles.backButtonText, { color: colors.text }]}>Back</ThemedText>
                            </TouchableOpacity>
                <View style={styles.footerButtonContainer}>
                  <FormButton
                    title={isMultiResource ? 'Borrow All' : 'Borrow Resource'}
                    onPress={handleSubmit}
                    variant="primary"
                    disabled={loading || resourceItems.length === 0}
                    loading={loading}
                  />
                      </View>
                    </View>
                  )}
          </View>
                          </View>
                        );
                      }
                      
    // Return mode - no steps, show return details directly
                      return (
      <View style={styles.mobileContentContainer}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="close" size={20} color={colors.text} />
                            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <ThemedText type="subtitle" style={styles.title}>
                Return Resource
              </ThemedText>
                        </View>
                </View>
            </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Return Details */}
          {selectedTransaction && (
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
        </ScrollView>

        {/* Footer with action button */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <View style={styles.footerButtonContainer}>
            <FormButton
              title="Return Resource"
              onPress={handleSubmit}
              variant="success"
              disabled={loading || !selectedTransaction}
              loading={loading}
            />
            </View>
          </View>
      </View>
    );
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
              {renderModalContent()}
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
      {...getMobileModalConfig()}
      onRequestClose={handleClose}
      statusBarTranslucent={false}
    >
      <MobileModalSafeAreaWrapper backgroundColor={colors.background}>
        <ThemedView style={styles.mobileContainer}>
          {renderModalContent()}
        </ThemedView>
      </MobileModalSafeAreaWrapper>
    </Modal>
  );
}

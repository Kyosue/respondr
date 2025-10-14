import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, ScrollView, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Agency, ResourceCategory, ResourceCondition, ResourceStatus } from '@/types/Resource';

import { styles } from './ResourceHeader.styles';

const CATEGORIES: ResourceCategory[] = [
  'vehicles',
  'medical', 
  'equipment',
  'communication',
  'personnel',
  'tools',
  'supplies',
  'other'
];

const RESOURCE_TYPES = [
  { value: 'pdrrmo', label: 'PDRRMO', icon: 'home-outline' },
  { value: 'external', label: 'External', icon: 'business-outline' },
];

const STATUS_OPTIONS: ResourceStatus[] = [
  'active',
  'inactive', 
  'maintenance',
  'retired'
];

const CONDITION_OPTIONS: ResourceCondition[] = [
  'excellent',
  'good',
  'fair',
  'poor',
  'needs_repair'
];

interface ResourceFiltersProps {
  selectedCategory?: ResourceCategory;
  selectedAgency?: string;
  selectedResourceType?: 'pdrrmo' | 'external';
  selectedStatus?: ResourceStatus;
  selectedCondition?: ResourceCondition;
  onCategorySelect?: (category: ResourceCategory | undefined) => void;
  onAgencySelect?: (agencyId: string | undefined) => void;
  onResourceTypeSelect?: (type: 'pdrrmo' | 'external' | undefined) => void;
  onStatusSelect?: (status: ResourceStatus | undefined) => void;
  onConditionSelect?: (condition: ResourceCondition | undefined) => void;
  onClearFilters?: () => void;
  agencies?: Agency[];
}

interface DropdownProps {
  visible: boolean;
  onClose: () => void;
  options: Array<{ value: string; label: string; icon?: string }>;
  onSelect: (value: string | undefined) => void;
  selectedValue?: string;
  title: string;
}

function FilterDropdown({ visible, onClose, options, onSelect, selectedValue, title }: DropdownProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSelect = (value: string) => {
    onSelect(selectedValue === value ? undefined : value);
    onClose();
  };

  // Helper function to get category color for category dropdown
  const getCategoryColor = (category: string) => {
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

  // Get dropdown accent color based on title
  const getDropdownAccentColor = () => {
    switch (title) {
      case 'Category': return '#6B7280';
      case 'Resource Type': return '#8B5CF6';
      case 'Agency': return '#10B981';
      case 'Status': return '#6B7280';
      case 'Condition': return '#6B7280';
      default: return colors.primary;
    }
  };

  if (!visible) return null;

  const accentColor = getDropdownAccentColor();

  return (
    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
      <View style={[
        styles.dropdownContainer, 
        { 
          backgroundColor: colors.surface,
          borderTopWidth: 3,
          borderTopColor: accentColor,
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.08)',
        }
      ]}>
        <View style={styles.dropdownHeader}>
          <ThemedText style={[styles.dropdownTitle, { color: colors.text }]}>
            {title}
          </ThemedText>
          <View style={[styles.dropdownIndicator, { backgroundColor: accentColor }]} />
        </View>
        <FlatList
          data={options}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => {
            const isSelected = selectedValue === item.value;
            const isCategoryDropdown = title === 'Category';
            const itemColor = isCategoryDropdown ? getCategoryColor(item.value) : colors.primary;
            
              return (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    {
                      backgroundColor: isSelected ? itemColor : 'transparent',
                      ...(isSelected && {
                        transform: [{ scale: 1.02 }],
                      }),
                    }
                  ]}
                  onPress={() => handleSelect(item.value)}
                  activeOpacity={0.7}
                >
                {item.icon && (
                  <Ionicons 
                    name={item.icon as any} 
                    size={16} 
                    color={isSelected ? '#fff' : (isCategoryDropdown ? itemColor : colors.text)}
                    style={{ marginRight: 8 }}
                  />
                )}
                <ThemedText 
                  style={[
                    styles.dropdownItemText,
                    { color: isSelected ? '#fff' : colors.text }
                  ]}
                >
                  {item.label}
                </ThemedText>
              </TouchableOpacity>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

export function ResourceFilters({ 
  selectedCategory, 
  selectedAgency,
  selectedResourceType,
  selectedStatus,
  selectedCondition,
  onCategorySelect, 
  onAgencySelect,
  onResourceTypeSelect,
  onStatusSelect,
  onConditionSelect,
  onClearFilters,
  agencies = []
}: ResourceFiltersProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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

  const getStatusIcon = (status: ResourceStatus) => {
    switch (status) {
      case 'active': return 'checkmark-circle-outline';
      case 'inactive': return 'pause-circle-outline';
      case 'maintenance': return 'construct-outline';
      case 'retired': return 'archive-outline';
      default: return 'help-circle-outline';
    }
  };

  const getConditionIcon = (condition: ResourceCondition) => {
    switch (condition) {
      case 'excellent': return 'star-outline';
      case 'good': return 'thumbs-up-outline';
      case 'fair': return 'thumbs-up-outline';
      case 'poor': return 'thumbs-down-outline';
      case 'needs_repair': return 'warning-outline';
      default: return 'help-circle-outline';
    }
  };

  const getStatusColor = (status: ResourceStatus) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'maintenance': return '#F59E0B';
      case 'retired': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getConditionColor = (condition: ResourceCondition) => {
    switch (condition) {
      case 'excellent': return '#10B981';
      case 'good': return '#3B82F6';
      case 'fair': return '#F59E0B';
      case 'poor': return '#F97316';
      case 'needs_repair': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const agencyOptions = agencies.map(agency => ({
    value: agency.id,
    label: agency.name,
    icon: 'business-outline'
  }));

  const statusOptions = STATUS_OPTIONS.map(status => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
    icon: getStatusIcon(status)
  }));

  const conditionOptions = CONDITION_OPTIONS.map(condition => ({
    value: condition,
    label: condition.charAt(0).toUpperCase() + condition.slice(1).replace('_', ' '),
    icon: getConditionIcon(condition)
  }));

  const renderFilterButton = (
    label: string,
    icon: string,
    isSelected: boolean,
    color: string,
    onPress: () => void,
    isOpen: boolean = false
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: isOpen ? color : (isSelected ? color : colors.surface),
          borderColor: isSelected ? color : colors.border,
          ...(isOpen && {
            shadowColor: color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 6,
          }),
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={icon as any} 
        size={16} 
        color={isOpen ? '#fff' : (isSelected ? '#fff' : color)}
        style={{ marginRight: 6 }}
      />
      <ThemedText 
        style={[
          styles.filterButtonText,
          { color: isOpen ? '#fff' : (isSelected ? '#fff' : colors.text) }
        ]}
      >
        {label}
      </ThemedText>
      <Ionicons 
        name={isOpen ? "chevron-up-outline" : "chevron-down-outline"} 
        size={12} 
        color={isOpen ? '#fff' : (isSelected ? '#fff' : colors.text)}
        style={{ marginLeft: 4 }}
      />
    </TouchableOpacity>
  );

  const categoryOptions = CATEGORIES.map(category => ({
    value: category,
    label: category.charAt(0).toUpperCase() + category.slice(1),
    icon: getCategoryIcon(category)
  }));

  // Close dropdown when clicking outside (handled by TouchableWithoutFeedback)

  return (
    <TouchableWithoutFeedback onPress={() => setActiveDropdown(null)}>
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
        {/* Category Filter */}
        {renderFilterButton(
          selectedCategory ? categoryOptions.find(c => c.value === selectedCategory)?.label || 'Category' : 'Category',
          selectedCategory ? getCategoryIcon(selectedCategory) : 'grid-outline',
          !!selectedCategory,
          selectedCategory ? getCategoryColor(selectedCategory) : '#6B7280',
          () => setActiveDropdown(activeDropdown === 'category' ? null : 'category'),
          activeDropdown === 'category'
        )}

        {/* Resource Type Filter */}
        {renderFilterButton(
          selectedResourceType ? RESOURCE_TYPES.find(t => t.value === selectedResourceType)?.label || 'Type' : 'Type',
          selectedResourceType ? RESOURCE_TYPES.find(t => t.value === selectedResourceType)?.icon || 'help-outline' : 'layers-outline',
          !!selectedResourceType,
          selectedResourceType ? '#8B5CF6' : '#6B7280',
          () => setActiveDropdown(activeDropdown === 'resourceType' ? null : 'resourceType'),
          activeDropdown === 'resourceType'
        )}

        {/* Agency Filter */}
        {agencies.length > 0 && renderFilterButton(
          selectedAgency ? agencies.find(a => a.id === selectedAgency)?.name || 'Agency' : 'Agency',
          'business-outline',
          !!selectedAgency,
          selectedAgency ? '#10B981' : '#6B7280',
          () => setActiveDropdown(activeDropdown === 'agency' ? null : 'agency'),
          activeDropdown === 'agency'
        )}

        {/* Status Filter */}
        {renderFilterButton(
          selectedStatus ? statusOptions.find(s => s.value === selectedStatus)?.label || 'Status' : 'Status',
          selectedStatus ? getStatusIcon(selectedStatus) : 'flag-outline',
          !!selectedStatus,
          selectedStatus ? getStatusColor(selectedStatus) : '#6B7280',
          () => setActiveDropdown(activeDropdown === 'status' ? null : 'status'),
          activeDropdown === 'status'
        )}

        {/* Condition Filter */}
        {renderFilterButton(
          selectedCondition ? conditionOptions.find(c => c.value === selectedCondition)?.label || 'Condition' : 'Condition',
          selectedCondition ? getConditionIcon(selectedCondition) : 'star-outline',
          !!selectedCondition,
          selectedCondition ? getConditionColor(selectedCondition) : '#6B7280',
          () => setActiveDropdown(activeDropdown === 'condition' ? null : 'condition'),
          activeDropdown === 'condition'
        )}

        {/* Clear Filters Button */}
        {(selectedCategory || selectedAgency || selectedResourceType || selectedStatus || selectedCondition) && (
          <TouchableOpacity
            style={[
              styles.clearFiltersButton,
              {
                backgroundColor: colors.error,
                borderColor: colors.error,
              }
            ]}
            onPress={() => {
              onClearFilters?.();
              setActiveDropdown(null);
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="close-circle-outline" 
              size={16} 
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <ThemedText 
              style={[
                styles.clearFiltersText,
                { color: '#fff' }
              ]}
            >
              Clear All
            </ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Dropdowns */}
      <FilterDropdown
        visible={activeDropdown === 'category'}
        onClose={() => setActiveDropdown(null)}
        options={categoryOptions}
        onSelect={(value) => onCategorySelect?.(value as ResourceCategory | undefined)}
        selectedValue={selectedCategory}
        title="Category"
      />

      <FilterDropdown
        visible={activeDropdown === 'resourceType'}
        onClose={() => setActiveDropdown(null)}
        options={RESOURCE_TYPES}
        onSelect={(value) => onResourceTypeSelect?.(value as 'pdrrmo' | 'external' | undefined)}
        selectedValue={selectedResourceType}
        title="Resource Type"
      />

      <FilterDropdown
        visible={activeDropdown === 'agency'}
        onClose={() => setActiveDropdown(null)}
        options={agencyOptions}
        onSelect={(value) => onAgencySelect?.(value)}
        selectedValue={selectedAgency}
        title="Agency"
      />

      <FilterDropdown
        visible={activeDropdown === 'status'}
        onClose={() => setActiveDropdown(null)}
        options={statusOptions}
        onSelect={(value) => onStatusSelect?.(value as ResourceStatus | undefined)}
        selectedValue={selectedStatus}
        title="Status"
      />

      <FilterDropdown
        visible={activeDropdown === 'condition'}
        onClose={() => setActiveDropdown(null)}
        options={conditionOptions}
        onSelect={(value) => onConditionSelect?.(value as ResourceCondition | undefined)}
        selectedValue={selectedCondition}
        title="Condition"
      />
      </View>
    </TouchableWithoutFeedback>
  );
}

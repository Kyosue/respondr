import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, ScrollView, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { UserStatus } from '@/types/UserData';
import { UserType } from '@/types/UserType';

import { styles } from './UserHeader.styles';

const USER_TYPES: (UserType | 'all')[] = ['all', 'admin', 'supervisor', 'operator'];
const USER_STATUSES: (UserStatus | 'all')[] = ['all', 'active', 'inactive', 'suspended'];

// Helper functions moved outside component for accessibility
const getFilterColor = (filter: UserType | 'all') => {
  switch (filter) {
    case 'admin': return '#EF4444';
    case 'supervisor': return '#F59E0B';
    case 'operator': return '#3B82F6';
    case 'all': return '#6B7280';
    default: return '#6B7280';
  }
};

const getStatusColor = (filter: UserStatus | 'all') => {
  switch (filter) {
    case 'active': return '#10B981';
    case 'inactive': return '#6B7280';
    case 'suspended': return '#EF4444';
    case 'all': return '#6B7280';
    default: return '#6B7280';
  }
};

interface UserFiltersProps {
  selectedFilter: UserType | 'all';
  onFilterSelect: (filter: UserType | 'all') => void;
  selectedStatusFilter?: UserStatus | 'all';
  onStatusFilterSelect?: (filter: UserStatus | 'all') => void;
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

  // Get dropdown accent color based on title
  const getDropdownAccentColor = () => {
    switch (title) {
      case 'User Type': return '#6B7280';
      case 'Status': return '#10B981';
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
            const itemColor = title === 'User Type' ? getFilterColor(item.value as UserType | 'all') : getStatusColor(item.value as UserStatus | 'all');
            
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
                    color={isSelected ? '#fff' : itemColor}
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

export function UserFilters({ 
  selectedFilter, 
  onFilterSelect, 
  selectedStatusFilter = 'all', 
  onStatusFilterSelect 
}: UserFiltersProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const getFilterIcon = (filter: UserType | 'all') => {
    switch (filter) {
      case 'admin': return 'shield-outline';
      case 'supervisor': return 'eye-outline';
      case 'operator': return 'person-outline';
      case 'all': return 'people-outline';
      default: return 'people-outline';
    }
  };

  const getFilterLabel = (filter: UserType | 'all') => {
    switch (filter) {
      case 'all': return 'All Users';
      case 'admin': return 'Admins';
      case 'supervisor': return 'Supervisors';
      case 'operator': return 'Operators';
      default: return 'All Users';
    }
  };

  const getStatusIcon = (filter: UserStatus | 'all') => {
    switch (filter) {
      case 'active': return 'checkmark-circle-outline';
      case 'inactive': return 'pause-circle-outline';
      case 'suspended': return 'ban-outline';
      case 'all': return 'ellipse-outline';
      default: return 'ellipse-outline';
    }
  };

  const getStatusLabel = (filter: UserStatus | 'all') => {
    switch (filter) {
      case 'all': return 'All Status';
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'suspended': return 'Suspended';
      default: return 'All Status';
    }
  };

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

  const userTypeOptions = USER_TYPES.map(type => ({
    value: type,
    label: getFilterLabel(type),
    icon: getFilterIcon(type)
  }));

  const statusOptions = USER_STATUSES.map(status => ({
    value: status,
    label: getStatusLabel(status),
    icon: getStatusIcon(status)
  }));

  return (
    <TouchableWithoutFeedback onPress={() => setActiveDropdown(null)}>
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {/* User Type Filter */}
          {renderFilterButton(
            selectedFilter === 'all' ? 'User Type' : getFilterLabel(selectedFilter),
            selectedFilter === 'all' ? 'people-outline' : getFilterIcon(selectedFilter),
            selectedFilter !== 'all',
            selectedFilter === 'all' ? '#6B7280' : getFilterColor(selectedFilter),
            () => setActiveDropdown(activeDropdown === 'userType' ? null : 'userType'),
            activeDropdown === 'userType'
          )}

          {/* Status Filter */}
          {onStatusFilterSelect && renderFilterButton(
            selectedStatusFilter === 'all' ? 'Status' : getStatusLabel(selectedStatusFilter),
            selectedStatusFilter === 'all' ? 'ellipse-outline' : getStatusIcon(selectedStatusFilter),
            selectedStatusFilter !== 'all',
            selectedStatusFilter === 'all' ? '#6B7280' : getStatusColor(selectedStatusFilter),
            () => setActiveDropdown(activeDropdown === 'status' ? null : 'status'),
            activeDropdown === 'status'
          )}

          {/* Clear Filters Button */}
          {(selectedFilter !== 'all' || selectedStatusFilter !== 'all') && (
            <TouchableOpacity
              style={[
                styles.clearFiltersButton,
                {
                  backgroundColor: colors.error,
                  borderColor: colors.error,
                }
              ]}
              onPress={() => {
                onFilterSelect('all');
                onStatusFilterSelect?.('all');
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
          visible={activeDropdown === 'userType'}
          onClose={() => setActiveDropdown(null)}
          options={userTypeOptions}
          onSelect={(value) => onFilterSelect(value as UserType | 'all')}
          selectedValue={selectedFilter}
          title="User Type"
        />

        <FilterDropdown
          visible={activeDropdown === 'status'}
          onClose={() => setActiveDropdown(null)}
          options={statusOptions}
          onSelect={(value) => onStatusFilterSelect?.(value as UserStatus | 'all')}
          selectedValue={selectedStatusFilter}
          title="Status"
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

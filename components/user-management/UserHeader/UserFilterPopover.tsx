import { FilterPopover, FilterSection } from '@/components/filters';
import { UserStatus } from '@/types/UserData';
import { UserType } from '@/types/UserType';
import { useMemo } from 'react';

export type UserSortOption = 'alphabetical-asc' | 'alphabetical-desc' | 'recently-added' | 'default';

interface UserFilterPopoverProps {
  selectedFilter: UserType | 'all';
  onFilterSelect: (filter: UserType | 'all') => void;
  selectedStatusFilter: UserStatus | 'all';
  onStatusFilterSelect: (filter: UserStatus | 'all') => void;
  selectedSort?: UserSortOption;
  onSortSelect?: (sort: UserSortOption) => void;
}

function getFilterColor(filter: UserType | 'all'): string {
  switch (filter) {
    case 'admin': return '#DC2626';
    case 'supervisor': return '#F59E0B';
    case 'operator': return '#3B82F6';
    default: return '#6B7280';
  }
}

function getStatusColor(filter: UserStatus | 'all'): string {
  switch (filter) {
    case 'active': return '#10B981';
    case 'inactive': return '#6B7280';
    case 'suspended': return '#EF4444';
    default: return '#6B7280';
  }
}

function getFilterLabel(filter: UserType | 'all'): string {
  switch (filter) {
    case 'all': return 'All Users';
    case 'admin': return 'Administrators';
    case 'supervisor': return 'Supervisors';
    case 'operator': return 'Operators';
    default: return 'All Users';
  }
}

function getStatusLabel(filter: UserStatus | 'all'): string {
  switch (filter) {
    case 'all': return 'All Status';
    case 'active': return 'Active';
    case 'inactive': return 'Inactive';
    case 'suspended': return 'Suspended';
    default: return 'All Status';
  }
}

function getFilterIcon(filter: UserType | 'all'): string {
  switch (filter) {
    case 'admin': return 'shield-outline';
    case 'supervisor': return 'eye-outline';
    case 'operator': return 'person-outline';
    case 'all': return 'people-outline';
    default: return 'people-outline';
  }
}

function getStatusIcon(filter: UserStatus | 'all'): string {
  switch (filter) {
    case 'active': return 'checkmark-circle-outline';
    case 'inactive': return 'pause-circle-outline';
    case 'suspended': return 'ban-outline';
    case 'all': return 'ellipse-outline';
    default: return 'ellipse-outline';
  }
}

function getSortColor(sort: UserSortOption): string {
  switch (sort) {
    case 'alphabetical-asc': return '#3B82F6';
    case 'alphabetical-desc': return '#8B5CF6';
    case 'recently-added': return '#F59E0B';
    default: return '#6B7280';
  }
}

function getSortLabel(sort: UserSortOption): string {
  switch (sort) {
    case 'alphabetical-asc': return 'A-Z';
    case 'alphabetical-desc': return 'Z-A';
    case 'recently-added': return 'Recently Added';
    case 'default': return 'Default';
    default: return 'Default';
  }
}

function getSortIcon(sort: UserSortOption): string {
  switch (sort) {
    case 'alphabetical-asc': return 'arrow-up-outline';
    case 'alphabetical-desc': return 'arrow-down-outline';
    case 'recently-added': return 'time-outline';
    case 'default': return 'swap-vertical-outline';
    default: return 'swap-vertical-outline';
  }
}

const USER_TYPES: (UserType | 'all')[] = ['all', 'admin', 'supervisor', 'operator'];
const USER_STATUSES: (UserStatus | 'all')[] = ['all', 'active', 'inactive', 'suspended'];
const SORT_OPTIONS: UserSortOption[] = ['default', 'alphabetical-asc', 'alphabetical-desc', 'recently-added'];

export function UserFilterPopover({
  selectedFilter,
  onFilterSelect,
  selectedStatusFilter,
  onStatusFilterSelect,
  selectedSort = 'default',
  onSortSelect,
}: UserFilterPopoverProps) {
  const sections: FilterSection[] = useMemo(() => {
    const filterSections: FilterSection[] = [
      {
        id: 'roles',
        title: 'Roles',
        icon: 'people-outline',
        options: USER_TYPES.map((type) => ({
          value: type,
          label: getFilterLabel(type),
          icon: getFilterIcon(type),
          color: getFilterColor(type),
        })),
        selectedValue: selectedFilter,
        onSelect: (value) => onFilterSelect(value as UserType | 'all'),
        searchable: true,
        searchPlaceholder: 'Search roles...',
      },
      {
        id: 'status',
        title: 'Status',
        icon: 'checkmark-circle-outline',
        options: USER_STATUSES.map((status) => ({
          value: status,
          label: getStatusLabel(status),
          icon: getStatusIcon(status),
          color: getStatusColor(status),
        })),
        selectedValue: selectedStatusFilter,
        onSelect: (value) => onStatusFilterSelect(value as UserStatus | 'all'),
        searchable: true,
        searchPlaceholder: 'Search status...',
      },
    ];

    // Add sort section if onSortSelect is provided
    if (onSortSelect) {
      filterSections.push({
        id: 'sort',
        title: 'Sort By',
        icon: 'swap-vertical-outline',
        options: SORT_OPTIONS.map((sort) => ({
          value: sort,
          label: getSortLabel(sort),
          icon: getSortIcon(sort),
          color: getSortColor(sort),
        })),
        selectedValue: selectedSort,
        onSelect: (value) => onSortSelect(value as UserSortOption),
        searchable: false,
      });
    }

    return filterSections;
  }, [selectedFilter, selectedStatusFilter, selectedSort, onFilterSelect, onStatusFilterSelect, onSortSelect]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedFilter !== 'all') count++;
    if (selectedStatusFilter !== 'all') count++;
    if (selectedSort && selectedSort !== 'default') count++;
    return count;
  }, [selectedFilter, selectedStatusFilter, selectedSort]);

  return (
    <FilterPopover
      sections={sections}
      activeFilterCount={activeFilterCount}
    />
  );
}


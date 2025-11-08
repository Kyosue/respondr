import { ActiveFilterTags, ActiveFilter } from '@/components/filters';
import { UserStatus } from '@/types/UserData';
import { UserType } from '@/types/UserType';
import { useMemo } from 'react';
import { UserSortOption } from './UserFilterPopover';

interface UserActiveFilterTagsProps {
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

export function UserActiveFilterTags({
  selectedFilter,
  onFilterSelect,
  selectedStatusFilter,
  onStatusFilterSelect,
  selectedSort,
  onSortSelect,
}: UserActiveFilterTagsProps) {
  const filters: ActiveFilter[] = useMemo(() => {
    const activeFilters: ActiveFilter[] = [];
    
    if (selectedFilter !== 'all') {
      activeFilters.push({
        label: getFilterLabel(selectedFilter),
        onRemove: () => onFilterSelect('all'),
        color: getFilterColor(selectedFilter),
      });
    }
    
    if (selectedStatusFilter !== 'all') {
      activeFilters.push({
        label: getStatusLabel(selectedStatusFilter),
        onRemove: () => onStatusFilterSelect('all'),
        color: getStatusColor(selectedStatusFilter),
      });
    }
    
    if (selectedSort && selectedSort !== 'default' && onSortSelect) {
      activeFilters.push({
        label: getSortLabel(selectedSort),
        onRemove: () => onSortSelect('default'),
        color: getSortColor(selectedSort),
      });
    }
    
    return activeFilters;
  }, [selectedFilter, selectedStatusFilter, selectedSort, onFilterSelect, onStatusFilterSelect, onSortSelect]);

  const handleClearAll = () => {
    onFilterSelect('all');
    onStatusFilterSelect('all');
    if (onSortSelect) {
      onSortSelect('default');
    }
  };

  return (
    <ActiveFilterTags
      filters={filters}
      onClearAll={handleClearAll}
    />
  );
}


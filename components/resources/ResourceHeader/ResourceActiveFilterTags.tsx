import { ActiveFilterTags, ActiveFilter } from '@/components/filters';
import { Agency, ResourceCategory, ResourceCondition, ResourceStatus } from '@/types/Resource';
import { useMemo } from 'react';
import { ResourceSortOption } from './ResourceFilterPopover';

interface ResourceActiveFilterTagsProps {
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
  selectedSort?: ResourceSortOption;
  onSortSelect?: (sort: ResourceSortOption) => void;
  onClearFilters?: () => void;
  agencies?: Agency[];
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

function getStatusColor(status: ResourceStatus): string {
  switch (status) {
    case 'active': return '#10B981';
    case 'inactive': return '#6B7280';
    case 'maintenance': return '#F59E0B';
    case 'retired': return '#EF4444';
    default: return '#6B7280';
  }
}

function getConditionColor(condition: ResourceCondition): string {
  switch (condition) {
    case 'excellent': return '#10B981';
    case 'good': return '#3B82F6';
    case 'fair': return '#F59E0B';
    case 'poor': return '#F97316';
    case 'needs_repair': return '#EF4444';
    default: return '#6B7280';
  }
}

function getCategoryLabel(category: ResourceCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getStatusLabel(status: ResourceStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getConditionLabel(condition: ResourceCondition): string {
  return condition.charAt(0).toUpperCase() + condition.slice(1).replace('_', ' ');
}

function getSortColor(sort: ResourceSortOption): string {
  switch (sort) {
    case 'alphabetical-asc': return '#3B82F6';
    case 'alphabetical-desc': return '#8B5CF6';
    case 'recently-added': return '#F59E0B';
    default: return '#6B7280';
  }
}

function getSortLabel(sort: ResourceSortOption): string {
  switch (sort) {
    case 'alphabetical-asc': return 'A-Z';
    case 'alphabetical-desc': return 'Z-A';
    case 'recently-added': return 'Recently Added';
    case 'default': return 'Default';
    default: return 'Default';
  }
}

export function ResourceActiveFilterTags({
  selectedCategory,
  selectedAgency,
  selectedResourceType,
  selectedStatus,
  selectedCondition,
  selectedSort,
  onSortSelect,
  onCategorySelect,
  onAgencySelect,
  onResourceTypeSelect,
  onStatusSelect,
  onConditionSelect,
  onClearFilters,
  agencies = [],
}: ResourceActiveFilterTagsProps) {
  const filters: ActiveFilter[] = useMemo(() => {
    const activeFilters: ActiveFilter[] = [];

    if (selectedCategory) {
      activeFilters.push({
        label: getCategoryLabel(selectedCategory),
        onRemove: () => onCategorySelect?.(undefined),
        color: getCategoryColor(selectedCategory),
      });
    }

    if (selectedResourceType) {
      activeFilters.push({
        label: selectedResourceType === 'pdrrmo' ? 'PDRRMO' : 'External',
        onRemove: () => onResourceTypeSelect?.(undefined),
        color: '#8B5CF6',
      });
    }

    if (selectedAgency) {
      const agency = agencies.find((a) => a.id === selectedAgency);
      if (agency) {
        activeFilters.push({
          label: agency.name,
          onRemove: () => onAgencySelect?.(undefined),
          color: '#10B981',
        });
      }
    }

    if (selectedStatus) {
      activeFilters.push({
        label: getStatusLabel(selectedStatus),
        onRemove: () => onStatusSelect?.(undefined),
        color: getStatusColor(selectedStatus),
      });
    }

    if (selectedCondition) {
      activeFilters.push({
        label: getConditionLabel(selectedCondition),
        onRemove: () => onConditionSelect?.(undefined),
        color: getConditionColor(selectedCondition),
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
  }, [
    selectedCategory,
    selectedAgency,
    selectedResourceType,
    selectedStatus,
    selectedCondition,
    selectedSort,
    onCategorySelect,
    onAgencySelect,
    onResourceTypeSelect,
    onStatusSelect,
    onConditionSelect,
    onSortSelect,
    agencies,
  ]);

  const handleClearAll = () => {
    onClearFilters?.();
    if (onSortSelect) {
      onSortSelect('default');
    }
  };

  return <ActiveFilterTags filters={filters} onClearAll={handleClearAll} />;
}


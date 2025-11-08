import { FilterPopover, FilterSection } from '@/components/filters';
import { Agency, ResourceCategory, ResourceCondition, ResourceStatus } from '@/types/Resource';
import { useMemo } from 'react';

export type ResourceSortOption = 'alphabetical-asc' | 'alphabetical-desc' | 'recently-added' | 'default';

interface ResourceFilterPopoverProps {
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
  agencies?: Agency[];
}

const CATEGORIES: ResourceCategory[] = [
  'vehicles',
  'medical',
  'equipment',
  'communication',
  'personnel',
  'tools',
  'supplies',
  'other',
];

const RESOURCE_TYPES = [
  { value: 'pdrrmo', label: 'PDRRMO', icon: 'home-outline' },
  { value: 'external', label: 'External', icon: 'business-outline' },
];

const STATUS_OPTIONS: ResourceStatus[] = ['active', 'inactive', 'maintenance', 'retired'];

const CONDITION_OPTIONS: ResourceCondition[] = [
  'excellent',
  'good',
  'fair',
  'poor',
  'needs_repair',
];

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

function getStatusIcon(status: ResourceStatus): string {
  switch (status) {
    case 'active': return 'checkmark-circle-outline';
    case 'inactive': return 'pause-circle-outline';
    case 'maintenance': return 'construct-outline';
    case 'retired': return 'archive-outline';
    default: return 'help-circle-outline';
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

function getConditionIcon(condition: ResourceCondition): string {
  switch (condition) {
    case 'excellent': return 'star-outline';
    case 'good': return 'thumbs-up-outline';
    case 'fair': return 'thumbs-up-outline';
    case 'poor': return 'thumbs-down-outline';
    case 'needs_repair': return 'warning-outline';
    default: return 'help-circle-outline';
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

function getSortIcon(sort: ResourceSortOption): string {
  switch (sort) {
    case 'alphabetical-asc': return 'arrow-up-outline';
    case 'alphabetical-desc': return 'arrow-down-outline';
    case 'recently-added': return 'time-outline';
    case 'default': return 'swap-vertical-outline';
    default: return 'swap-vertical-outline';
  }
}

const SORT_OPTIONS: ResourceSortOption[] = ['default', 'alphabetical-asc', 'alphabetical-desc', 'recently-added'];

export function ResourceFilterPopover({
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
  selectedSort = 'default',
  onSortSelect,
  agencies = [],
}: ResourceFilterPopoverProps) {
  const sections: FilterSection[] = useMemo(() => {
    const filterSections: FilterSection[] = [
      {
        id: 'category',
        title: 'Category',
        icon: 'grid-outline',
        options: [
          { value: 'all', label: 'All Categories', icon: 'apps-outline', color: '#6B7280' },
          ...CATEGORIES.map((category) => ({
            value: category,
            label: getCategoryLabel(category),
            icon: getCategoryIcon(category),
            color: getCategoryColor(category),
          })),
        ],
        selectedValue: selectedCategory || 'all',
        onSelect: (value) => onCategorySelect?.(value === 'all' ? undefined : (value as ResourceCategory)),
        searchable: true,
        searchPlaceholder: 'Search categories...',
      },
      {
        id: 'resourceType',
        title: 'Resource Type',
        icon: 'layers-outline',
        options: [
          { value: 'all', label: 'All Types', icon: 'layers-outline', color: '#6B7280' },
          ...RESOURCE_TYPES.map((type) => ({
            value: type.value,
            label: type.label,
            icon: type.icon,
            color: '#8B5CF6',
          })),
        ],
        selectedValue: selectedResourceType || 'all',
        onSelect: (value) => onResourceTypeSelect?.(value === 'all' ? undefined : (value as 'pdrrmo' | 'external')),
        searchable: true,
        searchPlaceholder: 'Search resource types...',
      },
    ];

    // Add Agency section if agencies are available
    if (agencies.length > 0) {
      filterSections.push({
        id: 'agency',
        title: 'Agency',
        icon: 'business-outline',
        options: [
          { value: 'all', label: 'All Agencies', icon: 'business-outline', color: '#6B7280' },
          ...agencies.map((agency) => ({
            value: agency.id,
            label: agency.name,
            icon: 'business-outline',
            color: '#10B981',
          })),
        ],
        selectedValue: selectedAgency || 'all',
        onSelect: (value) => onAgencySelect?.(value === 'all' ? undefined : value),
        searchable: true,
        searchPlaceholder: 'Search agencies...',
      });
    }

    filterSections.push(
      {
        id: 'status',
        title: 'Status',
        icon: 'flag-outline',
        options: [
          { value: 'all', label: 'All Status', icon: 'flag-outline', color: '#6B7280' },
          ...STATUS_OPTIONS.map((status) => ({
            value: status,
            label: getStatusLabel(status),
            icon: getStatusIcon(status),
            color: getStatusColor(status),
          })),
        ],
        selectedValue: selectedStatus || 'all',
        onSelect: (value) => onStatusSelect?.(value === 'all' ? undefined : (value as ResourceStatus)),
        searchable: true,
        searchPlaceholder: 'Search status...',
      },
      {
        id: 'condition',
        title: 'Condition',
        icon: 'star-outline',
        options: [
          { value: 'all', label: 'All Conditions', icon: 'star-outline', color: '#6B7280' },
          ...CONDITION_OPTIONS.map((condition) => ({
            value: condition,
            label: getConditionLabel(condition),
            icon: getConditionIcon(condition),
            color: getConditionColor(condition),
          })),
        ],
        selectedValue: selectedCondition || 'all',
        onSelect: (value) => onConditionSelect?.(value === 'all' ? undefined : (value as ResourceCondition)),
        searchable: true,
        searchPlaceholder: 'Search conditions...',
      }
    );

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
        onSelect: (value) => onSortSelect(value as ResourceSortOption),
        searchable: false,
      });
    }

    return filterSections;
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedAgency) count++;
    if (selectedResourceType) count++;
    if (selectedStatus) count++;
    if (selectedCondition) count++;
    if (selectedSort && selectedSort !== 'default') count++;
    return count;
  }, [selectedCategory, selectedAgency, selectedResourceType, selectedStatus, selectedCondition, selectedSort]);

  return <FilterPopover sections={sections} activeFilterCount={activeFilterCount} />;
}


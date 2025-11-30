import { FilterPopover, FilterSection } from '@/components/filters';
import { MemoFilter } from '@/types/MemoDocument';
import { useMemo } from 'react';

interface MemoFilterPopoverProps {
  filters: MemoFilter;
  onFilterChange: (filters: MemoFilter) => void;
}

const AGENCY_LEVELS = [
  { value: 'national', label: 'National', icon: 'flag-outline', color: '#DC2626' },
  { value: 'regional', label: 'Regional', icon: 'location-outline', color: '#F59E0B' },
  { value: 'provincial', label: 'Provincial', icon: 'map-outline', color: '#3B82F6' },
  { value: 'municipal', label: 'Municipal', icon: 'business-outline', color: '#10B981' },
  { value: 'barangay', label: 'Barangay', icon: 'home-outline', color: '#8B5CF6' },
];

const PRIORITIES = [
  { value: 'urgent', label: 'Urgent', icon: 'alert-circle-outline', color: '#FF3B30' },
  { value: 'high', label: 'High', icon: 'arrow-up-circle-outline', color: '#FF9500' },
  { value: 'normal', label: 'Normal', icon: 'checkmark-circle-outline', color: '#34C759' },
  { value: 'low', label: 'Low', icon: 'arrow-down-circle-outline', color: '#8E8E93' },
];

export function MemoFilterPopover({ filters, onFilterChange }: MemoFilterPopoverProps) {
  const sections: FilterSection[] = useMemo(() => [
    {
      id: 'agencyLevel',
      title: 'Agency Level',
      icon: 'flag-outline',
      options: [
        { value: 'all', label: 'All Levels', icon: 'flag-outline', color: '#6B7280' },
        ...AGENCY_LEVELS.map((level) => ({
          value: level.value,
          label: level.label,
          icon: level.icon,
          color: level.color,
        })),
      ],
      selectedValue: filters.agencyLevel || 'all',
      onSelect: (value) => {
        onFilterChange({
          ...filters,
          agencyLevel: value === 'all' ? undefined : (value as MemoFilter['agencyLevel']),
        });
      },
      searchable: true,
      searchPlaceholder: 'Search agency levels...',
    },
    {
      id: 'priority',
      title: 'Priority',
      icon: 'flag-outline',
      options: [
        { value: 'all', label: 'All Priorities', icon: 'flag-outline', color: '#6B7280' },
        ...PRIORITIES.map((priority) => ({
          value: priority.value,
          label: priority.label,
          icon: priority.icon,
          color: priority.color,
        })),
      ],
      selectedValue: filters.priority || 'all',
      onSelect: (value) => {
        onFilterChange({
          ...filters,
          priority: value === 'all' ? undefined : (value as MemoFilter['priority']),
        });
      },
      searchable: true,
      searchPlaceholder: 'Search priorities...',
    },
  ], [filters, onFilterChange]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.agencyLevel) count++;
    if (filters.priority) count++;
    if (filters.issuingAgency) count++;
    if (filters.uploadedBy) count++;
    if (filters.acknowledgedBy) count++;
    if (filters.dateRange) count++;
    return count;
  }, [filters]);

  return <FilterPopover sections={sections} activeFilterCount={activeFilterCount} />;
}


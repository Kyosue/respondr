import { ActiveFilterTags, ActiveFilter } from '@/components/filters';
import { MemoFilter } from '@/types/MemoDocument';
import { useMemo } from 'react';

interface MemoActiveFilterTagsProps {
  filters: MemoFilter;
  onFilterChange: (filters: MemoFilter) => void;
}

const AGENCY_LEVELS: Record<string, { label: string; color: string }> = {
  national: { label: 'National', color: '#DC2626' },
  regional: { label: 'Regional', color: '#F59E0B' },
  provincial: { label: 'Provincial', color: '#3B82F6' },
  municipal: { label: 'Municipal', color: '#10B981' },
  barangay: { label: 'Barangay', color: '#8B5CF6' },
};

const PRIORITIES: Record<string, { label: string; color: string }> = {
  urgent: { label: 'Urgent', color: '#FF3B30' },
  high: { label: 'High', color: '#FF9500' },
  normal: { label: 'Normal', color: '#34C759' },
  low: { label: 'Low', color: '#8E8E93' },
};

export function MemoActiveFilterTags({ filters, onFilterChange }: MemoActiveFilterTagsProps) {
  const activeFilters: ActiveFilter[] = useMemo(() => {
    const filterTags: ActiveFilter[] = [];

    if (filters.agencyLevel) {
      const level = AGENCY_LEVELS[filters.agencyLevel];
      if (level) {
        filterTags.push({
          label: level.label,
          onRemove: () => onFilterChange({ ...filters, agencyLevel: undefined }),
          color: level.color,
        });
      }
    }

    if (filters.priority) {
      const priority = PRIORITIES[filters.priority];
      if (priority) {
        filterTags.push({
          label: priority.label,
          onRemove: () => onFilterChange({ ...filters, priority: undefined }),
          color: priority.color,
        });
      }
    }

    if (filters.issuingAgency) {
      filterTags.push({
        label: `Agency: ${filters.issuingAgency}`,
        onRemove: () => onFilterChange({ ...filters, issuingAgency: undefined }),
        color: '#6B7280',
      });
    }

    if (filters.uploadedBy) {
      filterTags.push({
        label: `Uploaded by: ${filters.uploadedBy}`,
        onRemove: () => onFilterChange({ ...filters, uploadedBy: undefined }),
        color: '#6B7280',
      });
    }

    if (filters.acknowledgedBy) {
      filterTags.push({
        label: `Acknowledged by: ${filters.acknowledgedBy}`,
        onRemove: () => onFilterChange({ ...filters, acknowledgedBy: undefined }),
        color: '#6B7280',
      });
    }

    if (filters.dateRange) {
      filterTags.push({
        label: 'Date Range',
        onRemove: () => onFilterChange({ ...filters, dateRange: undefined }),
        color: '#6B7280',
      });
    }

    return filterTags;
  }, [filters, onFilterChange]);

  const handleClearAll = () => {
    onFilterChange({});
  };

  return <ActiveFilterTags filters={activeFilters} onClearAll={handleClearAll} />;
}


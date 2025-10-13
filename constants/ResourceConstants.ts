import { ResourceCategory, ResourceCondition, ResourceStatus } from '@/types/Resource';

export interface CategoryOption {
  value: ResourceCategory;
  label: string;
  icon: string;
  description: string;
}

export interface ConditionOption {
  value: ResourceCondition;
  label: string;
  color: string;
  description: string;
}

export interface StatusOption {
  value: ResourceStatus;
  label: string;
  color: string;
  description: string;
}

export const RESOURCE_CATEGORIES: CategoryOption[] = [
  { value: 'vehicles', label: 'Vehicles', icon: 'car-outline', description: 'Cars, trucks, ambulances, etc.' },
  { value: 'medical', label: 'Medical', icon: 'medical-outline', description: 'Medical supplies and equipment' },
  { value: 'equipment', label: 'Equipment', icon: 'construct-outline', description: 'Tools and machinery' },
  { value: 'communication', label: 'Communication', icon: 'radio-outline', description: 'Radios, phones, etc.' },
  { value: 'personnel', label: 'Personnel', icon: 'people-outline', description: 'Human resources' },
  { value: 'tools', label: 'Tools', icon: 'hammer-outline', description: 'Hand tools and instruments' },
  { value: 'supplies', label: 'Supplies', icon: 'cube-outline', description: 'General supplies and materials' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', description: 'Other resources' },
];

export const RESOURCE_CONDITIONS: ConditionOption[] = [
  { value: 'excellent', label: 'Excellent', color: '#4CAF50', description: 'Like new, fully functional' },
  { value: 'good', label: 'Good', color: '#8BC34A', description: 'Minor wear, fully functional' },
  { value: 'fair', label: 'Fair', color: '#FF9800', description: 'Some wear, needs attention' },
  { value: 'poor', label: 'Poor', color: '#FF5722', description: 'Significant wear, limited use' },
  { value: 'needs_repair', label: 'Needs Repair', color: '#F44336', description: 'Not functional, requires repair' },
];

export const RESOURCE_STATUSES: StatusOption[] = [
  { value: 'active', label: 'Active', color: '#4CAF50', description: 'Available for use' },
  { value: 'inactive', label: 'Inactive', color: '#9E9E9E', description: 'Temporarily unavailable' },
  { value: 'maintenance', label: 'Maintenance', color: '#FF9800', description: 'Under maintenance' },
  { value: 'retired', label: 'Retired', color: '#F44336', description: 'No longer in service' },
];

// Helper functions
export const getCategoryIcon = (category: ResourceCategory): string => {
  const categoryOption = RESOURCE_CATEGORIES.find(cat => cat.value === category);
  return categoryOption?.icon || 'ellipsis-horizontal-outline';
};

export const getConditionColor = (condition: ResourceCondition): string => {
  const conditionOption = RESOURCE_CONDITIONS.find(cond => cond.value === condition);
  return conditionOption?.color || '#9E9E9E';
};

export const getStatusColor = (status: ResourceStatus): string => {
  const statusOption = RESOURCE_STATUSES.find(stat => stat.value === status);
  return statusOption?.color || '#9E9E9E';
};

export const getCategoryDescription = (category: ResourceCategory): string => {
  const categoryOption = RESOURCE_CATEGORIES.find(cat => cat.value === category);
  return categoryOption?.description || 'Resource category';
};

export const getConditionDescription = (condition: ResourceCondition): string => {
  const conditionOption = RESOURCE_CONDITIONS.find(cond => cond.value === condition);
  return conditionOption?.description || 'Resource condition';
};

export const getStatusDescription = (status: ResourceStatus): string => {
  const statusOption = RESOURCE_STATUSES.find(stat => stat.value === status);
  return statusOption?.description || 'Resource status';
};

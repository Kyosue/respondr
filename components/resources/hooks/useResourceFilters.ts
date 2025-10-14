import { useState } from 'react';

import { useResources } from '@/contexts/ResourceContext';
import { ResourceCategory, ResourceCondition, ResourceStatus } from '@/types/Resource';

export function useResourceFilters() {
  const { setFilters } = useResources();
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | undefined>();
  const [selectedAgency, setSelectedAgency] = useState<string | undefined>();
  const [selectedResourceType, setSelectedResourceType] = useState<'pdrrmo' | 'external' | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<ResourceStatus | undefined>();
  const [selectedCondition, setSelectedCondition] = useState<ResourceCondition | undefined>();

  const handleCategorySelect = (category: ResourceCategory | undefined) => {
    setSelectedCategory(category);
    setFilters({ category });
  };

  const handleAgencySelect = (agencyId: string | undefined) => {
    setSelectedAgency(agencyId);
    setFilters({ agencyId });
  };

  const handleResourceTypeSelect = (type: 'pdrrmo' | 'external' | undefined) => {
    setSelectedResourceType(type);
    setFilters({ resourceType: type });
  };

  const handleStatusSelect = (status: ResourceStatus | undefined) => {
    setSelectedStatus(status);
    setFilters({ status });
  };

  const handleConditionSelect = (condition: ResourceCondition | undefined) => {
    setSelectedCondition(condition);
    setFilters({ condition });
  };

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSelectedAgency(undefined);
    setSelectedResourceType(undefined);
    setSelectedStatus(undefined);
    setSelectedCondition(undefined);
    setFilters({ 
      category: undefined,
      agencyId: undefined,
      resourceType: undefined,
      status: undefined,
      condition: undefined
    });
  };

  return {
    selectedCategory,
    selectedAgency,
    selectedResourceType,
    selectedStatus,
    selectedCondition,
    handleCategorySelect,
    handleAgencySelect,
    handleResourceTypeSelect,
    handleStatusSelect,
    handleConditionSelect,
    clearFilters,
  };
}

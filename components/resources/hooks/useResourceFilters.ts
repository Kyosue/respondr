import { useState } from 'react';

import { useResources } from '@/contexts/ResourceContext';
import { ResourceCategory } from '@/types/Resource';

export function useResourceFilters() {
  const { setFilters } = useResources();
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | undefined>();

  const handleCategorySelect = (category: ResourceCategory | undefined) => {
    setSelectedCategory(category);
    setFilters({ category });
  };

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setFilters({ category: undefined });
  };

  return {
    selectedCategory,
    handleCategorySelect,
    clearFilters,
  };
}

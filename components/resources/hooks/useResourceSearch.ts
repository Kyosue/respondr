import { useState } from 'react';

import { useResources } from '@/contexts/ResourceContext';

export function useResourceSearch() {
  const { setFilters, state } = useResources();
  const [showSearch, setShowSearch] = useState(false);

  // Use the search filter from context as the source of truth
  const searchQuery = state.filters.search || '';

  const handleSearch = (query: string) => {
    // Update the search filter in the context
    setFilters({ search: query });
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      handleClearSearch();
    }
  };

  const handleClearSearch = () => {
    // Clear the search filter in the context
    setFilters({ search: undefined });
  };

  return {
    searchQuery,
    showSearch,
    handleSearch,
    handleSearchToggle,
    handleClearSearch,
  };
}

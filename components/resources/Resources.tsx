import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  TouchableOpacity,
  View
} from 'react-native';

import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { SuccessModal } from '@/components/modals/SuccessModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import { usePermissions } from '@/hooks/usePermissions';
import { usePlatform } from '@/hooks/usePlatform';
import { Resource } from '@/types/Resource';
import { AddExternalResourceModal } from './modals/AddExternalResourceModal';
import { AddResourceModal } from './modals/AddResourceModal';
import { BorrowerDashboard } from './modals/BorrowerDashboard';
import { EditResourceModal } from './modals/EditResourceModal';
import { ResourceDetailModal } from './modals/ResourceDetailModal';
import { ResourceTypeSelectionModal } from './modals/ResourceTypeSelectionModal';
import { SmartBorrowModal } from './modals/SmartBorrowModal';

import { useResourceActions } from './hooks/useResourceActions';
import { useResourceFilters } from './hooks/useResourceFilters';
import { useResourceSearch } from './hooks/useResourceSearch';
import { ResourceActionsMenu } from './ResourceActions/ResourceActionsMenu';
import { ResourceCard } from './ResourceCard/ResourceCard';
import { ResourceSortOption } from './ResourceHeader/ResourceFilterPopover';
import { ResourceHeader } from './ResourceHeader/ResourceHeader';
import { ResourcesTable } from './ResourcesTable';
import { styles } from './styles/Resources.styles';

/** When true, scrolling near the bottom loads the next page; when false, only the "Load more" button does. */
const INFINITE_SCROLL_ENABLED = false;

const INFINITE_SCROLL_THRESHOLD_PX = 200;

export function Resources() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const bottomNavHeight = useBottomNavHeight();
  const { isWeb } = usePlatform();
  const { canCreateResources, canEditResources, canDeleteResources } = usePermissions();
  const { 
    state, 
    getFilteredResources, 
    refreshResources,
    getAllAgencies,
    addResource,
    deleteResource,
    fetchResourcesPage,
    resourcesTotalCount,
    resourcesCurrentPage,
    loadingMore,
    usePaginatedResources,
    setUsePaginatedResources,
    lastFetchFailedPage,
  } = useResources();
  
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddExternalModal, setShowAddExternalModal] = useState(false);
  const [showResourceTypeModal, setShowResourceTypeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSmartBorrowModal, setShowSmartBorrowModal] = useState(false);
  const [showBorrowerDashboard, setShowBorrowerDashboard] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number; width: number; height: number } | undefined>();
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  
  // Pagination state for mobile (client-side slice when not using server pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of resources to load per page (kept in sync with API limit)

  // Web table: page size options and current size
  const [webPageSize, setWebPageSize] = useState(10);
  const WEB_PAGE_SIZE_OPTIONS = [10, 20, 50];

  const infiniteScrollTriggeredRef = useRef(false);
  const isFirstFocusRef = useRef(true);

  // Confirmation modal hook
  const confirmationModal = useConfirmationModal();

  // Load agencies on component mount
  useEffect(() => {
    const loadAgencies = async () => {
      try {
        setLoadingAgencies(true);
        const agenciesData = await getAllAgencies();
        setAgencies(agenciesData);
      } catch (error) {
        console.error('Failed to load agencies:', error);
      } finally {
        setLoadingAgencies(false);
      }
    };

    loadAgencies();
  }, [getAllAgencies]);

  // Define handlers first
  const handleEditResource = (resource: Resource) => {
    setSelectedResource(resource);
    setShowEditModal(true);
  };

  const handleBorrowResource = (resource: Resource) => {
    // Prevent borrowing external resources
    if (resource.resourceType === 'external' || resource.isBorrowable === false) {
      confirmationModal.showConfirmation({
        title: 'Cannot Borrow',
        message: resource.resourceType === 'external' 
          ? 'External resources cannot be borrowed.' 
          : 'This resource is not available for borrowing.',
        variant: 'info',
        confirmLabel: 'OK',
        onConfirm: () => {
          // Modal will close automatically after onConfirm
        },
      });
      return;
    }
    
    setSelectedResource(resource);
    setShowSmartBorrowModal(true);
  };

  const handleReturnResource = (resource: Resource) => {
    setSelectedResource(resource);
    setShowDetailModal(true);
  };

  // Delete handler with confirmation
  const handleDeleteResource = (resource: Resource) => {
    confirmationModal.showConfirmation({
      title: 'Delete Resource',
      message: `Are you sure you want to delete "${resource.name}"? This action cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteResource(resource.id);
        } catch (error) {
          console.error('Error deleting resource:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete resource';
          Alert.alert('Error', `Failed to delete resource: ${errorMessage}`);
          // Don't hide modal on error - let user retry
          throw error;
        }
        // Modal will close automatically after successful onConfirm
      },
    });
  };

  // Custom hooks
  const {
    openActionsMenuId,
    selectedResourceForMenu,
    setSelectedResourceForMenu,
    handleEdit,
    handleBorrow,
    handleReturn,
    handleDelete,
    handleActionsMenuToggle,
    handleActionsMenuClose,
  } = useResourceActions({
    onEdit: handleEditResource,
    onBorrow: handleBorrowResource,
    onReturn: handleReturnResource,
    onDelete: handleDeleteResource,
  });

  const {
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
  } = useResourceFilters();

  const [sortOption, setSortOption] = useState<ResourceSortOption>('default');

  const {
    searchQuery,
    showSearch,
    handleSearch,
    handleSearchToggle,
    handleClearSearch,
  } = useResourceSearch();

  const mapSortToApi = useCallback((sort: ResourceSortOption): 'name_asc' | 'name_desc' | 'createdAt_desc' => {
    switch (sort) {
      case 'alphabetical-desc': return 'name_desc';
      case 'recently-added': return 'createdAt_desc';
      case 'default':
      case 'alphabetical-asc':
      default: return 'name_asc';
    }
  }, []);

  const buildPageOptions = useCallback(() => ({
    sort: mapSortToApi(sortOption),
    ...(selectedCategory && { category: selectedCategory }),
    ...(selectedAgency && { agencyId: selectedAgency }),
    ...(selectedStatus && { status: selectedStatus }),
    ...(selectedCondition && { condition: selectedCondition }),
    ...(searchQuery?.trim() && { search: searchQuery.trim() }),
  }), [mapSortToApi, sortOption, selectedCategory, selectedAgency, selectedStatus, selectedCondition, searchQuery]);

  // Use server-side pagination on this screen (both web and mobile); turn off when leaving
  useEffect(() => {
    setUsePaginatedResources(true);
    return () => setUsePaginatedResources(false);
  }, [setUsePaginatedResources]);

  // Step 7: Filter/sort change resets to page 1 and refetches with new options (buildPageOptions deps: sort, category, agency, status, condition, search)
  const effectivePageSize = isWeb ? webPageSize : itemsPerPage;
  useEffect(() => {
    if (!usePaginatedResources) return;
    fetchResourcesPage(1, effectivePageSize, { ...buildPageOptions(), ...(isWeb && { replaceOnly: true }) });
  }, [usePaginatedResources, effectivePageSize, isWeb, fetchResourcesPage, buildPageOptions]);

  // Step 8: Refetch current page when screen gains focus (skip first focus to avoid double fetch on mount)
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      if (!usePaginatedResources) return;
      const page = resourcesCurrentPage >= 1 ? resourcesCurrentPage : 1;
      fetchResourcesPage(page, effectivePageSize, { ...buildPageOptions(), ...(isWeb && { replaceOnly: true }) });
    }, [usePaginatedResources, resourcesCurrentPage, effectivePageSize, isWeb, fetchResourcesPage, buildPageOptions])
  );

  const handleClearFilters = () => {
    clearFilters();
    setSortOption('default');
  };

  const handleResourcePress = (resource: Resource) => {
    setSelectedResource(resource);
    setShowDetailModal(true);
  };

  const handleModalClose = () => {
    setShowDetailModal(false);
    setShowAddModal(false);
    setShowAddExternalModal(false);
    setShowResourceTypeModal(false);
    setShowEditModal(false);
    setShowSmartBorrowModal(false);
    setShowBorrowerDashboard(false);
    setShowSuccessModal(false);
    setSelectedResource(null);
  };

  const handleSuccess = () => {
    if (usePaginatedResources) {
      const size = isWeb ? webPageSize : itemsPerPage;
      fetchResourcesPage(1, size, { ...buildPageOptions(), ...(isWeb && { replaceOnly: true }) });
    } else {
      refreshResources();
    }
    handleModalClose();
  };

  const totalPagesWeb = resourcesTotalCount <= 0 ? 1 : Math.ceil(resourcesTotalCount / webPageSize);
  const rangeStartWeb = resourcesTotalCount <= 0 ? 0 : (resourcesCurrentPage - 1) * webPageSize + 1;
  const rangeEndWeb = Math.min(resourcesCurrentPage * webPageSize, resourcesTotalCount);

  const handleWebPrev = useCallback(() => {
    if (resourcesCurrentPage <= 1 || state.loading) return;
    fetchResourcesPage(resourcesCurrentPage - 1, webPageSize, { ...buildPageOptions(), replaceOnly: true });
  }, [resourcesCurrentPage, state.loading, fetchResourcesPage, webPageSize, buildPageOptions]);

  const handleWebNext = useCallback(() => {
    if (resourcesCurrentPage >= totalPagesWeb || state.loading) return;
    fetchResourcesPage(resourcesCurrentPage + 1, webPageSize, { ...buildPageOptions(), replaceOnly: true });
  }, [resourcesCurrentPage, totalPagesWeb, state.loading, fetchResourcesPage, webPageSize, buildPageOptions]);

  const handleWebPageSizeChange = useCallback((size: number) => {
    setWebPageSize(size);
    fetchResourcesPage(1, size, { ...buildPageOptions(), replaceOnly: true });
  }, [fetchResourcesPage, buildPageOptions]);

  const handleRetryPagination = useCallback(() => {
    const page = lastFetchFailedPage ?? 1;
    const size = isWeb ? webPageSize : itemsPerPage;
    fetchResourcesPage(page, size, { ...buildPageOptions(), ...(isWeb && { replaceOnly: true }) });
  }, [lastFetchFailedPage, isWeb, webPageSize, itemsPerPage, fetchResourcesPage, buildPageOptions]);

  const handleMultiBorrow = () => {
    setShowSmartBorrowModal(true);
  };

  const handleSelectPDRRMO = () => {
    setShowResourceTypeModal(false);
    setShowAddModal(true);
  };

  const handleSelectExternal = () => {
    setShowResourceTypeModal(false);
    setShowAddExternalModal(true);
  };

  const handleActionsMenuToggleWithResource = (resourceId: string, position?: { x: number; y: number; width: number; height: number }) => {
    const resource = state.resources.find((r: Resource) => r.id === resourceId);
    setSelectedResourceForMenu(resource || null);
    setCardPosition(position);
    handleActionsMenuToggle(resourceId);
  };

  const filteredResources = useMemo(() => {
    const resources = getFilteredResources();
    
    // Apply sorting
    // Note: When sortOption is not 'default', sorting completely ignores any default grouping
    return [...resources].sort((a, b) => {
      switch (sortOption) {
        case 'alphabetical-asc':
          // Sort alphabetically A-Z, ignoring any default grouping
          return a.name.localeCompare(b.name);
        case 'alphabetical-desc':
          // Sort alphabetically Z-A, ignoring any default grouping
          return b.name.localeCompare(a.name);
        case 'recently-added':
          // Sort by creation date (newest first), ignoring any default grouping
          const getDate = (dateValue: Date | any): Date => {
            if (!dateValue) return new Date(0);
            if (dateValue instanceof Date) return dateValue;
            if (typeof dateValue.toDate === 'function') return dateValue.toDate();
            return new Date(0);
          };
          const dateA = getDate(a.createdAt);
          const dateB = getDate(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        case 'default':
        default:
          // Default: Sort alphabetically by name
          return a.name.localeCompare(b.name);
      }
    });
  }, [getFilteredResources, sortOption]);

  // Resources to show: on web or mobile (client-side slice) = filtered + slice; on mobile (server pagination) = filtered only (no slice)
  const paginatedResources = useMemo(() => {
    if (isWeb) return filteredResources;
    if (usePaginatedResources) return filteredResources;
    return filteredResources.slice(0, currentPage * itemsPerPage);
  }, [filteredResources, currentPage, itemsPerPage, isWeb, usePaginatedResources]);

  const hasMoreResources = !isWeb && (
    usePaginatedResources
      ? state.resources.length < resourcesTotalCount
      : filteredResources.length > paginatedResources.length
  );

  const handleLoadMore = useCallback(() => {
    if (!hasMoreResources || loadingMore) return;
    if (usePaginatedResources) {
      fetchResourcesPage(resourcesCurrentPage + 1, itemsPerPage, buildPageOptions());
    } else {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMoreResources, loadingMore, usePaginatedResources, fetchResourcesPage, resourcesCurrentPage, itemsPerPage, buildPageOptions]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!INFINITE_SCROLL_ENABLED || isWeb || !hasMoreResources || loadingMore || infiniteScrollTriggeredRef.current) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - INFINITE_SCROLL_THRESHOLD_PX;
    if (!isNearBottom) return;
    infiniteScrollTriggeredRef.current = true;
    if (usePaginatedResources) {
      fetchResourcesPage(resourcesCurrentPage + 1, itemsPerPage, buildPageOptions()).finally(() => {
        infiniteScrollTriggeredRef.current = false;
      });
    } else {
      setCurrentPage(prev => prev + 1);
      infiniteScrollTriggeredRef.current = false;
    }
  }, [isWeb, hasMoreResources, loadingMore, usePaginatedResources, fetchResourcesPage, resourcesCurrentPage, itemsPerPage, buildPageOptions]);

  // Reset client-side page when filters change (only matters when not using server pagination)
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedAgency, selectedResourceType, selectedStatus, selectedCondition, searchQuery, sortOption]);

  const renderResourceList = () => {
    if (state.loading) {
      return (
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading resources...</ThemedText>
        </View>
      );
    }

    if (filteredResources.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyTitle}>No resources found</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            {searchQuery ? 'Try adjusting your search terms' : 'Add your first resource to get started'}
          </ThemedText>
        </View>
      );
    }

    if (isWeb) {
      return (
        <View style={{ flex: 1 }}>
          <ResourcesTable
            resources={filteredResources}
            onResourcePress={handleResourcePress}
            onBorrow={handleBorrowResource}
            onReturn={handleReturnResource}
            onEdit={canEditResources ? handleEditResource : undefined}
            onDelete={canDeleteResources ? handleDelete : undefined}
            canEdit={canEditResources}
            canDelete={canDeleteResources}
          />
          <View style={[styles.tablePaginationBar, { borderTopColor: colors.border }]}>
            <ThemedText style={[styles.tablePaginationInfo, { color: colors.text }]}>
              {loadingMore ? (
                'Loading…'
              ) : (
                `Showing ${rangeStartWeb}–${rangeEndWeb} of ${resourcesTotalCount}`
              )}
            </ThemedText>
            <View style={styles.tablePaginationControls}>
              <TouchableOpacity
                style={[styles.tablePaginationButton, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}
                onPress={handleWebPrev}
                disabled={resourcesCurrentPage <= 1 || state.loading}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} style={resourcesCurrentPage <= 1 || state.loading ? { opacity: 0.5 } : undefined} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tablePaginationButton, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}
                onPress={handleWebNext}
                disabled={resourcesCurrentPage >= totalPagesWeb || state.loading}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.text} style={resourcesCurrentPage >= totalPagesWeb || state.loading ? { opacity: 0.5 } : undefined} />
              </TouchableOpacity>
              <View style={styles.tablePaginationPageSize}>
                <ThemedText style={[styles.tablePaginationInfo, { color: colors.text, marginRight: 4 }]}>Per page:</ThemedText>
                {WEB_PAGE_SIZE_OPTIONS.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.tablePaginationPageSizeOption,
                      { backgroundColor: webPageSize === size ? colors.tint : 'transparent', borderWidth: 1, borderColor: colors.border }
                    ]}
                    onPress={() => handleWebPageSizeChange(size)}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={{ fontSize: 14, color: webPageSize === size ? '#fff' : colors.text }}>{size}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      );
    }

    return (
      <>
        <View style={styles.resourcesContainer}>
          {paginatedResources.map((resource: Resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onPress={handleResourcePress}
              onEdit={canEditResources ? handleEditResource : () => {}}
              onDelete={canDeleteResources ? handleDelete : () => {}}
              onBorrow={handleBorrowResource}
              onReturn={handleReturnResource}
              isActionsMenuOpen={openActionsMenuId === resource.id}
              onActionsMenuToggle={handleActionsMenuToggleWithResource}
            />
          ))}
        </View>
        {loadingMore && (
          <View style={styles.loadingMoreRow}>
            <ActivityIndicator size="small" color={colors.tint} />
            <ThemedText style={[styles.loadingMoreRowText, { color: colors.text }]}>Loading more…</ThemedText>
          </View>
        )}
        {hasMoreResources && (
          <View style={styles.loadMoreContainer}>
            <TouchableOpacity
              style={[styles.loadMoreButton, { backgroundColor: 'white', borderColor: colors.border }]}
              onPress={handleLoadMore}
              activeOpacity={0.7}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ThemedText style={styles.loadMoreText}>Loading more...</ThemedText>
              ) : (
                <>
                  <Ionicons name="arrow-down" size={20} color="#black" />
                  <ThemedText style={styles.loadMoreText}>
                    Load More ({state.resources.length} of {usePaginatedResources ? resourcesTotalCount : filteredResources.length})
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        {!hasMoreResources && paginatedResources.length > 0 && (
          <View style={styles.endOfListContainer}>
            <ThemedText style={[styles.endOfListText, { color: colors.text }]}>
              Showing all {usePaginatedResources ? resourcesTotalCount : filteredResources.length} resource{(usePaginatedResources ? resourcesTotalCount : filteredResources.length) !== 1 ? 's' : ''}
            </ThemedText>
          </View>
        )}
      </>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ResourceHeader
        showSearch={showSearch}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onSearchToggle={handleSearchToggle}
        onAddResource={canCreateResources ? () => setShowResourceTypeModal(true) : () => {}}
        showAddButton={canCreateResources}
        onMultiBorrow={handleMultiBorrow}
        onBorrowerDashboard={() => setShowBorrowerDashboard(true)}
        onClearSearch={handleClearSearch}
        selectedCategory={selectedCategory}
        selectedAgency={selectedAgency}
        selectedResourceType={selectedResourceType}
        selectedStatus={selectedStatus}
        selectedCondition={selectedCondition}
        selectedSort={sortOption}
        onSortSelect={setSortOption}
        onCategorySelect={handleCategorySelect}
        onAgencySelect={handleAgencySelect}
        onResourceTypeSelect={handleResourceTypeSelect}
        onStatusSelect={handleStatusSelect}
        onConditionSelect={handleConditionSelect}
        onClearFilters={handleClearFilters}
        agencies={agencies}
      />

      {state.error && usePaginatedResources && (
        <View style={[styles.errorBanner, { backgroundColor: colors.error + '20', borderWidth: 1, borderColor: colors.error + '40' }]}>
          <ThemedText style={[styles.errorBannerText, { color: colors.text }]} numberOfLines={2}>
            {state.error}
          </ThemedText>
          <TouchableOpacity
            style={[styles.errorBannerRetry, { backgroundColor: colors.tint }]}
            onPress={handleRetryPagination}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.errorBannerRetryText, { color: '#fff' }]}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {isWeb ? (
        renderResourceList()
      ) : (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: bottomNavHeight + 20 }
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={100}
        >
          {renderResourceList()}
        </ScrollView>
      )}

      {/* Global Actions Menu */}
      <ResourceActionsMenu
        visible={!!openActionsMenuId && !!selectedResourceForMenu}
        resource={selectedResourceForMenu}
        cardPosition={cardPosition}
        onClose={handleActionsMenuClose}
        onEdit={handleEditResource}
        onDelete={handleDelete}
      />

      {/* Modals */}
      <ResourceDetailModal
        resource={selectedResource}
        visible={showDetailModal}
        onClose={handleModalClose}
        onEdit={handleEditResource}
        onBorrow={handleBorrowResource}
        onReturn={handleReturnResource}
      />

      <ResourceTypeSelectionModal
        visible={showResourceTypeModal}
        onClose={handleModalClose}
        onSelectPDRRMO={handleSelectPDRRMO}
        onSelectExternal={handleSelectExternal}
      />

      <AddResourceModal
        visible={showAddModal}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />

      <AddExternalResourceModal
        visible={showAddExternalModal}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        agencies={agencies}
      />

      <EditResourceModal
        resource={selectedResource}
        visible={showEditModal}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />

      <SmartBorrowModal
        resource={selectedResource}
        visible={showSmartBorrowModal}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        mode="borrow"
      />

      <BorrowerDashboard
        visible={showBorrowerDashboard}
        onClose={handleModalClose}
      />

      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={handleModalClose}
      />

      {/* Confirmation Modal */}
      {confirmationModal.options && (
        <ConfirmationModal
          visible={confirmationModal.visible}
          title={confirmationModal.options.title}
          message={confirmationModal.options.message}
          variant={confirmationModal.options.variant}
          confirmLabel={confirmationModal.options.confirmLabel}
          cancelLabel={confirmationModal.options.cancelLabel}
          icon={confirmationModal.options.icon}
          onConfirm={confirmationModal.handleConfirm}
          onCancel={confirmationModal.hideConfirmation}
        />
      )}
    </ThemedView>
  );
}
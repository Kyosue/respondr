import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
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
import { ResourceHeader } from './ResourceHeader/ResourceHeader';
import { ResourcesTable } from './ResourcesTable';
import { styles } from './styles/Resources.styles';

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
    deleteResource
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

  const {
    searchQuery,
    showSearch,
    handleSearch,
    handleSearchToggle,
    handleClearSearch,
  } = useResourceSearch();

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
    refreshResources();
    handleModalClose();
  };

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
    // Sort resources alphabetically by name
    return resources.sort((a, b) => a.name.localeCompare(b.name));
  }, [getFilteredResources]);

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
      );
    }

    return (
      <View style={styles.resourcesContainer}>
        {filteredResources.map((resource: Resource) => (
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
        onCategorySelect={handleCategorySelect}
        onAgencySelect={handleAgencySelect}
        onResourceTypeSelect={handleResourceTypeSelect}
        onStatusSelect={handleStatusSelect}
        onConditionSelect={handleConditionSelect}
        onClearFilters={clearFilters}
        agencies={agencies}
      />

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
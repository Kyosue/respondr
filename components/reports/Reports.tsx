import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from '@/contexts/MemoContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import { usePermissions } from '@/hooks/usePermissions';
import { MemoDocument, MemoFilter } from '@/types/MemoDocument';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Platform, RefreshControl, Text, TouchableOpacity, View } from 'react-native';

import { MemoActiveFilterTags } from './MemoActiveFilterTags';
import { MemoFilterPopover } from './MemoFilterPopover';
import { DistributionModal } from './modals/DistributionModal';
import { MemoDetailModal } from './modals/MemoDetailModal';
import { MemoUploadModal } from './modals/MemoUploadModal';

import { styles } from './Reports.styles';

const Reports: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const isWeb = Platform.OS === 'web';
  const { 
    documents, 
    loading, 
    fetchDocuments, 
    updateDistribution, 
    acknowledgeDocument,
    deleteDocument,
    deleteSelected,
    selectedDocuments,
    selectDocument,
    deselectDocument,
  } = useMemo();
  
  // Check if user can assign documents (supervisor or admin only)
  const canAssignDocuments = user?.userType === 'supervisor' || user?.userType === 'admin';
  const { canDeleteSitRep, isAdminOrSupervisor } = usePermissions();
  const confirmationModal = useConfirmationModal();
  
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [filters, setFilters] = useState<MemoFilter>({});
  const [selectedDocument, setSelectedDocument] = useState<MemoDocument | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [distributionModalVisible, setDistributionModalVisible] = useState(false);
  const [documentToDistribute, setDocumentToDistribute] = useState<MemoDocument | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDocuments(filters);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDocumentPress = (doc: MemoDocument) => {
    setSelectedDocument(doc);
    setDetailModalVisible(true);
  };

  const handleAssign = async (userIds: string[]) => {
    if (!documentToDistribute) return;

    try {
      await updateDistribution(documentToDistribute.id, userIds);
      setDistributionModalVisible(false);
      setDocumentToDistribute(null);
      Alert.alert('Success', `Document assigned to ${userIds.length} user(s)`);
      fetchDocuments(filters);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to assign document');
    }
  };

  const handleAcknowledge = async (documentId: string, comments?: string) => {
    try {
      await acknowledgeDocument(documentId, user?.id || '', user?.fullName || 'User', comments);
      Alert.alert('Success', 'Document acknowledged');
      fetchDocuments(filters);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to acknowledge document');
    }
  };

  const handleMultiSelectToggle = () => {
    if (isMultiSelectMode) {
      // Exit multi-select mode
      setIsMultiSelectMode(false);
      // Clear selections (deselectAll would be better but we need to check if it exists)
      selectedDocuments.forEach(id => deselectDocument(id));
    } else {
      // Enter multi-select mode
      setIsMultiSelectMode(true);
    }
  };

  const handleDocumentSelect = (documentId: string, selected: boolean) => {
    // If not in multi-select mode but trying to select, enter multi-select mode
    if (!isMultiSelectMode && selected) {
      setIsMultiSelectMode(true);
    }
    
    if (selected) {
      selectDocument(documentId);
    } else {
      deselectDocument(documentId);
      // If no documents are selected, exit multi-select mode
      if (selectedDocuments.size <= 1) {
        setIsMultiSelectMode(false);
      }
    }
  };

  const handleDelete = async (document: MemoDocument) => {
    confirmationModal.showConfirmation({
      title: 'Delete Document',
      message: `Are you sure you want to delete "${document.title}"? This action cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteDocument(document.id);
          // Close the detail modal if it's open
          setDetailModalVisible(false);
          setSelectedDocument(null);
          Alert.alert('Success', 'Document deleted successfully');
        } catch (error) {
          Alert.alert('Delete Failed', error instanceof Error ? error.message : 'Unknown error');
          throw error; // Re-throw to prevent modal from closing on error
        }
      },
    });
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return;
    
    const count = selectedDocuments.size;
    confirmationModal.showConfirmation({
      title: 'Delete Documents',
      message: `Are you sure you want to delete ${count} ${count === 1 ? 'document' : 'documents'}? This action cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteSelected();
          setIsMultiSelectMode(false);
          Alert.alert('Success', `Successfully deleted ${count} ${count === 1 ? 'document' : 'documents'}`);
        } catch (error) {
          Alert.alert('Delete Failed', error instanceof Error ? error.message : 'Unknown error');
          throw error; // Re-throw to prevent modal from closing on error
        }
      },
    });
  };

  const isAssignedToMe = (doc: MemoDocument) => {
    return doc.distributionList && doc.distributionList.includes(user?.id || '');
  };

  const hasAcknowledged = (doc: MemoDocument) => {
    if (!doc.acknowledgmentRequired) return false;
    if (!doc.acknowledgments || doc.acknowledgments.length === 0) return false;
    return doc.acknowledgments.some((ack) => ack.userId === user?.id);
  };

  // Responsive columns for web
  const [columns, setColumns] = useState<number>(isWeb ? 3 : 1);

  useEffect(() => {
    if (!isWeb) return;
    const CARD_WIDTH_WEB = 260; // match Reports.styles.ts
    const GAP = 16;             // match grid gap
    const H_PADDING = 40;       // paddingHorizontal: 20 on both sides

    const computeColumns = () => {
      const { width } = Dimensions.get('window');
      const available = Math.max(0, width - H_PADDING);
      const col = Math.max(1, Math.floor(available / (CARD_WIDTH_WEB + GAP)));
      setColumns(col);
    };

    computeColumns();
    const sub = Dimensions.addEventListener('change', computeColumns);
    return () => {
      // @ts-ignore RN web compatibility
      sub?.remove ? sub.remove() : Dimensions.removeEventListener?.('change', computeColumns);
    };
  }, [isWeb]);

  // Memoize unique documents list
  const uniqueDocuments = React.useMemo(() => {
    return documents.filter((doc, index, self) => index === self.findIndex(d => d.id === doc.id));
  }, [documents]);

  const renderItem = useCallback(({ item: doc }: { item: MemoDocument }) => {
    const isAssigned = isAssignedToMe(doc);
    const hasAck = hasAcknowledged(doc);
    const needsAcknowledgment = doc.acknowledgmentRequired && !hasAck;
    const isSelected = selectedDocuments.has(doc.id);
    
    const handlePress = () => {
      if (isMultiSelectMode) {
        handleDocumentSelect(doc.id, !isSelected);
      } else {
        handleDocumentPress(doc);
      }
    };

    const handleLongPress = () => {
      if (!isMultiSelectMode) {
        // Enter multi-select mode and select this document
        handleDocumentSelect(doc.id, true);
      }
    };
    
    return (
      <TouchableOpacity
        key={doc.id}
        style={[
          styles.documentItem,
          { backgroundColor: colors.surface },
          isWeb && styles.documentCard,
          isSelected && styles.documentItemSelected,
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
      >
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          </View>
        )}
        {isWeb ? (
          <>
            <View style={styles.cardHeader}>
              <View style={styles.documentIcon}>
                <Ionicons name="document-text" size={32} color={colors.tint} />
              </View>
              {canAssignDocuments && !isMultiSelectMode && (
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    setDocumentToDistribute(doc);
                    setDistributionModalVisible(true);
                  }}
                >
                  <Ionicons name="people" size={18} color={colors.tabIconDefault} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.documentInfo}>
              <Text style={[styles.documentTitle, { color: colors.text }]} numberOfLines={2}>
                {doc.title}
              </Text>
              <Text style={[styles.documentMeta, { color: colors.tabIconDefault }]} numberOfLines={1}>
                {doc.issuingAgency}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      doc.priority === 'urgent'
                        ? '#FF3B30'
                        : doc.priority === 'high'
                        ? '#FF9500'
                        : doc.priority === 'normal'
                        ? '#34C759'
                        : '#8E8E93',
                  },
                ]}
              >
                <Text style={styles.badgeText}>{doc.priority}</Text>
              </View>
              {isAssigned && (
                <View style={[styles.badge, { backgroundColor: '#34C759' }]}> 
                  <Ionicons name="checkmark-circle" size={12} color="#fff" />
                  <Text style={styles.badgeText}>Assigned</Text>
                </View>
              )}
              {needsAcknowledgment && (
                <View style={[styles.badge, { backgroundColor: '#FF9500' }]}> 
                  <Ionicons name="alert-circle" size={12} color="#fff" />
                  <Text style={styles.badgeText}>Acknowledge</Text>
                </View>
              )}
            </View>
            <View style={styles.cardFooter}>
              <Text style={[styles.documentDate, { color: colors.tabIconDefault }]}> 
                {new Date(doc.uploadedAt).toLocaleDateString()}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.documentIcon}>
              <Ionicons name="document-text" size={32} color={colors.tint} />
            </View>
            <View style={styles.documentInfo}>
              <Text style={[styles.documentTitle, { color: colors.text }]} numberOfLines={2}>
                {doc.title}
              </Text>
              <Text style={[styles.documentMeta, { color: colors.tabIconDefault }]}>
                {doc.issuingAgency} • {doc.agencyLevel}
              </Text>
              <View style={styles.documentBadges}>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        doc.priority === 'urgent'
                          ? '#FF3B30'
                          : doc.priority === 'high'
                          ? '#FF9500'
                          : doc.priority === 'normal'
                          ? '#34C759'
                          : '#8E8E93',
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>{doc.priority}</Text>
                </View>
                {isAssigned && (
                  <View style={[styles.badge, { backgroundColor: '#34C759' }]}> 
                    <Ionicons name="checkmark-circle" size={12} color="#fff" />
                    <Text style={styles.badgeText}>Assigned</Text>
                  </View>
                )}
                {needsAcknowledgment && (
                  <View style={[styles.badge, { backgroundColor: '#FF9500' }]}> 
                    <Ionicons name="alert-circle" size={12} color="#fff" />
                    <Text style={styles.badgeText}>Acknowledge</Text>
                  </View>
                )}
                <Text style={[styles.documentDate, { color: colors.tabIconDefault }]}>
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            {canAssignDocuments && !isMultiSelectMode && (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setDocumentToDistribute(doc);
                  setDistributionModalVisible(true);
                }}
              >
                <Ionicons name="people" size={20} color={colors.tabIconDefault} />
              </TouchableOpacity>
            )}
            {!isMultiSelectMode && (
              <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
              </TouchableOpacity>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  }, [colors, isWeb, canAssignDocuments, isMultiSelectMode, selectedDocuments, handleDocumentSelect, handleDocumentPress]);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent'}]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Reports Library</Text>
          <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
            Manage memos and local issuances
          </Text>
        </View>
        <View style={styles.headerButtons}>
          {!isMultiSelectMode && (
            <MemoFilterPopover
              filters={filters}
              onFilterChange={(newFilters) => {
                setFilters(newFilters);
                fetchDocuments(newFilters);
              }}
            />
          )}
          {!isMultiSelectMode && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.tint, borderColor: colors.tint }]}
              onPress={() => setUploadModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          {(canDeleteSitRep || isAdminOrSupervisor) && (
            <TouchableOpacity
              style={[styles.addButton, { 
                backgroundColor: isMultiSelectMode ? colors.error : colors.surface, 
                borderColor: isMultiSelectMode ? colors.error : colors.border,
              }]}
              onPress={handleMultiSelectToggle}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={isMultiSelectMode ? "checkmark" : "checkbox-outline"} 
                size={16} 
                color={isMultiSelectMode ? "#fff" : colors.text} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Active Filter Tags */}
      <View style={styles.filtersSection}>
        <MemoActiveFilterTags
          filters={filters}
          onFilterChange={(newFilters) => {
            setFilters(newFilters);
            fetchDocuments(newFilters);
          }}
        />
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.tabIconSelected }]}>
          <Ionicons name="document-text" size={28} color={colors.background} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statNumber, { color: colors.background }]}>
              {documents.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.background }]}>
              Total Documents
            </Text>
          </View>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.error }]}>
          <Ionicons name="alert-circle" size={28} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statNumber, { color: '#fff' }]}>
              {documents.filter((doc) => doc.priority === 'urgent').length}
            </Text>
            <Text style={[styles.statLabel, { color: '#fff' }]}>Urgent</Text>
          </View>
        </View>
      </View>

      {/* Content Area */}
      <FlatList
        key={`reports-grid-${isWeb ? columns : 1}`}
        style={styles.content}
        contentContainerStyle={[styles.documentsList]}
        data={uniqueDocuments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        numColumns={isWeb ? columns : 1}
        columnWrapperStyle={isWeb ? { 
          justifyContent: 'flex-start', 
          gap: 16, 
          paddingHorizontal: 20, 
          marginBottom: 16 
        } : undefined}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        }
        ListHeaderComponent={isMultiSelectMode && (canDeleteSitRep || isAdminOrSupervisor) ? (
          <View style={styles.multiSelectBar}>
            <View style={styles.multiSelectContent}>
              <Text style={[styles.selectedCount, { color: colors.text }]}>
                {selectedDocuments.size} selected
              </Text>
              <View style={styles.multiSelectActions}>
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.error }]}
                  onPress={handleBulkDelete}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={handleMultiSelectToggle}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}
        ListEmptyComponent={loading ? (
          <View style={styles.centerContent}>
            <Ionicons name="hourglass" size={32} color={colors.tabIconDefault} />
            <Text style={[styles.emptyText, { color: colors.text }]}>Loading documents...</Text>
          </View>
        ) : (
          <View style={styles.centerContent}>
            <Ionicons name="folder-open" size={64} color={colors.tabIconDefault} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No documents yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
              Upload memos and local issuances to get started
            </Text>
          </View>
        )}
      />

      {/* Upload Modal */}
      <MemoUploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
      />

      {/* Distribution Modal */}
      <DistributionModal
        visible={distributionModalVisible}
        selectedDocumentId={documentToDistribute?.id}
        initialDistributionList={documentToDistribute?.distributionList || []}
        onClose={() => {
          setDistributionModalVisible(false);
          setDocumentToDistribute(null);
        }}
        onSave={handleAssign}
      />

      {/* Detail Modal */}
      <MemoDetailModal
        visible={detailModalVisible}
        document={selectedDocument}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedDocument(null);
        }}
        onAssign={canAssignDocuments ? () => {
          setDetailModalVisible(false);
          setDocumentToDistribute(selectedDocument);
          setDistributionModalVisible(true);
        } : () => {}}
        onAcknowledge={handleAcknowledge}
        onDelete={(canDeleteSitRep || isAdminOrSupervisor) && selectedDocument ? handleDelete : undefined}
        isAssignedToMe={selectedDocument ? isAssignedToMe(selectedDocument) : false}
        hasAcknowledged={selectedDocument ? hasAcknowledged(selectedDocument) : false}
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
    </View>
  );
};

export { Reports };

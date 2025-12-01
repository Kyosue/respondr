import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from '@/contexts/MemoContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import { usePermissions } from '@/hooks/usePermissions';
import { useScreenSize } from '@/hooks/useScreenSize';
import { MemoDocument, MemoFilter } from '@/types/MemoDocument';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  const { isMobile, isTablet, isDesktop, width: screenWidth } = useScreenSize();
  const { 
    documents, 
    loading, 
    hasMore,
    fetchDocuments, 
    loadMore,
    refresh,
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
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDocuments(filters, true);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
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
      await refresh();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to assign document');
    }
  };

  const handleAcknowledge = async (documentId: string, comments?: string) => {
    try {
      await acknowledgeDocument(documentId, user?.id || '', user?.fullName || 'User', comments);
      Alert.alert('Success', 'Document acknowledged');
      await refresh();
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

  // Calculate grid columns based on screen size
  const getColumnsPerRow = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    if (isDesktop) {
      // Desktop: 3-5 columns depending on screen width
      if (screenWidth >= 1600) return 5;
      if (screenWidth >= 1200) return 4;
      return 2;
    }
    return 2; // Default
  };

  const columnsPerRow = getColumnsPerRow();

  // Memoize unique documents list
  const uniqueDocuments = React.useMemo(() => {
    return documents.filter((doc, index, self) => index === self.findIndex(d => d.id === doc.id));
  }, [documents]);

  // Filter documents by search query (client-side filtering)
  const filteredDocuments = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return uniqueDocuments;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return uniqueDocuments.filter((doc) => {
      const titleMatch = doc.title.toLowerCase().includes(query);
      const descriptionMatch = doc.description?.toLowerCase().includes(query);
      const agencyMatch = doc.issuingAgency?.toLowerCase().includes(query);
      const memoNumberMatch = doc.memoNumber?.toLowerCase().includes(query);
      const tagsMatch = doc.tags?.some(tag => tag.toLowerCase().includes(query));
      
      return titleMatch || descriptionMatch || agencyMatch || memoNumberMatch || tagsMatch;
    });
  }, [uniqueDocuments, searchQuery]);

  // Group documents by date (similar to SitRep)
  const groupDocumentsByDate = (docs: MemoDocument[]) => {
    const groups: { [key: string]: MemoDocument[] } = {};
    
    docs.forEach(doc => {
      const date = new Date(doc.uploadedAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else if (date.getFullYear() === today.getFullYear()) {
        groupKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      } else {
        groupKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(doc);
    });
    
    // Sort groups by date (most recent first)
    const sortedGroups = Object.entries(groups).sort((a, b) => {
      const dateA = new Date(a[1][0].uploadedAt);
      const dateB = new Date(b[1][0].uploadedAt);
      return dateB.getTime() - dateA.getTime();
    });
    
    return sortedGroups;
  };

  // Memoize sections for grid layout
  const sections = React.useMemo(() => {
    return groupDocumentsByDate(filteredDocuments).map(([title, data]) => ({ title, data }));
  }, [filteredDocuments]);

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
            {/* Top Row: Icon and Title */}
            <View style={styles.cardTopRow}>
              <View style={[styles.documentIcon, { backgroundColor: `${colors.tint}20` }]}>
                <Ionicons name="document-text" size={24} color={colors.tint} />
              </View>
              <View style={styles.titleContainer}>
                <Text style={[styles.documentTitle, { color: colors.text }]} numberOfLines={2}>
                  {doc.title}
                </Text>
                <Text style={[styles.documentMeta, { color: colors.tabIconDefault }]} numberOfLines={1}>
                  {doc.issuingAgency}
                </Text>
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
            
            {/* Bottom Row: Badges and Date */}
            <View style={[styles.cardBottomRow, { borderTopColor: colors.border }]}>
              <View style={styles.badgeContainer}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                        doc.priority === 'urgent'
                          ? '#FF3B3020'
                          : doc.priority === 'high'
                          ? '#FF950020'
                          : doc.priority === 'normal'
                          ? '#34C75920'
                          : '#8E8E9320',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color:
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
                    {doc.priority}
                  </Text>
              </View>
              {isAssigned && (
                  <View style={[styles.badge, { backgroundColor: '#34C75920' }]}> 
                    <Ionicons name="checkmark-circle" size={11} color="#34C759" />
                    <Text style={[styles.badgeText, { color: '#34C759' }]}>Assigned</Text>
                </View>
              )}
              {needsAcknowledgment && (
                  <View style={[styles.badge, { backgroundColor: '#FF950020' }]}> 
                    <Ionicons name="alert-circle" size={11} color="#FF9500" />
                    <Text style={[styles.badgeText, { color: '#FF9500' }]}>Acknowledge</Text>
                </View>
              )}
            </View>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={11} color={colors.tabIconDefault} />
              <Text style={[styles.documentDate, { color: colors.tabIconDefault }]}> 
                {new Date(doc.uploadedAt).toLocaleDateString()}
              </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.documentIcon, { backgroundColor: `${colors.tint}20` }]}>
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
                          ? '#FF3B3020'
                          : doc.priority === 'high'
                          ? '#FF950020'
                          : doc.priority === 'normal'
                          ? '#34C75920'
                          : '#8E8E9320',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color:
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
                    {doc.priority}
                  </Text>
                </View>
                {isAssigned && (
                  <View style={[styles.badge, { backgroundColor: '#34C75920' }]}> 
                    <Ionicons name="checkmark-circle" size={11} color="#34C759" />
                    <Text style={[styles.badgeText, { color: '#34C759' }]}>Assigned</Text>
                  </View>
                )}
                {needsAcknowledgment && (
                  <View style={[styles.badge, { backgroundColor: '#FF950020' }]}> 
                    <Ionicons name="alert-circle" size={11} color="#FF9500" />
                    <Text style={[styles.badgeText, { color: '#FF9500' }]}>Acknowledge</Text>
                  </View>
                )}
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar-outline" size={11} color={colors.tabIconDefault} />
                <Text style={[styles.documentDate, { color: colors.tabIconDefault }]}>
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </Text>
                </View>
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

  // Show loading spinner when initially loading documents (similar to SitRep)
  if (loading && documents.length === 0) {
    return (
      <View style={[styles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={{ marginTop: 16, opacity: 0.7, color: colors.text }}>
          Loading documents...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: 'transparent'}]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Documents</Text>
          <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
            Manage Documents
          </Text>
        </View>
        <View style={styles.headerButtons}>
          {!isMultiSelectMode && (
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.tint, borderColor: colors.tint }]}
              onPress={() => setUploadModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          {!isMultiSelectMode && (
            <TouchableOpacity
              style={[styles.headerButton, { 
                backgroundColor: colors.surface, 
                borderColor: colors.border,
              }]}
              onPress={handleSearchToggle}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={showSearch ? "close" : "search"} 
                size={16} 
                color={colors.text} 
              />
            </TouchableOpacity>
          )}
          {!isMultiSelectMode && (
            <View style={styles.filterButtonWrapper}>
              <MemoFilterPopover
                filters={filters}
                onFilterChange={(newFilters) => {
                  setFilters(newFilters);
                  fetchDocuments(newFilters, true);
                }}
              />
            </View>
          )}
          {(canDeleteSitRep || isAdminOrSupervisor) && (
            <TouchableOpacity
              style={[styles.headerButton, { 
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

      {/* Search Section */}
      {showSearch && (
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons 
                name="search" 
                size={20} 
                color={colors.text + '60'} 
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search documents..."
                placeholderTextColor={colors.text + '60'}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearSearchButton}
                  onPress={handleClearSearch}
                >
                  <Ionicons name="close-circle" size={20} color={colors.text + '60'} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

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

      {/* Content Area */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.documentsList]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.tint]}
              tintColor={colors.tint}
            />
          ) : undefined
        }
        onScroll={(event) => {
          // Handle infinite scroll for web
          if (Platform.OS === 'web' && hasMore && !loading) {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 400;
            if (isCloseToBottom) {
              loadMore();
            }
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Multi-select bar */}
        {isMultiSelectMode && (canDeleteSitRep || isAdminOrSupervisor) && (
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
        )}

        {/* Render sections with grid layout */}
        {sections.length > 0 ? (
          sections.map((section) => (
            <View key={section.title} style={styles.sectionContainer}>
              <View style={styles.documentGroup}>
                <Text style={[styles.groupHeader, { color: colors.text }]}>
                  {section.title}
                </Text>
              </View>
              <View style={[
                styles.documentsGrid,
                {
                  paddingHorizontal: isMobile ? 16 : isDesktop ? 20 : 16,
                }
              ]}>
                {section.data.map((doc) => {
                  // Calculate width percentage accounting for gaps
                  const widthPercent = isMobile 
                    ? 100 
                    : (100 / columnsPerRow) - (columnsPerRow > 1 ? 1.5 : 0);
                  
                  return (
                    <View
                      key={doc.id}
                      style={[
                        styles.gridItem,
                        isMobile ? styles.gridItemMobile : [
                          styles.gridItemDesktop,
                          {
                            width: `${widthPercent}%`,
                            minWidth: 200,
                          }
                        ]
                      ]}
                    >
                      {renderItem({ item: doc })}
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        ) : (
          !loading && (
            <View style={styles.centerContent}>
              <Ionicons name="folder-open" size={64} color={colors.tabIconDefault} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No documents yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                Upload memos and local issuances to get started
              </Text>
            </View>
          )
        )}

        {/* Loading more indicator */}
        {loading && documents.length > 0 && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.tint} />
            <Text style={{ marginTop: 8, color: colors.tabIconDefault, fontSize: 12 }}>
              Loading more documents...
            </Text>
          </View>
        )}
      </ScrollView>

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

import { useAuth } from '@/contexts/AuthContext';
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useDocumentDownload } from '@/hooks/useDocumentDownload';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { usePermissions } from '@/hooks/usePermissions';
import { usePlatform } from '@/hooks/usePlatform';
import { useScreenSize } from '@/hooks/useScreenSize';
import { SitRepDocument } from '@/types/Document';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
  RefreshControl,
  ScrollView,
    TouchableOpacity,
    View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { Colors } from '@/constants/Colors';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import { DocumentCard } from './DocumentCard';
import { SitRepHeader } from './SitRepHeader';
import { SitRepDetailModal } from './modals/SitRepDetailModal';
import { SitrepGeneratorModal } from './modals/SitrepGeneratorModal';
import { UploadDocumentModal } from './modals/UploadDocumentModal';
import { styles } from './styles/SitRep.styles';

export function SitRep() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState<string | null>(null);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [selectedDocument, setSelectedDocument] = useState<SitRepDocument | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [generatorModalVisible, setGeneratorModalVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const bottomNavHeight = useBottomNavHeight();
  const { isWeb } = usePlatform();
  const { isMobile, isTablet, isDesktop, width: screenWidth } = useScreenSize();
  const { user, firebaseUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { canDeleteSitRep, isAdminOrSupervisor } = usePermissions();
  
  // Confirmation modal hook
  const confirmationModal = useConfirmationModal();
  const { 
    uploadDocument, 
    isUploading, 
    uploadProgress, 
    error: uploadError, 
    clearError: clearUploadError 
  } = useDocumentUpload();

  const {
    documents,
    isLoading,
    error: downloadError,
    hasMore,
    loadDocuments,
    loadMore,
    searchDocuments,
    downloadDocument,
    deleteDocument,
    updateDocument,
    clearError: clearDownloadError,
    refresh
  } = useDocumentDownload();

  useEffect(() => {
    // Only load documents if user is authenticated
    if (user && firebaseUser && !authLoading) {
      loadDocuments();
    }
  }, [user, firebaseUser, authLoading]);

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
      loadDocuments();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    loadDocuments();
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Debounce search to reduce query thrash
  useEffect(() => {
    const trimmed = searchQuery.trim();
    const timer = setTimeout(() => {
      if (trimmed) {
        searchDocuments(trimmed);
      } else {
        loadDocuments();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleActionsMenuToggle = (documentId: string) => {
    setActionsMenuOpen(actionsMenuOpen === documentId ? null : documentId);
  };

  const handleMultiSelectToggle = () => {
    if (isMultiSelectMode) {
      // Exit multi-select mode
      setSelectedDocuments(new Set());
      setIsMultiSelectMode(false);
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
    
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(documentId);
      } else {
        newSet.delete(documentId);
      }
      
      // If no documents are selected, exit multi-select mode
      if (newSet.size === 0) {
        setIsMultiSelectMode(false);
      }
      
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return;
    
    confirmationModal.showConfirmation({
      title: 'Delete Documents',
      message: `Are you sure you want to delete ${selectedDocuments.size} ${selectedDocuments.size === 1 ? 'document' : 'documents'}? This action cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          const deletePromises = Array.from(selectedDocuments).map(async (docId) => {
            try {
              await deleteDocument(docId);
              return { success: true, docId };
            } catch (error) {
              console.warn(`Failed to delete document ${docId}:`, error);
              return { success: false, docId, error };
            }
          });
          
          const results = await Promise.all(deletePromises);
          const successful = results.filter(r => r.success);
          const failed = results.filter(r => !r.success);
          
          // Clear selection and exit multi-select mode regardless of individual failures
          setSelectedDocuments(new Set());
          setIsMultiSelectMode(false);
          
          if (successful.length > 0) {
            Alert.alert('Success', `Successfully deleted ${successful.length} ${successful.length === 1 ? 'document' : 'documents'}`);
          }
          
          if (failed.length > 0) {
            Alert.alert('Warning', `Failed to delete ${failed.length} ${failed.length === 1 ? 'document' : 'documents'}`);
          }
        } catch (error) {
          console.error('Error in bulk delete operation:', error);
          Alert.alert('Error', 'An error occurred during bulk deletion');
          // Still clear selection even if there's an error
          setSelectedDocuments(new Set());
          setIsMultiSelectMode(false);
          throw error; // Re-throw to prevent modal from closing on error
        }
      },
    });
  };

  const handleExitMultiSelect = () => {
    setSelectedDocuments(new Set());
    setIsMultiSelectMode(false);
  };

  const groupDocumentsByDate = (docs: SitRepDocument[]) => {
    const groups: { [key: string]: SitRepDocument[] } = {};
    
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
  const sections = useMemo(() => {
    const uniqueDocs = documents.filter((document, index, self) =>
      index === self.findIndex(d => d.id === document.id)
    );
    return groupDocumentsByDate(uniqueDocs).map(([title, data]) => ({ title, data }));
  }, [documents]);

  // Calculate grid columns based on screen size
  const getColumnsPerRow = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    if (isDesktop) {
      // Desktop: 3-4 columns depending on screen width
      if (screenWidth >= 1600) return 5;
      if (screenWidth >= 1200) return 4;
      return 2;
    }
    return 2; // Default
  };

  const columnsPerRow = getColumnsPerRow();

  const handleFileSelect = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web: Use file input
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      } else {
        // Mobile: Use DocumentPicker
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          
          // Create a file-like object for mobile
          const file = {
            name: asset.name || 'document',
            size: asset.size || 0,
            type: asset.mimeType || 'application/octet-stream',
            uri: asset.uri,
          };
          
          setSelectedFile(file as any);
          if (!uploadTitle) {
            setUploadTitle(asset.name?.split('.')[0] || 'document');
          }
        }
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.split('.')[0]);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadTitle || !user || !firebaseUser) {
      Alert.alert('Error', 'Please select a file and enter a title');
      return;
    }

    try {
      await uploadDocument(selectedFile, {
        title: uploadTitle,
        description: uploadDescription,
        uploadedBy: firebaseUser.uid,
        isPublic: true
      });

      setShowUploadModal(false);
      setUploadTitle('');
      setUploadDescription('');
      setSelectedFile(null);
      refresh();
      Alert.alert('Success', 'Document uploaded successfully');
    } catch (error) {
      Alert.alert('Upload Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleDocumentPress = (document: SitRepDocument) => {
    setSelectedDocument(document);
    setDetailModalVisible(true);
  };

  const handleDownload = async (document: SitRepDocument) => {
    try {
      setDownloadingDocumentId(document.id);
      await downloadDocument(document);
    } catch (error) {
      Alert.alert('Download Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setDownloadingDocumentId(null);
    }
  };

  const handleDelete = async (document: SitRepDocument) => {
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


  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  // Show login prompt if not authenticated
  if (!user || !firebaseUser) {
    return (
      <ThemedView style={[styles.container, styles.emptyContainer]}>
        <ThemedText style={styles.emptyTitle}>Situation Reports</ThemedText>
        <ThemedText style={styles.emptySubtitle}>
          {!firebaseUser ? 'Please log in to access documents' : 'Authentication in progress...'}
        </ThemedText>
        {downloadError && (
          <ThemedText style={[styles.emptySubtitle, { color: colors.error }]}>
            Error: {downloadError}
          </ThemedText>
        )}
      </ThemedView>
    );
  }

  // Show loading spinner when initially loading documents (similar to Dashboard)
  if (isLoading && documents.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={{ marginTop: 16, opacity: 0.7, color: colors.text }}>
            Loading documents...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SitRepHeader
        showSearch={showSearch}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchToggle={handleSearchToggle}
        onUploadDocument={() => setShowUploadModal(true)}
        onClearSearch={handleClearSearch}
        onMultiSelectToggle={handleMultiSelectToggle}
        isMultiSelectMode={isMultiSelectMode}
        canDelete={canDeleteSitRep || isAdminOrSupervisor}
        onOpenGenerator={() => setGeneratorModalVisible(true)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: bottomNavHeight + 20 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl refreshing={isLoading} onRefresh={refresh} />
          ) : undefined
        }
        onScroll={(event) => {
          // Handle infinite scroll for web
          if (Platform.OS === 'web' && hasMore && !isLoading) {
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
              <ThemedText style={[styles.selectedCount, { color: colors.text }]}>
                {selectedDocuments.size} selected
              </ThemedText>
              <View style={styles.multiSelectActions}>
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.error }]}
                  onPress={handleBulkDelete}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={handleExitMultiSelect}
                  activeOpacity={0.8}
                >
                  <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Render sections with grid layout */}
        {sections.length > 0 ? (
          sections.map((section, sectionIndex) => (
            <View key={section.title} style={styles.sectionContainer}>
              <View style={styles.documentGroup}>
                <ThemedText style={[styles.groupHeader, { color: colors.text }]}>
                  {section.title}
                </ThemedText>
              </View>
              <View style={[
                isMobile ? styles.documentsGridMobile : styles.documentsGrid,
                {
                  paddingHorizontal: isMobile ? 16 : isDesktop ? 20 : 16,
                }
              ]}>
                {section.data.map((item) => {
                  // Calculate width percentage accounting for gaps
                  // Each item takes (100% / columns) minus a small adjustment for gaps
                  const widthPercent = isMobile 
                    ? 100 
                    : (100 / columnsPerRow) - (columnsPerRow > 1 ? 1.5 : 0);
                  
                  return (
                    <View
                      key={item.id}
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
                      <DocumentCard
                        document={item}
                        onPress={handleDocumentPress}
                        onSelect={handleDocumentSelect}
                        isSelected={selectedDocuments.has(item.id)}
                        isDownloading={downloadingDocumentId === item.id}
                        isMultiSelectMode={isMultiSelectMode}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        ) : (
          !isLoading && (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyTitle}>No documents found</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Upload your first document to get started
              </ThemedText>
            </View>
          )
        )}

        {/* Loading more indicator */}
        {isLoading && documents.length > 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <ThemedText style={styles.loadingText}>Loading more documents...</ThemedText>
          </View>
        )}
      </ScrollView>

      <UploadDocumentModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
        onFileSelect={handleFileSelect}
        onFileChange={handleFileChange}
        selectedFile={selectedFile}
        uploadTitle={uploadTitle}
        onTitleChange={setUploadTitle}
        uploadDescription={uploadDescription}
        onDescriptionChange={setUploadDescription}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        error={uploadError || downloadError}
        onClearError={() => {
          clearUploadError();
          clearDownloadError();
        }}
        fileInputRef={fileInputRef}
      />

      {/* Detail Modal */}
      <SitRepDetailModal
        visible={detailModalVisible}
        document={selectedDocument}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedDocument(null);
        }}
        onDelete={(canDeleteSitRep || isAdminOrSupervisor) ? handleDelete : undefined}
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
          loading={confirmationModal.loading}
        />
      )}

      {/* SITREP Generator Modal */}
      <SitrepGeneratorModal
        visible={generatorModalVisible}
        onClose={() => setGeneratorModalVisible(false)}
        onSaveSuccess={() => {
          // Refresh documents list after saving
          refresh();
        }}
      />
    </ThemedView>
  );
}

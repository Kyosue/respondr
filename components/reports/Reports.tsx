import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from '@/contexts/MemoContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MemoDocument, MemoFilter } from '@/types/MemoDocument';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { MemoFilters } from './MemoFilters';
import { DistributionModal } from './modals/DistributionModal';
import { MemoDetailModal } from './modals/MemoDetailModal';
import { MemoUploadModal } from './modals/MemoUploadModal';

import { styles } from './Reports.styles';

const Reports: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const isWeb = Platform.OS === 'web';
  const { documents, loading, fetchDocuments, updateDistribution, acknowledgeDocument } = useMemo();
  
  // Check if user can assign documents (supervisor or admin only)
  const canAssignDocuments = user?.userType === 'supervisor' || user?.userType === 'admin';
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState<MemoFilter>({});
  const [selectedDocument, setSelectedDocument] = useState<MemoDocument | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [distributionModalVisible, setDistributionModalVisible] = useState(false);
  const [documentToDistribute, setDocumentToDistribute] = useState<MemoDocument | null>(null);


  const handleManualRefresh = async () => {
    await fetchDocuments(filters);
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

  const isAssignedToMe = (doc: MemoDocument) => {
    return doc.distributionList && doc.distributionList.includes(user?.id || '');
  };

  const hasAcknowledged = (doc: MemoDocument) => {
    if (!doc.acknowledgmentRequired) return false;
    if (!doc.acknowledgments || doc.acknowledgments.length === 0) return false;
    return doc.acknowledgments.some((ack) => ack.userId === user?.id);
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent'}]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Document Library</Text>
          <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
            Manage memos and local issuances
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.filterButton, { borderColor: colors.border }]}
            onPress={handleManualRefresh}
          >
            <Ionicons name="refresh" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, { borderColor: colors.border }]}
            onPress={() => setFiltersVisible(!filtersVisible)}
          >
            <Ionicons name="filter" size={20} color={colors.text} />
            {Object.keys(filters).length > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.filterBadgeText}>{Object.keys(filters).length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.tint }]}
            onPress={() => setUploadModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters Modal */}
      <MemoFilters
        visible={filtersVisible}
        filters={filters}
        onFilterChange={(newFilters) => {
          setFilters(newFilters);
          fetchDocuments(newFilters);
        }}
        onClose={() => setFiltersVisible(false)}
      />

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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerContent}>
            <Ionicons name="hourglass" size={32} color={colors.tabIconDefault} />
            <Text style={[styles.emptyText, { color: colors.text }]}>Loading documents...</Text>
          </View>
        ) : documents.length === 0 ? (
          <View style={styles.centerContent}>
            <Ionicons name="folder-open" size={64} color={colors.tabIconDefault} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No documents yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
              Upload memos and local issuances to get started
            </Text>
          </View>
        ) : (
          <View style={[styles.documentsList, isWeb && styles.documentsGrid]}>
            {documents.map((doc) => {
              const isAssigned = isAssignedToMe(doc);
              const hasAck = hasAcknowledged(doc);
              const needsAcknowledgment = doc.acknowledgmentRequired && !hasAck;

              return (
                <TouchableOpacity
                  key={doc.id}
                  style={[
                    styles.documentItem,
                    { backgroundColor: colors.surface },
                    isWeb && styles.documentCard,
                  ]}
                  onPress={() => handleDocumentPress(doc)}
                >
                  {isWeb ? (
                    <>
                      <View style={styles.cardHeader}>
                        <View style={styles.documentIcon}>
                          <Ionicons name="document-text" size={32} color={colors.tint} />
                        </View>
                        {canAssignDocuments && (
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
                      {canAssignDocuments && (
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
                      <TouchableOpacity style={styles.moreButton}>
                        <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
                      </TouchableOpacity>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
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
        isAssignedToMe={selectedDocument ? isAssignedToMe(selectedDocument) : false}
        hasAcknowledged={selectedDocument ? hasAcknowledged(selectedDocument) : false}
      />
    </View>
  );
};

export { Reports };

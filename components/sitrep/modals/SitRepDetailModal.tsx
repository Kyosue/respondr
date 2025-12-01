import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated, Linking, Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { SitRepDocument } from '@/types/Document';
import { SyncManager } from '@/utils/syncManager';

import { styles } from './SitRepDetailModal.styles';

interface SitRepDetailModalProps {
  visible: boolean;
  document: SitRepDocument | null;
  onClose: () => void;
  onDelete?: (document: SitRepDocument) => void;
}

export function SitRepDetailModal({
  visible,
  document,
  onClose,
  onDelete,
}: SitRepDetailModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose,
  });

  const [downloading, setDownloading] = useState(false);
  const [uploaderName, setUploaderName] = useState<string>('');

  React.useEffect(() => {
    if (!visible) {
      setDownloading(false);
    }
  }, [visible]);

  // Fetch uploader name
  useEffect(() => {
    const fetchUploaderName = async () => {
      if (!document?.uploadedBy) {
        setUploaderName('');
        return;
      }

      try {
        const syncManager = SyncManager.getInstance();
        const userData = await syncManager.getUserData(document.uploadedBy);
        
        if (userData) {
          setUploaderName(userData.fullName || userData.displayName || userData.email);
        } else {
          setUploaderName(document.uploadedBy);
        }
      } catch (error) {
        console.warn('Failed to fetch uploader name:', error);
        setUploaderName(document.uploadedBy);
      }
    };

    fetchUploaderName();
  }, [document?.uploadedBy]);

  const handleView = async () => {
    if (!document) return;
    
    try {
      setDownloading(true);
      
      if (Platform.OS === 'web') {
        // Web: Open in new tab for viewing/downloading
        if (typeof window !== 'undefined') {
          window.open(document.downloadUrl, '_blank');
        }
      } else {
        // Mobile: Open in external browser
        const canOpen = await Linking.canOpenURL(document.downloadUrl);
        if (canOpen) {
          await Linking.openURL(document.downloadUrl);
        } else {
          Alert.alert('Error', 'Cannot open this document');
        }
      }
    } catch (error) {
      console.error('Open error:', error);
      Alert.alert('Error', 'Failed to open document');
    } finally {
      setDownloading(false);
    }
  };

  if (!visible || !document) return null;

  const getFileIcon = (fileType: string): keyof typeof Ionicons.glyphMap => {
    if (fileType.includes('pdf')) return 'document-text';
    if (fileType.includes('doc')) return 'document';
    if (fileType.includes('xls')) return 'grid';
    if (fileType.includes('ppt')) return 'easel';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('video')) return 'videocam';
    if (fileType.includes('audio')) return 'musical-notes';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'archive';
    return 'document';
  };

  const getFileTypeColor = (fileType: string): string => {
    if (fileType.includes('pdf')) return '#E53E3E';
    if (fileType.includes('doc')) return '#2563EB';
    if (fileType.includes('xls')) return '#38A169';
    if (fileType.includes('ppt')) return '#D69E2E';
    if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('png') || fileType.includes('gif')) return '#805AD5';
    if (fileType.includes('video')) return '#9F7AEA';
    if (fileType.includes('audio')) return '#F56565';
    if (fileType.includes('zip') || fileType.includes('rar')) return '#4A5568';
    return '#4A5568';
  };

  const getFileTypeText = (fileType: string): string => {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('doc')) return 'DOC';
    if (fileType.includes('xls')) return 'XLS';
    if (fileType.includes('ppt')) return 'PPT';
    if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('png') || fileType.includes('gif')) return 'IMAGE';
    if (fileType.includes('video')) return 'VIDEO';
    if (fileType.includes('audio')) return 'AUDIO';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'ZIP';
    // Extract extension from fileType if it's just an extension
    const extension = fileType.split('.').pop()?.toUpperCase();
    return extension || 'FILE';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderContent = () => (
    <>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name={getFileIcon(document.fileType)} size={24} color={getFileTypeColor(document.fileType)} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={2}>
              {document.title}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.tabIconDefault }]}>
              {getFileTypeText(document.fileType)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={rampHandleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* File Type Badge */}
        <View style={styles.categoryContainer}>
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor: getFileTypeColor(document.fileType) + '20',
              },
            ]}
          >
            <Ionicons name="pricetag" size={14} color={getFileTypeColor(document.fileType)} />
            <Text style={[styles.categoryBadgeText, { color: getFileTypeColor(document.fileType) }]}>
              {getFileTypeText(document.fileType)}
            </Text>
          </View>
        </View>

        {/* Document Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Document Information</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="document-text" size={16} color={colors.tabIconDefault} />
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>Title:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{document.title}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="briefcase" size={16} color={colors.tabIconDefault} />
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>File Type:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{getFileTypeText(document.fileType)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="document" size={16} color={colors.tabIconDefault} />
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>File Type:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{document.fileType}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="stats-chart" size={16} color={colors.tabIconDefault} />
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>Size:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{formatFileSize(document.fileSize)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={colors.tabIconDefault} />
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>Uploaded:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(document.uploadedAt).toLocaleString()}
            </Text>
          </View>

          {document.uploadedBy && (
            <View style={styles.infoRow}>
              <Ionicons name="person" size={16} color={colors.tabIconDefault} />
              <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>Uploaded By:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{uploaderName || 'Loading...'}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {document.description && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: colors.text }]}>{document.description}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.downloadButton, { backgroundColor: colors.tint }]}
          onPress={handleView}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="download" size={20} color="#fff" />
              <Text style={styles.downloadButtonText}>View / Download</Text>
            </>
          )}
        </TouchableOpacity>

        {onDelete && (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={() => {
              if (document) {
                onDelete(document);
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.closeButtonFooter, { backgroundColor: colors.surface }]}
          onPress={rampHandleClose}
        >
          <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <>
      {isWeb ? (
        <Modal
          visible={visible}
          animationType="fade"
          transparent={true}
          onRequestClose={rampHandleClose}
        >
          <Animated.View style={[styles.overlayWeb, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.overlayCloseButton}
              onPress={rampHandleClose}
              activeOpacity={0.7}
            />
            <Animated.View
              style={[
                styles.containerWeb,
                { backgroundColor: colors.background },
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
                },
              ]}
            >
              {renderContent()}
            </Animated.View>
          </Animated.View>
        </Modal>
      ) : (
        <Modal visible={visible} animationType="slide" transparent={true}>
          <View style={styles.overlay}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
              {renderContent()}
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}
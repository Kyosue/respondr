import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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

import { styles } from './SitRepDetailModal.styles';

interface SitRepDetailModalProps {
  visible: boolean;
  document: SitRepDocument | null;
  onClose: () => void;
}

export function SitRepDetailModal({
  visible,
  document,
  onClose,
}: SitRepDetailModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose,
  });

  const [downloading, setDownloading] = useState(false);

  React.useEffect(() => {
    if (!visible) {
      setDownloading(false);
    }
  }, [visible]);

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

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'report': return '#E53E3E';
      case 'image': return '#805AD5';
      case 'spreadsheet': return '#38A169';
      case 'presentation': return '#D69E2E';
      default: return '#4A5568';
    }
  };

  const getCategoryText = (category: string): string => {
    return category.charAt(0).toUpperCase() + category.slice(1);
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
            <Ionicons name={getFileIcon(document.fileType)} size={24} color={getCategoryColor(document.category)} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={2}>
              {document.title}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.tabIconDefault }]}>
              {getCategoryText(document.category)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={rampHandleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Badge */}
        <View style={styles.categoryContainer}>
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor: getCategoryColor(document.category) + '20',
              },
            ]}
          >
            <Ionicons name="pricetag" size={14} color={getCategoryColor(document.category)} />
            <Text style={[styles.categoryBadgeText, { color: getCategoryColor(document.category) }]}>
              {getCategoryText(document.category)}
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
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>Category:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{getCategoryText(document.category)}</Text>
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
              <Text style={[styles.infoValue, { color: colors.text }]}>{document.uploadedBy}</Text>
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
              <Text style={styles.downloadButtonText}>View/Download</Text>
            </>
          )}
        </TouchableOpacity>

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

export { SitRepDetailModal };

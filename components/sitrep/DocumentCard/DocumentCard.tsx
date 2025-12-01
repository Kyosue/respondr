import { Ionicons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import {
  Animated,
  Platform,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SitRepDocument } from '@/types/Document';

import { styles } from './DocumentCard.styles';

interface DocumentCardProps {
  document: SitRepDocument;
  onPress: (document: SitRepDocument) => void;
  onSelect: (documentId: string, selected: boolean) => void;
  isSelected?: boolean;
  isDownloading?: boolean;
  isMultiSelectMode?: boolean;
}

export const DocumentCard = memo(function DocumentCard({ 
  document, 
  onPress,
  onSelect,
  isSelected = false,
  isDownloading = false,
  isMultiSelectMode = false
}: DocumentCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isWeb = Platform.OS === 'web';
  const [scaleValue] = useState(new Animated.Value(1));

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
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handlePress = () => {
    if (isMultiSelectMode) {
      onSelect(document.id, !isSelected);
    } else {
      onPress(document);
    }
  };

  const handleLongPress = () => {
    if (!isMultiSelectMode) {
      // Enter multi-select mode and select this document
      onSelect(document.id, true);
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <TouchableOpacity
        key={document.id}
        style={[
          styles.documentItem,
          { backgroundColor: colors.surface },
          isWeb && styles.documentCard,
          isSelected && styles.documentItemSelected,
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
      >
        {isWeb ? (
          <>
            {/* Top Row: Icon and Title */}
            <View style={styles.cardTopRow}>
              <View style={[styles.documentIcon, { backgroundColor: `${getFileTypeColor(document.fileType)}20` }]}>
                <Ionicons name={getFileIcon(document.fileType)} size={24} color={getFileTypeColor(document.fileType)} />
              </View>
              <View style={styles.titleContainer}>
                <Text style={[styles.documentTitle, { color: colors.text }]} numberOfLines={2}>
                  {document.title}
                </Text>
              </View>
            </View>
            
            {/* Bottom Row: File Type Badge, Date, and File Size */}
            <View style={[styles.cardBottomRow, { borderTopColor: colors.border }]}>
              <View style={[styles.categoryBadge, { backgroundColor: `${getFileTypeColor(document.fileType)}20` }]}>
                <Text style={[styles.categoryText, { color: getFileTypeColor(document.fileType) }]}>
                  {getFileTypeText(document.fileType)}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={11} color={colors.tabIconDefault} />
                <Text style={[styles.documentDate, { color: colors.tabIconDefault }]}>
                  {new Date(document.uploadedAt).toLocaleDateString()}
                </Text>
                {document.fileSize && (
                  <>
                    <Text style={[styles.metaSeparator, { color: colors.tabIconDefault }]}>•</Text>
                    <Ionicons name="document-outline" size={11} color={colors.tabIconDefault} />
                    <Text style={[styles.fileSize, { color: colors.tabIconDefault }]}>
                      {formatFileSize(document.fileSize)}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.documentIcon, { backgroundColor: `${getFileTypeColor(document.fileType)}20` }]}>
              <Ionicons 
                name={getFileIcon(document.fileType)} 
                size={32} 
                color={getFileTypeColor(document.fileType)} 
              />
            </View>
            <View style={styles.documentInfo}>
              <Text style={[styles.documentTitle, { color: colors.text }]} numberOfLines={2}>
                {document.title}
              </Text>
              <Text style={[styles.documentMeta, { color: colors.tabIconDefault }]}>
                {getFileTypeText(document.fileType)}
              </Text>
              <Text style={[styles.documentDate, { color: colors.tabIconDefault }]}>
                {new Date(document.uploadedAt).toLocaleDateString()}
              </Text>
            </View>
          </>
        )}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});
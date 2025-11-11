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

  const getCategoryColor = (category?: string): string => {
    switch (category) {
      case 'report': return '#E53E3E';
      case 'image': return '#805AD5';
      case 'spreadsheet': return '#38A169';
      case 'presentation': return '#D69E2E';
      default: return '#4A5568';
    }
  };

  const getCategoryText = (category?: string): string => {
    return category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Other';
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
              <View style={[styles.documentIcon, { backgroundColor: `${getCategoryColor(document.category)}20` }]}>
                <Ionicons name={getFileIcon(document.fileType)} size={24} color={getCategoryColor(document.category)} />
              </View>
              <View style={styles.titleContainer}>
                <Text style={[styles.documentTitle, { color: colors.text }]} numberOfLines={2}>
                  {document.title}
                </Text>
              </View>
            </View>
            
            {/* Bottom Row: Category Badge, Date, and File Size */}
            <View style={[styles.cardBottomRow, { borderTopColor: colors.border }]}>
              <View style={[styles.categoryBadge, { backgroundColor: `${getCategoryColor(document.category)}20` }]}>
                <Text style={[styles.categoryText, { color: getCategoryColor(document.category) }]}>
                  {getCategoryText(document.category)}
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
            <View style={[styles.documentIcon, { backgroundColor: `${getCategoryColor(document.category)}20` }]}>
              <Ionicons 
                name={getFileIcon(document.fileType)} 
                size={32} 
                color={getCategoryColor(document.category)} 
              />
            </View>
            <View style={styles.documentInfo}>
              <Text style={[styles.documentTitle, { color: colors.text }]} numberOfLines={2}>
                {document.title}
              </Text>
              <Text style={[styles.documentMeta, { color: colors.tabIconDefault }]}>
                {getCategoryText(document.category)}
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
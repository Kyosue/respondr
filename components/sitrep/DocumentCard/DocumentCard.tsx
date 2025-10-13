import { Ionicons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
  onDownload: (document: SitRepDocument) => void;
  onSelect: (documentId: string, selected: boolean) => void;
  isSelected?: boolean;
  isDownloading?: boolean;
  isMultiSelectMode?: boolean;
}

export const DocumentCard = memo(function DocumentCard({ 
  document, 
  onDownload,
  onSelect,
  isSelected = false,
  isDownloading = false,
  isMultiSelectMode = false
}: DocumentCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [scaleValue] = useState(new Animated.Value(1));
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    if (isMultiSelectMode) {
      onSelect(document.id, !isSelected);
    } else {
      onDownload(document);
    }
  };

  const handleLongPress = () => {
    if (!isMultiSelectMode) {
      onSelect(document.id, true);
    }
  };

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

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

  const getFileTypeText = (fileType: string): string => {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('doc')) return 'DOC';
    if (fileType.includes('xls')) return 'XLS';
    if (fileType.includes('ppt')) return 'PPT';
    if (fileType.includes('image')) return 'IMG';
    if (fileType.includes('video')) return 'VID';
    if (fileType.includes('audio')) return 'AUD';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'ZIP';
    return 'FILE';
  };

  const getFileColor = (fileType: string): string => {
    if (fileType.includes('pdf')) return '#E53E3E';
    if (fileType.includes('doc')) return '#3182CE';
    if (fileType.includes('xls')) return '#38A169';
    if (fileType.includes('ppt')) return '#D69E2E';
    if (fileType.includes('image')) return '#805AD5';
    if (fileType.includes('video')) return '#DD6B20';
    if (fileType.includes('audio')) return '#319795';
    if (fileType.includes('zip') || fileType.includes('rar')) return '#718096';
    return '#4A5568';
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
         onPress={handlePress}
         onLongPress={handleLongPress}
         onPressIn={handlePressIn}
         onPressOut={handlePressOut}
         activeOpacity={0.8}
         style={styles.iconContainer}
       >
         {isDownloading ? (
           <ActivityIndicator size="large" color={isSelected ? '#fff' : colors.primary} />
         ) : (
           <>
             <Ionicons 
               name={getFileIcon(document.fileType)} 
               size={72} 
               color={isSelected ? 'rgba(221, 7, 7, 0.5)' : 'rgba(0, 0, 0, 0.3)'} 
               style={styles.backgroundIcon}
             />
             <Text style={[styles.fileTypeText, { color: isSelected ? 'red' : getFileColor(document.fileType) }]}>
               {getFileTypeText(document.fileType)}
             </Text>
           </>
         )}
         
         {isSelected && (
           <View style={styles.selectedIndicator}>
             <Ionicons name="checkmark" size={14} color="#fff" />
           </View>
         )}
       </TouchableOpacity>
      
      <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={2}>
        {document.title}
      </Text>
    </Animated.View>
  );
});

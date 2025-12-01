import { View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SitRepDocument } from '@/types/Document';

import { styles } from './DocumentCardStats.styles';

interface DocumentCardStatsProps {
  document: SitRepDocument;
  fileSize: string;
}

export function DocumentCardStats({ document, fileSize }: DocumentCardStatsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <ThemedText style={[styles.statText, { color: colors.text + '80' }]}>
          {fileSize}
        </ThemedText>
        <ThemedText style={[styles.statText, { color: colors.text + '80' }]}>
          •
        </ThemedText>
        <ThemedText style={[styles.statText, { color: colors.text + '80' }]}>
          {getFileTypeText(document.fileType)}
        </ThemedText>
      </View>
      
      <ThemedText style={[styles.dateText, { color: colors.text + '60' }]}>
        {formatDate(document.uploadedAt)}
      </ThemedText>
    </View>
  );
}

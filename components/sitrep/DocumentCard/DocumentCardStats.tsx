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
          {document.category}
        </ThemedText>
      </View>
      
      <ThemedText style={[styles.dateText, { color: colors.text + '60' }]}>
        {formatDate(document.uploadedAt)}
      </ThemedText>
    </View>
  );
}

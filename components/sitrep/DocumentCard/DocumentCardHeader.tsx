import { View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SitRepDocument } from '@/types/Document';

import { styles } from './DocumentCardHeader.styles';

interface DocumentCardHeaderProps {
  document: SitRepDocument;
  fileIcon: string;
}

export function DocumentCardHeader({ document, fileIcon }: DocumentCardHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <ThemedText style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {document.title}
        </ThemedText>
        <View style={styles.iconContainer}>
          <ThemedText style={styles.fileIcon}>{fileIcon}</ThemedText>
        </View>
      </View>
      
      {document.description && (
        <ThemedText 
          style={[styles.description, { color: colors.text + '80' }]} 
          numberOfLines={2}
        >
          {document.description}
        </ThemedText>
      )}
    </View>
  );
}

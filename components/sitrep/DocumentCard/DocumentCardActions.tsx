import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SitRepDocument } from '@/types/Document';

import { styles } from './DocumentCardActions.styles';

interface DocumentCardActionsProps {
  document: SitRepDocument;
  onDownload: (document: SitRepDocument) => void;
  onDelete: (document: SitRepDocument) => void;
  onActionsMenuToggle: () => void;
  isActionsMenuOpen: boolean;
  isDownloading?: boolean;
}

export function DocumentCardActions({
  document,
  onDownload,
  onDelete,
  onActionsMenuToggle,
  isActionsMenuOpen,
  isDownloading = false
}: DocumentCardActionsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={[
          styles.actionButton, 
          { 
            backgroundColor: isDownloading ? colors.border : colors.primary,
            opacity: isDownloading ? 0.6 : 1
          }
        ]}
        onPress={() => onDownload(document)}
        activeOpacity={0.8}
        disabled={isDownloading}
      >
        {isDownloading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="download-outline" size={18} color="#fff" />
        )}
        <ThemedText style={styles.actionButtonText}>
          {isDownloading ? 'Downloading...' : 'Download'}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.error }]}
        onPress={() => onDelete(document)}
        activeOpacity={0.8}
        disabled={isDownloading}
      >
        <Ionicons name="trash-outline" size={18} color="#fff" />
        <ThemedText style={styles.actionButtonText}>Delete</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

import { styles } from './SitRepHeader.styles';
import { SitRepSearch } from './SitRepSearch';

interface SitRepHeaderProps {
  showSearch: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchToggle: () => void;
  onUploadDocument: () => void;
  onClearSearch: () => void;
  onMultiSelectToggle?: () => void;
  isMultiSelectMode?: boolean;
  canDelete?: boolean;
}

export function SitRepHeader({
  showSearch,
  searchQuery,
  onSearchChange,
  onSearchToggle,
  onUploadDocument,
  onClearSearch,
  onMultiSelectToggle,
  isMultiSelectMode = false,
  canDelete = false,
}: SitRepHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerTitleContainer}>
          <ThemedText type="subtitle" style={styles.headerTitle}>Situation Reports</ThemedText>
          <ThemedText style={styles.subheader}>Manage and share important documents</ThemedText>
        </View>
        <View style={styles.headerActions}>
          {!isMultiSelectMode && (
            <TouchableOpacity 
              style={[styles.headerButton, { 
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              }]}
              onPress={onUploadDocument}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
            </TouchableOpacity>
          )}
          {canDelete && onMultiSelectToggle && (
            <TouchableOpacity 
              style={[styles.headerButton, { 
                backgroundColor: isMultiSelectMode ? colors.error : colors.surface, 
                borderColor: isMultiSelectMode ? colors.error : colors.border,
              }]}
              onPress={onMultiSelectToggle}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={isMultiSelectMode ? "checkmark" : "checkbox-outline"} 
                size={16} 
                color={isMultiSelectMode ? "#fff" : colors.text} 
              />
            </TouchableOpacity>
          )}
          {!isMultiSelectMode && (
            <TouchableOpacity 
              style={[styles.headerButton, { 
                backgroundColor: colors.surface, 
                borderColor: colors.border,
              }]}
              onPress={onSearchToggle}
              activeOpacity={0.8}
            >
              <Ionicons name={showSearch ? "close" : "search"} size={16} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Search Section */}
      {showSearch && (
        <View style={styles.searchSection}>
          <SitRepSearch
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onClearSearch={onClearSearch}
          />
        </View>
      )}
    </View>
  );
}

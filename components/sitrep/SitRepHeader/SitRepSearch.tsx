import { Ionicons } from '@expo/vector-icons';
import { TextInput, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

import { styles } from './SitRepSearch.styles';

interface SitRepSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
}

export function SitRepSearch({
  searchQuery,
  onSearchChange,
  onClearSearch
}: SitRepSearchProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={16} color={colors.text} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search documents..."
          placeholderTextColor={colors.text + '80'}
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={onClearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={colors.text + '60'} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

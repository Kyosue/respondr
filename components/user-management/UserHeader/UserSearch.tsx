import { Ionicons } from '@expo/vector-icons';
import { TextInput, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

import { styles } from './UserHeader.styles';

interface UserSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
}

export function UserSearch({ searchQuery, onSearchChange, onClearSearch }: UserSearchProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputWrapper}>
        <Ionicons 
          name="search" 
          size={20} 
          color={colors.text + '60'} 
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            color: colors.text 
          }]}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search users..."
          placeholderTextColor={colors.text + '60'}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearSearchButton}
            onPress={onClearSearch}
          >
            <Ionicons name="close-circle" size={20} color={colors.text + '60'} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

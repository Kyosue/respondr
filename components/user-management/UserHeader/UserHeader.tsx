import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { UserStatus } from '@/types/UserData';
import { UserType } from '@/types/UserType';

import { UserActiveFilterTags } from './UserActiveFilterTags';
import { UserFilterPopover, UserSortOption } from './UserFilterPopover';
import { styles } from './UserHeader.styles';
import { UserSearch } from './UserSearch';

interface UserHeaderProps {
  showSearch: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchToggle: () => void;
  onClearSearch: () => void;
  selectedFilter: UserType | 'all';
  onFilterSelect: (filter: UserType | 'all') => void;
  selectedStatusFilter?: UserStatus | 'all';
  onStatusFilterSelect?: (filter: UserStatus | 'all') => void;
  selectedSort?: UserSortOption;
  onSortSelect?: (sort: UserSortOption) => void;
}

export function UserHeader({
  showSearch,
  searchQuery,
  onSearchChange,
  onSearchToggle,
  onClearSearch,
  selectedFilter,
  onFilterSelect,
  selectedStatusFilter,
  onStatusFilterSelect,
  selectedSort,
  onSortSelect,
}: UserHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.header}>
      {/* Main Header Section */}
      <View style={styles.headerMain}>
        <View style={styles.headerTitleSection}>
          <ThemedText type="subtitle" style={styles.headerTitle}>User Management</ThemedText>
          <ThemedText style={styles.subheader}>Manage and monitor user accounts</ThemedText>
        </View>
        
        <View style={styles.headerActionsSection}>
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
          
          <UserFilterPopover 
            selectedFilter={selectedFilter}
            onFilterSelect={onFilterSelect}
            selectedStatusFilter={selectedStatusFilter || 'all'}
            onStatusFilterSelect={onStatusFilterSelect || (() => {})}
            selectedSort={selectedSort}
            onSortSelect={onSortSelect}
          />
        </View>
      </View>
      
      {/* Search Section */}
      {showSearch && (
        <View style={styles.searchSection}>
          <UserSearch
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onClearSearch={onClearSearch}
          />
        </View>
      )}
      
      {/* Active Filter Tags Section */}
      <View style={styles.filtersSection}>
        <UserActiveFilterTags
          selectedFilter={selectedFilter}
          onFilterSelect={onFilterSelect}
          selectedStatusFilter={selectedStatusFilter || 'all'}
          onStatusFilterSelect={onStatusFilterSelect || (() => {})}
          selectedSort={selectedSort}
          onSortSelect={onSortSelect}
        />
      </View>
    </View>
  );
}

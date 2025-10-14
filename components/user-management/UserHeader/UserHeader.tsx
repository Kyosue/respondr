import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { UserStatus } from '@/types/UserData';
import { UserType } from '@/types/UserType';

import { UserFilters } from './UserFilters';
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
  onSignupPress?: () => void;
  showAddButton?: boolean;
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
  onSignupPress,
  showAddButton = true,
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
          {showAddButton && (
            <TouchableOpacity 
              style={[styles.signupButton, { 
                backgroundColor: colors.primary,
              }]}
              onPress={onSignupPress}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={16} color="white" />
              <ThemedText style={[styles.signupButtonText, { color: 'white' }]}>Add User</ThemedText>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.searchButton, { 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
            }]}
            onPress={onSearchToggle}
            activeOpacity={0.8}
          >
            <Ionicons name={showSearch ? "close" : "search"} size={18} color={colors.text} />
          </TouchableOpacity>
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
      
      {/* Filters Section */}
      <View style={styles.filtersSection}>
        <UserFilters 
          selectedFilter={selectedFilter}
          onFilterSelect={onFilterSelect}
          selectedStatusFilter={selectedStatusFilter}
          onStatusFilterSelect={onStatusFilterSelect}
        />
      </View>
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { UserType } from '@/types/UserType';

import { styles } from './UserHeader.styles';

const USER_TYPES: (UserType | 'all')[] = ['all', 'admin', 'supervisor', 'operator'];

interface UserFiltersProps {
  selectedFilter: UserType | 'all';
  onFilterSelect: (filter: UserType | 'all') => void;
}

export function UserFilters({ selectedFilter, onFilterSelect }: UserFiltersProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getFilterColor = (filter: UserType | 'all') => {
    switch (filter) {
      case 'admin': return '#EF4444';
      case 'supervisor': return '#F59E0B';
      case 'operator': return '#3B82F6';
      case 'all': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getFilterIcon = (filter: UserType | 'all') => {
    switch (filter) {
      case 'admin': return 'shield-outline';
      case 'supervisor': return 'eye-outline';
      case 'operator': return 'person-outline';
      case 'all': return 'people-outline';
      default: return 'people-outline';
    }
  };

  const getFilterLabel = (filter: UserType | 'all') => {
    switch (filter) {
      case 'all': return 'All Users';
      case 'admin': return 'Admins';
      case 'supervisor': return 'Supervisors';
      case 'operator': return 'Operators';
      default: return 'All Users';
    }
  };

  return (
    <View style={styles.filtersContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
      >
        {USER_TYPES.map((filter) => {
          const isSelected = selectedFilter === filter;
          const filterColor = getFilterColor(filter);
          
          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                {
                  backgroundColor: isSelected ? filterColor : colors.surface,
                  borderColor: isSelected ? filterColor : colors.border,
                }
              ]}
              onPress={() => onFilterSelect(filter)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={getFilterIcon(filter)} 
                size={16} 
                color={isSelected ? '#fff' : filterColor}
                style={{ marginRight: 6 }}
              />
              <ThemedText 
                style={[
                  styles.filterText,
                  { color: isSelected ? '#fff' : colors.text }
                ]}
              >
                {getFilterLabel(filter)}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

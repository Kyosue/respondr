import { View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './FilterPopover.styles';

export interface ActiveFilter {
  label: string;
  onRemove: () => void;
  color: string;
}

interface ActiveFilterTagsProps {
  filters: ActiveFilter[];
  onClearAll?: () => void;
}

export function ActiveFilterTags({ filters, onClearAll }: ActiveFilterTagsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (filters.length === 0) {
    return null;
  }

  return (
    <View style={styles.activeFiltersContainer}>
      {filters.map((filter, index) => (
        <View
          key={index}
          style={[
            styles.activeFilterTag,
            { backgroundColor: `${filter.color}15`, borderColor: filter.color },
          ]}
        >
          <ThemedText style={[styles.activeFilterTagText, { color: filter.color }]}>
            {filter.label}
          </ThemedText>
          <TouchableOpacity onPress={filter.onRemove} style={styles.activeFilterTagClose}>
            <Ionicons name="close" size={14} color={filter.color} />
          </TouchableOpacity>
        </View>
      ))}
      {onClearAll && (
        <TouchableOpacity
          style={[styles.clearAllButton, { backgroundColor: `${colors.error}15` }]}
          onPress={onClearAll}
        >
          <ThemedText style={[styles.clearAllText, { color: colors.error }]}>Clear all</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}


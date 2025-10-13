import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ResourceCategory } from '@/types/Resource';

import { styles } from './ResourceHeader.styles';

const CATEGORIES: ResourceCategory[] = [
  'vehicles',
  'medical', 
  'equipment',
  'communication',
  'personnel',
  'tools',
  'supplies',
  'other'
];

interface ResourceFiltersProps {
  selectedCategory?: ResourceCategory;
  onCategorySelect?: (category: ResourceCategory | undefined) => void;
}

export function ResourceFilters({ selectedCategory, onCategorySelect }: ResourceFiltersProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getCategoryColor = (category: ResourceCategory) => {
    switch (category) {
      case 'vehicles': return '#3B82F6';
      case 'medical': return '#EF4444';
      case 'equipment': return '#F97316';
      case 'communication': return '#8B5CF6';
      case 'personnel': return '#10B981';
      case 'tools': return '#F59E0B';
      case 'supplies': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getCategoryIcon = (category: ResourceCategory) => {
    switch (category) {
      case 'vehicles': return 'car-outline';
      case 'medical': return 'medkit-outline';
      case 'equipment': return 'construct-outline';
      case 'communication': return 'radio-outline';
      case 'personnel': return 'people-outline';
      case 'tools': return 'hammer-outline';
      case 'supplies': return 'cube-outline';
      default: return 'cube-outline';
    }
  };

  return (
    <View style={styles.categoriesContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category;
          const categoryColor = getCategoryColor(category);
          
          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: isSelected ? categoryColor : colors.surface,
                  borderColor: isSelected ? categoryColor : colors.border,
                }
              ]}
              onPress={() => onCategorySelect?.(isSelected ? undefined : category)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={getCategoryIcon(category)} 
                size={16} 
                color={isSelected ? '#fff' : categoryColor}
                style={{ marginRight: 6 }}
              />
              <ThemedText 
                style={[
                  styles.categoryText,
                  { color: isSelected ? '#fff' : colors.text }
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

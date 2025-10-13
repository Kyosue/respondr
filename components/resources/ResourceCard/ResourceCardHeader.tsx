import { Ionicons } from '@expo/vector-icons';
import { Image, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Resource, ResourceCategory } from '@/types/Resource';

import { styles } from './ResourceCard.styles';

interface ResourceCardHeaderProps {
  resource: Resource;
  categoryColor: string;
  conditionColor: string;
  getConditionText: (condition: string) => string;
}

export function ResourceCardHeader({ 
  resource, 
  categoryColor, 
  conditionColor, 
  getConditionText 
}: ResourceCardHeaderProps) {
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
    <View style={styles.headerRow}>
      <View style={styles.imageContainer}>
        {resource.images && resource.images.length > 0 ? (
          <Image 
            source={{ uri: resource.images[0] }} 
            style={styles.resourceImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: categoryColor + '20' }]}>
            <Ionicons 
              name={getCategoryIcon(resource.category)} 
              size={24} 
              color={categoryColor} 
            />
          </View>
        )}
      </View>
      
      <View style={styles.titleContainer}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.resourceTitle} numberOfLines={2}>
            {resource.name}
          </ThemedText>
          <View style={[styles.conditionChip, { backgroundColor: conditionColor + '20' }]}>
            <ThemedText style={[styles.conditionText, { color: conditionColor }]}>
              {getConditionText(resource.condition)}
            </ThemedText>
          </View>
        </View>
        
        {resource.description && (
          <ThemedText style={styles.resourceDescription} numberOfLines={2}>
            {resource.description}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

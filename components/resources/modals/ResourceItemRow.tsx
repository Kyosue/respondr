import { Ionicons } from '@expo/vector-icons';
import {
    Image,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { FormDatePicker, FormQuantityInput } from '@/components/ui/FormComponents';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Resource } from '@/types/Resource';

export interface ResourceItem {
  resource: Resource;
  quantity: number;
  dueDate: Date;
  notes: string;
}

interface ResourceItemRowProps {
  item: ResourceItem;
  onUpdate: (item: ResourceItem) => void;
  onRemove: () => void;
  errors?: Record<string, string>;
  showRemoveButton?: boolean;
}

export function ResourceItemRow({ 
  item, 
  onUpdate, 
  onRemove, 
  errors = {},
  showRemoveButton = true 
}: ResourceItemRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const updateItem = (field: keyof Omit<ResourceItem, 'resource'>, value: any) => {
    onUpdate({
      ...item,
      [field]: value,
    });
  };

  const getCategoryIcon = (category: string) => {
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
    <View style={[styles.container, { 
      backgroundColor: colors.surface,
      borderColor: colors.border 
    }]}>
      <View style={styles.header}>
        <View style={styles.resourceInfo}>
          <View style={styles.resourceImageContainer}>
            {item.resource.images && item.resource.images.length > 0 ? (
              <Image 
                source={{ uri: item.resource.images[0] }} 
                style={styles.resourceImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name={getCategoryIcon(item.resource.category) as any} size={16} color={colors.primary} />
              </View>
            )}
          </View>
          <View style={styles.resourceDetails}>
            <ThemedText style={styles.resourceName}>
              {item.resource.name}
            </ThemedText>
            <ThemedText style={styles.resourceCategory}>
              {item.resource.category}
            </ThemedText>
            <ThemedText style={styles.availability}>
              Available: {item.resource.availableQuantity}
            </ThemedText>
          </View>
        </View>
        {showRemoveButton && (
          <TouchableOpacity
            onPress={onRemove}
            style={styles.removeButton}
          >
            <Ionicons name="close-circle" size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.controls}>
        <View style={styles.controlGroup}>
          <FormQuantityInput
            label="Quantity"
            value={item.quantity}
            onChangeValue={(quantity) => updateItem('quantity', quantity)}
            max={item.resource.availableQuantity}
            required
            helperText={`Max: ${item.resource.availableQuantity}`}
            error={errors.quantity}
          />
        </View>

        <View style={styles.controlGroup}>
          <FormDatePicker
            label="Due Date"
            value={item.dueDate}
            onDateChange={(date) => updateItem('dueDate', date)}
            minimumDate={new Date()}
          />
        </View>
      </View>

      <View style={styles.notesContainer}>
        <ThemedText style={styles.notesLabel}>Notes (Optional)</ThemedText>
        <TextInput
          style={[styles.notesInput, { 
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text 
          }]}
          value={item.notes}
          onChangeText={(text) => updateItem('notes', text)}
          placeholder="Add notes for this resource"
          placeholderTextColor={colors.text + '80'}
          multiline
          numberOfLines={2}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resourceImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceDetails: {
    flex: 1,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  resourceCategory: {
    fontSize: 12,
    opacity: 0.7,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  availability: {
    fontSize: 12,
    opacity: 0.6,
  },
  removeButton: {
    padding: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  controlGroup: {
    flex: 1,
    marginRight: 12,
  },
  notesContainer: {
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.7,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});

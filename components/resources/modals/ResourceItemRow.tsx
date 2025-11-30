import { Ionicons } from '@expo/vector-icons';
import {
    Image,
    Platform,
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
      borderColor: colors.border,
      shadowColor: colors.text,
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
                <Ionicons name={getCategoryIcon(item.resource.category) as any} size={24} color={colors.primary} />
              </View>
            )}
          </View>
          <View style={styles.resourceDetails}>
            <ThemedText style={styles.resourceName}>
              {item.resource.name}
            </ThemedText>
            <View style={styles.resourceMetaRow}>
              <View style={[styles.categoryBadge, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name={getCategoryIcon(item.resource.category) as any} size={12} color={colors.primary} />
                <ThemedText style={[styles.resourceCategory, { color: colors.primary }]}>
                  {item.resource.category.charAt(0).toUpperCase() + item.resource.category.slice(1)}
            </ThemedText>
              </View>
              <View style={[styles.availabilityBadge, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                <ThemedText style={[styles.availability, { color: colors.success }]}>
                  {item.resource.availableQuantity} available
            </ThemedText>
              </View>
            </View>
          </View>
        </View>
        {showRemoveButton && (
          <TouchableOpacity
            onPress={onRemove}
            style={[styles.removeButton, { backgroundColor: colors.error + '15' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

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
        <View style={styles.notesHeader}>
          <Ionicons name="document-text-outline" size={16} color={colors.text} style={{ opacity: 0.7 }} />
          <ThemedText style={[styles.notesLabel, { color: colors.text }]}>Notes (Optional)</ThemedText>
        </View>
        <TextInput
          style={[styles.notesInput, { 
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text 
          }]}
          value={item.notes}
          onChangeText={(text) => updateItem('notes', text)}
          placeholder="Add notes for this resource..."
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
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    ...Platform.select({
      web: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      default: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 3,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resourceInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  resourceImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 10,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceDetails: {
    flex: 1,
    paddingTop: 0,
  },
  resourceName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 21,
  },
  resourceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  resourceCategory: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  availability: {
    fontSize: 11,
    fontWeight: '600',
  },
  removeButton: {
    padding: 6,
    borderRadius: 8,
    marginLeft: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 12,
    opacity: 0.3,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  controlGroup: {
    flex: 1,
  },
  notesContainer: {
    marginTop: 0,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 5,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 70,
  },
});

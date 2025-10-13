import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FormButton, FormInput, FormQuantityInput } from '@/components/ui/FormComponents';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { LocationInput } from '@/components/ui/LocationInput';
import { Colors } from '@/constants/Colors';
import { RESOURCE_CATEGORIES, RESOURCE_CONDITIONS } from '@/constants/ResourceConstants';
import { useAuth } from '@/contexts/AuthContext';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Resource, ResourceCategory, ResourceCondition } from '@/types/Resource';
import { getModalConfig, showErrorAlert, showSuccessAlert } from '@/utils/modalUtils';
import { ResourceValidator } from '@/utils/resourceValidation';

interface AddResourceModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Use shared constants
const categories = RESOURCE_CATEGORIES;
const conditions = RESOURCE_CONDITIONS;

export function AddResourceModal({ visible, onClose, onSuccess }: AddResourceModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { addResource, getLocationSuggestions } = useResources();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'equipment' as ResourceCategory,
    totalQuantity: 1,
    location: '',
    condition: 'good' as ResourceCondition,
    tags: '',
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [imagePublicIds, setImagePublicIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Real-time validation
    validateField(field, value);
  };

  const validateForm = () => {
    const resourceData = {
      name: formData.name,
      description: formData.description,
      totalQuantity: formData.totalQuantity,
      availableQuantity: formData.totalQuantity, // For new resources, available = total
      location: formData.location,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
      category: formData.category,
      condition: formData.condition,
      status: 'active' as const,
    };

    const validationResult = ResourceValidator.validateResource(resourceData);
    
    // Convert validation errors to form errors
    const newErrors: Record<string, string> = {};
    validationResult.errors.forEach(error => {
      newErrors[error.field] = error.message;
    });

    setErrors(newErrors);
    return validationResult.isValid;
  };

  const validateField = (field: string, value: string | number) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'name':
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors.name = 'Please enter a name for this resource';
        } else if (typeof value === 'string' && value.trim().length < 3) {
          newErrors.name = 'Resource name must be at least 3 characters long';
        } else {
          delete newErrors.name;
        }
        break;
      case 'totalQuantity':
        if (typeof value === 'number') {
          if (value <= 0) {
            newErrors.totalQuantity = 'Please enter a quantity greater than 0';
          } else if (value > 999) {
            newErrors.totalQuantity = 'Quantity cannot exceed 999';
          } else {
            delete newErrors.totalQuantity;
          }
        }
        break;
      case 'description':
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors.description = 'Please provide a description';
        } else if (typeof value === 'string' && value.trim().length < 10) {
          newErrors.description = 'Description must be at least 10 characters long';
        } else if (typeof value === 'string' && value.length > 500) {
          newErrors.description = 'Description cannot exceed 500 characters';
        } else {
          delete newErrors.description;
        }
        break;
      case 'location':
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors.location = 'Please enter a location';
        } else if (typeof value === 'string' && value.length > 100) {
          newErrors.location = 'Location cannot exceed 100 characters';
        } else {
          delete newErrors.location;
        }
        break;
      case 'tags':
        if (typeof value === 'string' && value.length > 200) {
          newErrors.tags = 'Tags cannot exceed 200 characters';
        } else {
          delete newErrors.tags;
        }
        break;
    }
    
    setErrors(newErrors);
  };
74444
  const handleImageSelected = (imageUrl: string, publicId: string) => {
    setImages(prev => [...prev, imageUrl]);
    setImagePublicIds(prev => [...prev, publicId]);
  };

  const handleImageRemoved = (imageUrl?: string) => {
    if (imageUrl) {
      // Remove specific image
      setImages(prev => prev.filter(img => img !== imageUrl));
      setImagePublicIds(prev => {
        const imageIndex = images.indexOf(imageUrl);
        return prev.filter((_, index) => index !== imageIndex);
      });
    } else {
      // Remove the last image (fallback)
      setImages(prev => prev.slice(0, -1));
      setImagePublicIds(prev => prev.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        totalQuantity: formData.totalQuantity,
        availableQuantity: formData.totalQuantity,
        isBorrowable: true, // Internal PDRRMO resources are borrowable
        resourceType: 'pdrrmo', // Identifies as internal PDRRMO resource
        images,
        location: formData.location.trim(),
        condition: formData.condition,
        maintenanceNotes: '',
        lastMaintenanceDate: null,
        nextMaintenanceDate: null,
        tags,
        isActive: true,
        status: 'active' as const,
        createdBy: user?.id || 'anonymous',
        updatedBy: user?.id || 'anonymous',
      };

      await addResource(resourceData);
      
      // Show success alert with proper callback handling
      const successConfig = showSuccessAlert(
        'Success',
        'Resource added successfully',
        () => {
          handleClose();
          onSuccess();
        }
      );
      Alert.alert(successConfig.title, successConfig.message, successConfig.buttons, successConfig.options);
    } catch (error) {
      console.error('Error adding resource:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add resource';
      const errorConfig = showErrorAlert('Error', `Failed to add resource: ${errorMessage}`);
      Alert.alert(errorConfig.title, errorConfig.message, errorConfig.buttons, errorConfig.options);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      category: 'equipment',
      totalQuantity: 1,
      location: '',
      condition: 'good',
      tags: '',
    });
    setImages([]);
    setImagePublicIds([]);
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      {...getModalConfig()}
      onRequestClose={handleClose}
    >
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <ThemedText type="subtitle" style={styles.title}>Add Resource</ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: colors.text + '80' }]}>
                Create a new resource entry
              </ThemedText>
            </View>
            <View style={styles.headerButton}>
              <FormButton
                title="Save"
                onPress={handleSubmit}
                variant="primary"
                disabled={loading}
                loading={loading}
              />
            </View>
          </View>
        </View>


        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FormInput
                label="Resource Name"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="e.g., Emergency Generator, First Aid Kit, Radio"
                required
                error={errors.name}
                helperText="Give it a clear, descriptive name that others will understand"
              />

              <FormInput
                label="Description"
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Describe what this resource is and how it's used..."
                multiline
                numberOfLines={3}
                error={errors.description}
                helperText="Provide details about the resource's purpose and usage"
              />

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Category</ThemedText>
                <View style={styles.categoryContainer}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.value}
                      style={[
                        styles.categoryButton,
                        { borderColor: colors.border },
                        formData.category === category.value && { 
                          backgroundColor: colors.primary,
                          borderColor: colors.primary 
                        }
                      ]}
                      onPress={() => handleInputChange('category', category.value)}
                    >
                      <Ionicons 
                        name={category.icon as keyof typeof Ionicons.glyphMap} 
                        size={16} 
                        color={formData.category === category.value ? '#fff' : colors.primary} 
                        style={styles.categoryIcon}
                      />
                      <ThemedText style={[
                        styles.categoryButtonText,
                        formData.category === category.value && { color: '#fff' }
                      ]}>
                        {category.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Quantity and Location */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="location-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Quantity & Location</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FormQuantityInput
                label="Total Quantity"
                value={formData.totalQuantity}
                onChangeValue={(value) => handleInputChange('totalQuantity', value)}
                required
                error={errors.totalQuantity}
                helperText="How many units of this resource do you have?"
              />

              <LocationInput
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
                placeholder="e.g., Warehouse A, Building 2, Room 101"
                suggestions={getLocationSuggestions(formData.location)}
                error={errors.location}
                helperText="Where can others find this resource? Select from existing locations or type a new one."
                disabled={loading}
              />
            </View>
          </View>

          {/* Condition and Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="settings-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Condition & Details</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Condition</ThemedText>
                <View style={styles.conditionContainer}>
                  {conditions.map((condition) => (
                    <TouchableOpacity
                      key={condition.value}
                      style={[
                        styles.conditionButton,
                        { borderColor: colors.border },
                        formData.condition === condition.value && { 
                          backgroundColor: condition.color,
                          borderColor: condition.color 
                        }
                      ]}
                      onPress={() => handleInputChange('condition', condition.value)}
                    >
                      <View style={[
                        styles.conditionIndicator,
                        { backgroundColor: formData.condition === condition.value ? '#fff' : condition.color }
                      ]} />
                      <ThemedText style={[
                        styles.conditionButtonText,
                        formData.condition === condition.value && { color: '#fff' }
                      ]}>
                        {condition.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <FormInput
                label="Tags (Optional)"
                value={formData.tags}
                onChangeText={(value) => handleInputChange('tags', value)}
                placeholder="e.g., emergency, portable, battery-powered"
                error={errors.tags}
                helperText="Add keywords to help others find this resource (separate with commas)"
              />
            </View>
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="images-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Photos (Optional)</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ImageUpload
                onImageSelected={handleImageSelected}
                onImageRemoved={handleImageRemoved}
                currentImageUrl={images[0]}
                placeholder="Tap to add resource photo"
                maxImages={5}
                resourceId="temp" // Will be updated after resource creation
                folder="resources"
                tags={['resource', formData.category]}
                quality="auto"
                format="auto"
                disabled={loading}
              />
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    minWidth: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  formCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  conditionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  conditionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  conditionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

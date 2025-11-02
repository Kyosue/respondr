import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FormButton, FormInput, FormQuantityInput } from '@/components/ui/FormComponents';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { LocationInput } from '@/components/ui/LocationInput';
import { Colors } from '@/constants/Colors';
import { RESOURCE_CATEGORIES, RESOURCE_CONDITIONS, RESOURCE_STATUSES } from '@/constants/ResourceConstants';
import { useAuth } from '@/contexts/AuthContext';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { Resource, ResourceCategory, ResourceCondition, ResourceStatus } from '@/types/Resource';
import { ResourceValidator } from '@/utils/resourceValidation';

interface EditResourceModalProps {
  resource: Resource | null;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Use shared constants
const categories = RESOURCE_CATEGORIES;
const statuses = RESOURCE_STATUSES;
const conditions = RESOURCE_CONDITIONS;

export function EditResourceModal({ resource, visible, onClose, onSuccess }: EditResourceModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { updateResource, getLocationSuggestions } = useResources();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'equipment' as ResourceCategory,
    totalQuantity: 1,
    availableQuantity: 1,
    location: '',
    status: 'active' as ResourceStatus,
    condition: 'good' as ResourceCondition,
    tags: '',
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name,
        description: resource.description,
        category: resource.category,
        totalQuantity: resource.totalQuantity,
        availableQuantity: resource.availableQuantity,
        location: resource.location,
        status: resource.status,
        condition: resource.condition,
        tags: resource.tags.join(', '),
      });
      setImages([...resource.images]);
    }
  }, [resource]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const resourceData = {
      name: formData.name,
      description: formData.description,
      totalQuantity: formData.totalQuantity,
      availableQuantity: formData.availableQuantity,
      location: formData.location,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
      category: formData.category,
      condition: formData.condition,
      status: formData.status,
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


  const handleSubmit = async () => {
    if (!resource) return;

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const updates: Partial<Resource> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        totalQuantity: formData.totalQuantity,
        availableQuantity: formData.availableQuantity,
        images,
        location: formData.location.trim(),
        status: formData.status,
        condition: formData.condition,
        tags,
        updatedBy: user?.id || 'anonymous',
      };

      await updateResource(resource.id, updates);
      
      Alert.alert('Success', 'Resource updated successfully', [
        { text: 'OK', onPress: handleClose }
      ]);
      
      onSuccess();
    } catch (error) {
      console.error('Error updating resource:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update resource';
      Alert.alert('Error', `Failed to update resource: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Ensure we clear local errors before closing
  const clearAndClose = () => {
    setErrors({});
    onClose();
  };

  // Hybrid RAMP (Responsive Animated Modal Pattern)
  const {
    isWeb,
    fadeAnim,
    scaleAnim,
    slideAnim,
    handleClose,
  } = useHybridRamp({ visible, onClose: clearAndClose });

  if (!resource) return null;

  return (
    <Modal
      visible={visible}
      animationType={isWeb ? 'none' : 'slide'}
      transparent={isWeb}
      presentationStyle={isWeb ? 'overFullScreen' : 'pageSheet'}
      onRequestClose={handleClose}
    >
      {isWeb && (
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={handleClose} />
        </Animated.View>
      )}

      <Animated.View
        style={[
          isWeb ? styles.webPanelContainer : styles.mobilePanelContainer,
          isWeb && { transform: [{ scale: scaleAnim }, { translateY: slideAnim }] },
        ]}
      >
      {isWeb ? (
        <ThemedView style={[styles.container, styles.webPanel]}>
          <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <ThemedText type="subtitle" style={styles.title}>Edit Resource</ThemedText>
                <ThemedText style={[styles.headerSubtitle, { color: colors.text + '80' }]}>
                  Update resource information
                </ThemedText>
              </View>
              <View style={styles.headerButton}>
                <FormButton
                  title="Update"
                  onPress={handleSubmit}
                  variant="primary"
                  disabled={loading}
                  loading={loading}
                />
              </View>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FormInput
                label="Name"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter resource name"
                required
                error={errors.name}
              />

              <FormInput
                label="Description"
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Enter resource description"
                multiline
                numberOfLines={3}
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

              <View style={styles.quantityRow}>
                <View style={styles.quantityHalf}>
                  <FormQuantityInput
                    label="Total Quantity"
                    value={formData.totalQuantity}
                    onChangeValue={(value) => handleInputChange('totalQuantity', value)}
                    required
                    error={errors.totalQuantity}
                  />
                </View>
                
                <View style={styles.quantityHalf}>
                  <FormQuantityInput
                    label="Available Quantity"
                    value={formData.availableQuantity}
                    onChangeValue={(value) => handleInputChange('availableQuantity', value)}
                    required
                    error={errors.availableQuantity}
                  />
                </View>
              </View>

              <LocationInput
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
                placeholder="Enter or select location"
                suggestions={getLocationSuggestions(formData.location)}
                error={errors.location}
                helperText="Where can others find this resource? Select from existing locations or type a new one."
                disabled={loading}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="settings-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Status & Condition</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Status</ThemedText>
                <View style={styles.statusContainer}>
                  {statuses.map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      style={[
                        styles.statusButton,
                        { borderColor: colors.border },
                        formData.status === status.value && { 
                          backgroundColor: status.color,
                          borderColor: status.color 
                        }
                      ]}
                      onPress={() => handleInputChange('status', status.value)}
                    >
                      <View style={[
                        styles.statusIndicator,
                        { backgroundColor: formData.status === status.value ? '#fff' : status.color }
                      ]} />
                      <ThemedText style={[
                        styles.statusButtonText,
                        formData.status === status.value && { color: '#fff' }
                      ]}>
                        {status.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

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
                label="Tags"
                value={formData.tags}
                onChangeText={(value) => handleInputChange('tags', value)}
                placeholder="Enter tags separated by commas"
                helperText="Separate multiple tags with commas"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="images-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Images</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ImageUpload
                onImageSelected={(imageUrl) => setImages(prev => [...prev, imageUrl])}
                onImageRemoved={() => setImages(prev => prev.slice(0, -1))}
                currentImageUrl={images[0]}
                imagesCount={images.length}
                maxImages={5}
                resourceId={resource.id}
                folder="resources"
                disabled={loading}
              />
            </View>
          </View>
          </ScrollView>
        </ThemedView>
      ) : (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <ThemedView style={styles.container}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              <View style={styles.headerTop}>
                <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                  <ThemedText type="subtitle" style={styles.title}>Edit Resource</ThemedText>
                  <ThemedText style={[styles.headerSubtitle, { color: colors.text + '80' }]}>
                    Update resource information
                  </ThemedText>
                </View>
                <View style={styles.headerButton}>
                  <FormButton
                    title="Update"
                    onPress={handleSubmit}
                    variant="primary"
                    disabled={loading}
                    loading={loading}
                  />
                </View>
              </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
                  </View>
                  <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
                </View>
                
                <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <FormInput
                    label="Name"
                    value={formData.name}
                    onChangeText={(value) => handleInputChange('name', value)}
                    placeholder="Enter resource name"
                    required
                    error={errors.name}
                  />

                  <FormInput
                    label="Description"
                    value={formData.description}
                    onChangeText={(value) => handleInputChange('description', value)}
                    placeholder="Enter resource description"
                    multiline
                    numberOfLines={3}
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

                  <View style={styles.quantityRow}>
                    <View style={styles.quantityHalf}>
                      <FormQuantityInput
                        label="Total Quantity"
                        value={formData.totalQuantity}
                        onChangeValue={(value) => handleInputChange('totalQuantity', value)}
                        required
                        error={errors.totalQuantity}
                      />
                    </View>
                    
                    <View style={styles.quantityHalf}>
                      <FormQuantityInput
                        label="Available Quantity"
                        value={formData.availableQuantity}
                        onChangeValue={(value) => handleInputChange('availableQuantity', value)}
                        required
                        error={errors.availableQuantity}
                      />
                    </View>
                  </View>

                  <LocationInput
                    value={formData.location}
                    onChangeText={(value) => handleInputChange('location', value)}
                    placeholder="Enter or select location"
                    suggestions={getLocationSuggestions(formData.location)}
                    error={errors.location}
                    helperText="Where can others find this resource? Select from existing locations or type a new one."
                    disabled={loading}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="settings-outline" size={20} color="#007AFF" />
                  </View>
                  <ThemedText style={styles.sectionTitle}>Status & Condition</ThemedText>
                </View>
                
                <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.label}>Status</ThemedText>
                    <View style={styles.statusContainer}>
                      {statuses.map((status) => (
                        <TouchableOpacity
                          key={status.value}
                          style={[
                            styles.statusButton,
                            { borderColor: colors.border },
                            formData.status === status.value && { 
                              backgroundColor: status.color,
                              borderColor: status.color 
                            }
                          ]}
                          onPress={() => handleInputChange('status', status.value)}
                        >
                          <View style={[
                            styles.statusIndicator,
                            { backgroundColor: formData.status === status.value ? '#fff' : status.color }
                          ]} />
                          <ThemedText style={[
                            styles.statusButtonText,
                            formData.status === status.value && { color: '#fff' }
                          ]}>
                            {status.label}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

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
                    label="Tags"
                    value={formData.tags}
                    onChangeText={(value) => handleInputChange('tags', value)}
                    placeholder="Enter tags separated by commas"
                    helperText="Separate multiple tags with commas"
                  />
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="images-outline" size={20} color="#007AFF" />
                  </View>
                  <ThemedText style={styles.sectionTitle}>Images</ThemedText>
                </View>
                
                <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <ImageUpload
                    onImageSelected={(imageUrl) => setImages(prev => [...prev, imageUrl])}
                    onImageRemoved={() => setImages(prev => prev.slice(0, -1))}
                    currentImageUrl={images[0]}
                    imagesCount={images.length}
                    maxImages={5}
                    resourceId={resource.id}
                    folder="resources"
                    disabled={loading}
                  />
                </View>
              </View>
            </ScrollView>
          </ThemedView>
        </SafeAreaView>
      )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Mobile full-screen container placeholder
  mobilePanelContainer: {
    flex: 1,
  },
  // Web: centered panel container
  webPanelContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100000,
    pointerEvents: 'box-none',
  },
  webPanel: {
    width: '90%',
    maxWidth: 900,
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    ...StyleSheet.create({ shadow: {
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16,
    }}).shadow,
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 99999,
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quantityHalf: {
    flex: 1,
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
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusButtonText: {
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

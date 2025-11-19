import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
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
const statuses = RESOURCE_STATUSES;
const isPersonnelCategory = (category: ResourceCategory) => category === 'personnel';

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
    status: 'active' as ResourceStatus,
    phoneNumber: '',
    tags: '',
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [imagePublicIds, setImagePublicIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUploadKey, setImageUploadKey] = useState(0); // Key to force ImageUpload remount
  
  // Refs for scrolling to top
  const webScrollViewRef = useRef<ScrollView>(null);
  const mobileScrollViewRef = useRef<ScrollView>(null);
  
  // Reset form function
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'equipment',
      totalQuantity: 1,
      location: '',
      condition: 'good',
      status: 'active',
      phoneNumber: '',
      tags: '',
    });
    setImages([]);
    setImagePublicIds([]);
    setErrors({});
    setImageUploadKey(prev => prev + 1); // Force ImageUpload to remount
    // Scroll to top
    webScrollViewRef.current?.scrollTo({ y: 0, animated: true });
    mobileScrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Hybrid RAMP hook
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose: () => {
      resetForm();
      onClose();
    }
  });

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
        // Description is optional, no validation needed
        delete newErrors.description;
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
      
      // For personnel, add phone number to tags if provided
      const finalTags = isPersonnelCategory(formData.category) && formData.phoneNumber.trim()
        ? [...tags, `phone:${formData.phoneNumber.trim()}`]
        : tags;

      const resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        totalQuantity: isPersonnelCategory(formData.category) ? 1 : formData.totalQuantity,
        availableQuantity: isPersonnelCategory(formData.category) ? 1 : formData.totalQuantity,
        isBorrowable: true, // Internal PDRRMO resources are borrowable
        resourceType: 'pdrrmo', // Identifies as internal PDRRMO resource
        images,
        location: formData.location.trim(),
        condition: isPersonnelCategory(formData.category) ? 'good' : formData.condition, // Default condition for personnel
        maintenanceNotes: isPersonnelCategory(formData.category) && formData.phoneNumber.trim() 
          ? `Phone: ${formData.phoneNumber.trim()}` 
          : '',
        lastMaintenanceDate: null,
        nextMaintenanceDate: null,
        tags: finalTags,
        isActive: true,
        status: isPersonnelCategory(formData.category) ? formData.status : 'active' as const,
        createdBy: user?.id || 'anonymous',
        updatedBy: user?.id || 'anonymous',
      };

      await addResource(resourceData);
      
      // Reset form immediately after successful save
      resetForm();
      
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

  const handleClose = rampHandleClose;

  // Platform-specific modal rendering
  if (isWeb) {
    // RAMP implementation for web
  return (
    <Modal
      visible={visible}
      {...getModalConfig()}
      onRequestClose={handleClose}
        transparent={true}
        animationType="fade"
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.overlayCloseButton} 
            onPress={handleClose}
            activeOpacity={0.7}
          />
          <Animated.View style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ]
            }
          ]}>
            <ThemedView style={styles.modalContent}>
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


        <ScrollView ref={webScrollViewRef} style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.text }]}>Category *</ThemedText>
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
                <ThemedText style={[styles.helperText, { color: colors.text + '70', marginTop: 8 }]}>
                  Select the category first to see relevant fields
                </ThemedText>
              </View>

              <FormInput
                label={isPersonnelCategory(formData.category) ? "Personnel Name" : "Resource Name"}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder={isPersonnelCategory(formData.category) ? "e.g., John Doe, Maria Santos" : "e.g., Emergency Generator, First Aid Kit, Radio"}
                required
                error={errors.name}
                helperText={isPersonnelCategory(formData.category) ? "Enter the full name of the personnel" : "Give it a clear, descriptive name that others will understand"}
              />

              <FormInput
                label="Description (Optional)"
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder={isPersonnelCategory(formData.category) ? "Describe the personnel's role, skills, or responsibilities..." : "Describe what this resource is and how it's used..."}
                multiline
                numberOfLines={3}
                error={errors.description}
                helperText={isPersonnelCategory(formData.category) ? "Provide details about the personnel's role and capabilities" : "Provide details about the resource's purpose and usage"}
              />

              {isPersonnelCategory(formData.category) && (
                <FormInput
                  label="Contact Information"
                  value={formData.phoneNumber}
                  onChangeText={(value) => handleInputChange('phoneNumber', value)}
                  placeholder="e.g., 09123456789, (02) 123-4567, 145.500 MHz"
                  keyboardType="default"
                  error={errors.phoneNumber}
                  helperText="Enter mobile number, landline, or radio frequency"
                />
              )}
            </View>
          </View>

          {/* Quantity and Location */}
          {!isPersonnelCategory(formData.category) && (
            <View style={[styles.section, styles.sectionWithOverlay]}>
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
          )}

          {/* Location (for Personnel) */}
          {isPersonnelCategory(formData.category) && (
            <View style={[styles.section, styles.sectionWithOverlay]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="location-outline" size={20} color="#007AFF" />
                </View>
                <ThemedText style={styles.sectionTitle}>Location</ThemedText>
              </View>
              
              <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <LocationInput
                  value={formData.location}
                  onChangeText={(value) => handleInputChange('location', value)}
                  placeholder="e.g., Office, Field Station, Department"
                  suggestions={getLocationSuggestions(formData.location)}
                  error={errors.location}
                  helperText="Where is this personnel typically located? Select from existing locations or type a new one."
                  disabled={loading}
                />
              </View>
            </View>
          )}

          {/* Condition/Status and Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="settings-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>
                {isPersonnelCategory(formData.category) ? "Status & Details" : "Condition & Details"}
              </ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {isPersonnelCategory(formData.category) ? (
                <View style={styles.inputGroup}>
                  <ThemedText style={[styles.label, { color: colors.text }]}>Status</ThemedText>
                  <View style={styles.conditionContainer}>
                    {statuses
                      .filter(status => status.value !== 'maintenance' && status.value !== 'retired')
                      .map((status) => (
                      <TouchableOpacity
                        key={status.value}
                        style={[
                          styles.conditionButton,
                          { borderColor: colors.border },
                          formData.status === status.value && { 
                            backgroundColor: status.color,
                            borderColor: status.color 
                          }
                        ]}
                        onPress={() => handleInputChange('status', status.value)}
                      >
                        <View style={[
                          styles.conditionIndicator,
                          { backgroundColor: formData.status === status.value ? '#fff' : status.color }
                        ]} />
                        <ThemedText style={[
                          styles.conditionButtonText,
                          formData.status === status.value && { color: '#fff' }
                        ]}>
                          {status.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <ThemedText style={[styles.label, { color: colors.text }]}>Condition</ThemedText>
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
              )}

              <FormInput
                label="Tags (Optional)"
                value={formData.tags}
                onChangeText={(value) => handleInputChange('tags', value)}
                placeholder={isPersonnelCategory(formData.category) ? "e.g., paramedic, driver, coordinator" : "e.g., emergency, portable, battery-powered"}
                error={errors.tags}
                helperText={isPersonnelCategory(formData.category) ? "Add keywords to help identify this personnel's skills or role (separate with commas)" : "Add keywords to help others find this resource (separate with commas)"}
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
                key={imageUploadKey}
                onImageSelected={handleImageSelected}
                onImageRemoved={handleImageRemoved}
                currentImageUrl={images[0]}
                imagesCount={images.length}
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
        </Animated.View>
      </Animated.View>
    </Modal>
    );
  }

  // Original mobile implementation
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <ThemedView style={styles.mobileContainer}>
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

        <ScrollView ref={mobileScrollViewRef} style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.text }]}>Category *</ThemedText>
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
                <ThemedText style={[styles.helperText, { color: colors.text + '70', marginTop: 8 }]}>
                  Select the category first to see relevant fields
                </ThemedText>
              </View>

              <FormInput
                label={isPersonnelCategory(formData.category) ? "Personnel Name" : "Resource Name"}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder={isPersonnelCategory(formData.category) ? "e.g., John Doe, Maria Santos" : "e.g., Emergency Generator, First Aid Kit, Radio"}
                required
                error={errors.name}
                helperText={isPersonnelCategory(formData.category) ? "Enter the full name of the personnel" : "Give it a clear, descriptive name that others will understand"}
              />

              <FormInput
                label="Description (Optional)"
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder={isPersonnelCategory(formData.category) ? "Describe the personnel's role, skills, or responsibilities..." : "Describe what this resource is and how it's used..."}
                multiline
                numberOfLines={3}
                error={errors.description}
                helperText={isPersonnelCategory(formData.category) ? "Provide details about the personnel's role and capabilities" : "Provide details about the resource's purpose and usage"}
              />

              {isPersonnelCategory(formData.category) && (
                <FormInput
                  label="Contact Information"
                  value={formData.phoneNumber}
                  onChangeText={(value) => handleInputChange('phoneNumber', value)}
                  placeholder="e.g., 09123456789, (02) 123-4567, 145.500 MHz"
                  keyboardType="default"
                  error={errors.phoneNumber}
                  helperText="Enter mobile number, landline, or radio frequency"
                />
              )}
            </View>
          </View>

          {/* Quantity and Location */}
          {!isPersonnelCategory(formData.category) && (
            <View style={[styles.section, styles.sectionWithOverlay]}>
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
          )}

          {/* Location (for Personnel) */}
          {isPersonnelCategory(formData.category) && (
            <View style={[styles.section, styles.sectionWithOverlay]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="location-outline" size={20} color="#007AFF" />
                </View>
                <ThemedText style={styles.sectionTitle}>Location</ThemedText>
              </View>
              
              <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <LocationInput
                  value={formData.location}
                  onChangeText={(value) => handleInputChange('location', value)}
                  placeholder="e.g., Office, Field Station, Department"
                  suggestions={getLocationSuggestions(formData.location)}
                  error={errors.location}
                  helperText="Where is this personnel typically located? Select from existing locations or type a new one."
                  disabled={loading}
                />
              </View>
            </View>
          )}

          {/* Condition/Status and Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="settings-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>
                {isPersonnelCategory(formData.category) ? "Status & Details" : "Condition & Details"}
              </ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {isPersonnelCategory(formData.category) ? (
                <View style={styles.inputGroup}>
                  <ThemedText style={[styles.label, { color: colors.text }]}>Status</ThemedText>
                  <View style={styles.conditionContainer}>
                    {statuses
                      .filter(status => status.value !== 'maintenance' && status.value !== 'retired')
                      .map((status) => (
                      <TouchableOpacity
                        key={status.value}
                        style={[
                          styles.conditionButton,
                          { borderColor: colors.border },
                          formData.status === status.value && { 
                            backgroundColor: status.color,
                            borderColor: status.color 
                          }
                        ]}
                        onPress={() => handleInputChange('status', status.value)}
                      >
                        <View style={[
                          styles.conditionIndicator,
                          { backgroundColor: formData.status === status.value ? '#fff' : status.color }
                        ]} />
                        <ThemedText style={[
                          styles.conditionButtonText,
                          formData.status === status.value && { color: '#fff' }
                        ]}>
                          {status.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <ThemedText style={[styles.label, { color: colors.text }]}>Condition</ThemedText>
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
              )}

              <FormInput
                label="Tags (Optional)"
                value={formData.tags}
                onChangeText={(value) => handleInputChange('tags', value)}
                placeholder={isPersonnelCategory(formData.category) ? "e.g., paramedic, driver, coordinator" : "e.g., emergency, portable, battery-powered"}
                error={errors.tags}
                helperText={isPersonnelCategory(formData.category) ? "Add keywords to help identify this personnel's skills or role (separate with commas)" : "Add keywords to help others find this resource (separate with commas)"}
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
                key={imageUploadKey}
                onImageSelected={handleImageSelected}
                onImageRemoved={handleImageRemoved}
                currentImageUrl={images[0]}
                imagesCount={images.length}
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
      </SafeAreaView>
    </Modal>
  );
}


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  overlayCloseButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  container: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
  },
  modalContent: {
    flex: 1,
  },
  mobileContainer: {
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
    overflow: 'visible', // Allow child elements with absolute positioning to overflow
    zIndex: 1, // Ensure proper stacking context
  },
  sectionWithOverlay: {
    position: 'relative',
    zIndex: 10,
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
    overflow: 'visible', // Allow child elements with absolute positioning to overflow
  },
  inputGroup: {
    marginBottom: 16,
    overflow: 'visible', // Allow dropdown to extend beyond bounds
    zIndex: 1, // Ensure proper stacking context
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
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
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});

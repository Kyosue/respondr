import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AgencyNameInput } from '@/components/ui/AgencyNameInput';
import { FormButton, FormInput, FormQuantityInput } from '@/components/ui/FormComponents';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { LocationInput } from '@/components/ui/LocationInput';
import { Colors } from '@/constants/Colors';
import { RESOURCE_CATEGORIES, RESOURCE_CONDITIONS } from '@/constants/ResourceConstants';
import { useAuth } from '@/contexts/AuthContext';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { Resource, ResourceCategory, ResourceCondition } from '@/types/Resource';
import { getModalConfig, showErrorAlert, showSuccessAlert } from '@/utils/modalUtils';
import { ResourceValidator } from '@/utils/resourceValidation';

interface Agency {
  id: string;
  name: string;
  address: string;
  contactNumbers: string[];
}

interface AddExternalResourceModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agencies: Agency[];
}

// Use shared constants
const categories = RESOURCE_CATEGORIES;
const conditions = RESOURCE_CONDITIONS;

export function AddExternalResourceModal({
  visible,
  onClose,
  onSuccess,
  agencies
}: AddExternalResourceModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { addResource, addAgency, getLocationSuggestions } = useResources();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'equipment' as ResourceCategory,
    agencyName: '',
    agencyId: '',
    address: '',
    contactNumbers: [''],
    location: '',
    condition: 'good' as ResourceCondition,
    totalQuantity: 1,
    tags: ''
  });

  const [images, setImages] = useState<string[]>([]);
  const [imagePublicIds, setImagePublicIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUploadKey, setImageUploadKey] = useState(0); // Key to force ImageUpload remount
  
  // Refs for scrolling to top
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Reset form function
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'equipment',
      agencyName: '',
      agencyId: '',
      address: '',
      contactNumbers: [''],
      location: '',
      condition: 'good',
      totalQuantity: 1,
      tags: ''
    });
    setImages([]);
    setImagePublicIds([]);
    setErrors({});
    setImageUploadKey(prev => prev + 1); // Force ImageUpload to remount
    // Scroll to top
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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
      availableQuantity: formData.totalQuantity, // External resources show full quantity as available for operations
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

    // Add external-specific validations
    if (!formData.agencyName.trim()) {
      newErrors.agencyName = 'Please enter an agency name';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Agency address is required';
    }

    // Validate contact numbers - must have at least one non-empty contact
    const validContactNumbers = formData.contactNumbers.filter(num => num.trim().length > 0);
    if (validContactNumbers.length === 0) {
      newErrors.contactNumbers = 'At least one contact number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      case 'description':
        // Description is optional, no validation needed
        delete newErrors.description;
        break;
      case 'agencyName':
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors.agencyName = 'Please enter an agency name';
        } else {
          delete newErrors.agencyName;
        }
        break;
      case 'address':
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors.address = 'Agency address is required';
        } else {
          delete newErrors.address;
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
      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleContactNumberChange = (index: number, value: string) => {
    // Allow any contact information (mobile, landline, radio frequency)
    const newContactNumbers = [...formData.contactNumbers];
    newContactNumbers[index] = value;
    setFormData({ ...formData, contactNumbers: newContactNumbers });
  };

  const addContactNumber = () => {
    setFormData({
      ...formData,
      contactNumbers: [...formData.contactNumbers, '']
    });
  };

  const removeContactNumber = (index: number) => {
    if (formData.contactNumbers.length > 1) {
      const newContactNumbers = formData.contactNumbers.filter((_, i) => i !== index);
      setFormData({ ...formData, contactNumbers: newContactNumbers });
    }
  };

  const handleAgencyNameChange = (agencyName: string) => {
    setFormData(prev => ({ ...prev, agencyName }));
    validateField('agencyName', agencyName);
  };

  const handleAgencySelect = (agency: Agency) => {
    setFormData(prev => ({
      ...prev,
      agencyName: agency.name,
      agencyId: agency.id,
      address: agency.address,
      contactNumbers: agency.contactNumbers.length > 0 ? agency.contactNumbers : ['']
    }));
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
      
      const validContactNumbers = formData.contactNumbers.filter(num => num.trim().length > 0);
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Save agency information if it's a new agency (no agencyId)
      let agencyId = formData.agencyId;
      if (!agencyId && formData.agencyName.trim()) {
        try {
          const agencyData = {
            name: formData.agencyName.trim(),
            address: formData.address.trim(),
            contactNumbers: validContactNumbers,
          };
          agencyId = await addAgency(agencyData);
          console.log('Agency saved successfully with ID:', agencyId);
        } catch (error) {
          console.error('Failed to save agency:', error);
          Alert.alert('Error', 'Failed to save agency information. Please try again.');
          return;
        }
      }

      const resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        totalQuantity: formData.totalQuantity,
        availableQuantity: formData.totalQuantity, // External resources show full quantity as available for operations
        isBorrowable: false,
        resourceType: 'external',
        agencyId: agencyId || '', // Use the saved agency ID
        agencyName: formData.agencyName.trim(),
        agencyAddress: formData.address.trim(),
        agencyContactNumbers: validContactNumbers,
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
        updatedBy: user?.id || 'anonymous'
      };

      await addResource(resourceData);
      
      // Reset form immediately after successful save
      resetForm();
      
      // Show success alert with proper callback handling
      const successConfig = showSuccessAlert(
        'Success',
        'External resource added successfully',
        () => {
          handleClose();
          onSuccess();
        }
      );
      Alert.alert(successConfig.title, successConfig.message, successConfig.buttons, successConfig.options);
      
    } catch (error) {
      console.error('Error adding external resource:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add external resource';
      const errorConfig = showErrorAlert('Error', `Failed to add external resource: ${errorMessage}`);
      Alert.alert(errorConfig.title, errorConfig.message, errorConfig.buttons, errorConfig.options);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = rampHandleClose;
  const locationSuggestions = getLocationSuggestions(formData.location);

  const renderFormSections = () => (
    <ScrollView ref={scrollViewRef} style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="business-outline" size={20} color="#FF8F00" />
          </View>
          <ThemedText style={styles.sectionTitle}>Agency Information</ThemedText>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Agency Name *</ThemedText>
            <AgencyNameInput
              value={formData.agencyName}
              onChangeText={handleAgencyNameChange}
              onAgencySelect={handleAgencySelect}
              placeholder="Enter agency name"
              suggestions={agencies}
              error={errors.agencyName}
              helperText="Select from existing agencies or type a new agency name"
            />
          </View>

          <FormInput
            label="Agency Address"
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            placeholder="Enter full agency address"
            multiline
            numberOfLines={2}
            required
            error={errors.address}
            helperText="Complete address of the agency"
          />

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Contact Numbers *</ThemedText>
            <View style={styles.contactNumbersGrid}>
              {formData.contactNumbers.map((number, index) => (
                <View key={index} style={styles.contactNumberItem}>
                  <FormInput
                    label={`Contact ${index + 1}`}
                    value={number}
                    onChangeText={(text) => handleContactNumberChange(index, text)}
                    placeholder="e.g., 09123456789, (02) 123-4567, 145.500 MHz"
                    keyboardType="default"
                    error={errors.contactNumbers && index === 0 ? errors.contactNumbers : undefined}
                    helperText={index === 0 ? "Enter mobile number, landline, or radio frequency" : undefined}
                  />
                  {formData.contactNumbers.length > 1 && (
                    <TouchableOpacity
                      style={[styles.removeButton, { backgroundColor: colors.error + '20' }]}
                      onPress={() => removeContactNumber(index)}
                    >
                      <Ionicons name="close" size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
              onPress={addContactNumber}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <ThemedText style={[styles.addButtonText, { color: colors.primary }]}>
                Add Contact Number
              </ThemedText>
            </TouchableOpacity>
            {errors.contactNumbers && (
              <ThemedText style={[styles.errorText, { color: colors.error }]}>
                {errors.contactNumbers}
              </ThemedText>
            )}
          </View>
        </View>
      </View>

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
            label="Resource Name"
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="e.g., Emergency Generator, First Aid Kit, Radio"
            required
            error={errors.name}
            helperText="Give it a clear, descriptive name that others will understand"
          />

          <FormInput
            label="Description (Optional)"
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="Describe what this resource is and how it's used..."
            multiline
            numberOfLines={3}
            error={errors.description}
            helperText="Provide details about the resource's purpose and usage"
          />
        </View>
      </View>

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
            helperText="How many units of this resource does the agency have?"
          />

          <LocationInput
            value={formData.location}
            onChangeText={(value) => handleInputChange('location', value)}
            placeholder="e.g., Agency Office, Emergency Center"
            suggestions={locationSuggestions}
            error={errors.location}
            helperText="Where is this resource located at the agency? Select from existing locations or type a new one."
            disabled={loading}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name="settings-outline" size={20} color="#007AFF" />
          </View>
          <ThemedText style={styles.sectionTitle}>Condition & Details</ThemedText>
        </View>
        
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name="camera-outline" size={20} color="#007AFF" />
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
            resourceId="temp"
            folder="resources"
            tags={['resource', formData.category, 'external']}
            quality="auto"
            format="auto"
            disabled={loading}
          />
        </View>
      </View>
    </ScrollView>
  );

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
              <ThemedText type="subtitle" style={styles.title}>Add External Resource</ThemedText>
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

        {renderFormSections()}
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
      {...getModalConfig()}
      onRequestClose={handleClose}
    >
      <ThemedView style={styles.mobileContainer}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <ThemedText type="subtitle" style={styles.title}>Add External Resource</ThemedText>
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

        {renderFormSections()}
      </ThemedView>
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
    paddingTop: 15,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  headerButton: {
    minWidth: 80,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
    overflow: 'visible',
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
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    overflow: 'visible',
  },
  inputGroup: {
    marginBottom: 20,
    overflow: 'visible',
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
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
    marginRight: 8,
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
    marginRight: 8,
  },
  conditionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactNumbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  contactNumberItem: {
    flex: 1,
    minWidth: '45%', // Each item takes roughly half the width with gap
    marginBottom: 8,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});

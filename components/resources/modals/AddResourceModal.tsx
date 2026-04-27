import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FormButton, FormQuantityInput } from '@/components/ui/FormComponents';
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
    isBorrowable: true,
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [imagePublicIds, setImagePublicIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUploadKey, setImageUploadKey] = useState(0); // Key to force ImageUpload remount
  const [tagInputValue, setTagInputValue] = useState(''); // Current tag being typed (committed on comma/Enter)
  const [suggestingTags, setSuggestingTags] = useState(false); // Loading state for "Suggest from name"
  const [segmentScrollAtEnd, setSegmentScrollAtEnd] = useState(true); // Hide right arrow when scrolled to end or when nothing to scroll
  
  // Refs for scrolling to top and focusing tag input
  const webScrollViewRef = useRef<ScrollView>(null);
  const mobileScrollViewRef = useRef<ScrollView>(null);
  const tagInputRef = useRef<TextInput>(null);
  const segmentScrollLayoutRef = useRef<{ contentWidth?: number; layoutWidth?: number }>({});
  
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
      isBorrowable: true,
    });
    setTagInputValue('');
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
    const tagsFromForm = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
    const tagsWithCurrent = tagInputValue.trim() ? [...tagsFromForm, tagInputValue.trim()] : tagsFromForm;
    const resourceData = {
      name: formData.name,
      description: formData.description,
      totalQuantity: formData.totalQuantity,
      availableQuantity: formData.totalQuantity, // For new resources, available = total
      location: formData.location,
      tags: tagsWithCurrent,
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

  const removeTag = (tagToRemove: string) => {
    const tags = formData.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const next = tags.filter((t) => t !== tagToRemove).join(', ');
    setFormData((prev) => ({ ...prev, tags: next }));
  };

  const handleTagInputChange = (text: string) => {
    const parts = text.split(/[,\n]/);
    if (parts.length > 1) {
      const toAdd = parts.slice(0, -1).map((p) => p.trim()).filter(Boolean);
      const last = parts[parts.length - 1].trim();
      if (toAdd.length > 0) {
        setFormData((prev) => ({
          ...prev,
          tags: [...(prev.tags ? prev.tags.split(',').map((t) => t.trim()).filter(Boolean) : []), ...toAdd].join(', '),
        }));
      }
      setTagInputValue(last);
    } else {
      setTagInputValue(text);
    }
  };

  const handleTagInputSubmit = () => {
    const trimmed = tagInputValue.trim();
    if (trimmed) {
      setFormData((prev) => ({
        ...prev,
        tags: prev.tags ? `${prev.tags}, ${trimmed}` : trimmed,
      }));
      setTagInputValue('');
    }
  };

  // Fetch related/general terms from Datamuse API (free, no key) and add as tags
  const suggestTagsFromName = async () => {
    const name = formData.name.trim();
    if (!name) return;
    setSuggestingTags(true);
    try {
      const term = encodeURIComponent(name.toLowerCase());
      // ml = "means like" (related), rel_gen = "more general" (e.g. laptop -> device, machine)
      const [relatedRes, generalRes] = await Promise.all([
        fetch(`https://api.datamuse.com/words?ml=${term}&max=5`),
        fetch(`https://api.datamuse.com/words?rel_gen=${term}&max=5`),
      ]);
      const related: { word: string }[] = await relatedRes.json();
      const general: { word: string }[] = await generalRes.json();
      const existing = (formData.tags ? formData.tags.split(',').map((t) => t.trim().toLowerCase()) : []) as string[];
      const newWords = [...related, ...general]
        .map((o) => (typeof o === 'object' && o && 'word' in o ? (o as { word: string }).word : ''))
        .filter(Boolean)
        .map((w) => w.trim())
        .filter((w) => w.length > 1 && !existing.includes(w.toLowerCase()));
      const seen = new Set<string>();
      const unique = newWords.filter((w) => {
        const key = w.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const toAdd = unique.slice(0, 6).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      if (toAdd.length > 0) {
        const current = formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
        setFormData((prev) => ({
          ...prev,
          tags: [...current, ...toAdd].join(', '),
        }));
      }
    } catch {
      // Offline or API error: no-op
    } finally {
      setSuggestingTags(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      const scrollRef = isWeb ? webScrollViewRef : mobileScrollViewRef;
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    try {
      setLoading(true);
      
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      if (tagInputValue.trim()) {
        tags.push(tagInputValue.trim());
      }
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
        isBorrowable: formData.isBorrowable,
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
    return (
      <Modal
        visible={visible}
        {...getModalConfig()}
        onRequestClose={handleClose}
        transparent
        animationType="fade"
      >
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.overlayCloseButton}
            onPress={handleClose}
            activeOpacity={0.7}
          />
          <Animated.View style={[
            styles.webPanel,
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
                style={styles.saveButtonPill}
              />
            </View>
          </View>
        </View>


        <ScrollView
          ref={webScrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category */}
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.labelTop, { color: colors.text }]}>Category *</ThemedText>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryPill,
                    { borderColor: colors.border },
                    formData.category === category.value && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleInputChange('category', category.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={category.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={formData.category === category.value ? '#fff' : colors.primary}
                  />
                  <ThemedText style={[styles.categoryPillText, formData.category === category.value && { color: '#fff' }]}>
                    {category.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Name */}
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.labelTop, { color: colors.text }]}>
              {isPersonnelCategory(formData.category) ? 'Personnel Name' : 'Resource Name'} *
            </ThemedText>
            <TextInput
              style={[
                styles.inputRounded,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.name ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
              value={formData.name}
              onChangeText={(v) => handleInputChange('name', v)}
              placeholder={isPersonnelCategory(formData.category) ? 'e.g., John Doe, Maria Santos' : 'e.g., Emergency Generator, First Aid Kit'}
              placeholderTextColor={colors.text + '80'}
            />
            {errors.name ? <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.name}</ThemedText> : null}
          </View>

          {/* Description */}
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.labelTop, { color: colors.text }]}>Description (Optional)</ThemedText>
            <TextInput
              style={[
                styles.inputRounded,
                styles.inputMultiline,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={formData.description}
              onChangeText={(v) => handleInputChange('description', v)}
              placeholder={isPersonnelCategory(formData.category) ? "Role, skills, responsibilities..." : "What it is and how it's used..."}
              placeholderTextColor={colors.text + '80'}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {isPersonnelCategory(formData.category) && (
            <View style={styles.fieldBlock}>
              <ThemedText style={[styles.labelTop, { color: colors.text }]}>Contact Information</ThemedText>
              <TextInput
                style={[
                  styles.inputRounded,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={formData.phoneNumber}
                onChangeText={(v) => handleInputChange('phoneNumber', v)}
                placeholder="e.g., 09123456789, (02) 123-4567"
                placeholderTextColor={colors.text + '80'}
              />
            </View>
          )}

          {/* Quantity (non-personnel) */}
          {!isPersonnelCategory(formData.category) && (
            <View style={styles.fieldBlock}>
              <FormQuantityInput
                label="Total Quantity"
                value={formData.totalQuantity}
                onChangeValue={(v) => handleInputChange('totalQuantity', v)}
                required
                error={errors.totalQuantity}
              />
            </View>
          )}

          {/* Location */}
          <View style={[styles.fieldBlock, styles.fieldBlockOverlay]}>
            <ThemedText style={[styles.labelTop, { color: colors.text }]}>Location *</ThemedText>
            <LocationInput
              value={formData.location}
              onChangeText={(v) => handleInputChange('location', v)}
              placeholder={isPersonnelCategory(formData.category) ? 'e.g., Office, Field Station' : 'e.g., Warehouse A, Room 101'}
              suggestions={getLocationSuggestions(formData.location)}
              error={errors.location}
              disabled={loading}
            />
          </View>

          {/* Borrowable toggle */}
          <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
            <ThemedText style={[styles.toggleLabel, { color: colors.text }]}>Borrowable</ThemedText>
            <Switch
              value={formData.isBorrowable}
              onValueChange={(v) => setFormData((p) => ({ ...p, isBorrowable: v }))}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={formData.isBorrowable ? colors.primary : colors.surface}
            />
          </View>

          {/* Condition / Status (segmented) */}
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.labelTop, { color: colors.text }]}>
              {isPersonnelCategory(formData.category) ? 'Status' : 'Condition'}
            </ThemedText>
            <View style={[styles.segmentedControl, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {isPersonnelCategory(formData.category)
                ? statuses
                    .filter((s) => s.value !== 'maintenance' && s.value !== 'retired')
                    .map((status) => (
                      <TouchableOpacity
                        key={status.value}
                        style={[
                          styles.segmentButton,
                          formData.status === status.value && { backgroundColor: colors.primary },
                        ]}
                        onPress={() => handleInputChange('status', status.value)}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={[styles.segmentButtonText, formData.status === status.value && { color: '#fff' }]}>
                          {status.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))
                : conditions.map((condition) => (
                    <TouchableOpacity
                      key={condition.value}
                      style={[
                        styles.segmentButton,
                        formData.condition === condition.value && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => handleInputChange('condition', condition.value)}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={[styles.segmentButtonText, formData.condition === condition.value && { color: '#fff' }]}>
                        {condition.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
            </View>
          </View>

          {/* Tags: pills + More + input */}
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.labelTop, { color: colors.text }]}>Tags</ThemedText>
            <View style={styles.tagsPillRow}>
              {(formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : []).map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => removeTag(tag)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tagDot, { backgroundColor: colors.primary }]} />
                  <ThemedText style={[styles.tagPillText, { color: colors.text }]}>{tag}</ThemedText>
                  <Ionicons name="close-circle" size={16} color={colors.text + '99'} style={styles.tagPillRemove} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.tagPillMore, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => tagInputRef.current?.focus()}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.tagPillMoreText, { color: colors.text }]}>More</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tagPillSuggest, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={suggestTagsFromName}
                disabled={!formData.name.trim() || suggestingTags}
                activeOpacity={0.7}
              >
                {suggestingTags ? (
                  <Ionicons name="hourglass-outline" size={14} color={colors.text + '99'} />
                ) : (
                  <ThemedText style={[styles.tagPillSuggestText, { color: colors.text }]}>
                    Suggest from name
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
            <TextInput
              ref={tagInputRef}
              style={[
                styles.inputRounded,
                { backgroundColor: colors.surface, borderColor: errors.tags ? colors.error : colors.border, color: colors.text },
              ]}
              value={tagInputValue}
              onChangeText={handleTagInputChange}
              onSubmitEditing={handleTagInputSubmit}
              blurOnSubmit={false}
              placeholder={isPersonnelCategory(formData.category) ? 'Type a tag and press comma or Enter' : 'Type a tag and press comma or Enter'}
              placeholderTextColor={colors.text + '80'}
            />
            {errors.tags ? <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.tags}</ThemedText> : null}
          </View>

          {/* Photos */}
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.labelTop, { color: colors.text }]}>Photos (Optional)</ThemedText>
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
              tags={['resource', formData.category]}
              quality="auto"
              format="auto"
              disabled={loading}
            />
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
                style={styles.saveButtonPill}
              />
            </View>
          </View>
        </View>

        <ScrollView
          ref={mobileScrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category */}
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.labelTop, { color: colors.text }]}>Category *</ThemedText>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryPill,
                    { borderColor: colors.border },
                    formData.category === category.value && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleInputChange('category', category.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={category.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={formData.category === category.value ? '#fff' : colors.primary}
                  />
                  <ThemedText style={[styles.categoryPillText, formData.category === category.value && { color: '#fff' }]}>
                    {category.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Name */}
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.labelTop, { color: colors.text }]}>
              {isPersonnelCategory(formData.category) ? 'Personnel Name' : 'Resource Name'} *
            </ThemedText>
            <TextInput
              style={[
                styles.inputRounded,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.name ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
              value={formData.name}
              onChangeText={(v) => handleInputChange('name', v)}
              placeholder={isPersonnelCategory(formData.category) ? 'e.g., John Doe, Maria Santos' : 'e.g., Emergency Generator, First Aid Kit'}
              placeholderTextColor={colors.text + '80'}
            />
            {errors.name ? <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.name}</ThemedText> : null}
          </View>

          {/* Description */}
          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.labelTop, { color: colors.text }]}>Description (Optional)</ThemedText>
            <TextInput
              style={[
                styles.inputRounded,
                styles.inputMultiline,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={formData.description}
              onChangeText={(v) => handleInputChange('description', v)}
              placeholder={isPersonnelCategory(formData.category) ? "Role, skills, responsibilities..." : "What it is and how it's used..."}
              placeholderTextColor={colors.text + '80'}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {isPersonnelCategory(formData.category) && (
            <View style={styles.fieldBlock}>
              <ThemedText style={[styles.labelTop, { color: colors.text }]}>Contact Information</ThemedText>
              <TextInput
                style={[
                  styles.inputRounded,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={formData.phoneNumber}
                onChangeText={(v) => handleInputChange('phoneNumber', v)}
                placeholder="e.g., 09123456789, (02) 123-4567"
                placeholderTextColor={colors.text + '80'}
              />
            </View>
          )}

          {!isPersonnelCategory(formData.category) && (
            <View style={styles.fieldBlock}>
              <FormQuantityInput
                label="Total Quantity"
                value={formData.totalQuantity}
                onChangeValue={(v) => handleInputChange('totalQuantity', v)}
                required
                error={errors.totalQuantity}
              />
            </View>
          )}

          <View style={[styles.fieldBlock, styles.fieldBlockOverlay]}>
            <ThemedText style={[styles.labelTop, { color: colors.text }]}>Location *</ThemedText>
            <LocationInput
              value={formData.location}
              onChangeText={(v) => handleInputChange('location', v)}
              placeholder={isPersonnelCategory(formData.category) ? 'e.g., Office, Field Station' : 'e.g., Warehouse A, Room 101'}
              suggestions={getLocationSuggestions(formData.location)}
              error={errors.location}
              disabled={loading}
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
            <ThemedText style={[styles.toggleLabel, { color: colors.text }]}>Borrowable</ThemedText>
            <Switch
              value={formData.isBorrowable}
              onValueChange={(v) => setFormData((p) => ({ ...p, isBorrowable: v }))}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={formData.isBorrowable ? colors.primary : colors.surface}
            />
          </View>

          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.labelTop, { color: colors.text }]}>
              {isPersonnelCategory(formData.category) ? 'Status' : 'Condition'}
            </ThemedText>
            <View style={styles.segmentControlScrollWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                style={[styles.segmentControlScroll, { backgroundColor: colors.surface, borderColor: colors.border }]}
                contentContainerStyle={styles.segmentControlScrollContent}
                onScroll={(e) => {
                  const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
                  const atEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 4;
                  setSegmentScrollAtEnd(atEnd);
                }}
                onContentSizeChange={(contentWidth) => {
                  segmentScrollLayoutRef.current = { ...segmentScrollLayoutRef.current, contentWidth };
                  const { layoutWidth } = segmentScrollLayoutRef.current;
                  if (layoutWidth != null) setSegmentScrollAtEnd(contentWidth <= layoutWidth);
                }}
                onLayout={(e) => {
                  const layoutWidth = e.nativeEvent.layout.width;
                  segmentScrollLayoutRef.current = { ...segmentScrollLayoutRef.current, layoutWidth };
                  const { contentWidth } = segmentScrollLayoutRef.current;
                  if (contentWidth != null) setSegmentScrollAtEnd(contentWidth <= layoutWidth);
                }}
                scrollEventThrottle={16}
              >
                {isPersonnelCategory(formData.category)
                  ? statuses
                      .filter((s) => s.value !== 'maintenance' && s.value !== 'retired')
                      .map((status) => (
                        <TouchableOpacity
                          key={status.value}
                          style={[
                            styles.segmentButtonMobile,
                            formData.status === status.value && { backgroundColor: colors.primary },
                          ]}
                          onPress={() => handleInputChange('status', status.value)}
                          activeOpacity={0.7}
                        >
                          <ThemedText style={[styles.segmentButtonText, formData.status === status.value && { color: '#fff' }]}>
                            {status.label}
                          </ThemedText>
                        </TouchableOpacity>
                      ))
                  : conditions.map((condition) => (
                      <TouchableOpacity
                        key={condition.value}
                        style={[
                          styles.segmentButtonMobile,
                          formData.condition === condition.value && { backgroundColor: colors.primary },
                        ]}
                        onPress={() => handleInputChange('condition', condition.value)}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={[styles.segmentButtonText, formData.condition === condition.value && { color: '#fff' }]}>
                          {condition.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
              </ScrollView>
              {!segmentScrollAtEnd && (
                <View style={styles.segmentControlFadeWrap} pointerEvents="none">
                  <LinearGradient
                    colors={['transparent', colors.surface]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.segmentControlFade}
                  />
                  <Ionicons name="chevron-forward" size={16} color={colors.text + '99'} style={styles.segmentControlFadeIcon} />
                </View>
              )}
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.labelTop, { color: colors.text }]}>Tags</ThemedText>
            <View style={styles.tagsPillRow}>
              {(formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : []).map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => removeTag(tag)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tagDot, { backgroundColor: colors.primary }]} />
                  <ThemedText style={[styles.tagPillText, { color: colors.text }]}>{tag}</ThemedText>
                  <Ionicons name="close-circle" size={16} color={colors.text + '99'} style={styles.tagPillRemove} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.tagPillMore, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => tagInputRef.current?.focus()}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.tagPillMoreText, { color: colors.text }]}>More</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tagPillSuggest, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={suggestTagsFromName}
                disabled={!formData.name.trim() || suggestingTags}
                activeOpacity={0.7}
              >
                {suggestingTags ? (
                  <Ionicons name="hourglass-outline" size={14} color={colors.text + '99'} />
                ) : (
                  <ThemedText style={[styles.tagPillSuggestText, { color: colors.text }]}>
                    Suggest from name
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
            <TextInput
              ref={tagInputRef}
              style={[
                styles.inputRounded,
                { backgroundColor: colors.surface, borderColor: errors.tags ? colors.error : colors.border, color: colors.text },
              ]}
              value={tagInputValue}
              onChangeText={handleTagInputChange}
              onSubmitEditing={handleTagInputSubmit}
              blurOnSubmit={false}
              placeholder={isPersonnelCategory(formData.category) ? 'Type a tag and press comma or Enter' : 'Type a tag and press comma or Enter'}
              placeholderTextColor={colors.text + '80'}
            />
            {errors.tags ? <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.tags}</ThemedText> : null}
          </View>

          <View style={styles.fieldBlock}>
            <ThemedText style={[styles.labelTop, { color: colors.text }]}>Photos (Optional)</ThemedText>
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
              tags={['resource', formData.category]}
              quality="auto"
              format="auto"
              disabled={loading}
            />
          </View>
        </ScrollView>
        </ThemedView>
      </SafeAreaView>
    </Modal>
  );
}


const styles = StyleSheet.create({
  backdrop: {
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
  webPanel: {
    width: '100%',
    maxWidth: 620,
    height: '96%',
    maxHeight: '96%',
    borderRadius: 16,
    overflow: 'hidden',
    ...StyleSheet.create({ shadow: {
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16,
    }}).shadow,
    zIndex: 2,
  },
  modalContent: {
    flex: 1,
  },
  mobileContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  saveButtonPill: {
    borderRadius: 999,
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
  contentContainer: {
    paddingBottom: 32,
  },
  fieldBlock: {
    marginBottom: 20,
  },
  fieldBlockOverlay: {
    position: 'relative',
    zIndex: 10,
    overflow: 'visible',
  },
  labelTop: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputRounded: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  segmentControlScrollWrap: {
    position: 'relative',
  },
  segmentControlScroll: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  segmentControlScrollContent: {
    flexDirection: 'row',
  },
  segmentControlFadeWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 32,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  segmentControlFade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 32,
  },
  segmentControlFadeIcon: {
    zIndex: 1,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonMobile: {
    flex: 0,
    minWidth: 92,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagsPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tagPillRemove: {
    marginLeft: 2,
  },
  tagPillMore: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagPillMoreText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tagPillSuggest: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagPillSuggestText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

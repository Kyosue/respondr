import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ImageSelectionModal } from '@/components/resources/modals/ImageSelectionModal';
import { ThemedText } from '@/components/ThemedText';
import { BorrowerNameInput } from '@/components/ui/BorrowerNameInput';
import { FormInput } from '@/components/ui/FormComponents';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface BorrowerInfo {
  borrowerName: string;
  borrowerContact: string;
  borrowerDepartment: string;
  borrowerPicture: string | null;
}

interface BorrowerFormProps {
  borrowerInfo: BorrowerInfo;
  onBorrowerInfoChange: (info: BorrowerInfo) => void;
  errors?: Record<string, string>;
  showImagePicker?: boolean;
}

export function BorrowerForm({ 
  borrowerInfo, 
  onBorrowerInfoChange, 
  errors = {},
  showImagePicker = true 
}: BorrowerFormProps) {
  const { getBorrowerNameSuggestions, getBorrowerProfile } = useResources();
  const [isLoadingBorrower, setIsLoadingBorrower] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const updateBorrowerInfo = (field: keyof BorrowerInfo, value: string | null) => {
    onBorrowerInfoChange({
      ...borrowerInfo,
      [field]: value,
    });
  };

  const handleBorrowerNameChange = useCallback(async (name: string) => {
    // First update the name immediately
    updateBorrowerInfo('borrowerName', name);
    
    // Then check if this is an existing borrower and auto-fill their info
    if (name.trim()) {
      setIsLoadingBorrower(true);
      try {
        const existingBorrower = await getBorrowerProfile(name);
        if (existingBorrower) {
          onBorrowerInfoChange({
            ...borrowerInfo,
            borrowerName: name,
            borrowerContact: existingBorrower.contact || borrowerInfo.borrowerContact,
            borrowerDepartment: existingBorrower.department || borrowerInfo.borrowerDepartment,
            borrowerPicture: existingBorrower.picture || borrowerInfo.borrowerPicture,
          });
        }
      } catch (error) {
        console.warn('Failed to load borrower profile:', error);
      } finally {
        setIsLoadingBorrower(false);
      }
    }
  }, [borrowerInfo, getBorrowerProfile, onBorrowerInfoChange]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateBorrowerInfo('borrowerPicture', result.assets[0].uri);
    }
    setShowImageModal(false);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateBorrowerInfo('borrowerPicture', result.assets[0].uri);
    }
    setShowImageModal(false);
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => updateBorrowerInfo('borrowerPicture', null)
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="person-outline" size={20} color={colors.primary} />
        </View>
        <ThemedText style={styles.sectionTitle}>Borrower Information</ThemedText>
      </View>
      
      <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Primary Information Section */}
        <View style={styles.primarySection}>
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              Borrower Name
              <ThemedText style={[styles.required, { color: colors.error }]}> *</ThemedText>
            </ThemedText>
            <BorrowerNameInput
              value={borrowerInfo.borrowerName}
              onChangeText={handleBorrowerNameChange}
              placeholder="Enter borrower's full name"
              suggestions={getBorrowerNameSuggestions(borrowerInfo.borrowerName)}
              error={errors.borrowerName}
              helperText={isLoadingBorrower ? "Loading borrower info..." : "Select from existing borrowers or type a new name"}
            />
          </View>
        </View>

        {/* Secondary Information Section */}
        <View style={styles.secondarySection}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.inputGroup}>
            <FormInput
              label="Contact Information"
              value={borrowerInfo.borrowerContact}
              onChangeText={(text) => updateBorrowerInfo('borrowerContact', text)}
              placeholder="Phone or email"
              keyboardType="email-address"
              helperText="Optional contact information"
            />
          </View>

          <View style={styles.inputGroup}>
            <FormInput
              label="Department"
              value={borrowerInfo.borrowerDepartment}
              onChangeText={(text) => updateBorrowerInfo('borrowerDepartment', text)}
              placeholder="Department or team"
              helperText="Optional department or team name"
            />
          </View>
        </View>

        {/* Optional Photo Section */}
        {showImagePicker && (
          <View style={styles.photoSection}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Borrower Photo
              </ThemedText>
              <ThemedText style={[styles.helperText, { color: colors.text + '80' }]}>
                Optional - Add a photo to help identify the borrower
              </ThemedText>
              
              <View style={styles.photoContainer}>
                {borrowerInfo.borrowerPicture ? (
                  <View style={styles.photoWrapper}>
                    <Image 
                      source={{ uri: borrowerInfo.borrowerPicture }} 
                      style={[styles.photoImage, { borderColor: colors.border }]}
                    />
                    <View style={styles.photoActionButtons}>
                      <TouchableOpacity
                        style={[styles.photoActionButton, { backgroundColor: colors.primary }]}
                        onPress={() => setShowImageModal(true)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="camera" size={16} color="#fff" />
                        <ThemedText style={styles.photoActionText}>Change</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.photoActionButton, { backgroundColor: colors.error }]}
                        onPress={handleRemovePhoto}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trash-outline" size={16} color="#fff" />
                        <ThemedText style={styles.photoActionText}>Remove</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.photoButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setShowImageModal(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.photoPlaceholder}>
                      <View style={[styles.photoIconContainer, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="camera-outline" size={32} color={colors.primary} />
                      </View>
                      <ThemedText style={[styles.photoPlaceholderText, { color: colors.text + '80' }]}>
                        Tap to add photo
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <ImageSelectionModal
              visible={showImageModal}
              onClose={() => setShowImageModal(false)}
              onCameraPress={takePhoto}
              onLibraryPress={pickImage}
              maxImages={1}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  primarySection: {
    marginBottom: 0,
  },
  secondarySection: {
    marginTop: 0,
  },
  photoSection: {
    marginTop: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 0,
    marginBottom: 16,
    marginHorizontal: -4,
    opacity: 0.3,
  },
  inputGroup: {
    marginBottom: 16,
    overflow: 'visible', // Allow suggestions to extend beyond the input group
    zIndex: 1000, // Ensure the input group has a high z-index
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  required: {
    // Color applied via style prop for dark mode support
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  photoContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  photoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  photoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  photoActionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  photoActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  photoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  photoPlaceholderText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});

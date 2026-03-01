import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Alert, Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ImageSelectionModal } from '@/components/resources/modals/ImageSelectionModal';
import { ThemedText } from '@/components/ThemedText';
import { BorrowerNameInput } from '@/components/ui/BorrowerNameInput';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as ImagePicker from 'expo-image-picker';

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
      {/* Borrower Name - flat fieldBlock + labelTop (matches AddResourceModal) */}
      <View style={[styles.fieldBlock, styles.fieldBlockOverlay]}>
        <ThemedText style={[styles.labelTop, { color: colors.text }]}>Borrower Name *</ThemedText>
        <BorrowerNameInput
          value={borrowerInfo.borrowerName}
          onChangeText={handleBorrowerNameChange}
          placeholder="Enter borrower's full name"
          suggestions={getBorrowerNameSuggestions(borrowerInfo.borrowerName)}
          error={errors.borrowerName}
          helperText={isLoadingBorrower ? 'Loading borrower info...' : 'Select from existing borrowers or type a new name'}
        />
      </View>

      {/* Contact - labelTop + inputRounded */}
      <View style={styles.fieldBlock}>
        <ThemedText style={[styles.labelTop, { color: colors.text }]}>Contact Information</ThemedText>
        <TextInput
          style={[
            styles.inputRounded,
            {
              backgroundColor: colors.surface,
              borderColor: errors.borrowerContact ? colors.error : colors.border,
              color: colors.text,
            },
          ]}
          value={borrowerInfo.borrowerContact}
          onChangeText={(text) => updateBorrowerInfo('borrowerContact', text)}
          placeholder="Phone or email"
          placeholderTextColor={colors.text + '80'}
          keyboardType="email-address"
        />
        {errors.borrowerContact ? (
          <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.borrowerContact}</ThemedText>
        ) : (
          <ThemedText style={[styles.helperText, { color: colors.text + '80' }]}>Optional contact information</ThemedText>
        )}
      </View>

      {/* Department - labelTop + inputRounded */}
      <View style={styles.fieldBlock}>
        <ThemedText style={[styles.labelTop, { color: colors.text }]}>Department</ThemedText>
        <TextInput
          style={[
            styles.inputRounded,
            {
              backgroundColor: colors.surface,
              borderColor: errors.borrowerDepartment ? colors.error : colors.border,
              color: colors.text,
            },
          ]}
          value={borrowerInfo.borrowerDepartment}
          onChangeText={(text) => updateBorrowerInfo('borrowerDepartment', text)}
          placeholder="Department or team"
          placeholderTextColor={colors.text + '80'}
        />
        {errors.borrowerDepartment ? (
          <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.borrowerDepartment}</ThemedText>
        ) : (
          <ThemedText style={[styles.helperText, { color: colors.text + '80' }]}>Optional department or team name</ThemedText>
        )}
      </View>

      {/* Optional Photo - labelTop + helper + photo UI with pill buttons */}
      {showImagePicker && (
        <View style={styles.fieldBlock}>
          <ThemedText style={[styles.labelTop, { color: colors.text }]}>Borrower Photo</ThemedText>
          <ThemedText style={[styles.helperText, { color: colors.text + '80' }]}>
            Optional – Add a photo to help identify the borrower
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
                    style={[styles.photoActionPill, { backgroundColor: colors.primary }]}
                    onPress={() => setShowImageModal(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="camera" size={16} color="#fff" />
                    <ThemedText style={styles.photoActionText}>Change</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.photoActionPill, { backgroundColor: colors.error + '15', borderWidth: 1, borderColor: colors.error + '40' }]}
                    onPress={handleRemovePhoto}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <ThemedText style={[styles.photoActionTextSecondary, { color: colors.error }]}>Remove</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
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
  errorText: {
    fontSize: 12,
    marginTop: 6,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
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
    marginTop: 8,
  },
  photoActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  photoActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  photoActionTextSecondary: {
    fontSize: 14,
    fontWeight: '500',
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

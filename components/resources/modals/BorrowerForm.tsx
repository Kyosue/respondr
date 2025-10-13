import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { BorrowerNameInput } from '@/components/ui/BorrowerNameInput';
import { FormImagePicker, FormInput } from '@/components/ui/FormComponents';
import { useResources } from '@/contexts/ResourceContext';

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

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          <Ionicons name="person-outline" size={20} color="#007AFF" />
        </View>
        <ThemedText style={styles.sectionTitle}>Borrower Information</ThemedText>
      </View>
      
      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>
            Borrower Name
            <ThemedText style={styles.required}> *</ThemedText>
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

        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <FormInput
              label="Contact Information"
              value={borrowerInfo.borrowerContact}
              onChangeText={(text) => updateBorrowerInfo('borrowerContact', text)}
              placeholder="Phone or email"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.inputHalf}>
            <FormInput
              label="Department"
              value={borrowerInfo.borrowerDepartment}
              onChangeText={(text) => updateBorrowerInfo('borrowerDepartment', text)}
              placeholder="Department or team"
            />
          </View>
        </View>

        {showImagePicker && (
          <View style={styles.imagePickerContainer}>
            <FormImagePicker
              label="Borrower Photo"
              value={borrowerInfo.borrowerPicture}
              onImageChange={(uri) => updateBorrowerInfo('borrowerPicture', uri)}
              aspect={[1, 1]}
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
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputGroup: {
    marginBottom: 16,
    overflow: 'visible', // Allow suggestions to extend beyond the input group
    zIndex: 1000, // Ensure the input group has a high z-index
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },
  imagePickerContainer: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  required: {
    color: '#ff4444',
  },
});

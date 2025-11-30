import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { ImageSelectionModal } from '@/components/resources/modals/ImageSelectionModal';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  helperText?: string;
  error?: string;
}

export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  helperText,
  error,
}: FormInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.inputGroup}>
      <ThemedText style={styles.label}>
        {label} {required && <ThemedText style={[styles.required, { color: colors.error }]}>*</ThemedText>}
      </ThemedText>
      <TextInput
        style={[
          multiline ? styles.textArea : styles.input,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.inputBorder,
            color: colors.inputText,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text + '80'}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error && (
        <ThemedText style={[styles.errorText, { color: colors.error }]}>
          {error}
        </ThemedText>
      )}
      {helperText && !error && (
        <ThemedText style={[styles.helperText, { color: colors.text + '80' }]}>
          {helperText}
        </ThemedText>
      )}
    </View>
  );
}

interface FormDatePickerProps {
  label: string;
  value: Date;
  onDateChange: (date: Date) => void;
  minimumDate?: Date;
  required?: boolean;
}

export function FormDatePicker({
  label,
  value,
  onDateChange,
  minimumDate,
  required = false,
}: FormDatePickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  // Web-specific date input handler
  const handleWebDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newDate = new Date(e.target.value);
      onDateChange(newDate);
    }
  };

  return (
    <View style={styles.inputGroup}>
      <ThemedText style={styles.label}>
        {label} {required && <ThemedText style={[styles.required, { color: colors.error }]}>*</ThemedText>}
      </ThemedText>
      {Platform.OS === 'web' ? (
        <input
          type="date"
          value={value.toISOString().split('T')[0]}
          onChange={handleWebDateChange}
          min={minimumDate ? minimumDate.toISOString().split('T')[0] : undefined}
          style={{
            border: `1px solid ${colors.inputBorder}`,
            borderRadius: 8,
            padding: '12px',
            fontSize: 16,
            backgroundColor: colors.inputBackground,
            color: colors.inputText || colors.text,
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
      ) : (
        <>
      <TouchableOpacity
        style={[
          styles.dateButton,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
          },
        ]}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.text} />
        <ThemedText style={styles.dateText}>
          {value.toLocaleDateString()}
        </ThemedText>
      </TouchableOpacity>
      
      {showDatePicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
        />
          )}
        </>
      )}
    </View>
  );
}

interface FormImagePickerProps {
  label: string;
  value: string | null;
  onImageChange: (uri: string | null) => void;
  required?: boolean;
  aspect?: [number, number];
}

export function FormImagePicker({
  label,
  value,
  onImageChange,
  required = false,
  aspect = [1, 1],
}: FormImagePickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showImageModal, setShowImageModal] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect,
      quality: 0.8,
    });

    if (!result.canceled) {
      onImageChange(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect,
      quality: 0.8,
    });

    if (!result.canceled) {
      onImageChange(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    setShowImageModal(true);
  };

  return (
    <View style={styles.inputGroup}>
      <ThemedText style={styles.label}>
        {label} {required && <ThemedText style={[styles.required, { color: colors.error }]}>*</ThemedText>}
      </ThemedText>
      <TouchableOpacity
        style={[
          styles.imagePickerButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={showImageOptions}
      >
        {value ? (
          <Image source={{ uri: value }} style={styles.selectedImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera-outline" size={24} color={colors.text} />
            <ThemedText style={styles.imagePlaceholderText}>Tap to add photo</ThemedText>
          </View>
        )}
      </TouchableOpacity>
      
      <ImageSelectionModal
        visible={showImageModal}
        onClose={() => setShowImageModal(false)}
        onCameraPress={takePhoto}
        onLibraryPress={pickImage}
        maxImages={1}
      />
    </View>
  );
}

interface FormQuantityInputProps {
  label: string;
  value: number;
  onChangeValue: (value: number) => void;
  min?: number;
  max?: number;
  required?: boolean;
  helperText?: string;
  error?: string;
}

export function FormQuantityInput({
  label,
  value,
  onChangeValue,
  min = 1,
  max = 999,
  required = false,
  helperText,
  error,
}: FormQuantityInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [textValue, setTextValue] = useState(value.toString());

  // Update text value when prop value changes (e.g., from increment/decrement)
  React.useEffect(() => {
    setTextValue(value.toString());
  }, [value]);

  const handleIncrement = () => {
    if (value < max) {
      onChangeValue(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChangeValue(value - 1);
    }
  };

  const handleTextChange = (text: string) => {
    setTextValue(text);
    
    // Only update the actual value if it's a valid number
    if (text === '') {
      return;
    }
    
    const numValue = parseInt(text);
    if (isNaN(numValue)) {
      return;
    }
    
    const clampedValue = Math.max(min, Math.min(max, numValue));
    onChangeValue(clampedValue);
  };

  const handleBlur = () => {
    // On blur, ensure we have a valid value
    const numValue = parseInt(textValue);
    if (isNaN(numValue) || numValue < min) {
      onChangeValue(min);
    } else if (numValue > max) {
      onChangeValue(max);
    }
  };

  return (
    <View style={styles.inputGroup}>
      <ThemedText style={styles.label}>
        {label} {required && <ThemedText style={[styles.required, { color: colors.error }]}>*</ThemedText>}
      </ThemedText>
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={[
            styles.quantityButton,
            { backgroundColor: colors.primary },
            value <= min && { opacity: 0.5 },
          ]}
          onPress={handleDecrement}
          disabled={value <= min}
        >
          <Ionicons name="remove" size={16} color="#fff" />
        </TouchableOpacity>
         <TextInput
           style={[
             styles.quantityInput,
             {
               backgroundColor: colors.surface,
               borderColor: colors.border,
               color: colors.text,
             },
           ]}
           value={textValue}
           onChangeText={handleTextChange}
           onBlur={handleBlur}
           keyboardType="numeric"
           textAlign="center"
         />
        <TouchableOpacity
          style={[
            styles.quantityButton,
            { backgroundColor: colors.primary },
            value >= max && { opacity: 0.5 },
          ]}
          onPress={handleIncrement}
          disabled={value >= max}
        >
          <Ionicons name="add" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      {error && (
        <ThemedText style={[styles.errorText, { color: colors.error }]}>
          {error}
        </ThemedText>
      )}
      {helperText && !error && (
        <ThemedText style={[styles.helperText, { color: colors.text + '80' }]}>
          {helperText}
        </ThemedText>
      )}
    </View>
  );
}

interface FormButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function FormButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
}: FormButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getButtonColor = () => {
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.secondary;
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      default: return colors.primary;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getButtonColor(),
          opacity: disabled || loading ? 0.6 : 1,
          width: fullWidth ? '100%' : 'auto',
        },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <ThemedText style={styles.buttonText}>
        {loading ? 'Processing...' : title}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  required: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
  },
  imagePickerButton: {
    borderWidth: 1,
    borderRadius: 50,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  imagePlaceholderText: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 12,
    minWidth: 60,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

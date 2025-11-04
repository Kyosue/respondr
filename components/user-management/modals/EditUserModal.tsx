import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MobileModalSafeAreaWrapper, getMobileModalConfig } from '@/components/ui/MobileModalWrapper';
import { Colors } from '@/constants/Colors';
import { updateUser } from '@/firebase/auth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { UserData, UserStatus } from '@/types/UserData';
import { UserType } from '@/types/UserType';
import { generateDisplayName, validateFullName } from '@/utils/nameUtils';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { styles } from './EditUserModal.styles';

interface EditUserModalProps {
  user: UserData | null;
  visible: boolean;
  onClose: () => void;
  onUserUpdated?: () => void;
}

export function EditUserModal({ user, visible, onClose, onUserUpdated }: EditUserModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose } = useHybridRamp({ visible, onClose });
  const screenWidth = Dimensions.get('window').width;
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<UserType>('operator');
  const [status, setStatus] = useState<UserStatus>('active');
  const [isLoading, setIsLoading] = useState(false);
  
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  
  const [isFocused, setIsFocused] = useState({ 
    fullName: false, 
    email: false, 
    userType: false,
    status: false
  });
  
  // Animation values
  const [buttonScale] = useState(new Animated.Value(1));

// Initialize form when user changes
useEffect(() => {
  if (user) {
    setFullName(user.fullName);
    setEmail(user.email);
    setUserType(user.userType);
    setStatus(user.status || 'active'); // Default to 'active' if status is undefined
    setFullNameError('');
    setEmailError('');
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user, visible]);

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Clear previous errors
    setFullNameError('');
    setEmailError('');

    // Validate full name using utility function
    const nameValidation = validateFullName(fullName);
    if (!nameValidation.isValid) {
      setFullNameError(nameValidation.error || 'Invalid full name');
      isValid = false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }


    return isValid;
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (validateForm()) {
      setIsLoading(true);
      try {
        const displayName = generateDisplayName(fullName.trim());
        await updateUser(user.id, {
          fullName: fullName.trim(),
          displayName: displayName,
          email: email.trim(),
          userType,
          status
        });
        
        // Notify parent component
        onUserUpdated?.();
        
        // Close modal
        onClose();
        
        Alert.alert('Success', 'User updated successfully');
      } catch (error) {
        console.error('Error updating user:', error);
        Alert.alert('Error', 'Failed to update user. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleModalClose = () => {
    // Reset form when closing
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
      setUserType(user.userType);
      setStatus(user.status || 'active'); // Default to 'active' if status is undefined
    }
    setFullNameError('');
    setEmailError('');
    handleClose();
  };

  const handleFullNameChange = (text: string) => {
    setFullName(text);
    if (fullNameError) setFullNameError('');
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
  };

  // Handle button press animation
  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType={isWeb ? 'none' : 'slide'}
      transparent={isWeb}
      presentationStyle={isWeb ? 'overFullScreen' : getMobileModalConfig().presentationStyle}
      onRequestClose={handleModalClose}
    >
      {isWeb ? (
        // Web: Animated backdrop and modal
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={handleModalClose} />
        </Animated.View>
      ) : null}

      <Animated.View
        style={[
          isWeb ? styles.webPanelContainer : styles.mobilePanelContainer,
          isWeb && { transform: [{ scale: scaleAnim }, { translateY: slideAnim }] },
        ]}
      >
        {isWeb ? (
          // Web: Desktop/Web layout
          <ThemedView style={[styles.container, styles.webPanel]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <TouchableOpacity style={styles.closeButton} onPress={handleModalClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <ThemedText style={styles.headerTitle}>Edit User</ThemedText>
              <View style={styles.headerSpacer} />
            </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Full Name</ThemedText>
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={isFocused.fullName ? colors.primary : colors.icon} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.inputBackground,
                      borderColor: isFocused.fullName ? colors.primary : fullNameError ? colors.error : colors.inputBorder,
                      color: colors.inputText,
                      paddingLeft: 48,
                    }
                  ]}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.disabledText}
                  value={fullName}
                  onChangeText={handleFullNameChange}
                  editable={!isLoading}
                  onFocus={() => setIsFocused({...isFocused, fullName: true})}
                  onBlur={() => setIsFocused({...isFocused, fullName: false})}
                />
              </View>
              {fullNameError ? (
                <ThemedText style={[styles.errorText, { color: colors.error }]}>
                  {fullNameError}
                </ThemedText>
              ) : null}
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={isFocused.email ? colors.primary : colors.icon} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.inputBackground,
                      borderColor: isFocused.email ? colors.primary : emailError ? colors.error : colors.inputBorder,
                      color: colors.inputText,
                      paddingLeft: 48,
                    }
                  ]}
                  placeholder="Enter email address"
                  placeholderTextColor={colors.disabledText}
                  value={email}
                  onChangeText={handleEmailChange}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                  onFocus={() => setIsFocused({...isFocused, email: true})}
                  onBlur={() => setIsFocused({...isFocused, email: false})}
                />
              </View>
              {emailError ? (
                <ThemedText style={[styles.errorText, { color: colors.error }]}>
                  {emailError}
                </ThemedText>
              ) : null}
            </View>


            {/* User Type Picker */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>User Type</ThemedText>
              <View style={[
                styles.inputWrapper,
                styles.pickerWrapper, 
                { 
                  backgroundColor: colors.inputBackground,
                  borderColor: isFocused.userType ? colors.primary : colors.inputBorder,
                }
              ]}>
                <Ionicons 
                  name="people-outline" 
                  size={20} 
                  color={isFocused.userType ? colors.primary : colors.icon} 
                  style={styles.inputIcon} 
                />
                <Picker
                  selectedValue={userType}
                  onValueChange={(itemValue: UserType) => setUserType(itemValue)}
                  style={[
                    styles.picker, 
                    { 
                      color: colors.inputText,
                    }
                  ]}
                  dropdownIconColor={isFocused.userType ? colors.primary : colors.icon}
                  enabled={!isLoading}
                  mode="dropdown"
                  onFocus={() => setIsFocused({...isFocused, userType: true})}
                  onBlur={() => setIsFocused({...isFocused, userType: false})}
                >
                  <Picker.Item label="Admin" value="admin" />
                  <Picker.Item label="Supervisor" value="supervisor" />
                  <Picker.Item label="Operator" value="operator" />
                </Picker>
              </View>
            </View>

            {/* Status Picker */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Status</ThemedText>
              <View style={[
                styles.inputWrapper,
                styles.pickerWrapper, 
                { 
                  backgroundColor: colors.inputBackground,
                  borderColor: isFocused.status ? colors.primary : colors.inputBorder,
                }
              ]}>
                <Ionicons 
                  name="checkmark-circle-outline" 
                  size={20} 
                  color={isFocused.status ? colors.primary : colors.icon} 
                  style={styles.inputIcon} 
                />
                <Picker
                  selectedValue={status}
                  onValueChange={(itemValue: UserStatus) => setStatus(itemValue)}
                  style={[
                    styles.picker, 
                    { 
                      color: colors.inputText,
                    }
                  ]}
                  dropdownIconColor={isFocused.status ? colors.primary : colors.icon}
                  enabled={!isLoading}
                  mode="dropdown"
                  onFocus={() => setIsFocused({...isFocused, status: true})}
                  onBlur={() => setIsFocused({...isFocused, status: false})}
                >
                  <Picker.Item label="Active" value="active" />
                  <Picker.Item label="Inactive" value="inactive" />
                  <Picker.Item label="Suspended" value="suspended" />
                </Picker>
              </View>
            </View>

            <TouchableOpacity
              style={[{ transform: [{ scale: buttonScale }] }]}
              onPress={handleSubmit}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              <Animated.View
                style={[
                  styles.button,
                  { 
                    backgroundColor: isLoading ? colors.disabledButton : colors.primary,
                    shadowColor: colors.shadow,
                  }
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.buttonText} size="small" />
                ) : (
                  <>
                    <ThemedText style={[styles.buttonText, { color: colors.buttonText }]}>
                      Update User
                    </ThemedText>
                    <Ionicons name="checkmark" size={20} color={colors.buttonText} style={styles.buttonIcon} />
                  </>
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
        ) : (
          // Mobile: Native modal with safe area wrapper
          <MobileModalSafeAreaWrapper>
            <KeyboardAvoidingView
              style={styles.mobileContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              {/* Mobile Header */}
              <View style={[styles.mobileHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity style={styles.mobileCloseButton} onPress={handleModalClose}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <ThemedText style={[styles.mobileTitle, { color: colors.text }]}>
                  Edit User
                </ThemedText>
                <View style={styles.mobileHeaderSpacer} />
              </View>
              
              <ScrollView 
                style={styles.mobileScrollView}
                contentContainerStyle={styles.mobileContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.form}>
                  {/* Full Name Input */}
                  <View style={styles.inputContainer}>
                    <ThemedText style={styles.label}>Full Name</ThemedText>
                    <View style={styles.inputWrapper}>
                      <Ionicons 
                        name="person-outline" 
                        size={20} 
                        color={isFocused.fullName ? colors.primary : colors.icon} 
                        style={styles.inputIcon} 
                      />
                      <TextInput
                        style={[
                          styles.input,
                          { 
                            backgroundColor: colors.inputBackground,
                            borderColor: isFocused.fullName ? colors.primary : fullNameError ? colors.error : colors.inputBorder,
                            color: colors.inputText,
                            paddingLeft: 48,
                          }
                        ]}
                        placeholder="Enter full name"
                        placeholderTextColor={colors.disabledText}
                        value={fullName}
                        onChangeText={handleFullNameChange}
                        editable={!isLoading}
                        onFocus={() => setIsFocused({...isFocused, fullName: true})}
                        onBlur={() => setIsFocused({...isFocused, fullName: false})}
                      />
                    </View>
                    {fullNameError ? (
                      <ThemedText style={[styles.errorText, { color: colors.error }]}>
                        {fullNameError}
                      </ThemedText>
                    ) : null}
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <ThemedText style={styles.label}>Email</ThemedText>
                    <View style={styles.inputWrapper}>
                      <Ionicons 
                        name="mail-outline" 
                        size={20} 
                        color={isFocused.email ? colors.primary : colors.icon} 
                        style={styles.inputIcon} 
                      />
                      <TextInput
                        style={[
                          styles.input,
                          { 
                            backgroundColor: colors.inputBackground,
                            borderColor: isFocused.email ? colors.primary : emailError ? colors.error : colors.inputBorder,
                            color: colors.inputText,
                            paddingLeft: 48,
                          }
                        ]}
                        placeholder="Enter email address"
                        placeholderTextColor={colors.disabledText}
                        value={email}
                        onChangeText={handleEmailChange}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!isLoading}
                        onFocus={() => setIsFocused({...isFocused, email: true})}
                        onBlur={() => setIsFocused({...isFocused, email: false})}
                      />
                    </View>
                    {emailError ? (
                      <ThemedText style={[styles.errorText, { color: colors.error }]}>
                        {emailError}
                      </ThemedText>
                    ) : null}
                  </View>

                  {/* User Type Picker */}
                  <View style={styles.inputContainer}>
                    <ThemedText style={styles.label}>User Type</ThemedText>
                    <View style={[
                      styles.inputWrapper,
                      styles.pickerWrapper, 
                      { 
                        backgroundColor: colors.inputBackground,
                        borderColor: isFocused.userType ? colors.primary : colors.inputBorder,
                      }
                    ]}>
                      <Ionicons 
                        name="people-outline" 
                        size={20} 
                        color={isFocused.userType ? colors.primary : colors.icon} 
                        style={styles.inputIcon} 
                      />
                      <Picker
                        selectedValue={userType}
                        onValueChange={(itemValue: UserType) => setUserType(itemValue)}
                        style={[
                          styles.picker, 
                          { 
                            color: colors.inputText,
                          }
                        ]}
                        dropdownIconColor={isFocused.userType ? colors.primary : colors.icon}
                        enabled={!isLoading}
                        mode="dropdown"
                        onFocus={() => setIsFocused({...isFocused, userType: true})}
                        onBlur={() => setIsFocused({...isFocused, userType: false})}
                      >
                        <Picker.Item label="Admin" value="admin" />
                        <Picker.Item label="Supervisor" value="supervisor" />
                        <Picker.Item label="Operator" value="operator" />
                      </Picker>
                    </View>
                  </View>

                  {/* Status Picker */}
                  <View style={styles.inputContainer}>
                    <ThemedText style={styles.label}>Status</ThemedText>
                    <View style={[
                      styles.inputWrapper,
                      styles.pickerWrapper, 
                      { 
                        backgroundColor: colors.inputBackground,
                        borderColor: isFocused.status ? colors.primary : colors.inputBorder,
                      }
                    ]}>
                      <Ionicons 
                        name="checkmark-circle-outline" 
                        size={20} 
                        color={isFocused.status ? colors.primary : colors.icon} 
                        style={styles.inputIcon} 
                      />
                      <Picker
                        selectedValue={status}
                        onValueChange={(itemValue: UserStatus) => setStatus(itemValue)}
                        style={[
                          styles.picker, 
                          { 
                            color: colors.inputText,
                          }
                        ]}
                        dropdownIconColor={isFocused.status ? colors.primary : colors.icon}
                        enabled={!isLoading}
                        mode="dropdown"
                        onFocus={() => setIsFocused({...isFocused, status: true})}
                        onBlur={() => setIsFocused({...isFocused, status: false})}
                      >
                        <Picker.Item label="Active" value="active" />
                        <Picker.Item label="Inactive" value="inactive" />
                        <Picker.Item label="Suspended" value="suspended" />
                      </Picker>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[{ transform: [{ scale: buttonScale }] }]}
                    onPress={handleSubmit}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isLoading}
                    activeOpacity={0.9}
                  >
                    <Animated.View
                      style={[
                        styles.button,
                        { 
                          backgroundColor: isLoading ? colors.disabledButton : colors.primary,
                          shadowColor: colors.shadow,
                        }
                      ]}
                    >
                      {isLoading ? (
                        <ActivityIndicator color={colors.buttonText} size="small" />
                      ) : (
                        <>
                          <ThemedText style={[styles.buttonText, { color: colors.buttonText }]}>
                            Update User
                          </ThemedText>
                          <Ionicons name="checkmark" size={20} color={colors.buttonText} style={styles.buttonIcon} />
                        </>
                      )}
                    </Animated.View>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </MobileModalSafeAreaWrapper>
        )}
      </Animated.View>
    </Modal>
  );
}

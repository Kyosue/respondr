import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSignup } from '@/hooks/useSignup';
import { UserType } from '@/types/UserType';
import { generateDisplayName, validateFullName } from '@/utils/nameUtils';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Modal,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { styles } from './AddUserModal.styles';

interface AddUserModalProps {
  visible: boolean;
  onClose: () => void;
  onUserAdded?: () => void;
}

export function AddUserModal({ visible, onClose, onUserAdded }: AddUserModalProps) {
  const { signup, isLoading, error } = useSignup();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('admin');
  // Status is always 'active' for new users - no need to make it selectable
  
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const [isFocused, setIsFocused] = useState({ 
    fullName: false, 
    email: false, 
    password: false, 
    confirmPassword: false,
    userType: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // Animation values
  const [buttonScale] = useState(new Animated.Value(1));

  // Calculate password strength
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  // Real-time password strength update
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);


  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 2) return '#EF4444';
    if (strength <= 4) return '#F59E0B';
    return '#10B981';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 2) return 'Weak';
    if (strength <= 4) return 'Medium';
    return 'Strong';
  };

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Clear previous errors
    setFullNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

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


    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (!passwordRegex.test(password)) {
      setPasswordError('Password must be at least 6 characters and include uppercase, lowercase, number, and special character');
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        const displayName = generateDisplayName(fullName.trim());
        const success = await signup(fullName.trim(), displayName, email.trim(), password, userType, 'active');
        if (success) {
          // Reset form
          setFullName('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setUserType('admin');
          setFullNameError('');
          setEmailError('');
          setPasswordError('');
          setConfirmPasswordError('');
          setPasswordStrength(0);
          
          // Notify parent component
          onUserAdded?.();
          
          // Close modal
          onClose();
        }
      } catch (err) {
        console.error('Error during user creation:', err);
      }
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUserType('admin');
    setFullNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setPasswordStrength(0);
    onClose();
  };

  const handleFullNameChange = (text: string) => {
    setFullName(text);
    if (fullNameError) setFullNameError('');
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError('');
    if (confirmPasswordError && text === confirmPassword) {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordError) setConfirmPasswordError('');
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Add New User</ThemedText>
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


            {/* Password Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={isFocused.password ? colors.primary : colors.icon} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.inputBackground,
                      borderColor: isFocused.password ? colors.primary : passwordError ? colors.error : colors.inputBorder,
                      color: colors.inputText,
                      paddingLeft: 48,
                      paddingRight: 48,
                    }
                  ]}
                  placeholder="Enter password"
                  placeholderTextColor={colors.disabledText}
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                  onFocus={() => setIsFocused({...isFocused, password: true})}
                  onBlur={() => setIsFocused({...isFocused, password: false})}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.icon} 
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <ThemedText style={[styles.errorText, { color: colors.error }]}>
                  {passwordError}
                </ThemedText>
              ) : password.length > 0 ? (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBar}>
                    {[1, 2, 3, 4, 5, 6].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.passwordStrengthSegment,
                          {
                            backgroundColor: level <= passwordStrength 
                              ? getPasswordStrengthColor(passwordStrength) 
                              : colors.border
                          }
                        ]}
                      />
                    ))}
                  </View>
                  <ThemedText style={[styles.passwordStrengthText, { color: getPasswordStrengthColor(passwordStrength) }]}>
                    {getPasswordStrengthText(passwordStrength)}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Confirm Password</ThemedText>
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={isFocused.confirmPassword ? colors.primary : colors.icon} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.inputBackground,
                      borderColor: isFocused.confirmPassword ? colors.primary : confirmPasswordError ? colors.error : colors.inputBorder,
                      color: colors.inputText,
                      paddingLeft: 48,
                      paddingRight: 48,
                    }
                  ]}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.disabledText}
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                  onFocus={() => setIsFocused({...isFocused, confirmPassword: true})}
                  onBlur={() => setIsFocused({...isFocused, confirmPassword: false})}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.icon} 
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <ThemedText style={[styles.errorText, { color: colors.error }]}>
                  {confirmPasswordError}
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


            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20`, borderColor: `${colors.error}40` }]}>
                <ThemedText style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </ThemedText>
              </View>
            ) : null}

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
                      Add User
                    </ThemedText>
                    <Ionicons name="person-add" size={20} color={colors.buttonText} style={styles.buttonIcon} />
                  </>
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

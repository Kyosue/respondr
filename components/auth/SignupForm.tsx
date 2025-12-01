import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { generateDisplayName, validateFullName } from '@/utils/nameUtils';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface SignupFormProps {
  onSubmit: (fullName: string, displayName: string, username: string, email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function SignupForm({ onSubmit, isLoading, error }: SignupFormProps) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [fullNameError, setFullNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const [isFocused, setIsFocused] = useState({ 
    fullName: false, 
    username: false,
    email: false, 
    password: false, 
    confirmPassword: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Animation values
  const [buttonScale] = useState(new Animated.Value(1));
  
  // Refs for inputs
  const usernameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  
  // Check if passwords match (only when both have values and no errors)
  const passwordsMatch = password.length > 0 && 
                          confirmPassword.length > 0 && 
                          password === confirmPassword && 
                          !passwordError && 
                          !confirmPasswordError;

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Clear previous errors
    setFullNameError('');
    setUsernameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate full name using utility function
    const nameValidation = validateFullName(fullName);
    if (!nameValidation.isValid) {
      setFullNameError(nameValidation.error || 'Invalid full name');
      isValid = false;
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (!usernameRegex.test(username.trim())) {
      setUsernameError('Username must be 3-20 characters and contain only letters, numbers, and underscores');
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
        // Submit the form - validation will be handled in the backend
        const displayName = generateDisplayName(fullName.trim());
        await onSubmit(fullName.trim(), displayName, username.trim().toLowerCase(), email.trim(), password);
      } catch (err) {
        console.error('Error during signup:', err);
      }
    }
  };

  const handleFullNameChange = (text: string) => {
    setFullName(text);
    if (fullNameError) setFullNameError('');
  };

  const handleUsernameChange = (text: string) => {
    // Convert to lowercase and remove spaces
    const cleaned = text.toLowerCase().replace(/\s/g, '');
    setUsername(cleaned);
    if (usernameError) setUsernameError('');
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
  };


  // Password validation checks
  const passwordChecks = {
    minLength: password.length >= 6,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[@$!%*?&]/.test(password),
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
    <View style={styles.container}>
      <View style={styles.form}>
        <View>
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
              placeholder="Enter your full name"
              placeholderTextColor={colors.disabledText}
              value={fullName}
              onChangeText={handleFullNameChange}
              editable={!isLoading}
              onFocus={() => setIsFocused({...isFocused, fullName: true})}
              onBlur={() => setIsFocused({...isFocused, fullName: false})}
              returnKeyType="next"
              onSubmitEditing={() => usernameInputRef.current?.focus()}
            />
          </View>
          {fullNameError ? (
            <ThemedText style={[styles.errorText, { color: colors.error }]}>
              {fullNameError}
            </ThemedText>
          ) : null}
        </View>

        {/* Username Input */}
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Username</ThemedText>
          <View style={styles.inputWrapper}>
            <Ionicons 
              name="at-outline" 
              size={20} 
              color={isFocused.username ? colors.primary : colors.icon} 
              style={styles.inputIcon} 
            />
            <TextInput
              ref={usernameInputRef}
              style={[
                styles.input,
                { 
                  backgroundColor: colors.inputBackground,
                  borderColor: isFocused.username ? colors.primary : usernameError ? colors.error : colors.inputBorder,
                  color: colors.inputText,
                  paddingLeft: 48,
                }
              ]}
              placeholder="Choose a username"
              placeholderTextColor={colors.disabledText}
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              onFocus={() => setIsFocused({...isFocused, username: true})}
              onBlur={() => setIsFocused({...isFocused, username: false})}
              returnKeyType="next"
              onSubmitEditing={() => emailInputRef.current?.focus()}
            />
          </View>
          {usernameError ? (
            <ThemedText style={[styles.errorText, { color: colors.error }]}>
              {usernameError}
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
              ref={emailInputRef}
              style={[
                styles.input,
                { 
                  backgroundColor: colors.inputBackground,
                  borderColor: isFocused.email ? colors.primary : emailError ? colors.error : colors.inputBorder,
                  color: colors.inputText,
                  paddingLeft: 48,
                }
              ]}
              placeholder="Enter your email"
              placeholderTextColor={colors.disabledText}
              value={email}
              onChangeText={handleEmailChange}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
              onFocus={() => setIsFocused({...isFocused, email: true})}
              onBlur={() => setIsFocused({...isFocused, email: false})}
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
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
              ref={passwordInputRef}
              style={[
                styles.input,
                { 
                  backgroundColor: colors.inputBackground,
                  borderColor: passwordError 
                    ? colors.error 
                    : passwordsMatch 
                      ? '#10b981' // Green color when passwords match
                      : isFocused.password 
                        ? colors.primary 
                        : colors.inputBorder,
                  color: colors.inputText,
                  paddingLeft: 48,
                  paddingRight: 48,
                }
              ]}
              placeholder="Enter your password"
              placeholderTextColor={colors.disabledText}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
              onFocus={() => setIsFocused({...isFocused, password: true})}
              onBlur={() => setIsFocused({...isFocused, password: false})}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
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
          ) : null}
          
          {/* Password Requirements Checker */}
          {password.length > 0 && (
            <View style={styles.passwordRequirements}>
              <ThemedText style={[styles.requirementsTitle, { color: colors.text, opacity: 0.7 }]}>
                Password must contain:
              </ThemedText>
              <View style={styles.requirementItem}>
                <Ionicons 
                  name={passwordChecks.minLength ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={passwordChecks.minLength ? '#10b981' : colors.text} 
                  style={{ opacity: passwordChecks.minLength ? 1 : 0.5 }}
                />
                <ThemedText style={[
                  styles.requirementText, 
                  { 
                    color: passwordChecks.minLength ? '#10b981' : colors.text,
                    opacity: passwordChecks.minLength ? 1 : 0.6
                  }
                ]}>
                  At least 6 characters
                </ThemedText>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons 
                  name={passwordChecks.hasUpperCase ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={passwordChecks.hasUpperCase ? '#10b981' : colors.text} 
                  style={{ opacity: passwordChecks.hasUpperCase ? 1 : 0.5 }}
                />
                <ThemedText style={[
                  styles.requirementText, 
                  { 
                    color: passwordChecks.hasUpperCase ? '#10b981' : colors.text,
                    opacity: passwordChecks.hasUpperCase ? 1 : 0.6
                  }
                ]}>
                  One uppercase letter
                </ThemedText>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons 
                  name={passwordChecks.hasLowerCase ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={passwordChecks.hasLowerCase ? '#10b981' : colors.text} 
                  style={{ opacity: passwordChecks.hasLowerCase ? 1 : 0.5 }}
                />
                <ThemedText style={[
                  styles.requirementText, 
                  { 
                    color: passwordChecks.hasLowerCase ? '#10b981' : colors.text,
                    opacity: passwordChecks.hasLowerCase ? 1 : 0.6
                  }
                ]}>
                  One lowercase letter
                </ThemedText>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons 
                  name={passwordChecks.hasNumber ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={passwordChecks.hasNumber ? '#10b981' : colors.text} 
                  style={{ opacity: passwordChecks.hasNumber ? 1 : 0.5 }}
                />
                <ThemedText style={[
                  styles.requirementText, 
                  { 
                    color: passwordChecks.hasNumber ? '#10b981' : colors.text,
                    opacity: passwordChecks.hasNumber ? 1 : 0.6
                  }
                ]}>
                  One number
                </ThemedText>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons 
                  name={passwordChecks.hasSpecialChar ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={passwordChecks.hasSpecialChar ? '#10b981' : colors.text} 
                  style={{ opacity: passwordChecks.hasSpecialChar ? 1 : 0.5 }}
                />
                <ThemedText style={[
                  styles.requirementText, 
                  { 
                    color: passwordChecks.hasSpecialChar ? '#10b981' : colors.text,
                    opacity: passwordChecks.hasSpecialChar ? 1 : 0.6
                  }
                ]}>
                  One special character (@$!%*?&)
                </ThemedText>
              </View>
            </View>
          )}
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
              ref={confirmPasswordInputRef}
              style={[
                styles.input,
                { 
                  backgroundColor: colors.inputBackground,
                  borderColor: confirmPasswordError 
                    ? colors.error 
                    : passwordsMatch 
                      ? '#10b981' // Green color when passwords match
                      : isFocused.confirmPassword 
                        ? colors.primary 
                        : colors.inputBorder,
                  color: colors.inputText,
                  paddingLeft: 48,
                  paddingRight: 48,
                }
              ]}
              placeholder="Confirm your password"
              placeholderTextColor={colors.disabledText}
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!isLoading}
              onFocus={() => setIsFocused({...isFocused, confirmPassword: true})}
              onBlur={() => setIsFocused({...isFocused, confirmPassword: false})}
              onSubmitEditing={handleSubmit}
              returnKeyType="go"
              blurOnSubmit={false}
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
                  Sign Up
                </ThemedText>
                <Ionicons name="arrow-forward" size={20} color={colors.buttonText} style={styles.buttonIcon} />
              </>
            )}
          </Animated.View>
        </TouchableOpacity>
        </View>
        
        {/* Footer with login link - moved inside form */}
        <View style={styles.footerContainer}>
          <ThemedText style={styles.footerText}>
            Already have an account?
          </ThemedText>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <ThemedText style={[styles.linkText, { color: colors.primary }]}>
                Sign In
              </ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const inputWidth = Math.min(width - 40, 400);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  form: {
    width: inputWidth,
    maxWidth: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 15,
    zIndex: 1,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 15,
    zIndex: 1,
  },
  errorText: {
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    flexDirection: 'row',
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 15,
    marginRight: 6,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
  },
  passwordRequirements: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
    flex: 1,
  },
});

import { ThemedText } from '@/components/ThemedText';
import { MobileModalSafeAreaWrapper, getMobileModalConfig } from '@/components/ui/MobileModalWrapper';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { styles } from './PasswordVerificationModal.styles';

interface PasswordVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (password: string) => Promise<void>;
  title?: string;
  message?: string;
  userFullName?: string;
}

export function PasswordVerificationModal({
  visible,
  onClose,
  onVerify,
  title = 'Verify Password',
  message = 'Please enter your password to confirm this action',
  userFullName
}: PasswordVerificationModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hybrid RAMP hook - handles platform detection and animations
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose } = useHybridRamp({ visible, onClose });
  
  const screenWidth = Dimensions.get('window').width;

  const handleVerify = async () => {
    if (!password.trim()) {
      setError('Password is required');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await onVerify(password);
      // Reset form on success
      setPassword('');
      setError(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPassword('');
    setError(null);
    handleClose();
  };
  
  const handleModalClose = () => {
    setPassword('');
    setError(null);
    handleClose();
  };

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
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={handleModalClose}
          />
          <KeyboardAvoidingView
            style={styles.overlay}
            behavior="padding"
          >
            <Animated.View
              style={[
                styles.modal,
                styles.webModal,
                { 
                  backgroundColor: colors.background, 
                  borderColor: colors.border,
                  transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
                  maxWidth: Math.min(480, screenWidth - 40),
                }
              ]}
            >
            {/* Header with icon and gradient */}
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
              <View style={styles.headerContent}>
                <View style={[styles.iconContainer, { backgroundColor: '#EF4444' + '20' }]}>
                  <Ionicons name="shield-checkmark" size={28} color="#EF4444" />
                </View>
                <View style={styles.headerText}>
                  <ThemedText style={[styles.title, { color: colors.text }]}>
                    {title}
                  </ThemedText>
                  <ThemedText style={[styles.subtitle, { color: colors.text + '80' }]}>
                    Security verification required
                  </ThemedText>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.border + '30' }]}
                onPress={handleModalClose}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              {/* Warning message */}
              <View style={[styles.warningContainer, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                <Ionicons name="warning" size={20} color="#F59E0B" />
                <ThemedText style={[styles.warningText, { color: '#92400E' }]}>
                  This action cannot be undone
                </ThemedText>
              </View>

              <ThemedText style={[styles.message, { color: colors.text }]}>
                {message}
              </ThemedText>
              
              {userFullName && (
                <View style={[styles.userInfoContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="person" size={16} color={colors.primary} />
                  <ThemedText style={[styles.userName, { color: colors.primary }]}>
                    Deleting: {userFullName}
                  </ThemedText>
                </View>
              )}

              <View style={styles.inputContainer}>
                <ThemedText style={[styles.label, { color: colors.text }]}>
                  Your Password
                </ThemedText>
                <View style={[
                  styles.passwordInput, 
                  { 
                    borderColor: error ? '#EF4444' : colors.border,
                    backgroundColor: colors.surface
                  }
                ]}>
                  <Ionicons 
                    name="lock-closed" 
                    size={20} 
                    color={colors.text + '60'} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError(null);
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.text + '60'}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.text + '60'}
                    />
                  </TouchableOpacity>
                </View>
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <ThemedText style={styles.errorText}>
                      {error}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.cancelButton, 
                  { 
                    borderColor: colors.border,
                    backgroundColor: colors.surface
                  }
                ]}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Ionicons name="close" size={18} color={colors.text} />
                <ThemedText style={[styles.buttonText, { color: colors.text }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  { backgroundColor: '#EF4444' },
                  isLoading && styles.disabledButton
                ]}
                onPress={handleVerify}
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="trash" size={18} color="white" />
                    <ThemedText style={styles.confirmButtonText}>
                      Verify & Delete
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      ) : (
        // Mobile: Native modal with safe area wrapper
        <MobileModalSafeAreaWrapper>
          <KeyboardAvoidingView
            style={styles.mobileContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={[styles.mobileHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.mobileCloseButton}
                onPress={handleModalClose}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <ThemedText style={[styles.mobileTitle, { color: colors.text }]}>
                {title}
              </ThemedText>
              <View style={styles.mobileHeaderSpacer} />
            </View>
            
            <ScrollView 
              style={styles.mobileScrollView}
              contentContainerStyle={styles.mobileContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Warning message */}
              <View style={[styles.warningContainer, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                <Ionicons name="warning" size={20} color="#F59E0B" />
                <ThemedText style={[styles.warningText, { color: '#92400E' }]}>
                  This action cannot be undone
                </ThemedText>
              </View>

              <ThemedText style={[styles.message, { color: colors.text }]}>
                {message}
              </ThemedText>
              
              {userFullName && (
                <View style={[styles.userInfoContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="person" size={16} color={colors.primary} />
                  <ThemedText style={[styles.userName, { color: colors.primary }]}>
                    Deleting: {userFullName}
                  </ThemedText>
                </View>
              )}

              <View style={styles.inputContainer}>
                <ThemedText style={[styles.label, { color: colors.text }]}>
                  Your Password
                </ThemedText>
                <View style={[
                  styles.passwordInput, 
                  { 
                    borderColor: error ? '#EF4444' : colors.border,
                    backgroundColor: colors.surface
                  }
                ]}>
                  <Ionicons 
                    name="lock-closed" 
                    size={20} 
                    color={colors.text + '60'} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError(null);
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.text + '60'}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.text + '60'}
                    />
                  </TouchableOpacity>
                </View>
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <ThemedText style={styles.errorText}>
                      {error}
                    </ThemedText>
                  </View>
                )}
              </View>
            </ScrollView>
            
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.cancelButton, 
                  { 
                    borderColor: colors.border,
                    backgroundColor: colors.surface
                  }
                ]}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Ionicons name="close" size={18} color={colors.text} />
                <ThemedText style={[styles.buttonText, { color: colors.text }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  { backgroundColor: '#EF4444' },
                  isLoading && styles.disabledButton
                ]}
                onPress={handleVerify}
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="trash" size={18} color="white" />
                    <ThemedText style={styles.confirmButtonText}>
                      Verify & Delete
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </MobileModalSafeAreaWrapper>
      )}
    </Modal>
  );
}

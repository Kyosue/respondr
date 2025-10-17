import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
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
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  // Animation effects
  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

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

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={handleClose}
          />
          <Animated.View
            style={[
              styles.modal,
              { 
                backgroundColor: colors.background, 
                borderColor: colors.border,
                transform: [{ scale: scaleAnim }]
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
                onPress={handleClose}
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
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

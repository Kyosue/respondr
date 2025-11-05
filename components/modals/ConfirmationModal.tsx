import { Ionicons } from '@expo/vector-icons';
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export type ConfirmationVariant = 'danger' | 'warning' | 'info';

interface ConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  variant?: ConfirmationVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
}

export function ConfirmationModal({
  visible,
  onConfirm,
  onCancel,
  title,
  message,
  variant = 'danger',
  confirmLabel,
  cancelLabel = 'Cancel',
  icon,
  loading = false,
}: ConfirmationModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Determine colors and icon based on variant
  const getVariantConfig = () => {
    switch (variant) {
      case 'danger':
        // Red for delete/destructive actions
        return {
          color: colors.error,
          defaultIcon: 'warning' as keyof typeof Ionicons.glyphMap,
          defaultConfirmLabel: 'Delete',
        };
      case 'warning':
        // Green for confirmations
        return {
          color: colors.success,
          defaultIcon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
          defaultConfirmLabel: 'Confirm',
        };
      case 'info':
        // Blue for neutral/informational actions
        return {
          color: colors.primary,
          defaultIcon: 'information-circle' as keyof typeof Ionicons.glyphMap,
          defaultConfirmLabel: 'Confirm',
        };
      default:
        return {
          color: colors.error,
          defaultIcon: 'warning' as keyof typeof Ionicons.glyphMap,
          defaultConfirmLabel: 'Confirm',
        };
    }
  };

  const variantConfig = getVariantConfig();
  const iconName = icon || variantConfig.defaultIcon;
  const confirmButtonLabel = confirmLabel || variantConfig.defaultConfirmLabel;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <SafeAreaView style={styles.container}>
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${variantConfig.color}15` },
              ]}
            >
              <Ionicons
                name={iconName}
                size={32}
                color={variantConfig.color}
              />
            </View>

            {/* Title */}
            <ThemedText type="subtitle" style={styles.title}>
              {title}
            </ThemedText>

            {/* Message */}
            <ThemedText style={[styles.message, { color: colors.text, opacity: 0.7 }]}>
              {message}
            </ThemedText>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  { borderColor: colors.border },
                  loading && styles.buttonDisabled,
                ]}
                onPress={onCancel}
                activeOpacity={0.7}
                disabled={loading}
              >
                <ThemedText style={[styles.buttonText, { color: colors.text }]}>
                  {cancelLabel}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  { backgroundColor: variantConfig.color },
                  loading && styles.buttonDisabled,
                ]}
                onPress={onConfirm}
                activeOpacity={0.8}
                disabled={loading}
              >
                <ThemedText style={[styles.buttonText, { color: 'white' }]}>
                  {loading ? 'Processing...' : confirmButtonLabel}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  container: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});


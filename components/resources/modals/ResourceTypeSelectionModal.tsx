import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ResourceTypeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPDRRMO: () => void;
  onSelectExternal: () => void;
}

export function ResourceTypeSelectionModal({
  visible,
  onClose,
  onSelectPDRRMO,
  onSelectExternal
}: ResourceTypeSelectionModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>
              Add Resource
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.text + '80' }]}>
              Choose the type of resource you want to add
            </ThemedText>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.option, { 
                backgroundColor: colors.primary + '10',
                borderColor: colors.primary + '30'
              }]}
              onPress={onSelectPDRRMO}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="shield-outline" size={32} color={colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <ThemedText style={[styles.optionTitle, { color: colors.primary }]}>
                  PDRRMO Resource
                </ThemedText>
                <ThemedText style={[styles.optionDescription, { color: colors.text + '80' }]}>
                  Internal resources that can be borrowed by authorized personnel
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.option, { 
                backgroundColor: colors.warning + '10',
                borderColor: colors.warning + '30'
              }]}
              onPress={onSelectExternal}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.warning + '20' }]}>
                <Ionicons name="business-outline" size={32} color={colors.warning} />
              </View>
              <View style={styles.optionContent}>
                <ThemedText style={[styles.optionTitle, { color: colors.warning }]}>
                  External Agency Resource
                </ThemedText>
                <ThemedText style={[styles.optionDescription, { color: colors.text + '80' }]}>
                  Resources from other agencies for reference and coordination
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.warning} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.cancelText, { color: colors.text + '80' }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
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
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

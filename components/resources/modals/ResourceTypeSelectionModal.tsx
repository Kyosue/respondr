import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';

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
  onSelectExternal,
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
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerRow}>
              <ThemedText type="subtitle" style={styles.title}>
                Add Resource
              </ThemedText>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.surface }]}
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ThemedText style={[styles.subtitle, { color: colors.text + '99' }]}>
              Choose the type of resource you want to add
            </ThemedText>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.option, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={onSelectPDRRMO}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Add PDRRMO resource"
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="shield-outline" size={28} color={colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <ThemedText style={[styles.optionTitle, { color: colors.text }]}>
                  PDRRMO Resource
                </ThemedText>
                <ThemedText style={[styles.optionDescription, { color: colors.text + '99' }]}>
                  Internal resources that can be borrowed by authorized personnel
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text + '99'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.option, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={onSelectExternal}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Add external agency resource"
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.warning + '18' }]}>
                <Ionicons name="business-outline" size={28} color={colors.warning} />
              </View>
              <View style={styles.optionContent}>
                <ThemedText style={[styles.optionTitle, { color: colors.text }]}>
                  External Agency Resource
                </ThemedText>
                <ThemedText style={[styles.optionDescription, { color: colors.text + '99' }]}>
                  Resources from other agencies for reference and coordination
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text + '99'} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.error + '12', borderColor: colors.error + '35' }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.cancelText, { color: colors.error }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    paddingBottom: 16,
    marginBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

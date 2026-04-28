import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export type SelectItemType = {
  id: string;
  label: string;
  supportingText?: string;
  disabled?: boolean;
  avatarUrl?: string;
};

type SelectProps = {
  label: string;
  isRequired?: boolean;
  tooltip?: string;
  hint?: string;
  placeholder?: string;
  items: SelectItemType[];
  selectedId?: string;
  onSelectionChange: (id: string) => void;
};

export function Select({
  label,
  isRequired = false,
  tooltip,
  hint,
  placeholder = 'Select item',
  items,
  selectedId,
  onSelectionChange,
}: SelectProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isWeb = Platform.OS === 'web';

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const q = searchQuery.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.supportingText?.toLowerCase().includes(q)
        );
      }),
    [items, searchQuery]
  );

  const selectedItem = items.find((item) => item.id === selectedId);

  const handleSelect = (id: string) => {
    onSelectionChange(id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText style={[styles.label, { color: colors.text }]}>
          {label}
          {isRequired && <ThemedText style={{ color: '#EF4444' }}> *</ThemedText>}
        </ThemedText>
        {tooltip ? <Ionicons name="help-circle-outline" size={16} color={`${colors.text}80`} /> : null}
      </View>

      <TouchableOpacity
        style={[
          styles.trigger,
          {
            borderColor: isOpen ? colors.primary : colors.border,
            backgroundColor: colors.surface,
          },
        ]}
        onPress={() => setIsOpen((prev) => !prev)}
        activeOpacity={0.8}
      >
        <ThemedText style={[styles.triggerText, { color: selectedItem ? colors.text : `${colors.text}80` }]}>
          {selectedItem?.label || placeholder}
        </ThemedText>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={`${colors.text}80`} />
      </TouchableOpacity>

      {isWeb && isOpen && (
        <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.searchWrap}>
            <TextInput
              style={[
                styles.searchInput,
                { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
              ]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search..."
              placeholderTextColor={`${colors.text}66`}
            />
          </View>
          <ScrollView style={styles.list} nestedScrollEnabled>
            {filteredItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.listItem,
                  {
                    borderBottomColor: `${colors.border}4D`,
                    backgroundColor: selectedId === item.id ? `${colors.primary}14` : 'transparent',
                    opacity: item.disabled ? 0.5 : 1,
                  },
                ]}
                onPress={() => !item.disabled && handleSelect(item.id)}
                disabled={item.disabled}
              >
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.itemLabel, { color: colors.text }]}>{item.label}</ThemedText>
                  {item.supportingText ? (
                    <ThemedText style={[styles.itemSupportingText, { color: `${colors.text}99` }]}>
                      {item.supportingText}
                    </ThemedText>
                  ) : null}
                </View>
                {selectedId === item.id ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {!isWeb && (
        <Modal visible={isOpen} transparent animationType="fade" onRequestClose={handleClose}>
          <View style={styles.backdrop}>
            <TouchableOpacity style={styles.backdropDismiss} onPress={handleClose} activeOpacity={1} />
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <ThemedText style={[styles.modalTitle, { color: colors.text }]}>{label}</ThemedText>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.searchWrap}>
                <TextInput
                  style={[
                    styles.searchInput,
                    { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                  ]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search..."
                  placeholderTextColor={`${colors.text}66`}
                />
              </View>
              <ScrollView style={styles.list}>
                {filteredItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.listItem,
                      {
                        borderBottomColor: `${colors.border}4D`,
                        backgroundColor: selectedId === item.id ? `${colors.primary}14` : 'transparent',
                        opacity: item.disabled ? 0.5 : 1,
                      },
                    ]}
                    onPress={() => !item.disabled && handleSelect(item.id)}
                    disabled={item.disabled}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.itemLabel, { color: colors.text }]}>{item.label}</ThemedText>
                      {item.supportingText ? (
                        <ThemedText style={[styles.itemSupportingText, { color: `${colors.text}99` }]}>
                          {item.supportingText}
                        </ThemedText>
                      ) : null}
                    </View>
                    {selectedId === item.id ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {hint ? (
        <ThemedText style={[styles.hintText, { color: `${colors.text}80` }]}>
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16, position: 'relative', zIndex: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '500' },
  trigger: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: { fontSize: 16, flex: 1 },
  dropdown: { marginTop: 8, borderWidth: 1, borderRadius: 12, overflow: 'hidden', maxHeight: 320 },
  searchWrap: { padding: 10, paddingBottom: 8 },
  searchInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  list: { maxHeight: 260 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  itemLabel: { fontSize: 16, fontWeight: '600' },
  itemSupportingText: { fontSize: 13, marginTop: 2 },
  hintText: { fontSize: 12, marginTop: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  backdropDismiss: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalCard: { width: '100%', maxWidth: 500, maxHeight: '70%', borderRadius: 12, borderWidth: 1 },
  modalHeader: { padding: 16, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '600' },
});

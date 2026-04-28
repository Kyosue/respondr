import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Image, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SelectItemType } from './select';

type MultiSelectProps = {
  label: string;
  isRequired?: boolean;
  tooltip?: string;
  hint?: string;
  placeholder?: string;
  items: SelectItemType[];
  selectedKeys: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
  supportingText?: string;
  onReset?: () => void;
  onSelectAll?: () => void;
};

export function MultiSelect({
  label,
  isRequired = false,
  tooltip,
  hint,
  placeholder = 'Select items',
  items,
  selectedKeys,
  onSelectionChange,
  supportingText,
  onReset,
  onSelectAll,
}: MultiSelectProps) {
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

  const selectedCount = selectedKeys.size;
  const selectedSummary = `${selectedCount} selected`;

  const toggleItem = (id: string) => {
    const next = new Set(selectedKeys);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const handleReset = () => {
    if (onReset) onReset();
    else onSelectionChange(new Set());
  };

  const handleSelectAll = () => {
    if (onSelectAll) onSelectAll();
    else onSelectionChange(new Set(items.filter((i) => !i.disabled).map((i) => i.id)));
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
  };

  const panel = (
    <View
      style={[
        styles.dropdown,
        isWeb ? { backgroundColor: colors.surface, borderColor: colors.border } : styles.mobileDropdown,
      ]}
    >
      <View style={styles.searchWrap}>
        <TextInput
          style={[
            styles.searchInput,
            { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search"
          placeholderTextColor={`${colors.text}66`}
        />
      </View>
      <ScrollView style={styles.list} nestedScrollEnabled>
        {filteredItems.map((item) => {
          const isSelected = selectedKeys.has(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.listItem,
                {
                  borderBottomColor: `${colors.border}4D`,
                  opacity: item.disabled ? 0.5 : 1,
                },
              ]}
              onPress={() => !item.disabled && toggleItem(item.id)}
              disabled={item.disabled}
            >
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={isSelected ? colors.primary : `${colors.text}55`}
              />
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: `${colors.primary}22` }]}>
                  <ThemedText style={[styles.avatarInitials, { color: colors.primary }]}>
                    {getInitials(item.label)}
                  </ThemedText>
                </View>
              )}
              <View style={styles.itemTextWrap}>
                <ThemedText style={[styles.itemLabel, { color: colors.text }]}>{item.label}</ThemedText>
                {item.supportingText ? (
                  <ThemedText style={[styles.itemSupportingText, { color: `${colors.text}99` }]}>
                    {item.supportingText}
                  </ThemedText>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.footerButton, { borderColor: colors.border }]} onPress={handleReset}>
          <ThemedText style={[styles.footerButtonText, { color: colors.text }]}>Reset</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerButton, { borderColor: colors.border }]} onPress={handleSelectAll}>
          <ThemedText style={[styles.footerButtonText, { color: colors.text }]}>Select all</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText style={[styles.label, { color: colors.text }]}>
          {label}
          {isRequired && <ThemedText style={{ color: '#EF4444' }}> *</ThemedText>}
        </ThemedText>
        {tooltip ? <Ionicons name="help-circle-outline" size={16} color={`${colors.text}80`} /> : null}
      </View>

      {isWeb && isOpen ? <View style={styles.webPanelWrap}>{panel}</View> : null}

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
        <ThemedText style={[styles.triggerText, { color: selectedCount > 0 ? colors.text : `${colors.text}80` }]}>
          {selectedCount > 0 ? selectedSummary : placeholder}
          {supportingText ? <ThemedText style={{ color: `${colors.text}99` }}> {supportingText}</ThemedText> : null}
        </ThemedText>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={`${colors.text}80`} />
      </TouchableOpacity>

      {!isWeb && (
        <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
          <View style={styles.backdrop}>
            <TouchableOpacity style={styles.backdropDismiss} onPress={() => setIsOpen(false)} activeOpacity={1} />
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <ThemedText style={[styles.modalTitle, { color: colors.text }]}>{label}</ThemedText>
                <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
              {panel}
            </View>
          </View>
        </Modal>
      )}

      {hint ? <ThemedText style={[styles.hintText, { color: `${colors.text}80` }]}>{hint}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16, position: 'relative', zIndex: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '500' },
  trigger: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: { fontSize: 16, flex: 1 },
  webPanelWrap: { marginBottom: 8 },
  dropdown: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', maxHeight: 360 },
  mobileDropdown: { borderWidth: 0, borderRadius: 0, maxHeight: undefined },
  searchWrap: { padding: 10, paddingBottom: 8 },
  searchInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  list: { maxHeight: 250 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarFallback: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 11, fontWeight: '700' },
  itemTextWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemLabel: { fontSize: 16, fontWeight: '600' },
  itemSupportingText: { fontSize: 15 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderTopWidth: 1 },
  footerButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  footerButtonText: { fontSize: 14, fontWeight: '600' },
  hintText: { fontSize: 12, marginTop: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  backdropDismiss: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalCard: { width: '100%', maxWidth: 520, maxHeight: '75%', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 16, fontWeight: '600' },
  closeButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});

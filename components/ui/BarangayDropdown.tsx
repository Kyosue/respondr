import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Platform,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { getBarangaysForMunicipality } from '../../data/barangaysData';
import { ThemedText } from '../ThemedText';

interface BarangayDropdownProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  municipalityName: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  colors: any;
}

export function BarangayDropdown({
  label,
  value,
  onValueChange,
  municipalityName,
  placeholder = "Select barangay",
  required = false,
  helperText,
  colors
}: BarangayDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const barangays = getBarangaysForMunicipality(municipalityName);
  const filteredBarangays = barangays.filter(barangay =>
    barangay.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedBarangay = barangays.find(barangay => barangay.name === value);
  const showInlineDropdown = Platform.OS === 'web';

  const handleSelect = (barangayName: string) => {
    onValueChange(barangayName);
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
        {required && <ThemedText style={{ color: '#EF4444' }}> *</ThemedText>}
      </ThemedText>
      </View>

      <TouchableOpacity
        style={[
          styles.trigger,
          {
            borderColor: isOpen ? colors.primary : colors.border,
            backgroundColor: colors.surface,
          }
        ]}
        onPress={() => setIsOpen((prev) => !prev)}
        activeOpacity={0.8}
      >
        <ThemedText style={[
          styles.triggerText,
          { color: selectedBarangay ? colors.text : `${colors.text}80` }
        ]}>
          {selectedBarangay ? selectedBarangay.name : placeholder}
        </ThemedText>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={18}
          color={`${colors.text}80`}
        />
      </TouchableOpacity>

      {showInlineDropdown && isOpen && (
        <View style={[styles.inlineDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.searchWrap}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background
                }
              ]}
              placeholder="Search barangays..."
              placeholderTextColor={`${colors.text}66`}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <ScrollView style={styles.list} nestedScrollEnabled>
            {filteredBarangays.length > 0 ? (
              filteredBarangays.map((barangay) => (
                <TouchableOpacity
                  key={barangay.name}
                  style={[
                    styles.listItem,
                    {
                      borderBottomColor: `${colors.border}4D`,
                      backgroundColor: value === barangay.name ? `${colors.primary}14` : 'transparent'
                    }
                  ]}
                  onPress={() => handleSelect(barangay.name)}
                >
                  <ThemedText style={[styles.listItemText, { color: colors.text }]}>
                    {barangay.name}
                  </ThemedText>
                  {value === barangay.name && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyWrap}>
                <ThemedText style={{ color: `${colors.text}80` }}>
                  No barangays found
                </ThemedText>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {helperText && (
        <ThemedText style={[styles.helperText, { color: `${colors.text}80` }]}>
          {helperText}
        </ThemedText>
      )}

      {!showInlineDropdown && (
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                Select Barangay
              </ThemedText>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.background
                  }
                ]}
                placeholder="Search barangays..."
                placeholderTextColor={`${colors.text}80`}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Barangay List */}
            <ScrollView style={styles.list}>
              {filteredBarangays.length > 0 ? (
                filteredBarangays.map((barangay) => (
                  <TouchableOpacity
                    key={barangay.name}
                    style={[
                      styles.listItem,
                      {
                        borderBottomColor: `${colors.border}4D`,
                        backgroundColor: value === barangay.name ? `${colors.primary}14` : 'transparent'
                      }
                    ]}
                    onPress={() => handleSelect(barangay.name)}
                  >
                    <ThemedText style={[styles.listItemText, { color: colors.text }]}>
                      {barangay.name}
                    </ThemedText>
                    {value === barangay.name && (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyWrap}>
                  <ThemedText style={{ color: `${colors.text}80` }}>
                    No barangays found
                  </ThemedText>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.primary }]}
                onPress={handleClose}
              >
                <ThemedText style={styles.closeButtonText}>
                  Close
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
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
  triggerText: {
    fontSize: 16,
    flex: 1,
  },
  inlineDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: 310,
  },
  searchWrap: {
    padding: 10,
    paddingBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  list: {
    maxHeight: 250,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  listItemText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  emptyWrap: {
    padding: 18,
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '70%',
    borderWidth: 1,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

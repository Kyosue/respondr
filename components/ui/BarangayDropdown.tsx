import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Modal,
    ScrollView,
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
    <View style={{ marginBottom: 16 }}>
      <ThemedText style={{ 
        fontSize: 14, 
        fontWeight: '600', 
        marginBottom: 8,
        color: colors.text 
      }}>
        {label}
        {required && <ThemedText style={{ color: '#EF4444' }}> *</ThemedText>}
      </ThemedText>

      <TouchableOpacity
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 12,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onPress={() => setIsOpen(true)}
      >
        <ThemedText style={{
          fontSize: 16,
          color: selectedBarangay ? colors.text : colors.text + '60',
          flex: 1
        }}>
          {selectedBarangay ? selectedBarangay.name : placeholder}
        </ThemedText>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={colors.text + '60'} 
        />
      </TouchableOpacity>

      {helperText && (
        <ThemedText style={{
          fontSize: 12,
          color: colors.text + '60',
          marginTop: 4
        }}>
          {helperText}
        </ThemedText>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            width: '100%',
            maxWidth: 500,
            maxHeight: '70%',
            borderWidth: 1,
            borderColor: colors.border
          }}>
            {/* Header */}
            <View style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <ThemedText style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.text
              }}>
                Select Barangay
              </ThemedText>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={{ padding: 16, paddingBottom: 8 }}>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 16,
                  color: colors.text,
                  backgroundColor: colors.background
                }}
                placeholder="Search barangays..."
                placeholderTextColor={colors.text + '60'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Barangay List */}
            <ScrollView style={{ maxHeight: 300 }}>
              {filteredBarangays.length > 0 ? (
                filteredBarangays.map((barangay) => (
                  <TouchableOpacity
                    key={barangay.name}
                    style={{
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border + '30',
                      backgroundColor: value === barangay.name ? colors.primary + '10' : 'transparent'
                    }}
                    onPress={() => handleSelect(barangay.name)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ThemedText style={{
                        fontSize: 16,
                        color: colors.text,
                        flex: 1
                      }}>
                        {barangay.name}
                      </ThemedText>
                      {value === barangay.name && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ThemedText style={{ color: colors.text + '60' }}>
                    No barangays found
                  </ThemedText>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={{
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: colors.border
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center'
                }}
                onPress={handleClose}
              >
                <ThemedText style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  Close
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

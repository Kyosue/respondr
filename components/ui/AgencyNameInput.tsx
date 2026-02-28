import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Dropdown } from '@/components/ui/Dropdown';

interface Agency {
  id: string;
  name: string;
  address: string;
  contactNumbers: string[];
}

interface AgencyNameInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onAgencySelect?: (agency: Agency) => void;
  placeholder?: string;
  suggestions: Agency[];
  error?: string;
  helperText?: string;
  disabled?: boolean;
  style?: any;
}

export function AgencyNameInput({
  value,
  onChangeText,
  onAgencySelect,
  placeholder = 'Enter agency name',
  suggestions,
  error,
  helperText,
  disabled = false,
  style,
}: AgencyNameInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Agency[]>([]);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (value.trim().length >= 1) {
      const query = value.toLowerCase().trim();
      const exactMatches = suggestions.filter((a) => a.name.toLowerCase().startsWith(query));
      const partialMatches = suggestions.filter(
        (a) => a.name.toLowerCase().includes(query) && !a.name.toLowerCase().startsWith(query)
      );
      setFilteredSuggestions([...exactMatches, ...partialMatches].slice(0, 8));
    } else {
      setFilteredSuggestions(suggestions.slice(0, 8));
    }
  }, [value, suggestions]);

  const handleInputChange = (text: string) => {
    onChangeText(text);
    if (!showDropdown && (text.trim().length >= 1 || suggestions.length > 0)) setShowDropdown(true);
  };

  const handleSuggestionPress = (agency: Agency) => {
    onChangeText(agency.name);
    setShowDropdown(false);
    inputRef.current?.blur();
    if (onAgencySelect) onAgencySelect(agency);
  };

  const toggleDropdown = () => setShowDropdown((v) => !v);

  const list = value.trim().length >= 1 ? filteredSuggestions : suggestions.slice(0, 8);
  const hasSuggestions = list.length > 0;

  return (
    <View style={[styles.container, style]}>
      <Dropdown
        open={showDropdown}
        onOpenChange={setShowDropdown}
        placement="bottom"
        align="start"
        maxHeight={280}
        constrainToViewport
        closeOnEscape
        closeOnBackdropPress
        renderInPortal
        trigger={
          <View style={styles.inputWrapper}>
            <View style={[styles.inputContainer, { borderColor: error ? colors.error : colors.border, backgroundColor: disabled ? colors.surface + '80' : colors.surface }]}>
              <Ionicons name="business-outline" size={20} color={error ? colors.error : colors.text + '99'} style={styles.inputIcon} />
              <TextInput
                ref={inputRef}
                style={[styles.textInput, { color: colors.text }]}
                value={value}
                onChangeText={handleInputChange}
                placeholder={placeholder}
                placeholderTextColor={colors.text + '80'}
                editable={!disabled}
                autoCapitalize="words"
                autoCorrect={false}
                onFocus={() => {
                  if (value.trim().length >= 1 || suggestions.length > 0) setShowDropdown(true);
                }}
              />
              {value.length > 0 && !disabled && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    onChangeText('');
                    setShowDropdown(false);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.text + '99'} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.chevronButton} onPress={toggleDropdown} disabled={disabled} activeOpacity={0.7}>
                <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        }
        dropdownStyle={{
          borderWidth: 1.5,
          borderRadius: 12,
          backgroundColor: colors.surface || colors.background,
          borderColor: colors.border,
        }}
      >
        {hasSuggestions ? (
          <ScrollView style={styles.suggestionsList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {list.map((agency, index) => {
              const isExactMatch = value.trim().length > 0 && agency.name.toLowerCase().startsWith(value.toLowerCase().trim());
              return (
                <TouchableOpacity
                  key={`${agency.id}-${index}`}
                  style={[styles.suggestionItem, { borderBottomColor: colors.border, backgroundColor: isExactMatch ? colors.primary + '15' : 'transparent' }]}
                  onPress={() => handleSuggestionPress(agency)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="business-outline" size={16} color={isExactMatch ? colors.primary : colors.text + '99'} style={styles.suggestionIcon} />
                  <View style={styles.suggestionContent}>
                    <ThemedText style={[styles.suggestionText, isExactMatch && { color: colors.primary, fontWeight: '600' }]}>{agency.name}</ThemedText>
                    <ThemedText style={[styles.suggestionSubtext, { color: colors.text + '99' }]} numberOfLines={1}>
                      {agency.address}
                    </ThemedText>
                  </View>
                  {isExactMatch && <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={styles.checkIcon} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.dropdownEmptyWrap}>
            <ThemedText style={[styles.dropdownEmpty, { color: colors.text + '99' }]}>No agencies found</ThemedText>
          </View>
        )}
      </Dropdown>

      {error && <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>}
      {helperText && !error && <ThemedText style={[styles.helperText, { color: colors.text + '99' }]}>{helperText}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    paddingRight: 80,
  },
  clearButton: {
    position: 'absolute',
    right: 40,
    padding: 4,
    zIndex: 1,
  },
  chevronButton: {
    position: 'absolute',
    right: 10,
    padding: 4,
    zIndex: 1,
  },
  suggestionsList: {
    maxHeight: 280,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionContent: {
    flex: 1,
    minWidth: 0,
  },
  suggestionText: {
    fontSize: 15,
    marginBottom: 2,
  },
  suggestionSubtext: {
    fontSize: 12,
  },
  checkIcon: {
    marginLeft: 8,
  },
  dropdownEmptyWrap: {
    padding: 16,
  },
  dropdownEmpty: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
  },
});

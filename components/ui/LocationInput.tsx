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

interface LocationInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    suggestions: string[];
    error?: string;
    helperText?: string;
    disabled?: boolean;
    style?: any;
}

export function LocationInput({
    value,
    onChangeText,
    placeholder = "Enter location",
    suggestions,
    error,
    helperText,
    disabled = false,
    style,
}: LocationInputProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const inputRef = useRef<TextInput>(null);

    // Filter suggestions based on current input
    useEffect(() => {
        if (value.trim().length >= 1) {
            const query = value.toLowerCase().trim();
            
            // First, find exact matches that start with the query
            const exactMatches = suggestions.filter(suggestion =>
                suggestion.toLowerCase().startsWith(query)
            );
            
            // Then, find partial matches that contain the query
            const partialMatches = suggestions.filter(suggestion =>
                suggestion.toLowerCase().includes(query) && 
                !suggestion.toLowerCase().startsWith(query)
            );
            
            // Combine and prioritize exact matches
            const filtered = [...exactMatches, ...partialMatches];
            
            setFilteredSuggestions(filtered);
        } else {
            // If input is empty, show all suggestions when dropdown is open
            setFilteredSuggestions(suggestions);
        }
    }, [value, suggestions]);

    const handleInputChange = (text: string) => {
        onChangeText(text);
        // Keep dropdown open when typing
        if (!showDropdown && text.trim().length >= 1) {
            setShowDropdown(true);
        }
    };

    const handleSuggestionPress = (suggestion: string) => {
        onChangeText(suggestion);
        setShowDropdown(false);
        inputRef.current?.blur();
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const hasSuggestions = filteredSuggestions.length > 0 || suggestions.length > 0;
    const list = value.trim().length >= 1 ? filteredSuggestions : suggestions;

    return (
        <View style={[styles.container, style]}>
            <Dropdown
                open={showDropdown}
                onOpenChange={setShowDropdown}
                placement="bottom"
                align="start"
                maxHeight={300}
                constrainToViewport
                closeOnEscape
                closeOnBackdropPress
                renderInPortal
                trigger={
                    <View style={styles.inputWrapper}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                ref={inputRef}
                                style={[
                                    styles.input,
                                    {
                                        borderColor: error ? colors.error : (colors.inputBorder || colors.border),
                                        backgroundColor: disabled ? colors.background + '50' : colors.background,
                                        color: colors.text,
                                    },
                                    disabled && styles.disabled,
                                ]}
                                value={value}
                                onChangeText={handleInputChange}
                                placeholder={placeholder}
                                placeholderTextColor={colors.text + '50'}
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
                                    <Ionicons name="close-circle" size={20} color={colors.text + '70'} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.chevronButton}
                                onPress={toggleDropdown}
                                disabled={disabled}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={showDropdown ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={colors.text}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                dropdownStyle={{
                    borderWidth: 1.5,
                    borderRadius: 10,
                    backgroundColor: colors.surface || colors.background,
                    borderColor: colors.border,
                }}
            >
                {hasSuggestions ? (
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {list.map((item, index) => {
                            const isExactMatch = value.trim().length > 0 && item.toLowerCase().startsWith(value.toLowerCase().trim());
                            return (
                                <TouchableOpacity
                                    key={`${item}-${index}`}
                                    style={[styles.dropdownItem, isExactMatch && { backgroundColor: colors.primary + '20' }]}
                                    onPress={() => handleSuggestionPress(item)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="location-outline"
                                        size={16}
                                        color={isExactMatch ? colors.primary : colors.text + '70'}
                                        style={styles.dropdownIcon}
                                    />
                                    <ThemedText
                                        style={[styles.dropdownItemText, isExactMatch && { color: colors.primary, fontWeight: '600' }]}
                                    >
                                        {item}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                ) : (
                    <View style={styles.dropdownEmptyWrap}>
                        <ThemedText style={[styles.dropdownEmpty, { color: colors.text + '80' }]}>
                            No locations available
                        </ThemedText>
                    </View>
                )}
            </Dropdown>

            {error && (
                <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>
            )}

            {helperText && !error && (
                <ThemedText style={[styles.helperText, { color: colors.text + '70' }]}>
                    {helperText}
                </ThemedText>
            )}
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
        },
        input: {
            flex: 1,
            borderWidth: 1.5,
            borderRadius: 10,
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingRight: 80, // Space for clear and chevron buttons
            fontSize: 16,
            minHeight: 48,
        },
        disabled: {
            opacity: 0.5,
        },
        clearButton: {
            position: 'absolute',
            right: 40,
            padding: 4,
            zIndex: 1,
        },
        chevronButton: {
            position: 'absolute',
            right: 12,
            padding: 4,
            zIndex: 1,
        },
        dropdown: {
            overflow: 'hidden',
        },
        dropdownScroll: {
            maxHeight: 300,
        },
        dropdownEmptyWrap: {
            padding: 16,
        },
        dropdownItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(0, 0, 0, 0.1)',
        },
        dropdownIcon: {
            marginRight: 12,
        },
        dropdownItemText: {
            flex: 1,
            fontSize: 16,
            color: '#333',
        },
        dropdownEmpty: {
            padding: 16,
            textAlign: 'center',
            fontSize: 14,
        },
        errorText: {
            fontSize: 12,
            marginTop: 4,
        },
    helperText: {
        fontSize: 12,
        marginTop: 4,
        lineHeight: 16,
    },
});

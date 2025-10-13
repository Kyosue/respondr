import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface BorrowerNameInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    suggestions: string[];
    error?: string;
    helperText?: string;
    disabled?: boolean;
    style?: any;
}

export function BorrowerNameInput({
    value,
    onChangeText,
    placeholder = "Enter borrower name",
    suggestions,
    error,
    helperText,
    disabled = false,
    style,
}: BorrowerNameInputProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const inputRef = useRef<TextInput>(null);

    // Filter suggestions based on current input
    useEffect(() => {
        if (value.trim().length >= 1) { // Show suggestions after typing at least 1 character
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
            const filtered = [...exactMatches, ...partialMatches].slice(0, 8);
            
            setFilteredSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            // Hide suggestions when input is empty or has less than 1 character
            setFilteredSuggestions([]);
            setShowSuggestions(false);
        }
    }, [value, suggestions]);

    const handleInputChange = (text: string) => {
        onChangeText(text);
    };

    const handleSuggestionPress = (suggestion: string) => {
        onChangeText(suggestion);
        setShowSuggestions(false);
        inputRef.current?.blur();
    };

    const handleInputFocus = () => {
        if (value.trim().length >= 1 && filteredSuggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    const handleInputBlur = () => {
        // Delay hiding suggestions to allow for suggestion selection
        setTimeout(() => setShowSuggestions(false), 150);
    };

    return (
        <View style={[styles.container, style]}>
            <View style={[
                styles.inputContainer,
                {
                    borderColor: error ? colors.error : showSuggestions ? colors.primary : colors.border,
                    backgroundColor: disabled ? colors.surface : colors.background,
                }
            ]}>
                <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={error ? colors.error : colors.text + '60'} 
                    style={styles.inputIcon}
                />
                <TextInput
                    ref={inputRef}
                    style={[
                        styles.textInput,
                        { color: colors.text }
                    ]}
                    value={value}
                    onChangeText={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder={placeholder}
                    placeholderTextColor={colors.text + '60'}
                    editable={!disabled}
                    autoCapitalize="words"
                    autoCorrect={false}
                />
            </View>

            {showSuggestions && filteredSuggestions.length > 0 && (
                <View style={[styles.suggestionsContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.suggestionsList}>
                        {filteredSuggestions.map((item, index) => {
                            const isExactMatch = item.toLowerCase().startsWith(value.toLowerCase().trim());
                            return (
                                <TouchableOpacity
                                    key={`${item}-${index}`}
                                    style={[
                                        styles.suggestionItem, 
                                        { 
                                            borderBottomColor: colors.border,
                                            backgroundColor: isExactMatch ? colors.primary + '10' : 'transparent'
                                        }
                                    ]}
                                    onPress={() => handleSuggestionPress(item)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons 
                                        name="person-outline" 
                                        size={16} 
                                        color={isExactMatch ? colors.primary : colors.text + '70'} 
                                        style={styles.suggestionIcon}
                                    />
                                    <ThemedText 
                                        style={[
                                            styles.suggestionText,
                                            isExactMatch && { color: colors.primary, fontWeight: '500' }
                                        ]}
                                    >
                                        {item}
                                    </ThemedText>
                                    {isExactMatch && (
                                        <Ionicons 
                                            name="checkmark-circle" 
                                            size={16} 
                                            color={colors.primary} 
                                            style={styles.checkIcon}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}

            {error && (
                <ThemedText style={styles.errorText}>{error}</ThemedText>
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
        position: 'relative',
        zIndex: 1000, // High z-index to ensure suggestions appear above other content
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        minHeight: 48,
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 0,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 48, // Position directly below the input field (48px height)
        left: 0,
        right: 0,
        borderWidth: 1,
        borderTopWidth: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        maxHeight: 200,
        zIndex: 1001, // Even higher z-index for the suggestions container
        elevation: 10, // High elevation for Android
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    suggestionsList: {
        maxHeight: 200,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    suggestionIcon: {
        marginRight: 12,
    },
    suggestionText: {
        flex: 1,
        fontSize: 14,
    },
    checkIcon: {
        marginLeft: 8,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    helperText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
});

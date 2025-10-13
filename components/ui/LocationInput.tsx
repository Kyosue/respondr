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
        // Replace the entire field content with the selected suggestion
        onChangeText(suggestion);
        setShowSuggestions(false);
        // Keep focus for a moment to ensure the value is properly set
        setTimeout(() => {
        inputRef.current?.blur();
        }, 100);
    };

    const handleInputFocus = () => {
        // Only show suggestions when focused if there's at least 1 character in the input
        if (value.trim().length >= 1 && suggestions.length > 0) {
        setShowSuggestions(true);
        }
    };

    const handleInputBlur = () => {
        // Delay hiding suggestions to allow for suggestion selection
        setTimeout(() => {
        setShowSuggestions(false);
        }, 150);
    };


    return (
        <View style={[styles.container, style]}>
        <View style={styles.inputContainer}>
            <TextInput
            ref={inputRef}
            style={[
                styles.input,
                {
                borderColor: error ? '#ff4444' : colors.border,
                backgroundColor: disabled ? colors.background + '50' : colors.background,
                color: colors.text,
                },
                disabled && styles.disabled,
            ]}
            value={value}
            onChangeText={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            placeholderTextColor={colors.text + '50'}
            editable={!disabled}
            autoCapitalize="words"
            autoCorrect={false}
            />
            {value.length > 0 && !disabled && (
            <TouchableOpacity
                style={styles.clearButton}
                onPress={() => onChangeText('')}
            >
                <Ionicons name="close-circle" size={20} color={colors.text + '70'} />
            </TouchableOpacity>
            )}
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
                        name="location-outline" 
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
        marginBottom: 0,
    },
    inputContainer: {
        position: 'relative',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        minHeight: 48,
    },
    disabled: {
        opacity: 0.5,
    },
    clearButton: {
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: [{ translateY: -10 }],
        padding: 4,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: '65%',
        left: 0,
        right: 0,
        zIndex: 1000,
        borderWidth: 1,
        borderTopWidth: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        maxHeight: 240,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        marginTop: -1, // Overlap slightly with input border
    },
    suggestionsList: {
        maxHeight: 240,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    suggestionIcon: {
        marginRight: 8,
    },
    suggestionText: {
        flex: 1,
        fontSize: 16,
    },
    checkIcon: {
        marginLeft: 8,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: 4,
    },
    helperText: {
        fontSize: 12,
        marginTop: 4,
        lineHeight: 16,
    },
    });

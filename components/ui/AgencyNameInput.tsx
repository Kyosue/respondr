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
    placeholder = "Enter agency name",
    suggestions,
    error,
    helperText,
    disabled = false,
    style,
}: AgencyNameInputProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<Agency[]>([]);
    const inputRef = useRef<TextInput>(null);

    // Filter suggestions based on current input
    useEffect(() => {
        if (value.trim().length >= 1) { // Show suggestions after typing at least 1 character
            const query = value.toLowerCase().trim();
            
            // First, find exact matches that start with the query
            const exactMatches = suggestions.filter(agency =>
                agency.name.toLowerCase().startsWith(query)
            );
            
            // Then, find partial matches that contain the query
            const partialMatches = suggestions.filter(agency =>
                agency.name.toLowerCase().includes(query) && 
                !agency.name.toLowerCase().startsWith(query)
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

    const handleSuggestionPress = (agency: Agency) => {
        onChangeText(agency.name);
        setShowSuggestions(false);
        inputRef.current?.blur();
        
        // Call the onAgencySelect callback to populate other fields
        if (onAgencySelect) {
            onAgencySelect(agency);
        }
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
        <View style={[
            styles.container, 
            style,
            showSuggestions && !error && {
                borderWidth: 2,
                borderColor: colors.primary,
                borderRadius: 10,
                padding: 2,
            }
        ]}>
            <View style={[
                styles.inputContainer,
                {
                    borderColor: error ? colors.error : colors.border,
                    backgroundColor: disabled ? colors.surface : colors.background,
                }
            ]}>
                <Ionicons 
                    name="business-outline" 
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
                        {filteredSuggestions.map((agency, index) => {
                            const isExactMatch = agency.name.toLowerCase().startsWith(value.toLowerCase().trim());
                            return (
                                <TouchableOpacity
                                    key={`${agency.id}-${index}`}
                                    style={[
                                        styles.suggestionItem, 
                                        { 
                                            borderBottomColor: colors.border,
                                            backgroundColor: isExactMatch ? colors.primary + '10' : 'transparent'
                                        }
                                    ]}
                                    onPress={() => handleSuggestionPress(agency)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons 
                                        name="business-outline" 
                                        size={16} 
                                        color={isExactMatch ? colors.primary : colors.text + '70'} 
                                        style={styles.suggestionIcon}
                                    />
                                    <View style={styles.suggestionContent}>
                                        <ThemedText 
                                            style={[
                                                styles.suggestionText,
                                                isExactMatch && { color: colors.primary, fontWeight: '500' }
                                            ]}
                                        >
                                            {agency.name}
                                        </ThemedText>
                                        <ThemedText 
                                            style={[
                                                styles.suggestionSubtext,
                                                { color: colors.text + '60' }
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {agency.address}
                                        </ThemedText>
                                    </View>
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
        zIndex: 9999, // Very high z-index to ensure suggestions appear above other content
        elevation: 10, // For Android
        borderWidth: 0, // Default no border, will be added when suggestions show
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
        zIndex: 10000, // Very high z-index for the suggestions container
        elevation: 20, // Very high elevation for Android to appear above other elements
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
    suggestionContent: {
        flex: 1,
    },
    suggestionText: {
        fontSize: 14,
        marginBottom: 2,
    },
    suggestionSubtext: {
        fontSize: 12,
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

/**
 * Modern color palette for the app with consistent theming for light and dark modes.
 */

// Primary brand colors
const primaryLight = '#4361EE'; // Modern blue
const primaryDark = '#4CC9F0'; // Bright blue for dark mode

// Secondary colors
const secondaryLight = '#3A0CA3'; // Deep purple
const secondaryDark = '#7209B7'; // Vibrant purple

// Accent colors
const accentLight = '#F72585'; // Vibrant pink
const accentDark = '#F72585'; // Same vibrant pink

// Success, warning, error
const successLight = '#388E3C'; // Darker green
const successDark = '#4CAF50'; // Darker green for dark mode
const warningLight = '#FF9800';
const warningDark = '#FFD54F';
const errorLight = '#F44336';
const errorDark = '#FF8A80';

export const Colors = {
  light: {
    text: '#2B2D42', // Dark blue-gray for better readability
    background: '#FFFFFF',
    surface: '#F8F9FA', // Subtle off-white for cards/surfaces
    border: '#E9ECEF', // Light gray for borders
    tint: primaryLight,
    primary: primaryLight,
    secondary: secondaryLight,
    accent: accentLight,
    success: successLight,
    warning: warningLight,
    error: errorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryLight,
    inputBackground: '#FFFFFF',
    inputBorder: '#CED4DA',
    inputText: '#2B2D42',
    buttonText: '#FFFFFF',
    disabledButton: '#E9ECEF',
    disabledText: '#ADB5BD',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    text: '#F8F9FA', // Off-white for better readability
    background: '#121212', // Material dark theme background
    surface: '#1E1E1E', // Slightly lighter than background
    border: '#333333', // Dark gray for borders
    tint: primaryDark,
    primary: primaryDark,
    secondary: secondaryDark,
    accent: accentDark,
    success: successDark,
    warning: warningDark,
    error: errorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryDark,
    inputBackground: '#2C2C2C',
    inputBorder: '#444444',
    inputText: '#F8F9FA',
    buttonText: '#121212',
    disabledButton: '#333333',
    disabledText: '#666666',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};
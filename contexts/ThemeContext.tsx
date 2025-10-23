import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

type ColorScheme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_preference';

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setColorSchemeState(savedTheme as ColorScheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Listen to system color scheme changes
  useEffect(() => {
    if (Platform.OS === 'web') {
      // For web, listen to system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemColorScheme(mediaQuery.matches ? 'dark' : 'light');

      const handleChange = (e: MediaQueryListEvent) => {
        setSystemColorScheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // For React Native, we'll use a simple approach
      // In a real app, you might want to use react-native-appearance or similar
      setSystemColorScheme('light'); // Default to light for now
    }
  }, []);

  const setColorScheme = async (scheme: ColorScheme) => {
    try {
      console.log('Setting color scheme to:', scheme);
      setColorSchemeState(scheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
      console.log('Color scheme saved successfully');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const isDark = colorScheme === 'dark' || (colorScheme === 'system' && systemColorScheme === 'dark');
  
  // Debug logging for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('Theme state:', { colorScheme, systemColorScheme, isDark });
    }
  }, [colorScheme, systemColorScheme, isDark]);

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

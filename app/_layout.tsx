import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/contexts/AuthContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { ResourceProvider } from '@/contexts/ResourceContext';
import { SitRepProvider } from '@/contexts/SitRepContext';
import { AppThemeProvider } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Initialize Firebase with error handling
let firebaseInitialized = false;
try {
  require('@/firebase/config');
  firebaseInitialized = true;
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Continue without Firebase for web fallback
  if (Platform.OS === 'web') {
    firebaseInitialized = false;
  } else {
    throw error;
  }
}

function LayoutContent() {
  const colorScheme = useColorScheme();
  
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="index" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isReady, setIsReady] = useState(false);

  // Initialize Firebase with proper error handling
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (firebaseInitialized) {
          console.log('Firebase has been initialized');
        } else if (Platform.OS === 'web') {
          console.log('Running in web mode without Firebase');
        }
        setIsReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        // Still set ready to true to prevent infinite loading
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!loaded || !isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <NetworkProvider>
          <AuthProvider>
            <ResourceProvider>
              <SitRepProvider>
                <LayoutContent />
              </SitRepProvider>
            </ResourceProvider>
          </AuthProvider>
        </NetworkProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
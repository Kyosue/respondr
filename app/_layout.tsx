import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
// import 'react-native-reanimated';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/contexts/AuthContext';
import { MemoProvider } from '@/contexts/MemoContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { ResourceProvider } from '@/contexts/ResourceContext';
import { SitRepProvider } from '@/contexts/SitRepContext';
import { AppThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useEffect, useState } from 'react';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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
  const { isDark } = useTheme();
  
  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {Platform.OS === 'web' && (
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Gabarito:wght@400..900&family=Luckiest+Guy&family=Patrick+Hand&display=swap"
            rel="stylesheet"
          />
        </Head>
      )}
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
  const isWeb = Platform.OS === 'web';
  const [loaded] = useFonts(
    isWeb
      ? {}
      : {
          Gabarito: require('../assets/fonts/Gabarito-VariableFont_wght.ttf'),
        }
  );
  const [isReady, setIsReady] = useState(false);

  // Set document title and favicon for web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Respondr';
      
      // Set favicon dynamically
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = '/assets/images/logo-1.png';
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = '/assets/images/logo-1.png';
        document.head.appendChild(link);
      }
    }
  }, []);

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

    // Initialize immediately - no delay needed
    initializeApp();
  }, []);

  const fontsReady = isWeb ? true : loaded;
  const appReady = fontsReady && isReady;
  const [canHideSplash, setCanHideSplash] = useState(false);

  // Wait for everything to be ready before hiding splash
  useEffect(() => {
    if (appReady) {
      // Give contexts time to initialize - NetworkProvider, AuthProvider, etc.
      // This delay ensures contexts are mounted and ready before splash hides
      // The blank screen was happening because splash hid before contexts initialized
      const timer = setTimeout(() => {
        setCanHideSplash(true);
      }, 600); // Wait for context initialization to complete (NetworkProvider, AuthProvider mount)
      
      return () => clearTimeout(timer);
    }
  }, [appReady]);

  // Hide splash screen only after everything is ready
  useEffect(() => {
    if (canHideSplash) {
      // Small delay to ensure smooth transition from splash to app
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {
          // Ignore errors if splash screen is already hidden
        });
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [canHideSplash]);

  // Keep splash visible until everything is ready
  // Show custom loading screen while contexts initialize
  if (!appReady || !canHideSplash) {
    return (
      <SafeAreaProvider>
        <AppThemeProvider>
          <LoadingScreen message="Initializing app..." />
        </AppThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <NetworkProvider>
          <AuthProvider>
            <ResourceProvider>
              <SitRepProvider>
                <MemoProvider>
                  <LayoutContent />
                </MemoProvider>
              </SitRepProvider>
            </ResourceProvider>
          </AuthProvider>
        </NetworkProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
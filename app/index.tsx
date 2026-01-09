import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Dashboard } from '../components/dashboard/Dashboard';
import { DesktopLayout } from '../components/layout/DesktopLayout';
import { BottomNavigation } from '../components/navigation/BottomNavigation';
import { Header } from '../components/navigation/Header';
import { Operations } from '../components/operations/Operations';
import { Reports } from '../components/reports/Reports';
import { Resources } from '../components/resources/Resources';
import { Settings } from '../components/settings/Settings';
import { SitRep } from '../components/sitrep/SitRep';
import { UserManagement } from '../components/user-management/UserManagement';
import WeatherStation from '../components/weather-station/WeatherStation';

export default function IndexScreen() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const colorScheme = useColorScheme();
  const { isDark } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isDesktop } = useScreenSize();
  
  // Redirect to home page immediately on web (home is the landing page)
  useEffect(() => {
    if (Platform.OS === 'web') {
      // On web, redirect to home page for unauthenticated users
      // This makes home.tsx the first page visitors see
      if (!isLoading && !isAuthenticated) {
        router.replace('/home');
        return;
      }
      // Also redirect if we're still loading but no user exists
      if (isLoading && !user) {
        const redirectTimer = setTimeout(() => {
          if (!isAuthenticated) {
            router.replace('/home');
          }
        }, 100);
        return () => clearTimeout(redirectTimer);
      }
    }
  }, [isLoading, isAuthenticated, user, router]);
  
  // Animation values (persist across renders)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Restart animations when theme changes
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, [isDark]);

  // Reset animation when tab changes
  useEffect(() => {
    // Define which tabs should have transitions
    const bottomTabs = ['dashboard', 'operations', 'resources', 'sitrep'];
    const hamburgerTabs = ['user-management', 'reports', 'settings', 'help', 'about'];
    
    // Only animate for bottom tab navigation (faster, more frequent)
    // Skip animation for hamburger menu items (less frequent, can be instant)
    const shouldAnimate = bottomTabs.includes(activeTab);
    
    if (shouldAnimate) {
      // Reset and restart animations for bottom tabs
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200, // Faster for bottom tabs
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Instant transition for hamburger menu items
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    }
  }, [activeTab]);

  // Update document title for web based on active tab
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const getPageTitle = (tab: string): string => {
        const titles: Record<string, string> = {
          dashboard: 'Dashboard',
          operations: 'Operations',
          resources: 'Resources',
          sitrep: 'Situation Report',
          'user-management': 'User Management',
          'weather-station': 'Weather Station',
          reports: 'Reports',
          settings: 'Settings',
        };
        return titles[tab] || 'Dashboard';
      };
      
      document.title = `Respondr - ${getPageTitle(activeTab)}`;
    }
  }, [activeTab]);

  // Redirect to login if not authenticated (for native apps)
  // Note: Web users are already redirected to /home above
  useEffect(() => {
    if (Platform.OS !== 'web') {
      // For native apps, redirect to login if not authenticated
      if (!isLoading && !isAuthenticated) {
        router.replace('/login');
      }
      else if (isLoading && !user) {
        const redirectTimer = setTimeout(() => {
          if (!isAuthenticated) {
            router.replace('/login');
          }
        }, 300);
        return () => clearTimeout(redirectTimer);
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // On web, redirect to home page if not authenticated (home is the landing page)
  if (Platform.OS === 'web' && !isAuthenticated) {
    // Don't wait for loading to complete - redirect immediately to show home page
    if (!isLoading || !user) {
      return null; // Will redirect via useEffect
    }
  }

  // Show loading state if auth is still loading
  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  // Don't render anything if not authenticated (will redirect)
  // Note: For native apps, this redirects to /login
  if (!isAuthenticated) {
    return null;
  }

  // Render desktop layout for larger screens
  if (isDesktop) {
    return (
      <DesktopLayout 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    );
  }

  // Render mobile layout for smaller screens
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Background gradient */}
      <LinearGradient
        colors={colorScheme === 'dark' ? 
          ['#121212', '#1E1E1E', '#121212'] : 
          [colors.background, '#f5f7fa', colors.background]}
        style={styles.backgroundGradient}
      />
      
      {/* Decorative elements */}
      <View style={styles.decorationContainer}>
        <View style={[styles.decorationCircle, { backgroundColor: `${colors.primary}15` }]} />
        <View style={[styles.decorationCircle, styles.decorationCircle2, { backgroundColor: `${colors.secondary}10` }]} />
      </View>
      
      <SafeAreaView style={[{ flex: 1 }, styles.safeArea]}>
        <Header 
          userName={user?.fullName || 'User'} 
          onTabChange={setActiveTab}
          currentTab={activeTab}
        />
        
        <Animated.View 
          key={`content-${isDark}`}
          style={[styles.contentContainer, { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }]}
        >
          {/* Render only the active component */}
          {activeTab === 'dashboard' && (
            <View style={{ flex: 1 }}>
              <Dashboard onNavigate={setActiveTab} />
            </View>
          )}
          {activeTab === 'operations' && (
            <View style={{ flex: 1 }}>
              <Operations />
            </View>
          )}
          {activeTab === 'resources' && (
            <View style={{ flex: 1 }}>
              <Resources />
            </View>
          )}
          {activeTab === 'sitrep' && (
            <View style={{ flex: 1 }}>
              <SitRep />
            </View>
          )}
          {activeTab === 'user-management' && (
            <View style={{ flex: 1 }}>
              <UserManagement />
            </View>
          )}
          {activeTab === 'weather-station' && (
            <View style={{ flex: 1 }}>
              <WeatherStation />
            </View>
          )}
          {activeTab === 'reports' && (
            <View style={{ flex: 1 }}>
              <Reports />
            </View>
          )}
          {activeTab === 'settings' && (
            <View style={{ flex: 1 }}>
              <Settings />
            </View>
          )}
        </Animated.View>
        
        {/* Position the bottom navigation as a floating element */}
        <View style={styles.bottomNavContainer}>
          <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    paddingTop: Platform.OS === 'android' ? 0 : 0, // Add extra padding for Android status bar
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    // Make sure the nav doesn't block content
    pointerEvents: 'box-none',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorationContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decorationCircle: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    top: -width * 0.2,
    right: -width * 0.2,
    opacity: 0.8,
  },
  decorationCircle2: {
    width: width * 0.6,
    height: width * 0.6,
    top: height * 0.6,
    left: -width * 0.3,
    opacity: 0.6,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 10, // Minimal padding at the bottom
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 12,
    opacity: 0.7,
  }
});

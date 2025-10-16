import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    StyleSheet,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { About } from '../components/about/About';
import { Dashboard } from '../components/dashboard/Dashboard';
import { Help } from '../components/help/Help';
import { BottomNavigation } from '../components/navigation/BottomNavigation';
import { Header } from '../components/navigation/Header';
import { Operations } from '../components/operations/Operations';
import { Reports } from '../components/reports/Reports';
import { Resources } from '../components/resources/Resources';
import { Settings } from '../components/settings/Settings';
import { SitRep } from '../components/sitrep/SitRep';
import { UserManagement } from '../components/user-management/UserManagement';

export default function IndexScreen() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const colorScheme = useColorScheme();
  const { isDark } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(20);
  
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

  // Redirect to login if not authenticated
  useEffect(() => {
    // Add a small delay to ensure Firebase auth state is properly initialized
    const redirectTimer = setTimeout(() => {
      if (!isLoading && !isAuthenticated) {
        console.log('Redirecting to login - not authenticated');
        router.replace('/login');
      }
    }, 100); // Small delay to ensure auth state is stable

    return () => clearTimeout(redirectTimer);
  }, [isLoading, isAuthenticated, router]);

  // Show loading state if auth is still loading
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {/* You can add a loading spinner here */}
      </View>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

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
              <Dashboard />
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
          {activeTab === 'help' && (
            <View style={{ flex: 1 }}>
              <Help />
            </View>
          )}
          {activeTab === 'about' && (
            <View style={{ flex: 1 }}>
              <About />
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
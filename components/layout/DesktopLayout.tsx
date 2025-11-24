import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import {
    Animated,
    Platform,
    StyleSheet,
    View
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Dashboard } from '../dashboard/Dashboard';
import { DesktopHeader } from '../navigation/DesktopHeader';
import { Sidebar } from '../navigation/Sidebar';
import { Operations } from '../operations/Operations';
import { Reports } from '../reports/Reports';
import { Resources } from '../resources/Resources';
import { Settings } from '../settings/Settings';
import { SitRep } from '../sitrep/SitRep';
import { UserManagement } from '../user-management/UserManagement';
import WeatherStation from '../weather-station/WeatherStation';

interface DesktopLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const getPageTitle = (activeTab: string): string => {
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
  return titles[activeTab] || 'Dashboard';
};

export function DesktopLayout({ activeTab, onTabChange }: DesktopLayoutProps) {
  const colorScheme = useColorScheme();
  const { isDark } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Animation values
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);

  // Update document title for web based on active tab
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const pageTitle = getPageTitle(activeTab);
      document.title = `Respondr - ${pageTitle}`;
    }
  }, [activeTab]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Background gradient */}
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['#121212', '#1E1E1E', '#121212']
            : [colors.background, '#f5f7fa', colors.background]
        }
        style={styles.backgroundGradient}
      />

      <View style={styles.container}>
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          <DesktopHeader title={getPageTitle(activeTab)} />

          <View style={styles.contentWrapper}>
            <Animated.View
              key={activeTab}
              style={[
                styles.contentContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Render only the active component */}
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'operations' && <Operations />}
              {activeTab === 'resources' && <Resources />}
              {activeTab === 'sitrep' && <SitRep />}
              {activeTab === 'user-management' && <UserManagement />}
              {activeTab === 'weather-station' && <WeatherStation />}
              {activeTab === 'reports' && <Reports />}
              {activeTab === 'settings' && <Settings />}
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  contentWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
});
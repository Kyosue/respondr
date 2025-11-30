import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { LogoutModal } from '@/components/modals/LogoutModal';
import { ThemedText } from '@/components/ThemedText';
import { BOTTOM_TABS, getMenuItems } from '@/config/navigation';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLogin } from '@/hooks/useLogin';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user } = useAuth();
  const { logout } = useLogin();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Get menu items based on user role
  const menuItems = user?.userType ? getMenuItems(user.userType) : [];
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/login');
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <SafeAreaView 
      style={[
        styles.sidebar, 
        { 
          backgroundColor: colors.surface, 
          borderRightColor: colors.border,
          width: isCollapsed ? 80 : 250,
          flex: 1,
        }
      ]}
      edges={['top', 'left']}
    >
      {/* Logo Section with Toggle */}
      <View style={styles.logoSection}>
        <TouchableOpacity 
          style={styles.logoContainer}
          onPress={isCollapsed ? toggleCollapse : undefined}
          activeOpacity={isCollapsed ? 0.7 : 1}
        >
          <Image
            source={require('@/assets/images/logo-1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        {!isCollapsed && (
          <View style={styles.logoTextContainer}>
            <ThemedText type="subtitle" style={styles.appName}>
              Respondr
            </ThemedText>
          </View>
        )}
        
        {!isCollapsed && (
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={toggleCollapse}
            activeOpacity={0.7}
          >
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <Svg viewBox="0 0 24 24" width={26} height={26}>
                <Path 
                  d="M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2H6a2 2 0 0 1 -2 -2z" 
                  stroke={colors.text} 
                  fill="none" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <Path 
                  d="M15 4v16" 
                  stroke={colors.text} 
                  fill="none" 
                  strokeWidth="1.5" 
                />
                <Path 
                  d="m9 10 2 2 -2 2" 
                  stroke={colors.text} 
                  fill="none" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </Svg>
            </View>
          </TouchableOpacity>
        )}
      </View>


      {/* Bottom Tabs (Primary Navigation) */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!isCollapsed && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text, opacity: 0.6 }]}>
              Main
            </ThemedText>
          </View>
        )}
        <View style={styles.section}>
          {BOTTOM_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.menuItem,
                  isActive && [
                    styles.activeMenuItem,
                    {
                      backgroundColor: `${colors.primary}15`,
                      borderLeftColor: colors.primary,
                    }
                  ]
                ]}
                onPress={() => onTabChange(tab.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    isActive
                      ? tab.icon.replace('-outline', '') as any
                      : tab.icon as any
                  }
                  size={22}
                  color={isActive ? colors.primary : colors.text}
                />
                {!isCollapsed && (
                  <ThemedText
                    style={[
                      styles.menuItemText,
                        {
                        color: isActive ? colors.primary : colors.text,
                        fontWeight: isActive ? '600' : '500'
                      }
                    ]}
                  >
                    {tab.id === 'sitrep' ? 'Situation Report' : tab.label}
                  </ThemedText>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Divider for collapsed state */}
        {isCollapsed && (
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        )}

        {/* Hamburger Menu Items (Secondary Navigation) */}
        {!isCollapsed && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text, opacity: 0.6 }]}>
              More
            </ThemedText>
          </View>
        )}
        <View style={styles.section}>
          {menuItems.filter(item => item.id !== 'logout').map((item) => {
            const isActive = activeTab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  isActive && [
                    styles.activeMenuItem,
                    {
                      backgroundColor: `${colors.primary}15`,
                      borderLeftColor: colors.primary,
                    }
                  ]
                ]}
                onPress={() => onTabChange(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    isActive
                      ? item.icon.replace('-outline', '') as any
                      : item.icon as any
                  }
                  size={22}
                  color={isActive ? colors.primary : colors.text}
                />
                {!isCollapsed && (
                  <ThemedText
                    style={[
                      styles.menuItemText,
                      {
                        color: isActive ? colors.primary : colors.text,
                        fontWeight: isActive ? '600' : '500'
                      }
                    ]}
                  >
                    {item.title}
                  </ThemedText>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutButton, { borderTopColor: colors.border }]}
        onPress={handleLogoutPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={menuItems.find(item => item.id === 'logout')?.icon as any}
          size={22}
          color={colors.error}
        />
        {!isCollapsed && (
          <ThemedText style={[styles.logoutText, { color: colors.error }]}>
            {menuItems.find(item => item.id === 'logout')?.title}
          </ThemedText>
        )}
      </TouchableOpacity>

      {/* Logout Modal */}
      <LogoutModal
        visible={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      },
    }),
  },
  logoSection: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 50,
    height: 50,
  },
  logoTextContainer: {
    flex: 1,
  },
  appName: {
    fontWeight: 'bold',
    fontSize: 24,
    lineHeight: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
  },
  activeMenuItem: {
    borderLeftWidth: 3,
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: Platform.OS === 'web' ? 0 : 8,
  },
  logoutText: {
    marginLeft: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  toggleButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    marginVertical: 8,
  },
});


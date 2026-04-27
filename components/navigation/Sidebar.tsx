import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

interface SidebarNavItem {
  item: { id: string; icon: string; label?: string; title?: string };
  isActive: boolean;
  isCollapsed: boolean;
  colors: any;
  onPress: () => void;
}

function NavItem({ item, isActive, isCollapsed, colors, onPress }: SidebarNavItem) {
  const label = item.id === 'sitrep' ? 'Situation Report' : (item.label || item.title || item.id);
  const iconName = isActive ? item.icon.replace('-outline', '') : item.icon;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navItem,
        {
          borderColor: isActive ? `${colors.primary}75` : 'transparent',
          backgroundColor: isActive ? `${colors.primary}0F` : 'transparent',
          opacity: pressed ? 0.68 : 1,
        },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name={iconName as any}
          size={20}
          color={isActive ? colors.primary : `${colors.text}AA`}
        />
      </View>
      {!isCollapsed && (
        <ThemedText
          style={[
            styles.navText,
            {
              color: isActive ? colors.text : `${colors.text}BF`,
              fontWeight: isActive ? '600' : '500',
            },
          ]}
        >
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user } = useAuth();
  const { logout } = useLogin();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = user?.userType ? getMenuItems(user.userType) : [];
  const secondaryItems = useMemo(
    () => menuItems.filter(item => item.id !== 'logout'),
    [menuItems],
  );

  const logoutItem = menuItems.find(item => item.id === 'logout');

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView
      style={[
        styles.sidebar,
        {
          backgroundColor: colorScheme === 'dark' ? '#15171C' : '#FFFFFF',
          borderRightColor: colorScheme === 'dark' ? '#262A33' : '#EAECF0',
          width: isCollapsed ? 72 : 248,
        },
      ]}
      edges={['top']}
    >
      <View style={[styles.header, { borderBottomColor: colorScheme === 'dark' ? '#262A33' : '#EAECF0' }]}>
        <View style={styles.brandWrap}>
          <Pressable
            onPress={isCollapsed ? () => setIsCollapsed(false) : undefined}
            style={[styles.logoBadge, { backgroundColor: colorScheme === 'dark' ? '#222633' : '#EEF0FF' }]}
          >
            <Image
              source={require('@/assets/images/respondr_foreground.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Pressable>
          {!isCollapsed && (
            <View>
              <ThemedText style={[styles.brandName, { color: colors.text }]}>Respondr</ThemedText>
              <ThemedText style={[styles.brandTagline, { color: `${colors.text}99` }]}>
                Command Center
              </ThemedText>
            </View>
          )}
        </View>
        {!isCollapsed && (
          <Pressable style={styles.collapseButton} onPress={() => setIsCollapsed(true)} hitSlop={6}>
            <Ionicons
              name="chevron-back"
              size={18}
              color={`${colors.text}8C`}
            />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.navSection}>
          {!isCollapsed && (
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>Operations</ThemedText>
            </View>
          )}
          {BOTTOM_TABS.map((tab) => (
            <NavItem
              key={tab.id}
              item={tab}
              isActive={activeTab === tab.id}
              isCollapsed={isCollapsed}
              colors={colors}
              onPress={() => onTabChange(tab.id)}
            />
          ))}
        </View>

        <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? '#262A33' : '#EEF0F4' }]} />

        <View style={styles.navSection}>
          {!isCollapsed && (
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>Management</ThemedText>
            </View>
          )}
          {secondaryItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              isCollapsed={isCollapsed}
              colors={colors}
              onPress={() => onTabChange(item.id)}
            />
          ))}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => setShowLogoutModal(true)}
        style={({ pressed }) => [
          styles.logoutButton,
          {
            borderTopColor: colorScheme === 'dark' ? '#262A33' : '#EEF0F4',
            backgroundColor: pressed
              ? `${colors.error}24`
              : (colorScheme === 'dark' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)'),
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            paddingHorizontal: isCollapsed ? 0 : 20,
          },
        ]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name={(logoutItem?.icon || 'log-out-outline') as any} size={20} color={colors.error} />
        </View>
        {!isCollapsed && (
          <ThemedText style={[styles.logoutText, { color: colors.error }]}>
            {logoutItem?.title || 'Logout'}
          </ThemedText>
        )}
      </Pressable>

      <LogoutModal
        visible={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    height: '100%',
    borderRightWidth: StyleSheet.hairlineWidth,
    marginLeft: 0,
    paddingLeft: 0,
  },
  header: {
    minHeight: 76,
    borderBottomWidth: 0,
    paddingLeft: 14,
    paddingRight: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flexShrink: 1,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 24,
    height: 24,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '700',
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: -2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 10,
  },
  navSection: {
    paddingTop: 6,
    paddingBottom: 4,
  },
  sectionHeader: {
    minHeight: 32,
    marginBottom: 2,
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapseButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  navItem: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    justifyContent: 'flex-start',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 16,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 10,
    marginBottom: 8,
    marginHorizontal: 10,
  },
  logoutButton: {
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 58,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
  },
});


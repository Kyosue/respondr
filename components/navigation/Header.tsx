import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Animated,
    Image,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import { LogoutModal } from '@/components/modals/LogoutModal';
import { ThemedText } from '@/components/ThemedText';
import { NotificationButton } from '@/components/ui/NotificationButton';
import { ProfileButton } from '@/components/ui/ProfileButton';
import { getMenuItems } from '@/config/navigation';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLogin } from '@/hooks/useLogin';

interface HeaderProps {
  userName: string;
  onTabChange?: (tab: string) => void;
  currentTab?: string;
}

export function Header({ userName, onTabChange, currentTab }: HeaderProps) {
  const { user } = useAuth();
  const { logout } = useLogin();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [menuAnimation] = useState(new Animated.Value(-300)); // Start from -300 (left side)
  
  // Get menu items based on user role
  const menuItems = user?.userType ? getMenuItems(user.userType) : [];

  // Get first and last word from user's full name
  const getUserDisplayName = (fullName?: string) => {
    if (!fullName) return '';
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length === 1) return nameParts[0];
    return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
  };

  const displayName = getUserDisplayName(user?.fullName || userName);

  const toggleMenu = () => {
    if (menuVisible) {
      // Close menu
      Animated.timing(menuAnimation, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setMenuVisible(false);
      });
    } else {
      // Open menu
      setMenuVisible(true);
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogoutPress = () => {
    toggleMenu();
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

  const handleMenuItemPress = (itemId: string) => {
    toggleMenu();
    if (onTabChange) {
      onTabChange(itemId);
    }
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Ionicons 
            name="menu-outline" 
            size={28} 
            color={colors.text} 
          />
        </TouchableOpacity>
        
        {displayName ? (
          <View style={styles.nameContainer}>
            <ThemedText style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </ThemedText>
          </View>
        ) : null}
        
        <View style={styles.rightSection}>
          <NotificationButton
            buttonSize={36}
            iconSize={18}
            dropdownWidth={320}
            dropdownMaxHeight={400}
            onNavigate={onTabChange}
          />
          <ProfileButton
            buttonSize={36}
            iconSize={16}
            dropdownWidth={320}
            dropdownMaxHeight={600}
            dropdownHeightPercentage={0.9}
          />
        </View>
      </View>

      {/* Side Menu */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleMenu}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            activeOpacity={1}
            onPress={toggleMenu}
          />
          
          <Animated.View 
            style={[
              styles.sideMenu,
              { 
                backgroundColor: colors.surface,
                borderRightColor: colors.border,
                transform: [{ translateX: menuAnimation }]
              }
            ]}
          >
            <View style={styles.menuHeader}>
              <Image
                source={require('@/assets/images/respondr_foreground.png')}
                style={styles.menuLogo}
                resizeMode="contain"
              />
              <ThemedText type="subtitle" style={styles.appName}>
                Respondr
              </ThemedText>
            </View>
            
            <View style={styles.menuItems}>
              {menuItems.filter(item => item.id !== 'logout').map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[
                      styles.menuItem,
                      isActive && [
                        styles.activeMenuItem,
                        { 
                          backgroundColor: `${colors.primary}15`,
                          borderLeftColor: colors.primary
                        }
                      ]
                    ]}
                    onPress={() => handleMenuItemPress(item.id)}
                  >
                    <Ionicons 
                      name={item.icon as any} 
                      size={22} 
                      color={isActive ? colors.primary : colors.text} 
                    />
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
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {/* Logout button at the bottom */}
            <TouchableOpacity 
              style={[styles.logoutButton, { borderTopColor: colors.border }]}
              onPress={handleLogoutPress}
            >
              <Ionicons 
                name={menuItems.find(item => item.id === 'logout')?.icon as any} 
                size={22} 
                color={colors.error} 
              />
              <ThemedText style={[styles.logoutText, { color: colors.error }]}>
                {menuItems.find(item => item.id === 'logout')?.title}
              </ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Logout Modal */}
      <LogoutModal
        visible={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: Platform.OS === 'android' ? 5 : 12, // Add extra padding for Android status bar
  },
  menuButton: {
    padding: 8,
  },
  nameContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sideMenu: {
    width: 250,
    height: '100%',
    borderRightWidth: 0.5,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderColor: 'rgba(200, 200, 200, 0.3)',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuHeader: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 40,
  },
  menuLogo: {
    width: 70,
    height: 70,
    marginBottom: 16,
  },
  appName: {
    marginTop: -5,
    fontWeight: 'bold',
    fontSize: 24,
    textAlign: 'center',
  },
  menuItems: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeMenuItem: {
    borderLeftWidth: 3,
    borderLeftColor: 'transparent', // Will be set dynamically
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 'auto',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  logoutText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});


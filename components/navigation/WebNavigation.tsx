import { usePlatform } from '@/hooks/usePlatform';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WebNavigationProps {
  currentRoute?: string;
}

export function WebNavigation({ currentRoute }: WebNavigationProps) {
  const { isWeb } = usePlatform();
  const router = useRouter();

  if (!isWeb) {
    return null;
  }

  const navigationItems = [
    { name: 'Dashboard', route: '/', icon: '🏠' },
    { name: 'Resources', route: '/resources', icon: '📦' },
    { name: 'Operations', route: '/operations', icon: '⚙️' },
    { name: 'SitRep', route: '/sitrep', icon: '📊' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>Respondr</Text>
      </View>
      
      <View style={styles.navItems}>
        {navigationItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.navItem,
              currentRoute === item.route && styles.activeNavItem
            ]}
            onPress={() => router.push(item.route)}
          >
            <Text style={styles.navIcon}>{item.icon}</Text>
            <Text style={[
              styles.navText,
              currentRoute === item.route && styles.activeNavText
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 250,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    padding: 16,
  },
  logo: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  navItems: {
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },
  activeNavItem: {
    backgroundColor: '#eff6ff',
  },
  navIcon: {
    fontSize: 18,
  },
  navText: {
    fontSize: 16,
    color: '#374151',
  },
  activeNavText: {
    color: '#2563eb',
    fontWeight: '600',
  },
});

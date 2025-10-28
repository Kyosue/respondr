import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { generateDisplayName } from '@/utils/nameUtils';

interface DesktopHeaderProps {
  title?: string;
}

export function DesktopHeader({ title }: DesktopHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  // Map user role to color
  const getUserTypeColor = (userType?: 'admin' | 'supervisor' | 'operator') => {
    switch (userType) {
      case 'admin': return '#EF4444';
      case 'supervisor': return '#F59E0B';
      case 'operator': return '#3B82F6';
      default: return colors.primary;
    }
  };

  // Get first letter of name for avatar placeholder
  const nameInitial = user?.fullName?.charAt(0).toUpperCase() || 'U';

  return (
    <SafeAreaView edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.userProfile}>
          <ThemedText style={styles.userName} numberOfLines={1}>
            {generateDisplayName(user?.fullName || 'User')}
          </ThemedText>
          <View style={[styles.avatar, { backgroundColor: getUserTypeColor(user?.userType as any) }]}>
            <ThemedText style={styles.avatarText} darkColor="#000" lightColor="#fff">
              {nameInitial}
            </ThemedText>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});


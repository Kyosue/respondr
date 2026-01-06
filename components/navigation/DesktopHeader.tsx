import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { NotificationButton } from '@/components/ui/NotificationButton';
import { ProfileButton } from '@/components/ui/ProfileButton';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

interface DesktopHeaderProps {
  title?: string;
  onTabChange?: (tab: string, params?: any) => void;
}

export function DesktopHeader({ title, onTabChange }: DesktopHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  // Get first and last word from user's full name
  const getUserDisplayName = (fullName?: string) => {
    if (!fullName) return '';
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length === 1) return nameParts[0];
    return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
  };

  const displayName = getUserDisplayName(user?.fullName);

  return (
    <SafeAreaView edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {displayName ? (
          <View style={styles.nameContainer}>
            <ThemedText style={[styles.userName, { color: colors.text }]}>
              {displayName}
            </ThemedText>
          </View>
        ) : null}
        <View style={styles.rightSection}>
          <NotificationButton
            buttonSize={40}
            iconSize={20}
            dropdownWidth={360}
            dropdownMaxHeight={500}
            onNavigate={onTabChange}
          />
          <ProfileButton
            buttonSize={40}
            iconSize={18}
            dropdownWidth={360}
            dropdownMaxHeight={500}
          />
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});


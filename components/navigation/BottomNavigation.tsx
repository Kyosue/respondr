import { Ionicons } from '@expo/vector-icons';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { BOTTOM_TABS } from '@/config/navigation';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const tabs = BOTTOM_TABS;

  return (
    <View style={styles.outerContainer}>
      <View style={[
        styles.container,
        { 
          backgroundColor: Platform.OS === 'ios' ? 
            `${colors.surface}F0` : // Semi-transparent for iOS
            colors.surface,
          ...Platform.select({
            ios: {
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
            },
            android: {
              elevation: 8,
            },
          }),
        }
      ]}>
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tab}
                onPress={() => onTabChange(tab.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.tabContent,
                  isActive && [
                    styles.tabContentActive,
                    {
                      backgroundColor: colors.background,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: colors.border,
                    },
                  ],
                ]}>
                  <Ionicons
                    name={isActive
                      ? tab.icon.replace('-outline', '') as any
                      : tab.icon as any}
                    size={22}
                    color={isActive ? colors.primary : colors.tabIconDefault}
                  />
                  {isActive && (
                    <ThemedText
                      style={[styles.tabLabel, { color: colors.primary }]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </ThemedText>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    alignItems: 'center',
  },
  container: {
    borderRadius: 150, // Rounded corners
    paddingVertical: 5,
    paddingHorizontal: 2,
    width: '90%', // Not full width
    maxWidth: 500,
    marginBottom: Platform.OS === 'ios' ? 10 : 8, // Space from bottom
    borderWidth: 0.5,
    borderColor: 'rgba(200, 200, 200, 0.3)', // Subtle border
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 4,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 16,
    minWidth: 40,
  },
  tabContentActive: {
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 72,
  },
});

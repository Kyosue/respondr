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
          backgroundColor: Platform.OS === 'ios' ? `${colors.surface}F5` : colors.surface,
          borderColor: colors.border,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            },
            android: {
              elevation: 6,
            },
          }),
        },
      ]}>
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tab}
                onPress={() => onTabChange(tab.id)}
                activeOpacity={0.6}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
              >
                <View
                  style={[
                    styles.tabContent,
                    isActive && [
                      styles.tabContentActive,
                      {
                        backgroundColor: colorScheme === 'dark'
                          ? 'rgba(76, 201, 240, 0.14)'
                          : 'rgba(67, 97, 238, 0.1)',
                        borderColor: colors.border,
                      },
                    ],
                  ]}
                >
                  <Ionicons
                    name={
                      isActive
                        ? (tab.icon.replace('-outline', '') as any)
                        : (tab.icon as any)
                    }
                    size={24}
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
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingTop: 8,
    alignItems: 'center',
  },
  container: {
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 10,
    width: '92%',
    maxWidth: 480,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 18,
    minWidth: 44,
    minHeight: 44,
  },
  tabContentActive: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 76,
    letterSpacing: 0.2,
  },
});

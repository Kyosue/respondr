import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Custom Bottom Tab Bar component for React Navigation
 * This component provides a floating, rounded bottom tab bar with proper styling
 */
export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.outerContainer}>
      <View style={[
        styles.container,
        { 
          backgroundColor: Platform.OS === 'ios' ? 
            `${colors.surface}F0` : // Semi-transparent for iOS
            colors.surface,
          borderColor: 'rgba(200, 200, 200, 0.3)', // Subtle border
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
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            // Get icon from options
            const iconName = options.tabBarIcon
              ? options.tabBarIcon({ focused: isFocused, color: '', size: 0 })
              : 'apps-outline'; // Default icon

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={route.name}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tab}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.tabContent,
                  isFocused && [
                    styles.activeTabContent,
                    { backgroundColor: `${colors.primary}15` }
                  ]
                ]}>
                  <Ionicons
                    name={typeof iconName === 'string' ? iconName as any : 'apps-outline'}
                    size={22}
                    color={isFocused ? colors.primary : colors.tabIconDefault}
                  />
                  <ThemedText
                    style={[
                      styles.tabLabel,
                      { color: isFocused ? colors.primary : colors.text }
                    ]}
                  >
                    {label as string}
                  </ThemedText>
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
    borderRadius: 30, // Rounded corners
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: '90%', // Not full width
    maxWidth: 500,
    marginBottom: Platform.OS === 'ios' ? 10 : 8, // Space from bottom
    borderWidth: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Even spacing
    alignItems: 'center',
    width: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16, // Rounded active tab background
    minWidth: 60, // Ensure minimum width
  },
  activeTabContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

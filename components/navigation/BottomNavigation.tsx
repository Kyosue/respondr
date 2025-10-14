import { Ionicons } from '@expo/vector-icons';
import {
    Dimensions,
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
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.tabContent
              ]}>
                <Ionicons
                  name={activeTab === tab.id 
                    ? tab.icon.replace('-outline', '') // Remove -outline to get filled version
                    : tab.icon as any}
                  size={22}
                  color={activeTab === tab.id ? colors.primary : colors.tabIconDefault}
                />
                <ThemedText
                  style={[
                    styles.tabLabel,
                    { color: activeTab === tab.id ? colors.primary : colors.text }
                  ]}
                >
                  {tab.label}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const tabWidth = Math.min(width / 5, 80);

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
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: '20%',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 0,
    fontWeight: '500',
  },
});

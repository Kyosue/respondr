import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type TabType = 'details' | 'history' | 'images' | 'borrowed';

interface ResourceDetailTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function ResourceDetailTabs({ activeTab, onTabChange }: ResourceDetailTabsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'details', label: 'Details', icon: 'information-circle-outline' },
    { key: 'history', label: 'History', icon: 'time-outline' },
    { key: 'images', label: 'Images', icon: 'images-outline' },
    { key: 'borrowed', label: 'Borrowed', icon: 'people-outline' },
  ];

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && { 
              backgroundColor: colors.primary + '15',
              borderBottomColor: colors.primary 
            }
          ]}
          onPress={() => onTabChange(tab.key)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={tab.icon as any}
            size={18}
            color={activeTab === tab.key ? colors.primary : colors.text + '70'}
            style={styles.tabIcon}
          />
          <ThemedText style={[
            styles.tabText,
            { color: activeTab === tab.key ? colors.primary : colors.text + '80' }
          ]}>
            {tab.label}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    marginTop: 4,
    borderRadius: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    minHeight: 48,
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

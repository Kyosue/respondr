import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { HelpSupportModal } from './modals/HelpSupportModal';
import { TermsModal } from './modals/TermsModal';

const Settings: React.FC = () => {
  const { isDark, setColorScheme } = useTheme();
  const { pushNotificationsEnabled, setPushNotificationsEnabled } = useNotifications();
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  // Settings state
  const [showTerms, setShowTerms] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleDarkModeToggle = (value: boolean) => {
    setColorScheme(value ? 'dark' : 'light');
  };


  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent,
    showArrow = true 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={icon === 'sunny' ? '#FFA500' : icon === 'moon' ? '#4A90E2' : colors.primary} 
          />
        </View>
        <View style={styles.settingText}>
          <ThemedText style={styles.settingTitle}>{title}</ThemedText>
          {subtitle && (
            <ThemedText style={[styles.settingSubtitle, { color: colors.text + '80' }]}>
              {subtitle}
            </ThemedText>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && onPress && (
          <Ionicons name="chevron-forward" size={16} color={colors.icon} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Settings</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.text + '80' }]}>
            Manage your app preferences
          </ThemedText>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.primary }]}>
            General
          </ThemedText>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <SettingItem
              icon="notifications-outline"
              title="Push Notifications"
              subtitle={pushNotificationsEnabled ? "Receive alerts and updates" : "Notifications are disabled"}
              rightComponent={
                <Switch
                  value={pushNotificationsEnabled}
                  onValueChange={setPushNotificationsEnabled}
                  trackColor={{ false: colors.border, true: colors.primary + '40' }}
                  thumbColor={pushNotificationsEnabled ? colors.primary : colors.icon}
                />
              }
              showArrow={false}
            />
            <SettingItem
              icon={isDark ? "moon" : "sunny"}
              title="Theme"
              subtitle={isDark ? "Currently in dark mode" : "Currently in light mode"}
              rightComponent={
                <Switch
                  value={isDark}
                  onValueChange={handleDarkModeToggle}
                  trackColor={{ false: colors.border, true: colors.primary + '40' }}
                  thumbColor={isDark ? colors.primary : colors.icon}
                />
              }
              showArrow={false}
            />
          </View>
        </View>


        {/* About */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.primary }]}>
            About
          </ThemedText>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <SettingItem
              icon="information-circle-outline"
              title="App Version"
              subtitle="1.0.0"
              showArrow={false}
            />
            <SettingItem
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="Get help and contact support"
              onPress={() => setShowHelp(true)}
            />
            <SettingItem
              icon="document-text-outline"
              title="Terms of Service"
              subtitle="Read our terms and conditions"
              onPress={() => setShowTerms(true)}
            />
          </View>
        </View>


        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
      <HelpSupportModal visible={showHelp} onClose={() => setShowHelp(false)} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    paddingBottom: 10,
  },
  title: {
    marginBottom: 0,
    height: 30,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export { Settings };


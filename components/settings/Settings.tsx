import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
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

  const getIconColor = (icon: string) => {
    if (icon === 'sunny') return isDark ? '#FFB347' : '#F59E0B';
    if (icon === 'moon') return '#6366F1';
    if (icon === 'notifications-outline') return '#EC4899';
    return colors.primary;
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightComponent,
    showArrow = true,
    isLast = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showArrow?: boolean;
    isLast?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { borderBottomColor: colors.border },
        isLast && styles.settingItemLast,
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: getIconColor(icon) + '22' }]}>
          <Ionicons name={icon as any} size={22} color={getIconColor(icon)} />
        </View>
        <View style={styles.settingText}>
          <ThemedText style={styles.settingTitle}>{title}</ThemedText>
          {subtitle && (
            <ThemedText style={[styles.settingSubtitle, { color: colors.text + '99' }]}>
              {subtitle}
            </ThemedText>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && onPress && (
          <Ionicons name="chevron-forward" size={18} color={colors.icon} />
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
          <ThemedText type="title" style={styles.title}>
            Settings
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.text + '99' }]}>
            Manage your app preferences and account
          </ThemedText>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionBadge, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="options-outline" size={14} color={colors.primary} />
            </View>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              General
            </ThemedText>
          </View>
          <View
            style={[
              styles.sectionContent,
              {
                backgroundColor: colors.surface,
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                  },
                  android: { elevation: 2 },
                }),
              },
            ]}
          >
            <SettingItem
              icon="notifications-outline"
              title="Push Notifications"
              subtitle={
                pushNotificationsEnabled
                  ? 'Receive alerts and updates'
                  : 'Notifications are disabled'
              }
              rightComponent={
                <Switch
                  value={pushNotificationsEnabled}
                  onValueChange={setPushNotificationsEnabled}
                  trackColor={{ false: colors.border, true: colors.primary + '50' }}
                  thumbColor={pushNotificationsEnabled ? colors.primary : colors.icon}
                />
              }
              showArrow={false}
              isLast={false}
            />
            <SettingItem
              icon={isDark ? 'moon' : 'sunny'}
              title="Theme"
              subtitle={isDark ? 'Dark mode' : 'Light mode'}
              rightComponent={
                <Switch
                  value={isDark}
                  onValueChange={handleDarkModeToggle}
                  trackColor={{ false: colors.border, true: colors.primary + '50' }}
                  thumbColor={isDark ? colors.primary : colors.icon}
                />
              }
              showArrow={false}
              isLast
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionBadge, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
            </View>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              About
            </ThemedText>
          </View>
          <View
            style={[
              styles.sectionContent,
              {
                backgroundColor: colors.surface,
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                  },
                  android: { elevation: 2 },
                }),
              },
            ]}
          >
            <SettingItem
              icon="information-circle-outline"
              title="App Version"
              subtitle="1.0.0"
              showArrow={false}
              isLast={false}
            />
            <SettingItem
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="Get help and contact support"
              onPress={() => setShowHelp(true)}
              isLast={false}
            />
            <SettingItem
              icon="document-text-outline"
              title="Terms of Service"
              subtitle="Read our terms and conditions"
              onPress={() => setShowTerms(true)}
              isLast
            />
          </View>
        </View>

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
    paddingTop: 8,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 28,
    position: 'relative',
  },
  title: {
    marginBottom: 4,
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginLeft: 12,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  sectionBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  sectionContent: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottomSpacing: {
    height: 24,
  },
});

export { Settings };


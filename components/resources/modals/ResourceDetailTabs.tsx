import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';

type TabType = 'details' | 'history' | 'images' | 'borrowed';

interface ResourceDetailTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function ResourceDetailTabs({ activeTab, onTabChange }: ResourceDetailTabsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  const scrollRef = useRef<ScrollView>(null);
  const [scrollState, setScrollState] = useState({ atStart: true, atEnd: false });
  const [contentWidth, setContentWidth] = useState(0);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const canScroll = contentWidth > layoutWidth;

  const handleScroll = (e: NativeSyntheticEvent<{ contentOffset: { x: number }; contentSize: { width: number }; layoutMeasurement: { width: number } }>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const atStart = contentOffset.x <= 4;
    const atEnd = contentOffset.x >= contentSize.width - layoutMeasurement.width - 4;
    setScrollState({ atStart, atEnd });
  };

  const handleContentSizeChange = (_w: number, h: number) => {
    setContentWidth(_w);
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    setLayoutWidth(e.nativeEvent.layout.width);
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'details', label: 'Details', icon: 'information-circle-outline' },
    { key: 'history', label: 'History', icon: 'time-outline' },
    { key: 'images', label: 'Images', icon: 'images-outline' },
    { key: 'borrowed', label: 'Borrowed', icon: 'people-outline' },
  ];

  const tabContent = tabs.map((tab) => {
    const isActive = activeTab === tab.key;
    return (
      <TouchableOpacity
        key={tab.key}
        style={[
          styles.tab,
          isMobile && styles.tabMobile,
          isActive && styles.tabActive,
          {
            backgroundColor: isActive ? `${colors.primary}18` : 'transparent',
          },
        ]}
        onPress={() => onTabChange(tab.key)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={tab.icon as any}
          size={20}
          color={isActive ? colors.primary : colors.icon}
          style={styles.tabIcon}
        />
        <ThemedText
          style={[
            styles.tabText,
            { color: isActive ? colors.primary : colors.text, opacity: isActive ? 1 : 0.65 },
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </ThemedText>
      </TouchableOpacity>
    );
  });

  if (isMobile) {
    return (
      <View style={styles.mobileTabWrapper}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabBarScroll, canScroll && styles.tabBarScrollPadding]}
          style={styles.tabBarScrollView}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleLayout}
          scrollEventThrottle={16}
        >
          {tabContent}
        </ScrollView>
        {canScroll && (
          <>
            {!scrollState.atStart && (
              <LinearGradient
                colors={[colors.background, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.scrollFade, styles.scrollFadeLeft]}
                pointerEvents="none"
              />
            )}
            {!scrollState.atEnd && (
              <View style={styles.scrollHintRight} pointerEvents="none">
                <LinearGradient
                  colors={[
                    'transparent',
                    `${colors.primary}12`,
                    `${colors.primary}28`,
                    `${colors.primary}48`,
                    `${colors.primary}70`,
                    colors.background,
                  ]}
                  locations={[0, 0.2, 0.4, 0.6, 0.82, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.scrollFadeRight}
                  pointerEvents="none"
                />
                <View style={[styles.scrollChevronWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </View>
              </View>
            )}
          </>
        )}
      </View>
    );
  }

  return <View style={styles.tabBar}>{tabContent}</View>;
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  mobileTabWrapper: {
    position: 'relative',
  },
  tabBarScrollView: {
    flexGrow: 0,
  },
  tabBarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  tabBarScrollPadding: {
    paddingRight: 60,
  },
  scrollFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 24,
    pointerEvents: 'none',
  },
  scrollFadeLeft: {
    left: 0,
  },
  scrollFadeRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 56,
    pointerEvents: 'none',
  },
  scrollHintRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 64,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  scrollChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    minHeight: 48,
    gap: 10,
    ...Platform.select({
      web: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 10,
        minHeight: 52,
      },
    }),
  },
  tabMobile: {
    flex: 0,
    minWidth: 120,
  },
  tabActive: {
    ...Platform.select({
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  tabIcon: {
    marginRight: 0,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    ...Platform.select({
      web: {
        fontSize: 15,
      },
    }),
  },
});

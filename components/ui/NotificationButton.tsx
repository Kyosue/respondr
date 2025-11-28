import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationButtonProps {
  notifications?: Notification[];
  buttonSize?: number;
  iconSize?: number;
  dropdownWidth?: number;
  dropdownMaxHeight?: number;
}

export function NotificationButton({
  notifications = [],
  buttonSize = 40,
  iconSize = 20,
  dropdownWidth = 360,
  dropdownMaxHeight = 500,
}: NotificationButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonRef = useRef<View>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const isWeb = Platform.OS === 'web';
  const slideAnim = useRef(new Animated.Value(isWeb ? dropdownWidth : 0)).current;

  // Measure button position
  const handleButtonLayout = () => {
    if (buttonRef.current) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        setButtonLayout({ x, y, width, height });
      });
    }
  };

  // Measure button position when opening dropdown
  const handleToggleNotification = () => {
    if (!notificationVisible) {
      // Measure button position before opening
      setTimeout(() => {
        handleButtonLayout();
      }, 0);
    }
    toggleNotification();
  };

  // Toggle notification dropdown
  const toggleNotification = () => {
    if (notificationVisible) {
      // Close animation - slide to right (desktop) or fade out (mobile)
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 250,
          useNativeDriver: true,
        }),
        ...(isWeb ? [
          Animated.timing(slideAnim, {
            toValue: dropdownWidth,
            duration: 300,
            useNativeDriver: true,
          }),
        ] : []),
      ]).start(() => {
        setNotificationVisible(false);
      });
    } else {
      // Open animation - slide from right (desktop) or fade in (mobile)
      setNotificationVisible(true);
      // Reset slide position for desktop
      if (isWeb) {
        slideAnim.setValue(dropdownWidth);
      }
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        ...(isWeb ? [
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          }),
        ] : []),
      ]).start();
    }
  };

  // Close notification when clicking outside
  const closeNotification = () => {
    if (notificationVisible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 250,
          useNativeDriver: true,
        }),
        ...(isWeb ? [
          Animated.timing(slideAnim, {
            toValue: dropdownWidth,
            duration: 300,
            useNativeDriver: true,
          }),
        ] : []),
      ]).start(() => {
        setNotificationVisible(false);
      });
    }
  };

  const badgeSize = buttonSize === 40 ? 18 : 16;
  const badgeFontSize = buttonSize === 40 ? 10 : 9;
  const badgeLineHeight = buttonSize === 40 ? 12 : 11;

  const dropdownContent = (
    <>
      <TouchableWithoutFeedback onPress={closeNotification}>
        <Animated.View 
          style={[
            styles.dropdownOverlay,
            { 
              opacity: opacityAnim,
              backgroundColor: isWeb ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.5)',
            } as any,
          ]}
        />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          styles.notificationDropdown,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.text,
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              ...(isWeb ? [{ translateX: slideAnim }] : []),
            ],
            ...(isWeb ? {
              // Desktop: Float on the right with full height and gap
              position: 'absolute' as const,
              top: 16,
              right: 16,
              bottom: 16,
              width: dropdownWidth,
              height: Dimensions.get('window').height - 32,
              maxHeight: Dimensions.get('window').height - 32,
            } : {
              maxHeight: dropdownMaxHeight,
              // Mobile: center the dropdown
              position: 'absolute' as const,
              top: (Dimensions.get('window').height - Math.min(dropdownMaxHeight, Dimensions.get('window').height - 100)) / 2,
              left: (Dimensions.get('window').width - Math.min(dropdownWidth, Dimensions.get('window').width - 32)) / 2,
              maxWidth: Dimensions.get('window').width - 32,
              width: Math.min(dropdownWidth, Dimensions.get('window').width - 32),
            }),
          },
        ]}
      >
        <View style={[styles.dropdownHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <View style={[styles.headerDivider, { backgroundColor: colors.border }]} />
          <View style={styles.headerLeft}>
            <Ionicons name="notifications" size={22} color={colors.primary} style={styles.headerIcon} />
            <View>
              <ThemedText style={[styles.dropdownTitle, { color: colors.text }]}>
                Notifications
              </ThemedText>
              {unreadCount > 0 && (
                <ThemedText style={[styles.unreadCountText, { color: colors.text, opacity: 0.6 }]}>
                  {unreadCount} {unreadCount === 1 ? 'unread' : 'unread'}
                </ThemedText>
              )}
            </View>
          </View>
          <TouchableOpacity 
            onPress={closeNotification}
            style={[styles.closeButton, { backgroundColor: `${colors.text}08` }]}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          style={styles.notificationList} 
          contentContainerStyle={styles.notificationListContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyNotifications}>
              <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.text}08` }]}>
                <Ionicons name="notifications-off-outline" size={32} color={colors.text} style={{ opacity: 0.4 }} />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                No notifications
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: colors.text, opacity: 0.6 }]}>
                You're all caught up!
              </ThemedText>
            </View>
          ) : (
            notifications.map((notification, index) => (
              <View key={notification.id}>
                <TouchableOpacity
                  style={[
                    styles.notificationItem,
                    { 
                      backgroundColor: notification.read ? colors.surface : `${colors.primary}05`,
                      borderLeftColor: notification.read ? 'transparent' : colors.primary,
                    }
                  ]}
                  activeOpacity={0.7}
                >
                <View style={[
                  styles.notificationIconContainer,
                  { backgroundColor: notification.read ? `${colors.text}08` : `${colors.primary}15` }
                ]}>
                  <Ionicons 
                    name={
                      notification.title.toLowerCase().includes('operation') ? 'flash' :
                      notification.title.toLowerCase().includes('resource') ? 'cube' :
                      notification.title.toLowerCase().includes('weather') ? 'cloud' :
                      'notifications'
                    } 
                    size={18} 
                    color={notification.read ? colors.text : colors.primary}
                    style={{ opacity: notification.read ? 0.6 : 1 }}
                  />
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <ThemedText style={[
                      styles.notificationTitle, 
                      { 
                        color: colors.text,
                        fontWeight: notification.read ? '500' : '600',
                      }
                    ]}>
                      {notification.title}
                    </ThemedText>
                    {!notification.read && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <ThemedText 
                    style={[styles.notificationMessage, { color: colors.text, opacity: notification.read ? 0.6 : 0.8 }]}
                    numberOfLines={2}
                  >
                    {notification.message}
                  </ThemedText>
                  <View style={styles.notificationFooter}>
                    <Ionicons name="time-outline" size={12} color={colors.text} style={{ opacity: 0.4 }} />
                    <ThemedText style={[styles.notificationTime, { color: colors.text, opacity: 0.5 }]}>
                      {notification.time}
                    </ThemedText>
                  </View>
                </View>
                </TouchableOpacity>
                {index < notifications.length - 1 && (
                  <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </>
  );

  return (
    <View style={styles.notificationContainer}>
      <View
        ref={buttonRef}
        onLayout={handleButtonLayout}
        collapsable={false}
      >
        <TouchableOpacity 
          style={[
            styles.notificationButton,
            {
              backgroundColor: `${colors.primary}15`,
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
            }
          ]}
          onPress={handleToggleNotification}
          activeOpacity={1}
          {...Platform.select({
            android: {
              android_ripple: { color: 'transparent' },
            },
          })}
        >
        <Ionicons 
          name="notifications-outline" 
          size={iconSize} 
          color={colors.text} 
        />
        {unreadCount > 0 && (
          <View style={[
            styles.notificationBadge,
            {
              backgroundColor: colors.error,
              width: unreadCount > 9 ? (badgeSize + 4) : badgeSize,
              minWidth: unreadCount > 9 ? (badgeSize + 4) : badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            }
          ]}>
            <ThemedText style={[
              styles.badgeText,
              {
                fontSize: badgeFontSize,
                lineHeight: badgeLineHeight,
              }
            ]} numberOfLines={1}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </ThemedText>
          </View>
        )}
        </TouchableOpacity>
      </View>

      {/* Notification Dropdown */}
      {notificationVisible && (
        <Modal
          visible={notificationVisible}
          transparent
          animationType="none"
          onRequestClose={closeNotification}
        >
          {dropdownContent}
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'relative',
    ...Platform.select({
      web: {
        zIndex: 10000,
      },
    }),
  },
  notificationButton: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...Platform.select({
      web: {
        position: 'fixed',
        zIndex: 99998,
      },
      default: {
        zIndex: 999,
      },
    }),
  },
  notificationDropdown: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        zIndex: 99999,
        boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
      },
      ios: {
        right: 0,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        right: 0,
        zIndex: 1000,
        elevation: 12,
      },
    }),
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    position: 'relative',
  },
  headerDivider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  unreadCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationList: {
    flex: 1,
    ...Platform.select({
      web: {
        // maxHeight removed for web to allow full height
      },
      default: {
        maxHeight: 400,
      },
    }),
  },
  notificationListContent: {
    flexGrow: 1,
    ...Platform.select({
      web: {
        minHeight: '100%',
      },
    }),
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 18,
    paddingHorizontal: 20,
    borderLeftWidth: 3,
    minHeight: 84,
  },
  itemDivider: {
    height: 1,
    marginLeft: 20,
    marginRight: 20,
    opacity: 0.2,
  },
  notificationIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  emptyNotifications: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});


import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useNotifications } from '@/contexts/NotificationContext';
import { useColorScheme } from '@/hooks/useColorScheme';

interface NotificationButtonProps {
  buttonSize?: number;
  iconSize?: number;
  dropdownWidth?: number;
  dropdownMaxHeight?: number;
  onNavigate?: (tab: string, params?: any) => void;
}

export function NotificationButton({
  buttonSize = 40,
  iconSize = 20,
  dropdownWidth = 360,
  dropdownMaxHeight = 500,
  onNavigate,
}: NotificationButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { notifications, unreadCount, markAsRead, markAllAsRead, handleNotificationPress } = useNotifications();

  // Get notification type styling
  const getNotificationTypeStyle = (type: string, priority: string, read: boolean) => {
    const isOperation = type.includes('operation');
    const isResource = type.includes('resource');
    const isWeather = type.includes('weather');
    const isDocument = type.includes('document') || type.includes('sitrep');
    const isUser = type.includes('user');
    const isSystem = type.includes('system');

    // Type-specific colors
    const typeColors = {
      operation: { primary: '#FF6B35', light: '#FF6B3515', border: '#FF6B35' },
      resource: { primary: '#4ECDC4', light: '#4ECDC415', border: '#4ECDC4' },
      weather: { primary: '#45B7D1', light: '#45B7D115', border: '#45B7D1' },
      document: { primary: '#96CEB4', light: '#96CEB415', border: '#96CEB4' },
      user: { primary: '#FFEAA7', light: '#FFEAA715', border: '#FFEAA7' },
      system: { primary: '#DDA15E', light: '#DDA15E15', border: '#DDA15E' },
    };

    let selectedType = 'system';
    if (isOperation) selectedType = 'operation';
    else if (isResource) selectedType = 'resource';
    else if (isWeather) selectedType = 'weather';
    else if (isDocument) selectedType = 'document';
    else if (isUser) selectedType = 'user';

    const typeColor = typeColors[selectedType as keyof typeof typeColors];

    // Priority-based intensity
    const priorityMultipliers: Record<string, number> = {
      urgent: 1.0,
      high: 0.8,
      normal: 0.6,
      low: 0.4,
    };
    const priorityMultiplier = priorityMultipliers[priority] || 0.6;

    return {
      backgroundColor: read 
        ? colors.surface 
        : `${typeColor.primary}${Math.round(priorityMultiplier * 20).toString(16).padStart(2, '0')}`,
      borderLeftColor: read ? 'transparent' : typeColor.border,
      iconColor: read ? colors.text : typeColor.primary,
      iconBackground: read 
        ? `${colors.text}08` 
        : `${typeColor.primary}${Math.round(priorityMultiplier * 20).toString(16).padStart(2, '0')}`,
      typeLabel: selectedType.charAt(0).toUpperCase() + selectedType.slice(1),
    };
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    if (type.includes('operation')) return 'flash';
    if (type.includes('resource')) return 'cube';
    if (type.includes('weather')) return 'cloud';
    if (type.includes('document') || type.includes('sitrep')) return 'document-text';
    if (type.includes('user')) return 'people';
    return 'notifications';
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    const priorityColors = {
      urgent: '#FF3B30',
      high: '#FF9500',
      normal: '#34C759',
      low: '#8E8E93',
    };
    return priorityColors[priority as keyof typeof priorityColors] || priorityColors.normal;
  };
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonRef = useRef<View>(null);
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
              // Mobile: center the dropdown with increased width
              position: 'absolute' as const,
              top: (Dimensions.get('window').height - Math.min(dropdownMaxHeight, Dimensions.get('window').height - 100)) / 2,
              left: (Dimensions.get('window').width - Math.min(dropdownWidth + 40, Dimensions.get('window').width - 24)) / 2,
              maxWidth: Dimensions.get('window').width - 24,
              width: Math.min(dropdownWidth + 40, Dimensions.get('window').width - 24),
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
            <>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={[styles.markAllReadButton, { backgroundColor: `${colors.primary}10` }]}
                  onPress={markAllAsRead}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[styles.markAllReadText, { color: colors.primary }]}>
                    Mark all as read
                  </ThemedText>
                </TouchableOpacity>
              )}
              {notifications.map((notification, index) => {
                const formatTime = (date: Date) => {
                  const now = new Date();
                  const diff = now.getTime() - date.getTime();
                  const minutes = Math.floor(diff / 60000);
                  const hours = Math.floor(diff / 3600000);
                  const days = Math.floor(diff / 86400000);

                  if (minutes < 1) return 'Just now';
                  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
                  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
                  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
                  return date.toLocaleDateString();
                };

                const typeStyle = getNotificationTypeStyle(notification.type, notification.priority, notification.read);
                const iconName = getNotificationIcon(notification.type);
                const priorityColor = getPriorityColor(notification.priority);

                return (
                  <View key={notification.id}>
                    <TouchableOpacity
                      style={[
                        styles.notificationItem,
                        { 
                          backgroundColor: typeStyle.backgroundColor,
                          borderLeftColor: typeStyle.borderLeftColor,
                          borderLeftWidth: notification.read ? 0 : 4,
                        }
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        handleNotificationPress(notification);
                        if (onNavigate && notification.actionData) {
                          const { type, id, tab } = notification.actionData;
                          if (tab) {
                            onNavigate(tab, { id });
                          } else if (type && id) {
                            const tabMap: { [key: string]: string } = {
                              operation: 'operations',
                              resource: 'resources',
                              document: 'reports',
                              sitrep: 'sitrep',
                              user: 'user-management',
                              weather: 'weather-station',
                            };
                            const targetTab = tabMap[type];
                            if (targetTab) {
                              onNavigate(targetTab, { id });
                            }
                          }
                        }
                        closeNotification();
                      }}
                    >
                      <View style={[
                        styles.notificationIconContainer,
                        { backgroundColor: typeStyle.iconBackground }
                      ]}>
                        <Ionicons 
                          name={iconName as any}
                          size={Platform.OS === 'web' ? 20 : 18} 
                          color={typeStyle.iconColor}
                          style={{ opacity: notification.read ? 0.7 : 1 }}
                        />
                      </View>
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationHeader}>
                          <View style={styles.titleContainer}>
                            <ThemedText style={[
                              styles.notificationTitle, 
                              { 
                                color: colors.text,
                                fontWeight: notification.read ? '500' : '600',
                              }
                            ]} numberOfLines={1}>
                              {notification.title}
                            </ThemedText>
                            {!notification.read && (
                              <View style={[styles.unreadDot, { backgroundColor: typeStyle.iconColor }]} />
                            )}
                          </View>
                          <View style={styles.badgeContainer}>
                            {(notification.priority === 'urgent' || notification.priority === 'high') && (
                              <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
                                <ThemedText style={styles.priorityBadgeText}>
                                  {notification.priority === 'urgent' ? '!' : 'H'}
                                </ThemedText>
                              </View>
                            )}
                            <View style={[styles.typeBadge, { backgroundColor: `${typeStyle.iconColor}20` }]}>
                              <ThemedText style={[styles.typeBadgeText, { color: typeStyle.iconColor }]}>
                                {typeStyle.typeLabel}
                              </ThemedText>
                            </View>
                          </View>
                        </View>
                        <ThemedText 
                          style={[styles.notificationMessage, { color: colors.text, opacity: notification.read ? 0.6 : 0.85 }]}
                          numberOfLines={2}
                        >
                          {notification.message}
                        </ThemedText>
                        <View style={styles.notificationFooter}>
                          <Ionicons name="time-outline" size={12} color={colors.text} style={{ opacity: 0.4 }} />
                          <ThemedText style={[styles.notificationTime, { color: colors.text, opacity: 0.5 }]}>
                            {formatTime(notification.createdAt)}
                          </ThemedText>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {index < notifications.length - 1 && (
                      <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />
                    )}
                  </View>
                );
              })}
            </>
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
    position: 'relative',
    ...Platform.select({
      web: {
        paddingHorizontal: 20,
        paddingVertical: 18,
      },
      default: {
        paddingHorizontal: 16,
        paddingVertical: 14,
      },
    }),
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
    borderLeftWidth: 4,
    ...Platform.select({
      web: {
        padding: 18,
        paddingHorizontal: 20,
        minHeight: 90,
      },
      default: {
        padding: 14,
        paddingHorizontal: 16,
        minHeight: 110,
      },
    }),
  },
  itemDivider: {
    height: 1,
    opacity: 0.2,
    ...Platform.select({
      web: {
        marginLeft: 20,
        marginRight: 20,
      },
      default: {
        marginLeft: 16,
        marginRight: 16,
      },
    }),
  },
  notificationIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    ...Platform.select({
      web: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 14,
        marginTop: 2,
      },
      default: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        marginTop: 0,
      },
    }),
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        paddingRight: 4,
      },
      default: {
        paddingRight: 2,
      },
    }),
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    ...Platform.select({
      web: {
        marginBottom: 8,
      },
      default: {
        marginBottom: 6,
      },
    }),
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  priorityBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        width: 20,
        height: 20,
        borderRadius: 10,
      },
      default: {
        width: 18,
        height: 18,
        borderRadius: 9,
      },
    }),
  },
  priorityBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    ...Platform.select({
      web: {
        fontSize: 10,
      },
      default: {
        fontSize: 9,
      },
    }),
  },
  typeBadge: {
    borderRadius: 10,
    ...Platform.select({
      web: {
        paddingHorizontal: 8,
        paddingVertical: 4,
      },
      default: {
        paddingHorizontal: 6,
        paddingVertical: 3,
      },
    }),
  },
  typeBadgeText: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    ...Platform.select({
      web: {
        fontSize: 10,
      },
      default: {
        fontSize: 9,
      },
    }),
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 19,
    ...Platform.select({
      web: {
        marginBottom: 10,
      },
      default: {
        marginBottom: 6,
        lineHeight: 18,
      },
    }),
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
  markAllReadButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllReadText: {
    fontSize: 13,
    fontWeight: '600',
  },
});


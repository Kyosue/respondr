import { notificationService } from '@/firebase/notifications';
import { Notification } from '@/types/Notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { useNetwork } from './NetworkContext';

// Lazy load expo-notifications only on native platforms when needed
let Notifications: any = null;
let notificationsLoaded = false;

function getNotifications() {
  if (Platform.OS === 'web') return null;
  if (notificationsLoaded) return Notifications;
  
  try {
    Notifications = require('expo-notifications');
    notificationsLoaded = true;
    return Notifications;
  } catch (error) {
    // Silently handle - expo-notifications is not available on web (expected)
    notificationsLoaded = true; // Mark as loaded to prevent retries
    return null;
  }
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  pushNotificationsEnabled: boolean;
  setPushNotificationsEnabled: (enabled: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  handleNotificationPress: (notification: Notification) => void;
}

const NOTIFICATION_PREFERENCE_KEY = '@push_notifications_enabled';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure notification handler (only on native platforms) - lazy load
// The handler checks the user's preference before showing notifications
if (Platform.OS !== 'web') {
  const NotifModule = getNotifications();
  if (NotifModule) {
    NotifModule.setNotificationHandler({
      handleNotification: async (notification: any) => {
        // Check if push notifications are enabled
        try {
          const savedPreference = await AsyncStorage.getItem(NOTIFICATION_PREFERENCE_KEY);
          const notificationsEnabled = savedPreference === null || savedPreference === 'true';
          
          if (!notificationsEnabled) {
            return {
              shouldShowAlert: false,
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: false,
              shouldShowList: false,
            };
          }
          
          return {
            shouldShowAlert: true,
            shouldPlaySound: true, // Enable sound
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          };
        } catch (error) {
          console.error('[NotificationHandler] Error checking notification preference:', error);
          // Default to showing notifications on error
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          };
        }
      },
    });
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, firebaseUser } = useAuth();
  const { isOnline } = useNetwork();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [pushNotificationsEnabled, setPushNotificationsEnabledState] = useState<boolean>(true);

  // Load notification preference on mount
  useEffect(() => {
    const loadNotificationPreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(NOTIFICATION_PREFERENCE_KEY);
        if (savedPreference !== null) {
          setPushNotificationsEnabledState(savedPreference === 'true');
        } else {
          // Default to enabled if no preference is saved
          setPushNotificationsEnabledState(true);
        }
      } catch (error) {
        console.error('Failed to load notification preference:', error);
        // Default to enabled on error
        setPushNotificationsEnabledState(true);
      }
    };

    loadNotificationPreference();
  }, []);

  // Save notification preference
  const setPushNotificationsEnabled = useCallback(async (enabled: boolean) => {
    try {
      setPushNotificationsEnabledState(enabled);
      await AsyncStorage.setItem(NOTIFICATION_PREFERENCE_KEY, enabled.toString());
    } catch (error) {
      console.error('Failed to save notification preference:', error);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const notifs = await notificationService.getNotifications(user.id);
      setNotifications(notifs);
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error refreshing notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      // Optimistically update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Request notification permissions, set up channels, and get push token (only on native platforms and when enabled)
  useEffect(() => {
    if (Platform.OS !== 'web' && pushNotificationsEnabled) {
      const NotifModule = getNotifications();
      if (NotifModule) {
        // Set up Android notification channel with sound
        if (Platform.OS === 'android') {
          NotifModule.setNotificationChannelAsync('default', {
            name: 'Default Notifications',
            importance: NotifModule.AndroidImportance.MAX,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          }).catch((err: any) => {
            console.warn('Failed to set up notification channel:', err);
          });
        }

        registerForPushNotificationsAsync().then(token => {
          if (token) {
            setExpoPushToken(token);
            // Store push token in user's Firestore document
            if (firebaseUser) {
              // You can add this to user document if needed
            }
          }
        });
      }
    } else if (Platform.OS !== 'web' && !pushNotificationsEnabled) {
      // Clear push token when notifications are disabled
      setExpoPushToken(null);
    }
  }, [firebaseUser, pushNotificationsEnabled]);

  // Set up notification listeners (only on native platforms)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const NotifModule = getNotifications();
      if (NotifModule) {
        // Handle notifications received while app is foregrounded
        const foregroundSubscription = NotifModule.addNotificationReceivedListener((notification: any) => {
          // Refresh notifications when a push notification is received
          if (user?.id) {
            refreshNotifications();
          }
        });

        // Handle notification taps
        const responseSubscription = NotifModule.addNotificationResponseReceivedListener((response: any) => {
          const data = response.notification.request.content.data;
          if (data?.notificationId && user?.id) {
            markAsRead(data.notificationId);
            // Navigation will be handled by the app when notification is pressed
          }
        });

        return () => {
          foregroundSubscription.remove();
          responseSubscription.remove();
        };
      }
    }
  }, [user?.id, refreshNotifications, markAsRead]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id || !firebaseUser || !isOnline) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    let previousNotificationIds = new Set<string>();

    // Subscribe to notifications (get all notifications, both read and unread)
    const unsubscribeNotifications = notificationService.subscribeToNotifications(
      user.id,
      (notifs) => {
        // Find new notifications (not in previous set)
        const currentNotificationIds = new Set(notifs.map(n => n.id));
        const newNotifications = notifs.filter(n => !previousNotificationIds.has(n.id) && !n.read);
        
        // Play sound for new unread notifications (only if push notifications are enabled)
        if (newNotifications.length > 0 && Platform.OS !== 'web' && pushNotificationsEnabled) {
          const NotifModule = getNotifications();
          if (NotifModule) {
            newNotifications.forEach((notification) => {
              // Trigger a local notification with sound for new notifications
              const notificationConfig: any = {
                content: {
                  title: notification.title,
                  body: notification.message,
                  data: notification.actionData || {},
                  sound: 'default', // Use default notification sound
                  priority: NotifModule.AndroidNotificationPriority.HIGH,
                },
                trigger: null, // Show immediately
              };
              
              // Set Android channel if on Android
              if (Platform.OS === 'android') {
                notificationConfig.channelId = 'default';
              }
              
              NotifModule.scheduleNotificationAsync(notificationConfig).catch((err: any) => {
                console.warn('[NotificationContext] Failed to play notification sound:', err);
              });
            });
          }
        }
        
        previousNotificationIds = currentNotificationIds;
        setNotifications(notifs);
        setIsLoading(false);
      },
      { read: undefined } // Get all notifications (read and unread)
    );

    // Subscribe to unread count
    const unsubscribeUnreadCount = notificationService.subscribeToUnreadCount(
      user.id,
      (count) => {
        setUnreadCount(count);
        // Update app badge (only on native platforms and if notifications are enabled)
        if (Platform.OS !== 'web' && pushNotificationsEnabled) {
          const NotifModule = getNotifications();
          if (NotifModule) {
            NotifModule.setBadgeCountAsync(count).catch((err: any) => {
              console.warn('Failed to set badge count:', err);
            });
          }
        } else if (Platform.OS !== 'web' && !pushNotificationsEnabled) {
          // Clear badge when notifications are disabled
          const NotifModule = getNotifications();
          if (NotifModule) {
            NotifModule.setBadgeCountAsync(0).catch((err: any) => {
              console.warn('Failed to clear badge count:', err);
            });
          }
        }
      }
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeUnreadCount();
    };
  }, [user?.id, firebaseUser, isOnline, pushNotificationsEnabled]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user?.id]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  const handleNotificationPress = useCallback((notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigation will be handled by the component that uses this context
    // The NotificationButton will handle navigation via its onNavigate prop
  }, [markAsRead]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        pushNotificationsEnabled,
        setPushNotificationsEnabled,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
        handleNotificationPress,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Register for push notifications (only on native platforms)
async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  const NotifModule = getNotifications();
  if (!NotifModule) {
    return null;
  }

  try {
    // Request permissions including sound
    const { status: existingStatus } = await NotifModule.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      // Request permissions with sound enabled
      const { status } = await NotifModule.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: false,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const token = (await NotifModule.getExpoPushTokenAsync()).data;
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}


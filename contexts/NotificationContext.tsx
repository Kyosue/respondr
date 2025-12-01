import { notificationService } from '@/firebase/notifications';
import { Notification } from '@/types/Notification';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { useNetwork } from './NetworkContext';

// Conditionally import expo-notifications only on native platforms
let Notifications: any = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch (error) {
    // Silently handle - expo-notifications is not available on web (expected)
    // and may not be available during development. All Notifications usage
    // is guarded with Platform.OS !== 'web' && Notifications checks.
  }
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  handleNotificationPress: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure notification handler (only on native platforms)
if (Notifications && Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, firebaseUser } = useAuth();
  const { isOnline } = useNetwork();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

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

  // Request notification permissions and get push token (only on native platforms)
  useEffect(() => {
    if (Platform.OS !== 'web' && Notifications) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          setExpoPushToken(token);
          // Store push token in user's Firestore document
          if (firebaseUser) {
            // You can add this to user document if needed
            console.log('Push token:', token);
          }
        }
      });
    }
  }, [firebaseUser]);

  // Set up notification listeners (only on native platforms)
  useEffect(() => {
    if (Platform.OS !== 'web' && Notifications) {
      // Handle notifications received while app is foregrounded
      const foregroundSubscription = Notifications.addNotificationReceivedListener((notification: any) => {
        console.log('Notification received:', notification);
        // Refresh notifications when a push notification is received
        if (user?.id) {
          refreshNotifications();
        }
      });

      // Handle notification taps
      const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
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
  }, [user?.id, refreshNotifications, markAsRead]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id || !firebaseUser || !isOnline) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Subscribe to notifications
    const unsubscribeNotifications = notificationService.subscribeToNotifications(
      user.id,
      (notifs) => {
        setNotifications(notifs);
        setIsLoading(false);
      },
      { read: undefined } // Get all notifications
    );

    // Subscribe to unread count
    const unsubscribeUnreadCount = notificationService.subscribeToUnreadCount(
      user.id,
      (count) => {
        setUnreadCount(count);
        // Update app badge (only on native platforms)
        if (Platform.OS !== 'web' && Notifications) {
          Notifications.setBadgeCountAsync(count).catch((err: any) => {
            console.warn('Failed to set badge count:', err);
          });
        }
      }
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeUnreadCount();
    };
  }, [user?.id, firebaseUser, isOnline]);

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
  if (Platform.OS === 'web' || !Notifications) {
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo push token:', token);
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}


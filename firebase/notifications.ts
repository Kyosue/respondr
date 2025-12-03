import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch,
  updateDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './config';
import { Notification, NotificationType, NotificationPriority, NotificationFilters } from '@/types/Notification';

const NOTIFICATIONS_COLLECTION = 'notifications';

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Convert Firestore timestamp to Date
   */
  private convertTimestamps(data: any): Notification {
    return {
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      readAt: data.readAt?.toDate ? data.readAt.toDate() : (data.readAt ? new Date(data.readAt) : undefined),
    } as Notification;
  }

  /**
   * Create a new notification
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal',
    actionData?: Notification['actionData'],
    metadata?: Notification['metadata']
  ): Promise<string> {
    try {
      const notificationRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
      
      // Build notification data, excluding undefined values (Firestore doesn't allow undefined)
      const notificationData: any = {
        userId,
        type,
        title,
        message,
        priority,
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only add actionData and metadata if they are defined
      if (actionData !== undefined) {
        notificationData.actionData = actionData;
      }
      if (metadata !== undefined) {
        notificationData.metadata = metadata;
      }

      await setDoc(notificationRef, notificationData);

      return notificationRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal',
    actionData?: Notification['actionData'],
    metadata?: Notification['metadata']
  ): Promise<string[]> {
    try {
      console.log('[NotificationService] createBulkNotifications called:', {
        userIdCount: userIds.length,
        type,
        title,
        message
      });

      if (!userIds || userIds.length === 0) {
        console.warn('[NotificationService] No user IDs provided for bulk notifications');
        return [];
      }

      const batch = writeBatch(db);
      const notificationIds: string[] = [];

      userIds.forEach((userId) => {
        const notificationRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
        notificationIds.push(notificationRef.id);
        
        // Build notification data, excluding undefined values (Firestore doesn't allow undefined)
        const notificationData: any = {
          userId,
          type,
          title,
          message,
          priority,
          read: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Only add actionData and metadata if they are defined
        if (actionData !== undefined) {
          notificationData.actionData = actionData;
        }
        if (metadata !== undefined) {
          notificationData.metadata = metadata;
        }
        
        batch.set(notificationRef, notificationData);
      });

      console.log('[NotificationService] Committing batch of', notificationIds.length, 'notifications');
      console.log('[NotificationService] Notification details:', {
        userIds: userIds.length,
        type,
        title,
        message,
        priority
      });
      await batch.commit();
      console.log('[NotificationService] Successfully created', notificationIds.length, 'notifications');
      console.log('[NotificationService] Notification IDs:', notificationIds);
      return notificationIds;
    } catch (error) {
      console.error('[NotificationService] Error creating bulk notifications:', error);
      console.error('[NotificationService] Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    filters?: NotificationFilters,
    limitCount: number = 50
  ): Promise<Notification[]> {
    try {
      let q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      // Apply filters
      if (filters?.read !== undefined) {
        q = query(q, where('read', '==', filters.read));
      }
      if (filters?.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters?.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertTimestamps({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(notificationRef, {
        updatedAt: serverTimestamp(),
      });
      // Soft delete by marking as read and removing from active queries
      // Or implement actual delete if needed
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time notifications for a user
   */
  subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
    filters?: NotificationFilters
  ): () => void {
    let unsubscribe: (() => void) | null = null;
    let hasSwitchedToFallback = false;

    const setupSubscription = (useFallbackQuery: boolean = false) => {
      try {
        let q;
        
        if (useFallbackQuery) {
          // Fallback: query without orderBy, then sort in memory
          q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('userId', '==', userId),
            limit(100) // Get more to account for no ordering
          );

          if (filters?.read !== undefined) {
            q = query(q, where('read', '==', filters.read));
          }
        } else {
          // Primary query with orderBy
          q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(50)
          );

          // Apply filters
          if (filters?.read !== undefined) {
            q = query(q, where('read', '==', filters.read));
          }
        }

        unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
          console.log('[NotificationService] Real-time notification update:', {
            userId,
            notificationCount: querySnapshot.docs.length,
            docs: querySnapshot.docs.map(d => ({ id: d.id, type: d.data().type, title: d.data().title }))
          });
          
          let notifications = querySnapshot.docs.map(doc => 
            this.convertTimestamps({ id: doc.id, ...doc.data() })
          );
          
          // Sort in memory if using fallback
          if (useFallbackQuery) {
            notifications.sort((a, b) => {
              const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
              const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
              return bTime - aTime;
            });
            notifications = notifications.slice(0, 50);
          }
          
          console.log('[NotificationService] Calling callback with', notifications.length, 'notifications');
          callback(notifications);
        }, (error: any) => {
          // Check if index is building and we haven't already switched to fallback
          const isIndexBuilding = (
            (error?.code === 'failed-precondition' || error?.code === 9) &&
            (error?.message?.includes('index') || error?.message?.includes('Index'))
          );
          
          if (!useFallbackQuery && !hasSwitchedToFallback && isIndexBuilding) {
            console.warn('Notification index is building, switching to fallback query without orderBy');
            hasSwitchedToFallback = true;
            if (unsubscribe) unsubscribe();
            setupSubscription(true); // Retry with fallback
          } else {
            console.error('Error in notification subscription:', error);
            callback([]); // Return empty array on error
          }
        });
      } catch (error) {
        console.error('Error setting up notification subscription:', error);
        callback([]);
      }
    };

    setupSubscription();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }

  /**
   * Subscribe to unread count
   */
  subscribeToUnreadCount(
    userId: string,
    callback: (count: number) => void
  ): () => void {
    let unsubscribe: (() => void) | null = null;
    let hasSwitchedToFallback = false;

    const setupSubscription = (useFallbackQuery: boolean = false) => {
      try {
        let q;
        
        if (useFallbackQuery) {
          // Fallback: query without the read filter, then filter in memory
          q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('userId', '==', userId)
          );
        } else {
          // Primary query with read filter
          q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('userId', '==', userId),
            where('read', '==', false)
          );
        }

        unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
          if (useFallbackQuery) {
            // Filter unread in memory
            const unreadCount = querySnapshot.docs.filter(doc => {
              const data = doc.data();
              return data.read === false;
            }).length;
            callback(unreadCount);
          } else {
            callback(querySnapshot.size);
          }
        }, (error: any) => {
          // Check if index is building and we haven't already switched to fallback
          const isIndexBuilding = (
            (error?.code === 'failed-precondition' || error?.code === 9) &&
            (error?.message?.includes('index') || error?.message?.includes('Index'))
          );
          
          if (!useFallbackQuery && !hasSwitchedToFallback && isIndexBuilding) {
            console.warn('Unread count index is building, switching to fallback query');
            hasSwitchedToFallback = true;
            if (unsubscribe) unsubscribe();
            setupSubscription(true); // Retry with fallback
          } else {
            console.error('Error in unread count subscription:', error);
            callback(0); // Return 0 on error
          }
        });
      } catch (error) {
        console.error('Error setting up unread count subscription:', error);
        callback(0);
      }
    };

    setupSubscription();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }
}

export const notificationService = NotificationService.getInstance();


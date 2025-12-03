import { notificationService } from '@/firebase/notifications';
import { NotificationType, NotificationPriority } from '@/types/Notification';
import { Platform } from 'react-native';

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

/**
 * Helper functions to create notifications throughout the app
 */

/**
 * Send push notification (for mobile devices)
 */
async function sendPushNotification(
  title: string,
  body: string,
  data?: any
): Promise<void> {
  if (Platform.OS === 'web') return;

  const NotifModule = getNotifications();
  if (!NotifModule) return;

  try {
    await NotifModule.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

/**
 * Notify about new operation
 */
export async function notifyOperationCreated(
  userIds: string[],
  operationId: string,
  operationTitle: string,
  createdBy: string
): Promise<void> {
  console.log('[notifyOperationCreated] Called with:', { userIds: userIds.length, operationId, operationTitle });
  
  if (!userIds || userIds.length === 0) {
    console.warn('[notifyOperationCreated] No user IDs provided, skipping notification');
    return;
  }

  const title = 'New Operation Created';
  const message = `Operation "${operationTitle}" has been created`;

  try {
    console.log('[notifyOperationCreated] Creating bulk notifications for', userIds.length, 'users');
    const notificationIds = await notificationService.createBulkNotifications(
      userIds,
      'operation_created',
      title,
      message,
      'high', // Higher priority for operation notifications
      {
        type: 'operation',
        id: operationId,
        tab: 'operations',
      }
    );
    console.log('[notifyOperationCreated] Created', notificationIds.length, 'notifications:', notificationIds);
    console.log('[notifyOperationCreated] Notification IDs:', notificationIds);

    // Firestore notifications will be picked up by the real-time listener in NotificationContext
    // Push notifications for mobile devices would require FCM/expo push tokens (device-specific)
    // The real-time subscription will automatically update the UI when notifications are created
  } catch (error) {
    console.error('[notifyOperationCreated] Error creating notifications:', error);
    throw error;
  }
}

/**
 * Notify about operation assignment
 */
export async function notifyOperationAssigned(
  userId: string,
  operationId: string,
  operationTitle: string
): Promise<void> {
  const title = 'Operation Assigned';
  const message = `You have been assigned to operation "${operationTitle}"`;

  await notificationService.createNotification(
    userId,
    'operation_assigned',
    title,
    message,
    'high',
    {
      type: 'operation',
      id: operationId,
      tab: 'operations',
    }
  );

  await sendPushNotification(title, message, {
    notificationId: 'temp',
    type: 'operation',
    id: operationId,
    tab: 'operations',
  });
}

/**
 * Notify about resource request
 */
export async function notifyResourceRequest(
  userIds: string[],
  resourceName: string,
  quantity: number,
  borrowerName: string
): Promise<void> {
  const title = 'Resource Request';
  const message = `${borrowerName} requested ${quantity} ${resourceName}`;

  await notificationService.createBulkNotifications(
    userIds,
    'resource_request',
    title,
    message,
    'normal',
    {
      type: 'resource',
      tab: 'resources',
    }
  );
}

/**
 * Notify about document assignment
 */
export async function notifyDocumentAssigned(
  userId: string,
  documentTitle: string,
  documentId: string
): Promise<void> {
  const title = 'Document Assigned';
  const message = `Document "${documentTitle}" has been assigned to you`;

  await notificationService.createNotification(
    userId,
    'document_assigned',
    title,
    message,
    'high',
    {
      type: 'document',
      id: documentId,
      tab: 'reports',
    }
  );

  await sendPushNotification(title, message, {
    notificationId: 'temp',
    type: 'document',
    id: documentId,
    tab: 'reports',
  });
}

/**
 * Notify about new user registration (admin only)
 */
export async function notifyUserRegistered(
  adminUserIds: string[],
  newUserName: string,
  newUserId: string
): Promise<void> {
  const title = 'New User Registered';
  const message = `${newUserName} has registered and needs approval`;

  await notificationService.createBulkNotifications(
    adminUserIds,
    'user_registered',
    title,
    message,
    'normal',
    {
      type: 'user',
      id: newUserId,
      tab: 'user-management',
    }
  );
}

/**
 * Notify about weather alert
 */
export async function notifyWeatherAlert(
  userIds: string[],
  alertType: string,
  message: string
): Promise<void> {
  const title = `Weather Alert: ${alertType}`;

  await notificationService.createBulkNotifications(
    userIds,
    'weather_alert',
    title,
    message,
    'urgent',
    {
      type: 'weather',
      tab: 'weather-station',
    }
  );

  // Send urgent push notifications
  for (const userId of userIds) {
    await sendPushNotification(title, message, {
      notificationId: 'temp',
      type: 'weather',
      tab: 'weather-station',
    });
  }
}

/**
 * Notify about low stock
 */
export async function notifyLowStock(
  userIds: string[],
  resourceName: string,
  currentQuantity: number
): Promise<void> {
  const title = 'Low Stock Alert';
  const message = `${resourceName} is running low (${currentQuantity} remaining)`;

  await notificationService.createBulkNotifications(
    userIds,
    'resource_low_stock',
    title,
    message,
    'high',
    {
      type: 'resource',
      tab: 'resources',
    }
  );
}

/**
 * Notify all users about PAGASA advisory level change
 */
export async function notifyAdvisoryLevelChange(
  userIds: string[],
  previousLevel: string,
  previousColor: string,
  currentLevel: string,
  currentColor: string,
  municipalityName?: string,
  isPredicted: boolean = false
): Promise<void> {
  if (!userIds || userIds.length === 0) {
    console.warn('[notifyAdvisoryLevelChange] No user IDs provided, skipping notification');
    return;
  }

  const location = municipalityName ? ` in ${municipalityName}` : '';
  const advisoryType = isPredicted ? 'Predicted' : 'Current';
  
  // Determine if it's an escalation (more severe) or de-escalation (less severe)
  const severityOrder = ['GREY', 'YELLOW', 'ORANGE', 'RED'];
  const previousSeverity = severityOrder.indexOf(previousColor);
  const currentSeverity = severityOrder.indexOf(currentColor);
  const isEscalation = currentSeverity > previousSeverity;
  const isDeEscalation = currentSeverity < previousSeverity;

  let title: string;
  let message: string;
  let priority: NotificationPriority = 'normal';

  if (isEscalation) {
    title = `⚠️ ${advisoryType} Rainfall Advisory Escalated${location}`;
    message = `Rainfall advisory has escalated from ${previousColor} (${previousLevel}) to ${currentColor} (${currentLevel})${location}. Please monitor the situation closely.`;
    priority = currentColor === 'RED' ? 'high' : 'normal';
  } else if (isDeEscalation) {
    title = `✅ ${advisoryType} Rainfall Advisory De-escalated${location}`;
    message = `Rainfall advisory has de-escalated from ${previousColor} (${previousLevel}) to ${currentColor} (${currentLevel})${location}.`;
    priority = 'normal';
  } else {
    // Same severity but different level (e.g., LIGHT to MODERATE, both GREY)
    title = `${advisoryType} Rainfall Advisory Changed${location}`;
    message = `Rainfall advisory has changed from ${previousColor} (${previousLevel}) to ${currentColor} (${currentLevel})${location}.`;
    priority = 'normal';
  }

  try {
    console.log('[notifyAdvisoryLevelChange] Creating bulk notifications for', userIds.length, 'users');
    const notificationIds = await notificationService.createBulkNotifications(
      userIds,
      'weather_advisory_change',
      title,
      message,
      priority,
      {
        type: 'weather',
        tab: 'weather-station',
      }
    );
    console.log('[notifyAdvisoryLevelChange] Created', notificationIds.length, 'notifications');
  } catch (error) {
    console.error('[notifyAdvisoryLevelChange] Error creating notifications:', error);
    throw error;
  }
}

/**
 * Generic notification creator
 */
export async function createNotification(
  userId: string | string[],
  type: NotificationType,
  title: string,
  message: string,
  priority: NotificationPriority = 'normal',
  actionData?: {
    type: 'operation' | 'resource' | 'document' | 'user' | 'weather' | 'system';
    id?: string;
    tab?: string;
  },
  sendPush: boolean = false
): Promise<void> {
  const userIds = Array.isArray(userId) ? userId : [userId];

  if (userIds.length === 1) {
    await notificationService.createNotification(
      userIds[0],
      type,
      title,
      message,
      priority,
      actionData
    );
  } else {
    await notificationService.createBulkNotifications(
      userIds,
      type,
      title,
      message,
      priority,
      actionData
    );
  }

  if (sendPush && priority !== 'low') {
    for (const uid of userIds) {
      await sendPushNotification(title, message, {
        notificationId: 'temp',
        ...actionData,
      });
    }
  }
}


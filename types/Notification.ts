export type NotificationType = 
  | 'operation_created'
  | 'operation_assigned'
  | 'operation_updated'
  | 'operation_concluded'
  | 'resource_request'
  | 'resource_assigned'
  | 'resource_low_stock'
  | 'resource_overdue'
  | 'document_assigned'
  | 'document_acknowledgment_required'
  | 'sitrep_uploaded'
  | 'user_registered'
  | 'user_status_changed'
  | 'weather_alert'
  | 'system_alert';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string; // Target user ID
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Action data for navigation
  actionData?: {
    type: 'operation' | 'resource' | 'document' | 'user' | 'weather' | 'system';
    id?: string;
    tab?: string; // For navigation
  };
  // Metadata
  metadata?: {
    [key: string]: any;
  };
}

export interface NotificationFilters {
  read?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  startDate?: Date;
  endDate?: Date;
}


import { trpc } from './trpc';

/**
 * Notification Service
 * Handles fetching and managing notifications from the server
 */

export interface Notification {
  id: string | number;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

class NotificationService {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(options?: {
    limit?: number;
    offset?: number;
    filter?: 'all' | 'unread';
  }) {
    try {
      const result = await trpc.notifications.getNotifications.query({
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        unreadOnly: options?.filter === 'unread',
      });

      return result;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    try {
      const result = await trpc.notifications.getUnreadCount.query();
      return result;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string | number) {
    try {
      const result = await trpc.notifications.markAsRead.mutate({
        notificationId: typeof notificationId === 'string' ? parseInt(notificationId) : notificationId,
      });
      return result;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const result = await trpc.notifications.markAllAsRead.mutate();
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string | number) {
    try {
      const result = await trpc.notifications.deleteNotification.mutate({
        notificationId: typeof notificationId === 'string' ? parseInt(notificationId) : notificationId,
      });
      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences() {
    try {
      const result = await trpc.notifications.getPreferences.query();
      return result;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    smsNotifications?: boolean;
    subscriptionAlerts?: boolean;
    paymentAlerts?: boolean;
    usageAlerts?: boolean;
    promotionalEmails?: boolean;
    weeklyDigest?: boolean;
    monthlyReport?: boolean;
  }) {
    try {
      const result = await trpc.notifications.updatePreferences.mutate(preferences);
      return result;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(type: 'subscription_expiring' | 'payment_failed' | 'usage_limit_warning' | 'system_alert') {
    try {
      const result = await trpc.notifications.sendTestNotification.mutate({ type });
      return result;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Transform server notification to UI format
   */
  transformNotification(serverNotification: any): Notification {
    return {
      id: serverNotification.id,
      type: serverNotification.type,
      title: serverNotification.title,
      message: serverNotification.message,
      timestamp: new Date(serverNotification.createdAt || serverNotification.timestamp),
      read: serverNotification.isRead || serverNotification.read,
      data: serverNotification.data,
    };
  }

  /**
   * Transform multiple notifications
   */
  transformNotifications(serverNotifications: any[]): Notification[] {
    return serverNotifications.map(n => this.transformNotification(n));
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

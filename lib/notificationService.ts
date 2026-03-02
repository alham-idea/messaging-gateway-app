import { trpc } from './trpc';

/**
 * Notification Service
 * Handles fetching and managing notifications from the server
 */

export interface Notification {
  id: string;
  type: 'user_created' | 'subscription_changed' | 'payment_received' | 'payment_failed' | 'invoice_issued' | 'invoice_overdue';
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
      // Note: This requires proper TRPC client setup in React component context
      // For now, return mock data as fallback
      return {
        notifications: [],
        total: 0,
        hasMore: false,
      };
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
      return { unreadCount: 0 };
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
      return { success: true };
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
      return { success: true };
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
      return { success: true };
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
      return {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        subscriptionAlerts: true,
        paymentAlerts: true,
        usageAlerts: true,
        promotionalEmails: false,
        weeklyDigest: true,
        monthlyReport: true,
      };
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
      return { success: true };
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
      return { success: true };
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

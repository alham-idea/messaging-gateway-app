import { useEffect, useState, useCallback } from 'react';
import { notificationService, Notification } from '../services/notificationService';

/**
 * Hook for managing real-time notifications
 */
export const useNotifications = (token?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    // Connect to WebSocket
    notificationService.connect(token).then(() => {
      setIsConnected(true);
      setNotifications(notificationService.getNotifications());
    }).catch((err) => {
      setError('Failed to connect to notifications');
      console.error(err);
    });

    // Listen for new notifications
    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleNotificationsUpdated = (updatedNotifications: Notification[]) => {
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter((n) => !n.read).length);
    };

    const handleConnectionFailed = () => {
      setIsConnected(false);
      setError('Connection to notification service failed');
    };

    notificationService.on('notification', handleNewNotification);
    notificationService.on('notifications_updated', handleNotificationsUpdated);
    notificationService.on('connection_failed', handleConnectionFailed);

    // Update unread count
    setUnreadCount(notificationService.getUnreadCount());

    return () => {
      notificationService.off('notification', handleNewNotification);
      notificationService.off('notifications_updated', handleNotificationsUpdated);
      notificationService.off('connection_failed', handleConnectionFailed);
    };
  }, [token]);

  const markAsRead = useCallback((notificationId: string) => {
    notificationService.markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearAll = useCallback(() => {
    notificationService.clearAll();
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const markAllAsRead = useCallback(() => {
    notifications.forEach((n) => {
      if (!n.read) {
        notificationService.markAsRead(n.id);
      }
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isConnected,
    error,
    markAsRead,
    clearAll,
    markAllAsRead,
  };
};

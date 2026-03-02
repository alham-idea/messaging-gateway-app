import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { ScreenContainer } from '@/components/screen-container';
import { Bell, Trash2, CheckCircle, AlertCircle, Info } from 'lucide-react-native';
import { notificationService } from '@/lib/notificationService';

interface Notification {
  id: string;
  type: 'user_created' | 'subscription_changed' | 'payment_received' | 'payment_failed' | 'invoice_issued' | 'invoice_overdue';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

export default function NotificationsScreen() {
  const colors = useColors();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    // TODO: Fetch notifications from API
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await notificationService.getNotifications({
        limit: 50,
        offset: 0,
        filter: filter === 'unread' ? 'unread' : 'all',
      });
      
      if (result && result.notifications) {
        const transformedNotifications = notificationService.transformNotifications(result.notifications);
        setNotifications(transformedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Fallback to mock data if API fails
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'payment_received',
          title: 'تم استقبال الدفع',
          message: 'تم استقبال دفعتك بنجاح بقيمة 299 ريال',
          timestamp: new Date(Date.now() - 3600000),
          read: false,
        },
      ];
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_received':
        return <CheckCircle size={24} color={colors.success} />;
      case 'payment_failed':
      case 'invoice_overdue':
        return <AlertCircle size={24} color={colors.error} />;
      default:
        return <Info size={24} color={colors.primary} />;
    }
  };

  const getNotificationColor = (type: string, read: boolean) => {
    if (read) return colors.surface;
    
    switch (type) {
      case 'payment_received':
        return colors.background;
      case 'payment_failed':
      case 'invoice_overdue':
        return colors.background;
      default:
        return colors.background;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Update UI immediately
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      // Call API to persist
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Update UI immediately
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Call API to persist
      await notificationService.deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Reload notifications if deletion fails
      loadNotifications();
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const renderNotification = ({ item }: { item: Notification }) => (
    <Pressable
      onPress={() => markAsRead(item.id)}
      style={[
        styles.notificationCard,
        {
          backgroundColor: getNotificationColor(item.type, item.read),
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>
          {getNotificationIcon(item.type)}
        </View>
        
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: colors.foreground, fontWeight: item.read ? '400' : '600' },
            ]}
          >
            {item.title}
          </Text>
          <Text style={[styles.message, { color: colors.muted }]}>
            {item.message}
          </Text>
          <Text style={[styles.timestamp, { color: colors.muted }]}>
            {new Date(item.timestamp).toLocaleString('ar-SA')}
          </Text>
        </View>

        {!item.read && (
          <View
            style={[
              styles.unreadIndicator,
              { backgroundColor: colors.primary },
            ]}
          />
        )}
      </View>

      <Pressable
        onPress={() => deleteNotification(item.id)}
        style={[styles.deleteButton, { backgroundColor: colors.surface }]}
      >
        <Trash2 size={18} color={colors.error} />
      </Pressable>
    </Pressable>
  );

  const emptyComponent = (
    <View style={styles.emptyContainer}>
      <Bell size={48} color={colors.muted} />
      <Text style={[styles.emptyText, { color: colors.muted }]}>
        لا توجد تنبيهات
      </Text>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          التنبيهات
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <Pressable
          onPress={() => setFilter('all')}
          style={[
            styles.filterButton,
            filter === 'all' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
        >
          <Text
            style={[
              styles.filterText,
              {
                color: filter === 'all' ? colors.primary : colors.muted,
                fontWeight: filter === 'all' ? '600' : '400',
              },
            ]}
          >
            الكل ({notifications.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter('unread')}
          style={[
            styles.filterButton,
            filter === 'unread' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
        >
          <Text
            style={[
              styles.filterText,
              {
                color: filter === 'unread' ? colors.primary : colors.muted,
                fontWeight: filter === 'unread' ? '600' : '400',
              },
            ]}
          >
            غير مقروءة ({notifications.filter(n => !n.read).length})
          </Text>
        </Pressable>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        ListEmptyComponent={emptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadNotifications}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
  },
  listContent: {
    flexGrow: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});

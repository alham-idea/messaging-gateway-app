import { useEffect, useState, useCallback } from 'react';
import { backgroundService } from '@/lib/services/background-service';
import { notificationService } from '@/lib/services/notification-service';
import { socketService } from '@/lib/services/socket-service';
import { messageHandlerService } from '@/lib/services/message-handler-service';

export interface ServiceStatus {
  isRunning: boolean;
  isSocketConnected: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  pendingMessages: number;
  sentMessages: number;
  failedMessages: number;
  successRate: number;
}

export function useBackgroundService() {
  const [status, setStatus] = useState<ServiceStatus>({
    isRunning: false,
    isSocketConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    pendingMessages: 0,
    sentMessages: 0,
    failedMessages: 0,
    successRate: 0,
  });

  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // تحديث حالة الخدمة
  const updateStatus = useCallback(async () => {
    const serviceStats = await backgroundService.getServiceStats();
    const messageStats = serviceStats.messageStats;
    const total = messageStats.sent + messageStats.failed;

    setStatus({
      isRunning: serviceStats.isRunning,
      isSocketConnected: serviceStats.socketConnected,
      reconnectAttempts: serviceStats.reconnectAttempts,
      maxReconnectAttempts: serviceStats.maxReconnectAttempts,
      pendingMessages: messageStats.pending,
      sentMessages: messageStats.sent,
      failedMessages: messageStats.failed,
      successRate: total > 0 ? (messageStats.sent / total) * 100 : 0,
    });
  }, []);

  // بدء خدمة الخلفية
  const startService = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // تهيئة خدمة الإشعارات
      await notificationService.initialize();

      // تهيئة خدمة الخلفية
      await backgroundService.initialize({
        enableWakeLock: true,
        enableBackgroundFetch: true,
        fetchInterval: 60,
        notificationTitle: 'بوابة الرسائل',
        notificationMessage: 'التطبيق يعمل في الخلفية',
      });

      // إرسال إشعار دائم
      await notificationService.sendPersistentNotification(
        'بوابة الرسائل',
        'التطبيق يعمل في الخلفية'
      );

      updateStatus();
      console.log('✓ تم بدء خدمة الخلفية');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'خطأ غير معروف';
      setError(errorMsg);
      console.error('❌ خطأ في بدء خدمة الخلفية:', err);
    } finally {
      setIsInitializing(false);
    }
  }, [updateStatus]);

  // إيقاف خدمة الخلفية
  const stopService = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);

      await backgroundService.stop();

      // إلغاء الإشعار الدائم
      await notificationService.cancelAllNotifications();

      updateStatus();
      console.log('✓ تم إيقاف خدمة الخلفية');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'خطأ غير معروف';
      setError(errorMsg);
      console.error('❌ خطأ في إيقاف خدمة الخلفية:', err);
    } finally {
      setIsInitializing(false);
    }
  }, [updateStatus]);

  // تحديث حالة الخدمة بشكل دوري
  useEffect(() => {
    void updateStatus();
    const interval = setInterval(() => void updateStatus(), 5000);
    return () => clearInterval(interval);
  }, [updateStatus]);

  // الاستماع لأحداث الاتصال
  useEffect(() => {
    const handleConnectionChange = (isConnected: boolean) => {
      console.log(`🔌 تغيير حالة الاتصال: ${isConnected ? 'متصل' : 'غير متصل'}`);
      updateStatus();

      // إرسال إشعار عند فقدان الاتصال
      if (!isConnected) {
        notificationService.sendErrorNotification('فقدان الاتصال بالمنصة');
      }
    };

    // يمكن إضافة listener للاتصال هنا إذا كان متاحاً
    // socketService.on('connect', () => handleConnectionChange(true));
    // socketService.on('disconnect', () => handleConnectionChange(false));

    return () => {
      // تنظيف المستمعين
    };
  }, [updateStatus]);

  return {
    status,
    isInitializing,
    error,
    startService,
    stopService,
    updateStatus,
    isServiceRunning: () => backgroundService.isServiceRunning(),
    getReconnectAttempts: () => backgroundService.getReconnectAttempts(),
    getServiceStats: () => backgroundService.getServiceStats(),
  };
}

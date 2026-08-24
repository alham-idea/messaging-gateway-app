import { useEffect, useState, useCallback } from 'react';
import { retryService, FailedMessage, RetryConfig } from '@/lib/services/retry-service';
import { messageHandlerService } from '@/lib/services/message-handler-service';
import { logService } from '@/lib/services/log-service';

export interface RetryStats {
  totalFailed: number;
  totalAttempts: number;
  pendingRetries: number;
  failedFinal: number;
  averageAttempts: number;
}

export function useRetryManager() {
  const [failedMessages, setFailedMessages] = useState<FailedMessage[]>([]);
  const [stats, setStats] = useState<RetryStats>({
    totalFailed: 0,
    totalAttempts: 0,
    pendingRetries: 0,
    failedFinal: 0,
    averageAttempts: 0,
  });

  // تحديث الإحصائيات والقائمة
  const updateStats = useCallback(() => {
    const newStats = retryService.getStats();
    setStats(newStats);

    const messages = retryService.getFailedMessages();
    setFailedMessages(messages);
  }, []);

  // معالج إعادة محاولة الرسالة
  const handleRetry = useCallback((message: FailedMessage) => {
    console.log(`🔄 إعادة محاولة إرسال الرسالة ${message.id}`);

    if (message.channel === 'whatsapp') {
      console.log(`🔄 إعادة إدخال رسالة WhatsApp ${message.id} إلى قائمة الإرسال`);
      void messageHandlerService.retryMessage(message.id);
      logService.addLog({
        type: 'whatsapp',
        direction: 'sent',
        status: 'pending',
        message: `تمت جدولة إعادة محاولة رسالة WhatsApp ${message.id} (المحاولة ${message.attempts + 1})`,
        timestamp: Date.now(),
      });
    } else if (message.channel === 'sms') {
      // إعادة المحاولة عبر مسار SMS المركزي، ولا نسجل نجاحاً قبل تأكيد الموفر.
      console.log(`🔄 إعادة إدخال رسالة SMS ${message.id} إلى قائمة الإرسال`);
      void messageHandlerService.retryMessage(message.id);
      logService.addLog({
        type: 'sms',
        direction: 'sent',
        status: 'pending',
        message: `تمت جدولة إعادة محاولة رسالة SMS ${message.id} (المحاولة ${message.attempts + 1})`,
        timestamp: Date.now(),
      });
    }

    updateStats();
  }, [updateStats]);

  // معالج الوصول للحد الأقصى من المحاولات
  const handleMaxAttemptsReached = useCallback((message: FailedMessage) => {
    console.error(`❌ فشلت الرسالة ${message.id} بعد ${message.attempts} محاولات`);

    logService.addLog({
      type: 'error',
      direction: 'sent',
      status: 'failed',
      message: `فشل نهائي للرسالة ${message.id} بعد ${message.attempts} محاولات`,
      timestamp: Date.now(),
    });

    updateStats();
  }, [updateStats]);

  // تثبيت المستمعين
  useEffect(() => {
    retryService.onRetry(handleRetry);
    retryService.onMaxAttemptsReached(handleMaxAttemptsReached);

    // تحديث الإحصائيات كل 5 ثوان
    const interval = setInterval(updateStats, 5000);

    // تحديث أولي
    updateStats();

    return () => {
      clearInterval(interval);
    };
  }, [handleRetry, handleMaxAttemptsReached, updateStats]);

  return {
    // البيانات
    failedMessages,
    stats,

    // الدوال
    updateStats,

    // دوال الإدارة
    setRetryConfig: (config: Partial<RetryConfig>) => {
      retryService.setConfig(config);
      updateStats();
    },

    // دوال الاستعلام
    getFailedMessage: (messageId: string) => retryService.getFailedMessage(messageId),
    getFailedMessageCount: () => retryService.getFailedMessageCount(),

    // دوال التحكم
    cancelRetry: (messageId: string) => {
      retryService.cancelRetry(messageId);
      updateStats();
    },

    removeFailedMessage: (messageId: string) => {
      retryService.removeFailedMessage(messageId);
      updateStats();
    },

    // دوال التنظيف
    clearAll: () => {
      retryService.clear();
      updateStats();
    },

    reset: () => {
      retryService.reset();
      updateStats();
    },

    // دالة لإضافة رسالة فاشلة يدويًا
    addFailedMessage: (
      id: string,
      phoneNumber: string,
      message: string,
      channel: 'whatsapp' | 'sms',
      error?: string
    ) => {
      retryService.addFailedMessage(id, phoneNumber, message, channel, error);
      updateStats();
    },
  };
}

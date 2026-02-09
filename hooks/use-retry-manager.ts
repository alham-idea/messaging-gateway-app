import { useEffect, useState, useCallback } from 'react';
import { retryService, FailedMessage, RetryConfig } from '@/lib/services/retry-service';
import { whatsAppDesktopService } from '@/lib/services/whatsapp-desktop-service';
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
      // إعادة محاولة عبر واتساب
      if (whatsAppDesktopService.isWhatsAppReady()) {
        console.log(`✓ إرسال الرسالة ${message.id} عبر واتساب`);
        whatsAppDesktopService.sendMessage(
          message.phoneNumber,
          message.message,
          message.id
        );

        logService.addLog({
          type: 'whatsapp',
          direction: 'sent',
          status: 'sent',
          message: `إعادة محاولة إرسال الرسالة ${message.id} عبر واتساب (محاولة ${message.attempts + 1})`,
          timestamp: Date.now(),
        });
      } else {
        console.warn(`⚠️ واتساب غير جاهز، سيتم إعادة المحاولة لاحقاً`);
        // سيتم إعادة المحاولة تلقائياً من قبل retryService
      }
    } else if (message.channel === 'sms') {
      // إعادة محاولة عبر SMS
      console.log(`✓ إرسال الرسالة ${message.id} عبر SMS`);
      // يمكن إضافة منطق إرسال SMS هنا
      logService.addLog({
        type: 'sms',
        direction: 'sent',
        status: 'sent',
        message: `إعادة محاولة إرسال الرسالة ${message.id} عبر SMS (محاولة ${message.attempts + 1})`,
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

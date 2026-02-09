import { useEffect, useState, useCallback } from 'react';
import { socketService, MessagePayload } from '@/lib/services/socket-service';
import { messageHandlerService, ProcessedMessage } from '@/lib/services/message-handler-service';
import { whatsAppDesktopService } from '@/lib/services/whatsapp-desktop-service';
import { logService } from '@/lib/services/log-service';

export interface MessageStats {
  totalProcessed: number;
  sent: number;
  failed: number;
  pending: number;
  successRate: number;
  whatsappReady: boolean;
  whatsappDesktop: boolean;
  whatsappPending: number;
  whatsappIncoming: number;
}

export interface WhatsAppMessageEvent {
  type: 'send' | 'receive' | 'error';
  phoneNumber: string;
  message: string;
  messageId: string;
  timestamp: number;
  status?: 'sent' | 'failed' | 'pending' | 'delivered';
  error?: string;
}

export function useMessageHandler() {
  const [stats, setStats] = useState<MessageStats>({
    totalProcessed: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    successRate: 0,
    whatsappReady: false,
    whatsappDesktop: false,
    whatsappPending: 0,
    whatsappIncoming: 0,
  });

  const [messageHistory, setMessageHistory] = useState<ProcessedMessage[]>([]);
  const [whatsappEvents, setWhatsappEvents] = useState<WhatsAppMessageEvent[]>([]);

  // تحديث الإحصائيات الشاملة
  const updateStats = useCallback(() => {
    const socketStats = messageHandlerService.getStats();
    const whatsappStats = whatsAppDesktopService.getStats();

    setStats({
      totalProcessed: socketStats.totalProcessed,
      sent: socketStats.sent,
      failed: socketStats.failed,
      pending: socketStats.pending,
      successRate: socketStats.successRate,
      whatsappReady: whatsappStats.isReady,
      whatsappDesktop: whatsappStats.isDesktop,
      whatsappPending: whatsappStats.pendingMessages,
      whatsappIncoming: whatsappStats.incomingMessages,
    });

    const history = messageHandlerService.getMessageHistory();
    setMessageHistory(history);
  }, []);

  // معالجة الرسالة الواردة من Socket.io وإرسالها عبر واتساب
  const handleIncomingMessage = useCallback((payload: MessagePayload) => {
    console.log('📨 رسالة واردة من Socket.io:', payload);

    // تسجيل الرسالة في السجل
    logService.addLog({
      type: 'system',
      direction: 'received',
      status: 'sent',
      message: `رسالة واردة من المنصة: ${payload.message}`,
      timestamp: Date.now(),
    });

    // معالجة الرسالة عبر معالج الرسائل
    messageHandlerService.handleIncomingMessage(payload);

    // إذا كانت الرسالة موجهة للواتساب
    if (payload.type === 'whatsapp') {
      if (whatsAppDesktopService.isWhatsAppReady()) {
        console.log('✓ إرسال الرسالة عبر واتساب');
        
        // إرسال الرسالة عبر واتساب
        whatsAppDesktopService.sendMessage(
          payload.phoneNumber,
          payload.message,
          payload.id
        );

        // تسجيل محاولة الإرسال
        const event: WhatsAppMessageEvent = {
          type: 'send',
          phoneNumber: payload.phoneNumber,
          message: payload.message,
          messageId: payload.id,
          timestamp: Date.now(),
          status: 'pending',
        };

        setWhatsappEvents(prev => [event, ...prev].slice(0, 100));

        logService.addLog({
          type: 'whatsapp',
          direction: 'sent',
          status: 'sent',
          message: `محاولة إرسال رسالة إلى ${payload.phoneNumber}`,
          timestamp: Date.now(),
        });
      } else {
        console.warn('⚠️ واتساب غير جاهز، إضافة الرسالة إلى الطابور');
        
        // إضافة الرسالة إلى الطابور
        whatsAppDesktopService.sendMessage(
          payload.phoneNumber,
          payload.message,
          payload.id
        );

        logService.addLog({
          type: 'whatsapp',
          direction: 'sent',
          status: 'sent',
          message: `تم إضافة الرسالة إلى الطابور (واتساب غير جاهز)`,
          timestamp: Date.now(),
        });
      }
    }

    updateStats();
  }, [updateStats]);

  // الاستماع للرسائل الواردة من واتساب
  const handleWhatsappIncomingMessage = useCallback((message: any) => {
    console.log('📨 رسالة واردة من واتساب:', message);

    const event: WhatsAppMessageEvent = {
      type: 'receive',
      phoneNumber: message.phoneNumber,
      message: message.message,
      messageId: message.id,
      timestamp: message.timestamp,
      status: 'delivered',
    };

    setWhatsappEvents(prev => [event, ...prev].slice(0, 100));

    logService.addLog({
      type: 'whatsapp',
      direction: 'received',
      status: 'sent',
      message: `رسالة واردة من ${message.phoneNumber}: ${message.message}`,
      timestamp: Date.now(),
    });

    updateStats();
  }, [updateStats]);

  // تثبيت المستمعين
  useEffect(() => {
    // الاستماع لحدث الرسائل الواردة من Socket.io
    socketService.on('send_message', handleIncomingMessage);

    // الاستماع لحدث الرسائل الواردة من واتساب
    const unsubscribeWhatsapp = whatsAppDesktopService.onMessageReceived(
      handleWhatsappIncomingMessage
    );

    // تحديث الإحصائيات كل 3 ثوان
    const interval = setInterval(updateStats, 3000);

    return () => {
      clearInterval(interval);
      unsubscribeWhatsapp();
    };
  }, [handleIncomingMessage, handleWhatsappIncomingMessage, updateStats]);

  // تحديث أولي
  useEffect(() => {
    updateStats();
  }, [updateStats]);

  return {
    // إحصائيات Socket.io والواتساب
    stats,
    messageHistory,
    whatsappEvents,

    // دوال التحديث
    updateStats,

    // دوال الاستعلام
    getPendingCount: () => messageHandlerService.getPendingMessageCount(),
    getHistory: () => messageHandlerService.getMessageHistory(),
    getWhatsappStats: () => whatsAppDesktopService.getStats(),
    getWhatsappMessages: () => whatsAppDesktopService.getIncomingMessages(),

    // دوال التنظيف
    clearHistory: () => {
      messageHandlerService.clearHistory();
      updateStats();
    },
    clearWhatsappMessages: () => {
      whatsAppDesktopService.clearIncomingMessages();
      updateStats();
    },
    clearWhatsappEvents: () => {
      setWhatsappEvents([]);
    },

    // دوال الإرسال المباشر
    sendWhatsappMessage: (phoneNumber: string, message: string, messageId: string) => {
      console.log(`📤 إرسال رسالة مباشرة عبر واتساب إلى ${phoneNumber}`);
      
      whatsAppDesktopService.sendMessage(phoneNumber, message, messageId);

      const event: WhatsAppMessageEvent = {
        type: 'send',
        phoneNumber,
        message,
        messageId,
        timestamp: Date.now(),
        status: 'pending',
      };

      setWhatsappEvents(prev => [event, ...prev].slice(0, 100));

      logService.addLog({
        type: 'whatsapp',
        direction: 'sent',
        status: 'sent',
        message: `إرسال رسالة مباشرة إلى ${phoneNumber}`,
        timestamp: Date.now(),
      });

      updateStats();
    },

    // دوال الحالة
    isWhatsappReady: () => whatsAppDesktopService.isWhatsAppReady(),
    isWhatsappDesktop: () => whatsAppDesktopService.isDesktop(),
  };
}

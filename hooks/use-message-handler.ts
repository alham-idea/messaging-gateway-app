import { useEffect, useState, useCallback } from 'react';
import { socketService, MessagePayload } from '@/lib/services/socket-service';
import { messageHandlerService, ProcessedMessage } from '@/lib/services/message-handler-service';
import { whatsAppService } from '@/lib/services/whatsapp-service';
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
  const updateStats = useCallback(async () => {
    const socketStats = await messageHandlerService.getStats();
    const whatsappStats = whatsAppService.getStats();
    const total = socketStats.sent + socketStats.failed;

    setStats({
      totalProcessed: total,
      sent: socketStats.sent,
      failed: socketStats.failed,
      pending: socketStats.pending,
      successRate: total > 0 ? (socketStats.sent / total) * 100 : 0,
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
    // يستمع SocketService للمسار المشترك مرة واحدة، لذلك لا نضيف مستمعاً مكرراً هنا.

    // الاستماع لحدث الرسائل الواردة من واتساب
    const unsubscribeWhatsapp = whatsAppService.onMessageReceived(
      handleWhatsappIncomingMessage
    );

    // تحديث الإحصائيات كل 3 ثوان
    const interval = setInterval(() => updateStats(), 3000);

    return () => {
      clearInterval(interval);
      unsubscribeWhatsapp();
    };
  }, [handleIncomingMessage, handleWhatsappIncomingMessage, updateStats]);

  // تحديث أولي
  useEffect(() => {
    void updateStats();
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
    getWhatsappStats: () => whatsAppService.getStats(),
    getWhatsappMessages: () => whatsAppService.getIncomingMessages(),

    // دوال التنظيف
    clearHistory: () => {
      messageHandlerService.clearHistory();
      updateStats();
    },
    clearWhatsappMessages: () => {
      whatsAppService.clearIncomingMessages();
      updateStats();
    },
    clearWhatsappEvents: () => {
      setWhatsappEvents([]);
    },

    // دوال الإرسال المباشر
    sendWhatsappMessage: (phoneNumber: string, message: string, messageId: string) => {
      console.log(`📤 إرسال رسالة مباشرة عبر واتساب إلى ${phoneNumber}`);
      
      void messageHandlerService.handleIncomingMessage({
        id: messageId,
        type: 'whatsapp',
        phoneNumber,
        message,
        timestamp: Date.now(),
      }).then((accepted) => {
        if (!accepted) return;
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
          status: 'pending',
          message: `تمت جدولة رسالة WhatsApp ${messageId}`,
          timestamp: Date.now(),
        });
        void updateStats();
      });
    },

    // دوال الحالة
    isWhatsappReady: () => whatsAppService.isWhatsAppReady(),
    isWhatsappDesktop: () => whatsAppService.isDesktop(),
  };
}

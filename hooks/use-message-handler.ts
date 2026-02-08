import { useEffect, useState, useCallback } from 'react';
import { socketService, MessagePayload } from '@/lib/services/socket-service';
import { messageHandlerService, ProcessedMessage } from '@/lib/services/message-handler-service';

export interface MessageStats {
  totalProcessed: number;
  sent: number;
  failed: number;
  pending: number;
  successRate: number;
}

export function useMessageHandler() {
  const [stats, setStats] = useState<MessageStats>({
    totalProcessed: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    successRate: 0,
  });

  const [messageHistory, setMessageHistory] = useState<ProcessedMessage[]>([]);

  // تحديث الإحصائيات والسجل
  const updateStats = useCallback(() => {
    const newStats = messageHandlerService.getStats();
    setStats(newStats);

    const history = messageHandlerService.getMessageHistory();
    setMessageHistory(history);
  }, []);

  // الاستماع للرسائل الواردة من Socket.io
  useEffect(() => {
    const handleIncomingMessage = (payload: MessagePayload) => {
      console.log('📨 رسالة واردة من Socket.io:', payload);
      messageHandlerService.handleIncomingMessage(payload);
      updateStats();
    };

    // الاستماع لحدث الرسائل الواردة
    socketService.on('send_message', handleIncomingMessage);

    // تحديث الإحصائيات كل 5 ثوان
    const interval = setInterval(updateStats, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [updateStats]);

  // تحديث أولي
  useEffect(() => {
    updateStats();
  }, [updateStats]);

  return {
    stats,
    messageHistory,
    updateStats,
    getPendingCount: () => messageHandlerService.getPendingMessageCount(),
    getHistory: () => messageHandlerService.getMessageHistory(),
    clearHistory: () => {
      messageHandlerService.clearHistory();
      updateStats();
    },
  };
}

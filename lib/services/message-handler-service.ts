import { socketService, MessagePayload, MessageResponse } from './socket-service';
import { whatsAppService } from './whatsapp-service';
import * as SMS from 'expo-sms';
import { Platform } from 'react-native';
import { retryService } from './retry-service';
import { logService } from './log-service';

export interface ProcessedMessage {
  id: string;
  payload: MessagePayload;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  error?: string;
  timestamp: number;
}

class MessageHandlerService {
  private messageHistory: ProcessedMessage[] = [];
  private isProcessing = false;
  private messageQueue: MessagePayload[] = [];
  private maxQueueSize = 100;

  /**
   * معالجة رسالة واردة من المنصة
   */
  public async handleIncomingMessage(payload: MessagePayload): Promise<void> {
    console.log('📨 معالجة رسالة واردة:', payload);

    // التحقق من امتلاء الطابور
    if (this.messageQueue.length >= this.maxQueueSize) {
      console.warn('⚠️ الطابور ممتلئ، سيتم رفض الرسالة');
      this.sendFailureResponse(payload.id, 'الطابور ممتلئ');
      return;
    }

    // إضافة الرسالة إلى الطابور
    this.messageQueue.push(payload);

    // بدء معالجة الطابور
    this.processQueue();
  }

  /**
   * معالجة طابور الرسائل
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        await this.processMessage(message);

        // إضافة تأخير عشوائي بين 30-60 ثانية بين الرسائل
        if (this.messageQueue.length > 0) {
          const delay = Math.random() * 30000 + 30000;
          console.log(`⏳ تأخير ${Math.round(delay / 1000)} ثانية قبل الرسالة التالية`);
          await this.sleep(delay);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * معالجة رسالة واحدة
   */
  private async processMessage(payload: MessagePayload): Promise<void> {
    const processedMessage: ProcessedMessage = {
      id: payload.id,
      payload,
      status: 'processing',
      timestamp: Date.now(),
    };

    try {
      console.log(`🔄 معالجة الرسالة ${payload.id} (${payload.type})`);

      if (payload.type === 'whatsapp') {
        await this.sendViaWhatsApp(payload);
      } else if (payload.type === 'sms') {
        await this.sendViaSMS(payload);
      } else {
        throw new Error(`نوع رسالة غير معروف: ${payload.type}`);
      }

      processedMessage.status = 'sent';
    } catch (error) {
      console.error('❌ خطأ في معالجة الرسالة:', error);
      processedMessage.status = 'failed';
      processedMessage.error = error instanceof Error ? error.message : 'خطأ غير معروف';

      // إضافة الرسالة إلى قائمة إعادة المحاولة
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      retryService.addFailedMessage(
        payload.id,
        payload.phoneNumber,
        payload.message,
        payload.type,
        errorMessage
      );

      // محاولة الإرسال عبر SMS كخيار احتياطي (فقط للواتساب)
      if (payload.type === 'whatsapp') {
        console.log('📱 محاولة الإرسال عبر SMS كخيار احتياطي');
        try {
          await this.sendViaSMS(payload);
          processedMessage.status = 'sent';
          processedMessage.error = undefined;
          // إزالة من قائمة إعادة المحاولة عند النجاح
          retryService.removeFailedMessage(payload.id);
        } catch (smsError) {
          console.error('❌ فشل الإرسال عبر SMS أيضاً:', smsError);
          processedMessage.error = `واتساب: ${processedMessage.error}, SMS: ${smsError instanceof Error ? smsError.message : 'خطأ غير معروف'}`;
        }
      }
    }

    // إضافة إلى السجل
    this.messageHistory.push(processedMessage);

    // إذا نجحت الرسالة، إزالتها من قائمة إعادة المحاولة
    if (processedMessage.status === 'sent') {
      retryService.removeFailedMessage(payload.id);
    }

    // إرسال التقرير إلى المنصة
    this.sendResponse(processedMessage);
  }

  /**
   * إرسال رسالة عبر واتساب
   */
  private async sendViaWhatsApp(payload: MessagePayload): Promise<void> {
    if (!whatsAppService.isWhatsAppReady()) {
      throw new Error('واتساب غير جاهز');
    }

    return new Promise((resolve, reject) => {
      try {
        whatsAppService.sendMessage(
          payload.phoneNumber,
          payload.message,
          payload.id
        );

        // انتظر تأكيد الإرسال (مع timeout)
        const timeout = setTimeout(() => {
          reject(new Error('انتهت مهلة انتظار الإرسال'));
        }, 30000);

        // يمكن تحسين هذا باستخدام نظام callbacks أفضل
        resolve();
        clearTimeout(timeout);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * إرسال رسالة عبر SMS
   */
  private async sendViaSMS(payload: MessagePayload): Promise<void> {
    if (Platform.OS === 'web') {
      throw new Error('SMS غير مدعوم على الويب');
    }

    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('خدمة SMS غير متاحة على هذا الجهاز');
    }

    const { result } = await SMS.sendSMSAsync(
      [payload.phoneNumber],
      payload.message
    );

    if (result !== 'sent' && result !== 'unknown') {
      throw new Error(`فشل إرسال SMS: ${result}`);
    }

    console.log('✓ تم إرسال SMS بنجاح');
  }

  /**
   * إرسال تقرير الرسالة إلى المنصة
   */
  private sendResponse(processedMessage: ProcessedMessage): void {
    const response: MessageResponse = {
      messageId: processedMessage.id,
      status: processedMessage.status === 'sent' ? 'sent' : 'failed',
      error: processedMessage.error,
      timestamp: Date.now(),
    };

    socketService.sendMessageResponse(response);
  }

  /**
   * إرسال تقرير فشل مباشر
   */
  private sendFailureResponse(messageId: string, error: string): void {
    const response: MessageResponse = {
      messageId,
      status: 'failed',
      error,
      timestamp: Date.now(),
    };

    socketService.sendMessageResponse(response);
  }

  /**
   * الحصول على سجل الرسائل
   */
  public getMessageHistory(): ProcessedMessage[] {
    return [...this.messageHistory];
  }

  /**
   * الحصول على عدد الرسائل المعلقة
   */
  public getPendingMessageCount(): number {
    return this.messageQueue.length;
  }

  /**
   * مسح السجل
   */
  public clearHistory(): void {
    this.messageHistory = [];
  }

  /**
   * دالة مساعدة للانتظار
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * الحصول على إحصائيات المعالجة
   */
  public getStats() {
    const history = this.messageHistory;
    const sent = history.filter((m) => m.status === 'sent').length;
    const failed = history.filter((m) => m.status === 'failed').length;
    const pending = this.messageQueue.length;

    return {
      totalProcessed: history.length,
      sent,
      failed,
      pending,
      successRate: history.length > 0 ? (sent / history.length) * 100 : 0,
    };
  }
}

// تصدير instance واحد من الخدمة
export const messageHandlerService = new MessageHandlerService();

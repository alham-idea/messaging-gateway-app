import { socketService, MessageResponse } from './socket-service';
import { logService } from './log-service';

/**
 * خدمة واتساب ويب محسّنة لسطح المكتب
 * تستخدم User-Agent لسطح المكتب وتدعم الميزات الكاملة
 */
class WhatsAppDesktopService {
  private webViewRef: any = null;
  private messageQueue: any[] = [];
  private isReady = false;
  private incomingMessages: any[] = [];
  private messageListeners: ((message: any) => void)[] = [];
  private isDesktopVersion = false;

  /**
   * تعيين مرجع WebView
   */
  public setWebViewRef(ref: any): void {
    this.webViewRef = ref;
    console.log('✓ تم تعيين مرجع WebView');
    logService.addLog({
      type: 'system',
      direction: 'internal',
      status: 'sent',
      message: 'تم تعيين مرجع WebView للواتساب',
      timestamp: Date.now(),
    });
  }

  /**
   * معالجة الرسائل الواردة من WebView
   */
  public handleWebViewMessage(event: any): void {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 رسالة من WebView:', data);

      switch (data.type) {
        case 'WHATSAPP_READY':
          this.handleWhatsAppReady(data);
          break;
        case 'MESSAGE_SENT':
          this.handleMessageSent(data);
          break;
        case 'MESSAGE_RECEIVED':
          this.handleMessageReceived(data);
          break;
        case 'ERROR':
          this.handleError(data);
          break;
        case 'DESKTOP_DETECTED':
          this.handleDesktopDetected(data);
          break;
        default:
          console.log('نوع رسالة غير معروف:', data.type);
      }
    } catch (error) {
      console.error('خطأ في معالجة رسالة WebView:', error);
    }
  }

  /**
   * حقن كود JavaScript في WebView
   */
  private injectJavaScript(code: string): void {
    if (!this.webViewRef) {
      console.warn('⚠️ مرجع WebView غير متوفر');
      return;
    }

    try {
      this.webViewRef.injectJavaScript(code);
      console.log('✓ تم حقن كود JavaScript');
    } catch (error) {
      console.error('خطأ في حقن JavaScript:', error);
    }
  }

  /**
   * إرسال رسالة عبر واتساب
   */
  public sendMessage(phoneNumber: string, message: string, messageId: string): void {
    if (!this.isReady) {
      console.log('⏳ واتساب غير جاهز، إضافة الرسالة إلى الطابور');
      this.messageQueue.push({ phoneNumber, message, messageId });
      return;
    }

    // صيغة الرابط الكاملة لسطح المكتب
    const url = `https://web.whatsapp.com/send/?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    const jsCode = `
      (function() {
        try {
          // الانتقال إلى الرسالة
          window.location.href = '${url}';
          
          // الانتظار قليلاً ثم محاولة الضغط على زر الإرسال
          setTimeout(() => {
            // البحث عن زر الإرسال بطرق متعددة
            const sendButton = document.querySelector('[data-testid="send"]') ||
                              document.querySelector('button[aria-label*="Send"]') ||
                              document.querySelector('button[aria-label*="أرسل"]') ||
                              Array.from(document.querySelectorAll('button')).find(btn => 
                                btn.getAttribute('aria-label')?.includes('Send') ||
                                btn.getAttribute('aria-label')?.includes('أرسل')
                              );
            
            if (sendButton) {
              sendButton.click();
              window.postMessage({
                type: 'MESSAGE_SENT',
                messageId: '${messageId}',
                status: 'sent',
                timestamp: Date.now()
              }, '*');
            } else {
              throw new Error('لم يتم العثور على زر الإرسال');
            }
          }, 2000);
        } catch (error) {
          window.postMessage({
            type: 'ERROR',
            messageId: '${messageId}',
            error: error.message
          }, '*');
        }
      })();
      true;
    `;

    this.injectJavaScript(jsCode);
  }

  /**
   * معالجة حدث جاهزية واتساب
   */
  private handleWhatsAppReady(data: any): void {
    console.log('✓ واتساب جاهز للاستخدام');
    this.isReady = true;

    logService.addLog({
      type: 'system',
      direction: 'internal',
      status: 'sent',
      message: 'واتساب ويب جاهز للاستخدام',
      timestamp: Date.now(),
    });

    // معالجة الرسائل المعلقة
    this.processPendingMessages();
  }

  /**
   * معالجة اكتشاف نسخة سطح المكتب
   */
  private handleDesktopDetected(data: any): void {
    this.isDesktopVersion = data.isDesktop;
    console.log('🖥️ نسخة سطح المكتب مكتشفة:', this.isDesktopVersion);

    logService.addLog({
      type: 'system',
      direction: 'internal',
      status: 'sent',
      message: `تم اكتشاف نسخة ${this.isDesktopVersion ? 'سطح المكتب' : 'الهاتف'}`,
      timestamp: Date.now(),
    });
  }

  /**
   * معالجة الرسائل المعلقة في الطابور
   */
  private processPendingMessages(): void {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (msg) {
        // إضافة تأخير عشوائي بين 30-60 ثانية
        const delay = Math.random() * 30000 + 30000;
        setTimeout(() => {
          this.sendMessage(msg.phoneNumber, msg.message, msg.messageId);
        }, delay);
      }
    }
  }

  /**
   * معالجة الرسالة المرسلة
   */
  private handleMessageSent(data: any): void {
    console.log('✓ تم إرسال الرسالة:', data.messageId);

    logService.addLog({
      type: 'whatsapp',
      direction: 'sent',
      status: 'sent',
      message: `تم إرسال الرسالة بنجاح (${data.messageId})`,
      timestamp: Date.now(),
    });

    // إرسال تقرير إلى المنصة
    const response: MessageResponse = {
      messageId: data.messageId,
      status: 'sent',
      timestamp: Date.now(),
    };

    socketService.sendMessageResponse(response);
  }

  /**
   * معالجة الرسالة الواردة
   */
  private handleMessageReceived(data: any): void {
    const message = {
      id: `whatsapp_${Date.now()}`,
      phoneNumber: data.phoneNumber,
      message: data.message,
      timestamp: Date.now(),
      status: 'delivered' as const,
    };

    console.log('📨 رسالة واردة من واتساب:', message);

    logService.addLog({
      type: 'whatsapp',
      direction: 'received',
      status: 'sent',
      message: `رسالة واردة من ${data.phoneNumber}: ${data.message}`,
      timestamp: Date.now(),
    });

    // إضافة إلى السجل
    this.incomingMessages.push(message);

    // إخطار المستمعين
    this.messageListeners.forEach(listener => listener(message));

    // إرسال الرسالة إلى المنصة
    socketService.emit('whatsapp_message_received', message);
  }

  /**
   * معالجة الأخطاء
   */
  private handleError(data: any): void {
    console.error('❌ خطأ في واتساب:', data.error);

    logService.addLog({
      type: 'whatsapp',
      direction: 'internal',
      status: 'failed',
      message: `خطأ: ${data.error}`,
      timestamp: Date.now(),
    });

    // إرسال تقرير خطأ إلى المنصة
    const response: MessageResponse = {
      messageId: data.messageId,
      status: 'failed',
      error: data.error,
      timestamp: Date.now(),
    };

    socketService.sendMessageResponse(response);
  }

  /**
   * الاستماع للرسائل الواردة
   */
  public onMessageReceived(callback: (message: any) => void): () => void {
    this.messageListeners.push(callback);

    // إرجاع دالة لإزالة المستمع
    return () => {
      this.messageListeners = this.messageListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * الحصول على الرسائل الواردة
   */
  public getIncomingMessages(): any[] {
    return [...this.incomingMessages];
  }

  /**
   * مسح سجل الرسائل
   */
  public clearIncomingMessages(): void {
    this.incomingMessages = [];
  }

  /**
   * التحقق من جاهزية واتساب
   */
  public isWhatsAppReady(): boolean {
    return this.isReady;
  }

  /**
   * التحقق من نسخة سطح المكتب
   */
  public isDesktop(): boolean {
    return this.isDesktopVersion;
  }

  /**
   * حقن كود المراقبة والاكتشاف
   */
  public injectMonitoringScript(): void {
    const monitoringCode = `
      (function() {
        // اكتشاف نسخة سطح المكتب
        const isDesktop = window.innerWidth > 768 && !navigator.userAgent.includes('Mobile');
        console.log('🖥️ نسخة سطح المكتب:', isDesktop);
        
        window.postMessage({
          type: 'DESKTOP_DETECTED',
          isDesktop: isDesktop,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }, '*');

        // إخطار بأن واتساب جاهز
        window.postMessage({
          type: 'WHATSAPP_READY',
          timestamp: Date.now()
        }, '*');

        // مراقبة الرسائل الواردة
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            // البحث عن الرسائل الجديدة
            const messages = document.querySelectorAll('[data-testid="msg-container"]');
            messages.forEach((msg) => {
              const senderElement = msg.querySelector('[data-testid="msg-sender"]');
              const textElement = msg.querySelector('[data-testid="msg-text"]');
              
              if (senderElement && textElement) {
                window.postMessage({
                  type: 'MESSAGE_RECEIVED',
                  phoneNumber: senderElement.textContent,
                  message: textElement.textContent,
                  timestamp: Date.now()
                }, '*');
              }
            });
          });
        });

        // بدء المراقبة
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true
        });
      })();
      true;
    `;

    this.injectJavaScript(monitoringCode);
  }

  /**
   * الحصول على إحصائيات الخدمة
   */
  public getStats() {
    return {
      isReady: this.isReady,
      isDesktop: this.isDesktopVersion,
      pendingMessages: this.messageQueue.length,
      incomingMessages: this.incomingMessages.length,
      messageListeners: this.messageListeners.length,
    };
  }
}

export const whatsAppDesktopService = new WhatsAppDesktopService();

import { WebViewMessageEvent } from 'react-native-webview';
import { socketService, MessageResponse } from './socket-service';

export interface WhatsAppMessage {
  id: string;
  phoneNumber: string;
  message: string;
  timestamp: number;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'received';
}

export interface WhatsAppSendRequest {
  phoneNumber: string;
  message: string;
  messageId: string;
}

class WhatsAppService {
  private webViewRef: any = null;
  private messageQueue: WhatsAppSendRequest[] = [];
  private isReady = false;
  private incomingMessages: WhatsAppMessage[] = [];
  private messageListeners: ((message: WhatsAppMessage) => void)[] = [];

  /**
   * تعيين مرجع WebView
   */
  public setWebViewRef(ref: any): void {
    this.webViewRef = ref;
    console.log('✓ تم تعيين مرجع WebView');
  }

  /**
   * معالجة الرسائل الواردة من WebView
   */
  public handleWebViewMessage(event: WebViewMessageEvent): void {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 رسالة من WebView:', data);

      switch (data.type) {
        case 'WHATSAPP_READY':
          this.handleWhatsAppReady();
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
  public async sendMessage(phoneNumber: string, message: string, messageId: string): Promise<void> {
    if (!this.isReady) {
      console.warn('⚠️ واتساب غير جاهز، سيتم إضافة الرسالة إلى الطابور');
      this.messageQueue.push({ phoneNumber, message, messageId });
      return;
    }

    // تنسيق رقم الهاتف (إزالة الأحرف غير الرقمية)
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');

    // كود JavaScript لإرسال الرسالة
    const jsCode = `
      (async () => {
        try {
          // البحث عن حقل البحث أو الدردشة
          const searchInput = document.querySelector('[contenteditable="true"]');
          
          if (!searchInput) {
            throw new Error('لم يتم العثور على حقل الإدخال');
          }

          // محاولة الوصول إلى الرسالة من خلال واجهة الويب
          const messageInput = document.querySelector('[aria-label="اكتب رسالة"]') || 
                              document.querySelector('[contenteditable="true"]');
          
          if (messageInput) {
            messageInput.textContent = '${message}';
            messageInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            // البحث عن زر الإرسال
            const sendButton = document.querySelector('[data-testid="send"]') ||
                              document.querySelector('[aria-label="أرسل"]') ||
                              Array.from(document.querySelectorAll('button')).find(btn => 
                                btn.textContent.includes('أرسل') || btn.textContent.includes('Send')
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
          } else {
            throw new Error('لم يتم العثور على حقل الرسالة');
          }
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
  private handleWhatsAppReady(): void {
    console.log('✓ واتساب جاهز للاستخدام');
    this.isReady = true;

    // معالجة الرسائل المعلقة
    this.processPendingMessages();
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

    // إرسال تقرير إلى المنصة
    const response: MessageResponse = {
      messageId: data.messageId,
      status: 'sent',
      timestamp: data.timestamp || Date.now(),
    };

    socketService.sendMessageResponse(response);
  }

  /**
   * معالجة الرسالة الواردة
   */
  private handleMessageReceived(data: any): void {
    const message: WhatsAppMessage = {
      id: data.id || `msg_${Date.now()}`,
      phoneNumber: data.phoneNumber || 'unknown',
      message: data.message || '',
      timestamp: data.timestamp || Date.now(),
      status: 'received',
    };

    console.log('📨 رسالة واردة من واتساب:', message);

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
  public onMessageReceived(callback: (message: WhatsAppMessage) => void): () => void {
    this.messageListeners.push(callback);

    // إرجاع دالة لإزالة المستمع
    return () => {
      this.messageListeners = this.messageListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * الحصول على الرسائل الواردة
   */
  public getIncomingMessages(): WhatsAppMessage[] {
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
   * حقن كود المراقبة في واتساب
   */
  public injectMonitoringScript(): void {
    const monitoringCode = `
      (function() {
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
              const text = msg.textContent;
              const sender = msg.getAttribute('data-from');
              
              if (text && sender && !msg.dataset.processed) {
                msg.dataset.processed = 'true';
                
                window.postMessage({
                  type: 'MESSAGE_RECEIVED',
                  phoneNumber: sender,
                  message: text,
                  timestamp: Date.now()
                }, '*');
              }
            });
          });
        });

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
}

// تصدير instance واحد من الخدمة
export const whatsAppService = new WhatsAppService();

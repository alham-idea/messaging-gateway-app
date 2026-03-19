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
    if (!this.webViewRef) {
        console.warn('⚠️ مرجع WebView غير متوفر');
        return;
    }

    // تنسيق رقم الهاتف (إزالة الأحرف غير الرقمية)
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');

    // كود JavaScript المحسن لإرسال الرسالة
    const jsCode = `
      (async () => {
        function getElement(selectors) {
            for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el) return el;
            }
            return null;
        }

        function triggerInputEvent(element, value) {
            const inputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
            });
            element.textContent = value;
            element.dispatchEvent(inputEvent);
        }

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        try {
          // 1. استخدام رابط API لفتح المحادثة (أكثر موثوقية من البحث اليدوي)
          // هذا سيقوم بتحميل المحادثة مع الرسالة في صندوق النص
          // ملاحظة: نستخدم location.assign لتجنب إضافة سجل التاريخ
          // window.location.assign('https://web.whatsapp.com/send?phone=${cleanPhoneNumber}&text=${encodeURIComponent(message)}');
          
          // الطريقة البديلة: محاولة البحث عن المحادثة إذا كنا بالفعل في الواجهة
          // لتجنب إعادة تحميل الصفحة بالكامل إذا لم يكن ضرورياً
          
          const chatSelectors = [
            'div[contenteditable="true"][data-tab="10"]',
            '#main footer div[contenteditable="true"]',
            'footer div[contenteditable="true"]',
            'div[role="textbox"][contenteditable="true"]'
          ];

          let messageInput = getElement(chatSelectors);

          // إذا لم نجد حقل الكتابة، ربما نحتاج لفتح المحادثة أولاً
          if (!messageInput) {
             // الانتقال المباشر للمحادثة (قد يستغرق وقتاً للتحميل)
             window.location.href = 'https://web.whatsapp.com/send?phone=${cleanPhoneNumber}&text=${encodeURIComponent(message)}';
             
             // ننتظر حتى يظهر زر الإرسال أو حقل النص
             let attempts = 0;
             while (attempts < 20) { // انتظار حتى 10 ثواني
                await sleep(500);
                const sendBtn = getElement(['button[data-testid="compose-btn-send"]', 'span[data-icon="send"]']);
                if (sendBtn) {
                    sendBtn.click();
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'MESSAGE_SENT',
                        messageId: '${messageId}',
                        status: 'sent',
                        timestamp: Date.now()
                    }));
                    return;
                }
                attempts++;
             }
             throw new Error('Timeout waiting for chat load');
          }

          // إذا وجدنا حقل الكتابة (نحن بالفعل في محادثة مفتوحة)
          // ملاحظة: هذا يتطلب أن نكون في المحادثة الصحيحة! 
          // لذا الخيار الأكثر أماناً هو دائماً استخدام الرابط أعلاه، 
          // ولكن لغرض "السرعة" إذا كنا نرسل لنفس الشخص، يمكننا الكتابة مباشرة.
          // للتبسيط والموثوقية في هذا الإصدار: سنعتمد على التوجيه بالرابط إذا اختلف الرقم،
          // ولكن بما أننا لا نعرف الرقم الحالي المفتوح، سنستخدم الرابط دائماً.
          
          window.location.href = 'https://web.whatsapp.com/send?phone=${cleanPhoneNumber}&text=${encodeURIComponent(message)}';
          
          let attempts = 0;
          while (attempts < 30) { // انتظار 15 ثانية
            await sleep(500);
            
            // محاولة البحث عن زر الإرسال مباشرة (لأن النص معبأ مسبقاً)
            const sendBtn = getElement([
                'button[data-testid="compose-btn-send"]', 
                'span[data-icon="send"]',
                'button[aria-label="Send"]',
                'button[aria-label="إرسال"]'
            ]);

            if (sendBtn) {
                // وجدنا الزر، نضغط عليه
                // قد يكون الزر داخل عنصر آخر، نتأكد من ضغط الزر الفعلي
                const clickable = sendBtn.closest('button') || sendBtn;
                clickable.click();
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'MESSAGE_SENT',
                    messageId: '${messageId}',
                    status: 'sent',
                    timestamp: Date.now()
                }));
                return;
            }
            attempts++;
          }
          
          throw new Error('Send button not found after navigation');

        } catch (error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ERROR',
            messageId: '${messageId}',
            error: error.message
          }));
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
        this.sendMessage(msg.phoneNumber, msg.message, msg.messageId);
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

    // إرسال الرسالة إلى المنصة (يجب أن يتم عبر MessageHandlerService لتوحيد المنطق والتخزين)
    // socketService.emit('whatsapp_message_received', message); // Removed direct emit
    
    // استخدام messageHandlerService للتعامل مع الرسالة الواردة
    // نحتاج لاستيراده، لكن لتجنب Circular Dependency، سنستخدم نمط Observer أو نستدعي socketService.emit بحدث موحد
    // الخيار الأفضل: MessageHandlerService يجب أن يشترك في WhatsAppService
    // لكن حالياً، WhatsAppService يستدعي socketService مباشرة.
    // سنقوم بتغيير الحدث ليكون متوافقاً مع ما يتوقعه السيرفر، أو نترك MessageHandler يتعامل معه.
    // في message-handler-service.ts قمنا بإضافة handleIncomingWhatsApp.
    // سنقوم باستدعاء socketService.emit بحدث 'whatsapp_received' ونترك السيرفر يتعامل معه،
    // ولكن للتخزين المحلي، يجب أن نمر عبر MessageHandler.
    
    // الحل المؤقت: بث حدث محلي عبر DeviceEventEmitter أو مشابه، أو الاستمرار في emit للسيرفر + تخزين محلي.
    // بما أننا في "بوابة"، فالأهم هو إيصال الرسالة للسيرفر.
    socketService.emit('whatsapp_received', message);
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
   * هذه الدالة تحقن كود JavaScript لاكتشاف ومراقبة الرسالل
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

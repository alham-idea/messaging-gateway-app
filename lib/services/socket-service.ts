import io, { Socket } from 'socket.io-client';
import { Platform } from 'react-native';

export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
  lastUpdate: number;
}

export interface DeviceStatus {
  batteryLevel: number;
  batteryState: string;
  isCharging: boolean;
  networkType: string;
  isOnline: boolean;
}

export interface MessagePayload {
  id: string;
  type: 'whatsapp' | 'sms';
  phoneNumber: string;
  message: string;
  timestamp: number;
}

export interface MessageResponse {
  messageId: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
  timestamp: number;
}

class SocketService {
  private socket: Socket | null = null;
  private socketUrl: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;
  private statusUpdateInterval: NodeJS.Timeout | null = null;

  /**
   * تهيئة الاتصال بـ Socket.io
   */
  public connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socketUrl = url;
        
        // إنشاء اتصال Socket.io جديد
        this.socket = io(url, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 10000,
          reconnectionAttempts: this.maxReconnectAttempts,
          autoConnect: true,
          forceNew: true,
          // تحديد User-Agent للتطبيق
          extraHeaders: {
            'User-Agent': `MessagingGateway/1.0 (${Platform.OS})`
          }
        });

        // معالج الاتصال الناجح
        this.socket.on('connect', () => {
          console.log('✓ متصل بالمنصة');
          this.reconnectAttempts = 0;
          this.startStatusUpdates();
          resolve();
        });

        // معالج فشل الاتصال
        this.socket.on('connect_error', (error: any) => {
          console.error('✗ خطأ في الاتصال:', error);
          reject(error);
        });

        // معالج قطع الاتصال
        this.socket.on('disconnect', (reason: any) => {
          console.log('✗ تم قطع الاتصال:', reason);
          this.stopStatusUpdates();
        });

        // معالج استقبال الأوامر من المنصة
        this.socket.on('send_message', (payload: MessagePayload) => {
          console.log('📨 رسالة واردة من المنصة:', payload);
          this.handleIncomingMessage(payload);
        });

        // معالج الأخطاء العامة
        this.socket.on('error', (error: any) => {
          console.error('⚠️ خطأ Socket:', error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * قطع الاتصال بـ Socket.io
   */
  public disconnect(): void {
    if (this.socket) {
      this.stopStatusUpdates();
      this.socket.disconnect();
      this.socket = null;
      console.log('تم قطع الاتصال بالمنصة');
    }
  }

  /**
   * التحقق من حالة الاتصال
   */
  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * إرسال تقرير حالة الجهاز إلى المنصة
   */
  public sendDeviceStatus(status: DeviceStatus): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ التطبيق غير متصل، لا يمكن إرسال الحالة');
      return;
    }

    this.socket.emit('device_status', {
      timestamp: Date.now(),
      platform: Platform.OS,
      ...status
    });
  }

  /**
   * إرسال تقرير نتيجة الرسالة إلى المنصة
   */
  public sendMessageResponse(response: MessageResponse): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ التطبيق غير متصل، لا يمكن إرسال التقرير');
      return;
    }

    this.socket.emit('message_response', response);
  }

  /**
   * بدء إرسال تحديثات الحالة بشكل دوري
   */
  private startStatusUpdates(): void {
    // سيتم استدعاء هذا من خدمة مراقبة الحالة
    console.log('بدء إرسال تحديثات الحالة');
  }

  /**
   * إيقاف إرسال تحديثات الحالة
   */
  private stopStatusUpdates(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }
  }

  /**
   * معالجة الرسائل الواردة من المنصة
   */
  private handleIncomingMessage(payload: MessagePayload): void {
    // سيتم استدعاء خدمة معالجة الرسائل
    console.log('معالجة الرسالة الواردة:', payload);
    // سيتم تنفيذ هذا في الخدمة الرئيسية
  }

  /**
   * الحصول على Socket instance
   */
  public getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * الاستماع لحدث مخصص
   */
  public on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * إرسال حدث مخصص
   */
  public emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
}

// تصدير instance واحد من الخدمة
export const socketService = new SocketService();

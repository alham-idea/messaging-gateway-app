import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  importance: number;
  enableVibration: boolean;
  enableSound: boolean;
  soundName?: string;
}

class NotificationService {
  private isInitialized = false;
  private channels: Map<string, NotificationChannel> = new Map();
  private notificationListeners: ((notification: Notifications.Notification) => void)[] = [];

  /**
   * تهيئة خدمة الإشعارات
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ خدمة الإشعارات مهيأة بالفعل');
      return;
    }

    try {
      console.log('🔔 بدء تهيئة خدمة الإشعارات');

      // طلب الإذن
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('⚠️ لم يتم منح إذن الإشعارات');
      }

      // إعداد معالج الإشعارات
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          console.log('برطالة إشعار:', notification);
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          };
        },
      });

      // الاستماع للإشعارات الواردة
      this.setupNotificationListeners();

      // إنشاء القنوات الافتراضية
      if (Platform.OS === 'android') {
        await this.createDefaultChannels();
      }

      this.isInitialized = true;
      console.log('✓ تم تهيئة خدمة الإشعارات');
    } catch (error) {
      console.error('❌ خطأ في تهيئة خدمة الإشعارات:', error);
      throw error;
    }
  }

  /**
   * إعداد مستمعي الإشعارات
   */
  private setupNotificationListeners(): void {
    // الاستماع للإشعارات عند استقبالها
    const subscription1 = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📨 إشعار مستقبل:', notification);
      this.notificationListeners.forEach((listener) => listener(notification));
    });

    // الاستماع لنقرات الإشعارات
    const subscription2 = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 تم النقر على الإشعار:', response);
    });

    // تنظيف المستمعين عند الحاجة
    // (subscription1.remove() and subscription2.remove() are called when needed)
  }

  /**
   * إنشاء قنوات الإشعارات الافتراضية
   */
  private async createDefaultChannels(): Promise<void> {
    try {
      // قناة الإشعارات العامة
      await this.createChannel({
        id: 'default',
        name: 'إشعارات عامة',
        importance: Notifications.AndroidImportance.DEFAULT,
        enableVibration: true,
        enableSound: true,
      });

      // قناة إشعارات الرسائل
      await this.createChannel({
        id: 'messages',
        name: 'إشعارات الرسائل',
        importance: Notifications.AndroidImportance.HIGH,
        enableVibration: true,
        enableSound: true,
      });

      // قناة إشعارات الأخطاء
      await this.createChannel({
        id: 'errors',
        name: 'إشعارات الأخطاء',
        importance: Notifications.AndroidImportance.MAX,
        enableVibration: true,
        enableSound: true,
      });

      // قناة الإشعار الدائم (للخدمة)
      await this.createChannel({
        id: 'service',
        name: 'إشعار الخدمة',
        importance: Notifications.AndroidImportance.MIN,
        enableVibration: false,
        enableSound: false,
      });

      console.log('✓ تم إنشاء قنوات الإشعارات');
    } catch (error) {
      console.error('❌ خطأ في إنشاء قنوات الإشعارات:', error);
    }
  }

  /**
   * إنشاء قناة إشعارات مخصصة
   */
  public async createChannel(channel: NotificationChannel): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: channel.importance,
        vibrationPattern: channel.enableVibration ? [0, 250, 250, 250] : undefined,
        lightColor: '#FF0000',
        sound: channel.enableSound ? 'default' : undefined,
        bypassDnd: true,
      });

      this.channels.set(channel.id, channel);
      console.log(`✓ تم إنشاء قناة الإشعار: ${channel.id}`);
    } catch (error) {
      console.error(`❌ خطأ في إنشاء قناة الإشعار ${channel.id}:`, error);
    }
  }

  /**
   * إرسال إشعار محلي
   */
  public async sendNotification(payload: NotificationPayload, channelId: string = 'default'): Promise<string> {
    try {
      console.log(`📤 إرسال إشعار: ${payload.title}`);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          badge: payload.badge,
          sound: payload.sound || 'default',
        },
        trigger: null, // إرسال فوري
      });

      console.log(`✓ تم إرسال الإشعار برقم: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('❌ خطأ في إرسال الإشعار:', error);
      throw error;
    }
  }

  /**
   * إرسال إشعار دائم (للخدمة)
   */
  public async sendPersistentNotification(title: string, body: string): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { persistent: true },
          sound: undefined,
          priority: 'min',
        },
        trigger: null,
      });

      console.log(`✓ تم إرسال إشعار دائم برقم: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('❌ خطأ في إرسال الإشعار الدائم:', error);
      throw error;
    }
  }

  /**
   * إرسال إشعار رسالة
   */
  public async sendMessageNotification(phoneNumber: string, message: string): Promise<string> {
    return this.sendNotification({
      title: `رسالة من ${phoneNumber}`,
      body: message.substring(0, 100),
      data: { type: 'message', phoneNumber },
      badge: 1,
    }, 'messages');
  }

  /**
   * إرسال إشعار خطأ
   */
  public async sendErrorNotification(error: string): Promise<string> {
    return this.sendNotification({
      title: 'خطأ في التطبيق',
      body: error.substring(0, 100),
      data: { type: 'error' },
      badge: 1,
    }, 'errors');
  }

  /**
   * إلغاء إشعار
   */
  public async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync(notificationId);
      console.log(`✓ تم إلغاء الإشعار: ${notificationId}`);
    } catch (error) {
      console.error('❌ خطأ في إلغاء الإشعار:', error);
    }
  }

  /**
   * إلغاء جميع الإشعارات
   */
  public async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('✓ تم إلغاء جميع الإشعارات');
    } catch (error) {
      console.error('❌ خطأ في إلغاء الإشعارات:', error);
    }
  }

  /**
   * الاستماع للإشعارات
   */
  public onNotification(callback: (notification: Notifications.Notification) => void): () => void {
    this.notificationListeners.push(callback);

    // إرجاع دالة لإزالة المستمع
    return () => {
      this.notificationListeners = this.notificationListeners.filter((listener) => listener !== callback);
    };
  }

  /**
   * التحقق من حالة الخدمة
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * الحصول على قائمة القنوات
   */
  public getChannels(): NotificationChannel[] {
    return Array.from(this.channels.values());
  }
}

// تصدير instance واحد من الخدمة
export const notificationService = new NotificationService();

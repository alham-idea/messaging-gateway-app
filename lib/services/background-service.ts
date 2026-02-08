import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { useKeepAwake } from 'expo-keep-awake';
import { Platform } from 'react-native';
import { socketService } from './socket-service';
import { deviceStatusService } from './device-status-service';
import { messageHandlerService } from './message-handler-service';

const BACKGROUND_TASK_NAME = 'messaging-gateway-background-task';
const BACKGROUND_FETCH_INTERVAL = 60; // كل دقيقة

export interface BackgroundServiceConfig {
  enableWakeLock: boolean;
  enableBackgroundFetch: boolean;
  fetchInterval: number;
  notificationTitle: string;
  notificationMessage: string;
}

class BackgroundService {
  private isRunning = false;
  private config: BackgroundServiceConfig = {
    enableWakeLock: true,
    enableBackgroundFetch: true,
    fetchInterval: BACKGROUND_FETCH_INTERVAL,
    notificationTitle: 'بوابة الرسائل',
    notificationMessage: 'التطبيق يعمل في الخلفية',
  };

  private statusCheckInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * تهيئة خدمة الخلفية
   */
  public async initialize(customConfig?: Partial<BackgroundServiceConfig>): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ خدمة الخلفية قيد التشغيل بالفعل');
      return;
    }

    // تحديث الإعدادات
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    console.log('🚀 بدء تهيئة خدمة الخلفية');

    try {
      // تفعيل WakeLock
      if (this.config.enableWakeLock && Platform.OS !== 'web') {
        this.enableWakeLock();
      }

      // تسجيل مهمة الخلفية
      if (this.config.enableBackgroundFetch && Platform.OS !== 'web') {
        await this.registerBackgroundTask();
      }

      // بدء مراقبة الحالة
      this.startStatusMonitoring();

      this.isRunning = true;
      console.log('✓ تم تهيئة خدمة الخلفية بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تهيئة خدمة الخلفية:', error);
      throw error;
    }
  }

  /**
   * تفعيل WakeLock لإبقاء الجهاز نشطاً
   */
  private enableWakeLock(): void {
    try {
      useKeepAwake();
      console.log('✓ تم تفعيل WakeLock');
    } catch (error) {
      console.error('❌ خطأ في تفعيل WakeLock:', error);
    }
  }

  /**
   * تسجيل مهمة الخلفية
   */
  private async registerBackgroundTask(): Promise<void> {
    try {
      // تعريف المهمة
      TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
        console.log('🔄 تنفيذ مهمة الخلفية');

        try {
          // التحقق من الاتصال
          if (!socketService.isConnected()) {
            console.log('🔌 محاولة إعادة الاتصال');
            await this.attemptReconnect();
          }

          // تحديث حالة الجهاز
          await deviceStatusService.startMonitoring();

          // معالجة الرسائل المعلقة
          const stats = messageHandlerService.getStats();
          console.log(`📊 إحصائيات الرسائل: ${stats.sent} مرسلة، ${stats.pending} معلقة`);

          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('❌ خطأ في مهمة الخلفية:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // تسجيل المهمة
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
        minimumInterval: this.config.fetchInterval,
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('✓ تم تسجيل مهمة الخلفية');
    } catch (error) {
      console.error('❌ خطأ في تسجيل مهمة الخلفية:', error);
    }
  }

  /**
   * بدء مراقبة حالة الاتصال
   */
  private startStatusMonitoring(): void {
    // مراقبة الاتصال كل 30 ثانية
    this.statusCheckInterval = setInterval(async () => {
      try {
        const isConnected = socketService.isConnected();

        if (!isConnected) {
          console.warn('⚠️ فقدان الاتصال بالمنصة');
          await this.attemptReconnect();
        } else {
          // إعادة تعيين عدد محاولات الاتصال عند النجاح
          this.reconnectAttempts = 0;
        }
      } catch (error) {
        console.error('❌ خطأ في مراقبة الحالة:', error);
      }
    }, 30000);

    console.log('✓ بدء مراقبة حالة الاتصال');
  }

  /**
   * محاولة إعادة الاتصال
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ تم تجاوز عدد محاولات الاتصال المسموح');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // exponential backoff

    console.log(`🔄 محاولة إعادة الاتصال #${this.reconnectAttempts} بعد ${delay}ms`);

    try {
      await new Promise((resolve) => setTimeout(resolve, delay));

      const socketUrl = await this.getSocketUrl();
      if (socketUrl) {
        await socketService.connect(socketUrl);
        console.log('✓ تم إعادة الاتصال بنجاح');
        this.reconnectAttempts = 0;
      }
    } catch (error) {
      console.error('❌ فشلت محاولة إعادة الاتصال:', error);
    }
  }

  /**
   * الحصول على رابط Socket من التخزين المحلي
   */
  private async getSocketUrl(): Promise<string | null> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const url = await AsyncStorage.getItem('socketUrl');
      return url;
    } catch (error) {
      console.error('❌ خطأ في الحصول على رابط Socket:', error);
      return null;
    }
  }

  /**
   * إيقاف خدمة الخلفية
   */
  public async stop(): Promise<void> {
    console.log('🛑 إيقاف خدمة الخلفية');

    // إيقاف مراقبة الحالة
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }

    // إلغاء تسجيل مهمة الخلفية
    if (Platform.OS !== 'web') {
      try {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
        console.log('✓ تم إلغاء تسجيل مهمة الخلفية');
      } catch (error) {
        console.error('❌ خطأ في إلغاء تسجيل مهمة الخلفية:', error);
      }
    }

    this.isRunning = false;
    console.log('✓ تم إيقاف خدمة الخلفية');
  }

  /**
   * التحقق من حالة الخدمة
   */
  public isServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * الحصول على عدد محاولات الاتصال
   */
  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * الحصول على إحصائيات الخدمة
   */
  public getServiceStats() {
    return {
      isRunning: this.isRunning,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      messageStats: messageHandlerService.getStats(),
      socketConnected: socketService.isConnected(),
    };
  }
}

// تصدير instance واحد من الخدمة
export const backgroundService = new BackgroundService();

import { socketService } from './socket-service';
import { logService } from './log-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * استراتيجيات إعادة الاتصال
 */
export enum ReconnectStrategy {
  LINEAR = 'linear',           // تأخير خطي: 5s, 10s, 15s, ...
  EXPONENTIAL = 'exponential', // تأخير أسي: 5s, 10s, 20s, 40s, ...
  FIBONACCI = 'fibonacci',     // تأخير فيبوناتشي: 5s, 5s, 10s, 15s, 25s, ...
}

export interface AutoReconnectConfig {
  enabled: boolean;
  strategy: ReconnectStrategy;
  initialDelay: number;        // التأخير الأولي بالثواني
  maxDelay: number;            // الحد الأقصى للتأخير بالثواني
  maxAttempts: number;         // الحد الأقصى لعدد المحاولات
  backoffMultiplier: number;   // معامل الزيادة (للأسي)
}

class AutoReconnectService {
  private config: AutoReconnectConfig = {
    enabled: true,
    strategy: ReconnectStrategy.EXPONENTIAL,
    initialDelay: 5,
    maxDelay: 60,
    maxAttempts: 10,
    backoffMultiplier: 2,
  };

  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isReconnecting = false;
  private fibonacciSequence: number[] = [];

  constructor() {
    this.generateFibonacciSequence();
  }

  /**
   * تهيئة الخدمة
   */
  public initialize(config?: Partial<AutoReconnectConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // الاستماع لحدث قطع الاتصال
    socketService.on('disconnect', (reason: string) => {
      console.log('📡 تم قطع الاتصال:', reason);
      
      if (this.config.enabled && reason !== 'io client namespace disconnect') {
        this.scheduleReconnect();
      }
    });

    // إعادة تعيين عدد المحاولات عند الاتصال الناجح
    socketService.on('connect', () => {
      console.log('✓ تم الاتصال بنجاح');
      this.resetReconnectAttempts();
    });
  }

  /**
   * جدولة إعادة الاتصال
   */
  private scheduleReconnect(): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.config.maxAttempts) {
      if (this.reconnectAttempts >= this.config.maxAttempts) {
        console.error('❌ تم تجاوز الحد الأقصى لمحاولات الاتصال');
      logService.addLog({
        type: 'system',
        direction: 'internal',
        status: 'failed',
        message: `فشل الاتصال بعد ${this.reconnectAttempts} محاولات`,
        timestamp: Date.now(),
      });
      }
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    const delay = this.calculateDelay();

    console.log(
      `⏳ جدولة إعادة اتصال (محاولة ${this.reconnectAttempts}/${this.config.maxAttempts}) بعد ${delay}ث`
    );

    logService.addLog({
      type: 'system',
      direction: 'internal',
      status: 'pending',
      message: `جدولة إعادة اتصال بعد ${delay} ثانية (محاولة ${this.reconnectAttempts})`,
      timestamp: Date.now(),
    });

    this.reconnectTimeout = setTimeout(() => {
      this.attemptReconnect();
    }, delay * 1000);
  }

  /**
   * محاولة إعادة الاتصال
   */
  private async attemptReconnect(): Promise<void> {
    try {
      console.log(`🔄 محاولة إعادة الاتصال (${this.reconnectAttempts}/${this.config.maxAttempts})`);

      // الحصول على رابط Socket المحفوظ
      const socketUrl = await AsyncStorage.getItem('socketUrl');

      if (!socketUrl) {
        console.warn('⚠️ لم يتم العثور على رابط Socket محفوظ');
        this.isReconnecting = false;
        return;
      }

      // محاولة الاتصال
      await socketService.connect(socketUrl);
      console.log('✓ تم الاتصال بنجاح');

    } catch (error) {
      console.error('❌ فشلت محاولة إعادة الاتصال:', error);
      this.isReconnecting = false;
      
      // جدولة محاولة أخرى
      if (this.reconnectAttempts < this.config.maxAttempts) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * حساب التأخير بناءً على الاستراتيجية
   */
  private calculateDelay(): number {
    let delay: number;

    switch (this.config.strategy) {
      case ReconnectStrategy.LINEAR:
        delay = this.config.initialDelay * this.reconnectAttempts;
        break;

      case ReconnectStrategy.EXPONENTIAL:
        delay =
          this.config.initialDelay *
          Math.pow(this.config.backoffMultiplier, this.reconnectAttempts - 1);
        break;

      case ReconnectStrategy.FIBONACCI:
        delay = this.getFibonacciDelay();
        break;

      default:
        delay = this.config.initialDelay;
    }

    // التأكد من عدم تجاوز الحد الأقصى
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * الحصول على التأخير بناءً على تسلسل فيبوناتشي
   */
  private getFibonacciDelay(): number {
    if (this.reconnectAttempts - 1 < this.fibonacciSequence.length) {
      return this.fibonacciSequence[this.reconnectAttempts - 1];
    }
    return this.fibonacciSequence[this.fibonacciSequence.length - 1];
  }

  /**
   * توليد تسلسل فيبوناتشي
   */
  private generateFibonacciSequence(): void {
    this.fibonacciSequence = [];
    let a = this.config.initialDelay;
    let b = this.config.initialDelay;

    for (let i = 0; i < this.config.maxAttempts; i++) {
      this.fibonacciSequence.push(Math.min(a, this.config.maxDelay));
      const temp = a + b;
      a = b;
      b = temp;
    }
  }

  /**
   * إعادة تعيين عدد المحاولات
   */
  private resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    logService.addLog({
      type: 'system',
      direction: 'internal',
      status: 'sent',
      message: 'تم إعادة تعيين عدد محاولات الاتصال',
      timestamp: Date.now(),
    });
  }

  /**
   * إلغاء جدولة إعادة الاتصال
   */
  public cancelReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * الحصول على حالة إعادة الاتصال
   */
  public getStatus() {
    return {
      isReconnecting: this.isReconnecting,
      attempts: this.reconnectAttempts,
      maxAttempts: this.config.maxAttempts,
      strategy: this.config.strategy,
      enabled: this.config.enabled,
    };
  }

  /**
   * تحديث الإعدادات
   */
  public updateConfig(config: Partial<AutoReconnectConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.strategy === ReconnectStrategy.FIBONACCI) {
      this.generateFibonacciSequence();
    }
  }
}

export const autoReconnectService = new AutoReconnectService();

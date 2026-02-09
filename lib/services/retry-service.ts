import { logService } from './log-service';

export interface FailedMessage {
  id: string;
  phoneNumber: string;
  message: string;
  channel: 'whatsapp' | 'sms';
  attempts: number;
  maxAttempts: number;
  lastAttemptTime: number;
  nextRetryTime: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface RetryConfig {
  initialDelayMs: number; // التأخير الأولي بالميلي ثانية
  maxDelayMs: number; // التأخير الأقصى
  backoffMultiplier: number; // معامل الضرب (exponential)
  maxAttempts: number; // عدد المحاولات الأقصى
  randomizationFactor: number; // عامل العشوائية (0-1)
}

class RetryService {
  private failedMessages: Map<string, FailedMessage> = new Map();
  private retryTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private config: RetryConfig = {
    initialDelayMs: 5000, // 5 ثوان
    maxDelayMs: 3600000, // ساعة واحدة
    backoffMultiplier: 2,
    maxAttempts: 5,
    randomizationFactor: 0.1,
  };
  private onRetryCallback: ((message: FailedMessage) => void) | null = null;
  private onMaxAttemptsReachedCallback: ((message: FailedMessage) => void) | null = null;

  /**
   * تعيين إعدادات إعادة المحاولة
   */
  setConfig(config: Partial<RetryConfig>) {
    this.config = { ...this.config, ...config };
    console.log('⚙️ تم تحديث إعدادات إعادة المحاولة:', this.config);
  }

  /**
   * الاستماع لحدث إعادة المحاولة
   */
  onRetry(callback: (message: FailedMessage) => void) {
    this.onRetryCallback = callback;
  }

  /**
   * الاستماع لحدث الوصول للحد الأقصى من المحاولات
   */
  onMaxAttemptsReached(callback: (message: FailedMessage) => void) {
    this.onMaxAttemptsReachedCallback = callback;
  }

  /**
   * حساب التأخير باستخدام exponential backoff مع عشوائية
   */
  private calculateDelay(attempt: number): number {
    // exponential backoff: initialDelay * (multiplier ^ attempt)
    let delay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt);

    // تحديد التأخير الأقصى
    delay = Math.min(delay, this.config.maxDelayMs);

    // إضافة عشوائية لتجنب thundering herd
    const randomization = delay * this.config.randomizationFactor;
    const randomDelay = (Math.random() - 0.5) * 2 * randomization;
    delay = Math.max(0, delay + randomDelay);

    return Math.floor(delay);
  }

  /**
   * إضافة رسالة فاشلة إلى قائمة إعادة المحاولة
   */
  addFailedMessage(
    id: string,
    phoneNumber: string,
    message: string,
    channel: 'whatsapp' | 'sms',
    error?: string
  ): FailedMessage {
    const now = Date.now();

    // إذا كانت الرسالة موجودة بالفعل، زيادة عدد المحاولات
    if (this.failedMessages.has(id)) {
      const existing = this.failedMessages.get(id)!;
      existing.attempts += 1;
      existing.updatedAt = now;
      existing.error = error;

      // إذا تم الوصول للحد الأقصى من المحاولات
      if (existing.attempts >= existing.maxAttempts) {
        console.error(`❌ فشلت الرسالة ${id} بعد ${existing.attempts} محاولات`);
        this.cancelRetry(id);
        this.onMaxAttemptsReachedCallback?.(existing);

        logService.addLog({
          type: 'error',
          direction: 'sent',
          status: 'failed',
          message: `فشل إرسال الرسالة ${id} بعد ${existing.attempts} محاولات: ${error || 'خطأ غير معروف'}`,
          timestamp: now,
        });

        return existing;
      }

      // جدولة إعادة محاولة جديدة
      this.scheduleRetry(existing);
      return existing;
    }

    // إنشاء رسالة جديدة
    const failedMessage: FailedMessage = {
      id,
      phoneNumber,
      message,
      channel,
      attempts: 1,
      maxAttempts: this.config.maxAttempts,
      lastAttemptTime: now,
      nextRetryTime: now + this.calculateDelay(0),
      error,
      createdAt: now,
      updatedAt: now,
    };

    this.failedMessages.set(id, failedMessage);

    console.warn(`⚠️ تم إضافة رسالة فاشلة ${id} إلى قائمة إعادة المحاولة`);

    logService.addLog({
      type: 'error',
      direction: 'sent',
      status: 'sent',
      message: `تم إضافة الرسالة ${id} إلى قائمة إعادة المحاولة: ${error || 'خطأ غير معروف'}`,
      timestamp: now,
    });

    // جدولة إعادة محاولة
    this.scheduleRetry(failedMessage);

    return failedMessage;
  }

  /**
   * جدولة إعادة محاولة
   */
  private scheduleRetry(message: FailedMessage) {
    // إلغاء أي مؤقت سابق
    if (this.retryTimers.has(message.id)) {
      clearTimeout(this.retryTimers.get(message.id)!);
    }

    const delay = message.nextRetryTime - Date.now();
    if (delay <= 0) {
      // إعادة محاولة فورية
      this.executeRetry(message);
    } else {
      // جدولة إعادة محاولة
      const timer = setTimeout(() => {
        this.executeRetry(message);
      }, delay);

      this.retryTimers.set(message.id, timer);

      console.log(
        `⏱️ جدولة إعادة محاولة للرسالة ${message.id} بعد ${Math.floor(delay / 1000)} ثانية (محاولة ${message.attempts + 1}/${message.maxAttempts})`
      );

      logService.addLog({
        type: 'system',
        direction: 'sent',
        status: 'sent',
        message: `جدولة إعادة محاولة للرسالة ${message.id} بعد ${Math.floor(delay / 1000)} ثانية`,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * تنفيذ إعادة محاولة
   */
  private executeRetry(message: FailedMessage) {
    message.lastAttemptTime = Date.now();
    message.updatedAt = Date.now();

    // حساب التأخير للمحاولة التالية
    if (message.attempts < message.maxAttempts) {
      message.nextRetryTime = Date.now() + this.calculateDelay(message.attempts);
    }

    console.log(
      `🔄 إعادة محاولة إرسال الرسالة ${message.id} (محاولة ${message.attempts + 1}/${message.maxAttempts})`
    );

    logService.addLog({
      type: 'system',
      direction: 'sent',
      status: 'sent',
      message: `إعادة محاولة إرسال الرسالة ${message.id} (محاولة ${message.attempts + 1}/${message.maxAttempts})`,
      timestamp: Date.now(),
    });

    // استدعاء callback لإعادة المحاولة
    this.onRetryCallback?.(message);

    // إزالة المؤقت
    this.retryTimers.delete(message.id);
  }

  /**
   * إلغاء إعادة محاولة
   */
  cancelRetry(messageId: string) {
    if (this.retryTimers.has(messageId)) {
      clearTimeout(this.retryTimers.get(messageId)!);
      this.retryTimers.delete(messageId);
    }

    console.log(`⛔ تم إلغاء إعادة محاولة الرسالة ${messageId}`);
  }

  /**
   * إزالة رسالة من قائمة إعادة المحاولة (عند النجاح)
   */
  removeFailedMessage(messageId: string) {
    this.cancelRetry(messageId);
    this.failedMessages.delete(messageId);

    console.log(`✓ تم إزالة الرسالة ${messageId} من قائمة إعادة المحاولة`);

    logService.addLog({
      type: 'system',
      direction: 'sent',
      status: 'sent',
      message: `تم إزالة الرسالة ${messageId} من قائمة إعادة المحاولة (نجحت)`,
      timestamp: Date.now(),
    });
  }

  /**
   * الحصول على قائمة الرسائل الفاشلة
   */
  getFailedMessages(): FailedMessage[] {
    return Array.from(this.failedMessages.values());
  }

  /**
   * الحصول على رسالة فاشلة محددة
   */
  getFailedMessage(messageId: string): FailedMessage | undefined {
    return this.failedMessages.get(messageId);
  }

  /**
   * الحصول على عدد الرسائل الفاشلة
   */
  getFailedMessageCount(): number {
    return this.failedMessages.size;
  }

  /**
   * الحصول على الإحصائيات
   */
  getStats() {
    const messages = Array.from(this.failedMessages.values());
    const totalAttempts = messages.reduce((sum, msg) => sum + msg.attempts, 0);
    const pendingRetries = messages.filter(msg => msg.attempts < msg.maxAttempts).length;
    const failedFinal = messages.filter(msg => msg.attempts >= msg.maxAttempts).length;

    return {
      totalFailed: messages.length,
      totalAttempts,
      pendingRetries,
      failedFinal,
      averageAttempts: messages.length > 0 ? totalAttempts / messages.length : 0,
    };
  }

  /**
   * تنظيف جميع الرسائل الفاشلة
   */
  clear() {
    // إلغاء جميع المؤقتات
    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer);
    }

    this.failedMessages.clear();
    this.retryTimers.clear();

    console.log('🧹 تم تنظيف جميع الرسائل الفاشلة');
  }

  /**
   * إعادة تعيين الخدمة
   */
  reset() {
    this.clear();
    this.onRetryCallback = null;
    this.onMaxAttemptsReachedCallback = null;
    console.log('🔄 تم إعادة تعيين خدمة إعادة المحاولة');
  }
}

// تصدير instance واحد من الخدمة
export const retryService = new RetryService();

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  // إعدادات الاتصال
  socketUrl: string;
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectDelay: number; // بالثواني

  // إعدادات الرسائل
  minRandomDelay: number; // بالثواني
  maxRandomDelay: number; // بالثواني
  enableRandomDelay: boolean;

  // إعدادات الإشعارات
  enableNotifications: boolean;
  enableSoundNotifications: boolean;
  enableVibration: boolean;

  // إعدادات الخلفية
  enableBackgroundService: boolean;
  enableWakeLock: boolean;

  // إعدادات SMS
  enableSMSFallback: boolean;
  smsTimeout: number; // بالثواني

  // إعدادات الواتساب
  enableWhatsAppAutoSend: boolean;
  whatsAppTimeout: number; // بالثواني

  // إعدادات السجل
  maxLogEntries: number;
  autoDeleteOldLogs: boolean;
  autoDeleteDays: number; // حذف السجلات الأقدم من هذا العدد من الأيام

  // إعدادات أخرى
  darkMode: boolean;
  language: 'ar' | 'en';
}

const DEFAULT_SETTINGS: AppSettings = {
  socketUrl: '',
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 5,

  minRandomDelay: 30,
  maxRandomDelay: 60,
  enableRandomDelay: true,

  enableNotifications: true,
  enableSoundNotifications: true,
  enableVibration: true,

  enableBackgroundService: true,
  enableWakeLock: true,

  enableSMSFallback: true,
  smsTimeout: 30,

  enableWhatsAppAutoSend: true,
  whatsAppTimeout: 30,

  maxLogEntries: 1000,
  autoDeleteOldLogs: true,
  autoDeleteDays: 30,

  darkMode: false,
  language: 'ar',
};

class SettingsService {
  private settings: AppSettings = { ...DEFAULT_SETTINGS };
  private storageKey = 'messaging_gateway_settings';
  private listeners: ((settings: AppSettings) => void)[] = [];

  /**
   * تهيئة خدمة الإعدادات
   */
  public async initialize(): Promise<void> {
    try {
      console.log('⚙️ بدء تهيئة خدمة الإعدادات');

      // تحميل الإعدادات المحفوظة
      await this.loadSettings();

      console.log('✓ تم تحميل الإعدادات');
    } catch (error) {
      console.error('❌ خطأ في تهيئة خدمة الإعدادات:', error);
    }
  }

  /**
   * الحصول على جميع الإعدادات
   */
  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * الحصول على إعداد محدد
   */
  public getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  /**
   * تحديث إعداد محدد
   */
  public async updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> {
    this.settings[key] = value;
    await this.saveSettings();
    this.notifyListeners();
    console.log(`✓ تم تحديث الإعداد: ${key}`);
  }

  /**
   * تحديث عدة إعدادات
   */
  public async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    this.settings = { ...this.settings, ...updates };
    await this.saveSettings();
    this.notifyListeners();
    console.log('✓ تم تحديث الإعدادات');
  }

  /**
   * إعادة تعيين الإعدادات إلى الافتراضية
   */
  public async resetToDefaults(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.saveSettings();
    this.notifyListeners();
    console.log('✓ تم إعادة تعيين الإعدادات إلى الافتراضية');
  }

  /**
   * الاستماع لتغييرات الإعدادات
   */
  public onSettingsChange(callback: (settings: AppSettings) => void): () => void {
    this.listeners.push(callback);

    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  /**
   * إخطار المستمعين
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener({ ...this.settings }));
  }

  /**
   * حفظ الإعدادات في التخزين المحلي
   */
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('❌ خطأ في حفظ الإعدادات:', error);
    }
  }

  /**
   * تحميل الإعدادات من التخزين المحلي
   */
  private async loadSettings(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      if (data) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل الإعدادات:', error);
    }
  }

  /**
   * الحصول على الإعدادات الافتراضية
   */
  public getDefaultSettings(): AppSettings {
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * التحقق من صحة الإعدادات
   */
  public validateSettings(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.settings.socketUrl && this.settings.autoReconnect) {
      errors.push('رابط Socket مطلوب عند تفعيل إعادة الاتصال التلقائي');
    }

    if (this.settings.minRandomDelay > this.settings.maxRandomDelay) {
      errors.push('الحد الأدنى للتأخير يجب أن يكون أقل من الحد الأقصى');
    }

    if (this.settings.maxReconnectAttempts < 1) {
      errors.push('عدد محاولات الاتصال يجب أن يكون على الأقل 1');
    }

    if (this.settings.maxLogEntries < 100) {
      errors.push('عدد السجلات الأقصى يجب أن يكون على الأقل 100');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// تصدير instance واحد من الخدمة
export const settingsService = new SettingsService();

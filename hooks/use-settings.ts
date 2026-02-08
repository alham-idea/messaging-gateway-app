import { useState, useEffect, useCallback } from 'react';
import { settingsService, AppSettings } from '@/lib/services/settings-service';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // تهيئة الخدمة
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        await settingsService.initialize();
        setSettings(settingsService.getSettings());
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'خطأ غير معروف';
        setError(errorMsg);
        console.error('❌ خطأ في تهيئة خدمة الإعدادات:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();

    // الاستماع لتغييرات الإعدادات
    const unsubscribe = settingsService.onSettingsChange((updatedSettings) => {
      setSettings(updatedSettings);
    });

    return () => unsubscribe();
  }, []);

  // تحديث إعداد محدد
  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      try {
        setError(null);
        await settingsService.updateSetting(key, value);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'خطأ غير معروف';
        setError(errorMsg);
        console.error('❌ خطأ في تحديث الإعداد:', err);
      }
    },
    []
  );

  // تحديث عدة إعدادات
  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    try {
      setError(null);
      await settingsService.updateSettings(updates);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'خطأ غير معروف';
      setError(errorMsg);
      console.error('❌ خطأ في تحديث الإعدادات:', err);
    }
  }, []);

  // إعادة تعيين الإعدادات
  const resetToDefaults = useCallback(async () => {
    try {
      setError(null);
      await settingsService.resetToDefaults();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'خطأ غير معروف';
      setError(errorMsg);
      console.error('❌ خطأ في إعادة تعيين الإعدادات:', err);
    }
  }, []);

  // الحصول على إعداد محدد
  const getSetting = useCallback(
    <K extends keyof AppSettings>(key: K): AppSettings[K] | null => {
      if (!settings) return null;
      return settings[key];
    },
    [settings]
  );

  // التحقق من صحة الإعدادات
  const validateSettings = useCallback(() => {
    return settingsService.validateSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSetting,
    updateSettings,
    resetToDefaults,
    getSetting,
    validateSettings,
  };
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { ScreenHeader } from '@/components/screen-header';
import { useRouter } from 'expo-router';
import { useSettings } from '@/hooks/use-settings';
import { SettingsInput } from '@/components/settings-input';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    settings,
    isLoading,
    error,
    updateSetting,
    updateSettings,
    resetToDefaults,
    validateSettings,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<
    'connection' | 'messages' | 'notifications' | 'background' | 'logs'
  >('connection');

  const handleResetSettings = () => {
    Alert.alert(
      'تأكيد إعادة التعيين',
      'هل تريد إعادة تعيين جميع الإعدادات إلى الافتراضية؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إعادة تعيين',
          onPress: () => resetToDefaults(),
          style: 'destructive',
        },
      ]
    );
  };

  const handleValidate = () => {
    const validation = validateSettings();
    if (validation.valid) {
      Alert.alert('✓ النجاح', 'جميع الإعدادات صحيحة');
    } else {
      Alert.alert('⚠️ تحذير', validation.errors.join('\n'));
    }
  };

  if (isLoading || !settings) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text className="mt-4 text-foreground">جاري تحميل الإعدادات...</Text>
      </ScreenContainer>
    );
  }

  const tabs = [
    { id: 'connection' as const, label: 'الاتصال' },
    { id: 'messages' as const, label: 'الرسائل' },
    { id: 'notifications' as const, label: 'الإشعارات' },
    { id: 'background' as const, label: 'الخلفية' },
    { id: 'logs' as const, label: 'السجلات' },
  ];

  return (
    <ScreenContainer className="flex-1">
      <ScreenHeader
        title="إعدادات التطبيق الشاملة"
        subtitle="تخصيص جميع إعدادات الاتصال والرسائل والإشعارات"
        showBackButton={true}
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-4">
        <View className="gap-4">
          {/* التبويبات */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  activeTab === tab.id
                    ? 'bg-primary'
                    : 'bg-surface border border-border'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    activeTab === tab.id ? 'text-white' : 'text-foreground'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* محتوى التبويبات */}
          {activeTab === 'connection' && (
            <View className="gap-4">
              <SettingsInput
                label="رابط Socket"
                description="رابط الاتصال بالمنصة"
                type="text"
                value={settings.socketUrl}
                onValueChange={(value) => updateSetting('socketUrl', String(value))}
                placeholder="http://example.com:3000"
              />

              <SettingsInput
                label="إعادة الاتصال التلقائي"
                description="محاولة الاتصال تلقائياً عند فقدان الاتصال"
                type="toggle"
                value={settings.autoReconnect}
                onValueChange={(value) => updateSetting('autoReconnect', Boolean(value))}
              />

              <SettingsInput
                label="عدد محاولات الاتصال"
                description="الحد الأقصى لمحاولات إعادة الاتصال"
                type="number"
                value={settings.maxReconnectAttempts}
                onValueChange={(value) =>
                  updateSetting('maxReconnectAttempts', Number(value))
                }
                min={1}
                max={20}
              />

              <SettingsInput
                label="تأخير الاتصال"
                description="التأخير بين محاولات الاتصال (بالثواني)"
                type="number"
                value={settings.reconnectDelay}
                onValueChange={(value) =>
                  updateSetting('reconnectDelay', Number(value))
                }
                min={1}
                max={60}
              />
            </View>
          )}

          {activeTab === 'messages' && (
            <View className="gap-4">
              <SettingsInput
                label="تفعيل التأخير العشوائي"
                description="إضافة تأخير عشوائي بين الرسائل"
                type="toggle"
                value={settings.enableRandomDelay}
                onValueChange={(value) =>
                  updateSetting('enableRandomDelay', Boolean(value))
                }
              />

              <SettingsInput
                label="الحد الأدنى للتأخير"
                description="الحد الأدنى للتأخير العشوائي (بالثواني)"
                type="number"
                value={settings.minRandomDelay}
                onValueChange={(value) =>
                  updateSetting('minRandomDelay', Number(value) || 30)
                }
                min={5}
                max={120}
              />

              <SettingsInput
                label="الحد الأقصى للتأخير"
                description="الحد الأقصى للتأخير العشوائي (بالثواني)"
                type="number"
                value={settings.maxRandomDelay}
                onValueChange={(value) =>
                  updateSetting('maxRandomDelay', Number(value) || 60)
                }
                min={5}
                max={300}
              />

              <SettingsInput
                label="تفعيل الخيار الاحتياطي SMS"
                description="إرسال SMS عند فشل الواتساب"
                type="toggle"
                value={settings.enableSMSFallback}
                onValueChange={(value) =>
                  updateSetting('enableSMSFallback', Boolean(value))
                }
              />

              <SettingsInput
                label="مهلة زمن الواتساب"
                description="الوقت المسموح لإرسال الرسالة عبر الواتساب (بالثواني)"
                type="number"
                value={settings.whatsAppTimeout}
                onValueChange={(value) =>
                  updateSetting('whatsAppTimeout', Number(value))
                }
                min={5}
                max={120}
              />
            </View>
          )}

          {activeTab === 'notifications' && (
            <View className="gap-4">
              <SettingsInput
                label="تفعيل الإشعارات"
                description="عرض الإشعارات"
                type="toggle"
                value={settings.enableNotifications}
                onValueChange={(value) =>
                  updateSetting('enableNotifications', Boolean(value))
                }
              />

              <SettingsInput
                label="تفعيل الصوت"
                description="تشغيل صوت الإشعارات"
                type="toggle"
                value={settings.enableSoundNotifications}
                onValueChange={(value) =>
                  updateSetting('enableSoundNotifications', Boolean(value))
                }
                disabled={!settings.enableNotifications}
              />

              <SettingsInput
                label="تفعيل الاهتزاز"
                description="اهتزاز الجهاز عند الإشعارات"
                type="toggle"
                value={settings.enableVibration}
                onValueChange={(value) =>
                  updateSetting('enableVibration', Boolean(value))
                }
                disabled={!settings.enableNotifications}
              />
            </View>
          )}

          {activeTab === 'background' && (
            <View className="gap-4">
              <SettingsInput
                label="تفعيل خدمة الخلفية"
                description="تشغيل التطبيق في الخلفية"
                type="toggle"
                value={settings.enableBackgroundService}
                onValueChange={(value) =>
                  updateSetting('enableBackgroundService', Boolean(value))
                }
              />

              <SettingsInput
                label="تفعيل WakeLock"
                description="إبقاء الجهاز نشطاً"
                type="toggle"
                value={settings.enableWakeLock}
                onValueChange={(value) =>
                  updateSetting('enableWakeLock', Boolean(value))
                }
                disabled={!settings.enableBackgroundService}
              />
            </View>
          )}

          {activeTab === 'logs' && (
            <View className="gap-4">
              <SettingsInput
                label="الحد الأقصى للسجلات"
                description="عدد السجلات المحفوظة"
                type="number"
                value={settings.maxLogEntries}
                onValueChange={(value) =>
                  updateSetting('maxLogEntries', Number(value))
                }
                min={100}
                max={10000}
              />

              <SettingsInput
                label="حذف السجلات القديمة تلقائياً"
                description="حذف السجلات الأقدم من المدة المحددة"
                type="toggle"
                value={settings.autoDeleteOldLogs}
                onValueChange={(value) =>
                  updateSetting('autoDeleteOldLogs', Boolean(value))
                }
              />

              <SettingsInput
                label="مدة الاحتفاظ بالسجلات"
                description="عدد الأيام للاحتفاظ بالسجلات"
                type="number"
                value={settings.autoDeleteDays}
                onValueChange={(value) =>
                  updateSetting('autoDeleteDays', Number(value))
                }
                min={1}
                max={365}
                disabled={!settings.autoDeleteOldLogs}
              />
            </View>
          )}

          {/* رسالة الخطأ */}
          {error && (
            <View className="bg-error/10 border border-error rounded-lg p-3">
              <Text className="text-error text-xs">{error}</Text>
            </View>
          )}

          {/* أزرار الإجراءات */}
          <View className="gap-3 mt-4">
            <TouchableOpacity
              onPress={handleValidate}
              className="bg-primary/10 border border-primary rounded-lg py-3 items-center"
            >
              <Text className="text-primary font-semibold">التحقق من الإعدادات</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/app-settings')}
              className="bg-primary rounded-lg py-3 items-center"
            >
              <Text className="text-background font-semibold">إعدادات أخرى</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResetSettings}
              className="bg-error/10 border border-error rounded-lg py-3 items-center"
            >
              <Text className="text-error font-semibold">إعادة تعيين</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

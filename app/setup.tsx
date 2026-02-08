import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { socketService } from '@/lib/services/socket-service';
import { deviceStatusService } from '@/lib/services/device-status-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SetupScreen() {
  const router = useRouter();
  const [socketUrl, setSocketUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!socketUrl.trim()) {
      setError('يرجى إدخال رابط Socket.io');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // حفظ الرابط في التخزين المحلي
      await AsyncStorage.setItem('socketUrl', socketUrl);

      // محاولة الاتصال
      await socketService.connect(socketUrl);

      // بدء مراقبة حالة الجهاز
      await deviceStatusService.startMonitoring();

      // الانتقال إلى الشاشة الرئيسية
      router.replace('/(tabs)');
    } catch (err) {
      setError(`فشل الاتصال: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
      setIsConnecting(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-8">
        <View className="flex-1 justify-center gap-8">
          {/* العنوان */}
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-foreground">
              بوابة الرسائل
            </Text>
            <Text className="text-base text-muted text-center">
              قم بإدخال رابط المنصة للبدء
            </Text>
          </View>

          {/* نموذج الإدخال */}
          <View className="gap-4">
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">
                رابط Socket.io
              </Text>
              <TextInput
                value={socketUrl}
                onChangeText={setSocketUrl}
                placeholder="https://platform.example.com"
                placeholderTextColor="#9CA3AF"
                editable={!isConnecting}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            {/* رسالة الخطأ */}
            {error ? (
              <View className="bg-error/10 border border-error rounded-lg px-4 py-3">
                <Text className="text-error text-sm">{error}</Text>
              </View>
            ) : null}

            {/* زر الاتصال */}
            <TouchableOpacity
              onPress={handleConnect}
              disabled={isConnecting}
              className={`py-4 rounded-lg items-center justify-center ${
                isConnecting ? 'bg-primary/50' : 'bg-primary'
              }`}
            >
              {isConnecting ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator color="#ffffff" />
                  <Text className="text-white font-semibold">جاري الاتصال...</Text>
                </View>
              ) : (
                <Text className="text-white font-semibold text-base">
                  الاتصال
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* معلومات إضافية */}
          <View className="bg-surface rounded-lg p-4 gap-2">
            <Text className="text-sm font-semibold text-foreground">
              ملاحظات مهمة:
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              • تأكد من أن رابط Socket.io صحيح وآمن (https://)
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              • سيتم حفظ الرابط محلياً على الجهاز
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              • التطبيق سيعمل في الخلفية بعد الاتصال
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

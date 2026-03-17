import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { socketService } from '@/lib/services/socket-service';
import { deviceStatusService } from '@/lib/services/device-status-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConnectionInfo {
  url: string;
  isConnected: boolean;
  lastConnectedTime: number | null;
  connectionAttempts: number;
  lastError: string | null;
  uptime: number; // بالثواني
}

export default function ConnectionManagerScreen() {
  const router = useRouter();
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    url: '',
    isConnected: false,
    lastConnectedTime: null,
    connectionAttempts: 0,
    lastError: null,
    uptime: 0,
  });

  const [socketUrl, setSocketUrl] = useState('');
  const [secretToken, setSecretToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoConnect, setAutoConnect] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadConnectionInfo();
    const interval = setInterval(updateConnectionInfo, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadConnectionInfo = async () => {
    try {
      const url = await AsyncStorage.getItem('socketUrl');
      const token = await AsyncStorage.getItem('secretToken');
      if (url) {
        setSocketUrl(url);
      }
      if (token) {
        setSecretToken(token);
      }
      updateConnectionInfo();
    } catch (error) {
      console.error('❌ خطأ في تحميل معلومات الاتصال:', error);
    }
  };

  const updateConnectionInfo = () => {
    const isConnected = socketService.isConnected();
    const stats = socketService.getConnectionStats();

    setConnectionInfo({
      url: socketUrl,
      isConnected,
      lastConnectedTime: stats.lastConnectedTime,
      connectionAttempts: stats.connectionAttempts,
      lastError: stats.lastError,
      uptime: stats.uptime,
    });
  };

  const handleConnect = async () => {
    if (!socketUrl.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رابط Socket');
      return;
    }

    try {
      setIsLoading(true);

      // حفظ الرابط والرمز السري
      await AsyncStorage.setItem('socketUrl', socketUrl);
      await AsyncStorage.setItem('secretToken', secretToken);

      // الاتصال
      await socketService.connect(socketUrl, secretToken);

      Alert.alert('✓ النجاح', 'تم الاتصال بالمنصة بنجاح');
      updateConnectionInfo();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
      Alert.alert('❌ خطأ', `فشل الاتصال: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'تأكيد قطع الاتصال',
      'هل تريد قطع الاتصال بالمنصة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'قطع الاتصال',
          onPress: async () => {
            try {
              setIsLoading(true);
              socketService.disconnect();
              await AsyncStorage.removeItem('socketUrl');
              setSocketUrl('');
              updateConnectionInfo();
              Alert.alert('✓ تم', 'تم قطع الاتصال بنجاح');
            } catch (error) {
              Alert.alert('❌ خطأ', 'فشل قطع الاتصال');
            } finally {
              setIsLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleReconnect = async () => {
    if (!socketUrl.trim()) {
      Alert.alert('خطأ', 'لا يوجد رابط محفوظ للاتصال');
      return;
    }

    try {
      setIsLoading(true);
      socketService.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 500));
      await socketService.connect(socketUrl, secretToken);
      updateConnectionInfo();
      Alert.alert('✓ النجاح', 'تم إعادة الاتصال بنجاح');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
      Alert.alert('❌ خطأ', `فشل إعادة الاتصال: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'لم يتصل';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA');
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}س ${minutes}د ${secs}ث`;
    } else if (minutes > 0) {
      return `${minutes}د ${secs}ث`;
    } else {
      return `${secs}ث`;
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-4">
        <View className="gap-4">
          {/* رأس الشاشة */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-2xl font-bold text-foreground">إدارة الاتصال</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-surface border border-border rounded-lg p-2"
            >
              <Text className="text-foreground text-lg">✕</Text>
            </TouchableOpacity>
          </View>

          {/* حالة الاتصال الرئيسية */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-foreground">حالة الاتصال</Text>
              <View
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: connectionInfo.isConnected ? '#10b981' : '#ef4444',
                }}
              />
            </View>
            <Text className="text-3xl font-bold text-foreground mb-2">
              {connectionInfo.isConnected ? 'متصل' : 'غير متصل'}
            </Text>
            <Text className="text-sm text-muted">
              آخر اتصال: {formatTime(connectionInfo.lastConnectedTime || 0)}
            </Text>
          </View>

          {/* معلومات الاتصال */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">محاولات الاتصال:</Text>
              <Text className="text-sm font-semibold text-foreground">
                {connectionInfo.connectionAttempts}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">وقت التشغيل:</Text>
              <Text className="text-sm font-semibold text-foreground">
                {formatUptime(connectionInfo.uptime)}
              </Text>
            </View>

            {connectionInfo.lastError && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">آخر خطأ:</Text>
                <Text className="text-sm font-semibold text-error flex-1 text-right">
                  {connectionInfo.lastError}
                </Text>
              </View>
            )}
          </View>

          {/* إدخال رابط Socket */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-2">
              رابط السيرفر (Socket URL)
            </Text>
            <TextInput
              value={socketUrl}
              onChangeText={setSocketUrl}
              placeholder="http://example.com:3000"
              placeholderTextColor="#9BA1A6"
              editable={!isLoading && !connectionInfo.isConnected}
              className="bg-background border border-border rounded px-3 py-2 text-foreground mb-4"
            />

            <Text className="text-sm font-semibold text-foreground mb-2">
              الرمز السري (Secret Token - اختياري)
            </Text>
            <TextInput
              value={secretToken}
              onChangeText={setSecretToken}
              placeholder="أدخل الرمز السري للمصادقة"
              placeholderTextColor="#9BA1A6"
              secureTextEntry
              editable={!isLoading && !connectionInfo.isConnected}
              className="bg-background border border-border rounded px-3 py-2 text-foreground mb-3"
            />

            {/* الاتصال التلقائي */}
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted">الاتصال التلقائي</Text>
              <Switch
                value={autoConnect}
                onValueChange={setAutoConnect}
                trackColor={{ false: '#e5e7eb', true: '#10b981' }}
                thumbColor={autoConnect ? '#10b981' : '#f3f4f6'}
              />
            </View>
          </View>

          {/* أزرار الإجراءات */}
          <View className="gap-3">
            {!connectionInfo.isConnected ? (
              <TouchableOpacity
                onPress={handleConnect}
                disabled={isLoading}
                className={`rounded-lg py-3 items-center ${
                  isLoading ? 'bg-primary/50' : 'bg-primary'
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">الاتصال</Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={handleReconnect}
                  disabled={isLoading}
                  className={`rounded-lg py-3 items-center border border-primary ${
                    isLoading ? 'bg-primary/10' : 'bg-primary/10'
                  }`}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#0a7ea4" />
                  ) : (
                    <Text className="text-primary font-semibold">إعادة الاتصال</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDisconnect}
                  disabled={isLoading}
                  className="bg-error/10 border border-error rounded-lg py-3 items-center"
                >
                  <Text className="text-error font-semibold">قطع الاتصال</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* الإحصائيات المتقدمة */}
          <TouchableOpacity
            onPress={() => setShowAdvanced(!showAdvanced)}
            className="bg-surface rounded-lg p-4 border border-border"
          >
            <Text className="text-sm font-semibold text-foreground">
              {showAdvanced ? '▼ الإحصائيات المتقدمة' : '▶ الإحصائيات المتقدمة'}
            </Text>
          </TouchableOpacity>

          {showAdvanced && (
            <View className="bg-surface rounded-lg p-4 border border-border gap-3">
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">معرّف الجهاز:</Text>
                <Text className="text-xs text-foreground font-mono">
                  {socketService.getClientId()?.substring(0, 12)}...
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">إصدار Socket.io:</Text>
                <Text className="text-xs text-foreground">4.x</Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">حالة الاتصال:</Text>
                <Text className="text-xs text-foreground">
                  {socketService.isConnected() ? 'متصل' : 'غير متصل'}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">حالة الشبكة:</Text>
                <Text className="text-xs text-foreground">
                  {deviceStatusService.getStatus().networkType}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">البطارية:</Text>
                <Text className="text-xs text-foreground">
                  {deviceStatusService.getBatteryPercentage()}%
                </Text>
              </View>
            </View>
          )}

          {/* رسالة المساعدة */}
          <View className="bg-primary/10 border border-primary rounded-lg p-4">
            <Text className="text-xs text-primary font-semibold mb-2">💡 نصيحة</Text>
            <Text className="text-xs text-primary">
              تأكد من إدخال رابط Socket الصحيح. يجب أن يكون الرابط بصيغة:
              http://example.com:port أو https://example.com:port
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

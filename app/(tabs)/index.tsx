import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, FlatList, Alert, Platform, PermissionsAndroid } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { socketService } from '@/lib/services/socket-service';
import { deviceStatusService } from '@/lib/services/device-status-service';
import { useBackgroundService } from '@/hooks/use-background-service';
import { useRetryManager } from '@/hooks/use-retry-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { status, startService, stopService, isInitializing } = useBackgroundService();
  const { stats: retryStats } = useRetryManager();
  const [isConnected, setIsConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [networkType, setNetworkType] = useState('unknown');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [queueCount, setQueueCount] = useState(0);
  const [queueStats, setQueueStats] = useState({ pending: 0, sent: 0, failed: 0 });
  const [permissions, setPermissions] = useState({ sms: false });

  useEffect(() => {
    checkConnection();
    updateStatus();
    checkPermissions();
    
    // بدء خدمة الخلفية عند فتح التطبيق
    startService();

    // تحديث الحالة كل 5 ثوان
    const interval = setInterval(() => {
      updateStatus();
      checkPermissions();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [startService]);

  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS);
        setPermissions({ sms: granted });
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
        ]);
        checkPermissions();
      } catch (err) {
        console.warn(err);
      }
    } else {
      Alert.alert('تنبيه', 'إدارة الصلاحيات متاحة فقط على نظام أندرويد');
    }
  };

  const checkConnection = async () => {
    const url = await AsyncStorage.getItem('socketUrl');
    if (!url && !socketService.isConnected()) {
      router.replace('/(tabs)');
    }
  };

  const updateStatus = () => {
    setIsConnected(socketService.isConnected());
    const deviceStatus = deviceStatusService.getStatus();
    setBatteryLevel(deviceStatusService.getBatteryPercentage());
    setNetworkType(deviceStatus.networkType);
    setQueueCount(status.pendingMessages);
    setQueueStats({
      pending: status.pendingMessages,
      sent: status.sentMessages,
      failed: status.failedMessages,
    });

    // إضافة سجل
    if (socketService.isConnected()) {
      addLog('info', 'متصل بالمنصة');
    }
  };

  const addLog = (type: LogEntry['type'], message: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type,
      message,
    };

    setLogs((prev) => [newLog, ...prev].slice(0, 50));
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'تأكيد',
      'هل تريد قطع الاتصال وإيقاف خدمة الخلفية؟',
      [
        { text: 'إلغاء', onPress: () => {}, style: 'cancel' },
        {
          text: 'نعم',
          onPress: async () => {
            await stopService();
            socketService.disconnect();
            deviceStatusService.stopMonitoring();
            await AsyncStorage.removeItem('socketUrl');
            router.replace('/(tabs)');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const getStatusColor = () => {
    return isConnected ? '#10b981' : '#ef4444';
  };

  const getStatusText = () => {
    return isConnected ? 'متصل' : 'غير متصل';
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-4">
        <View className="gap-4">
          {/* بطاقة حالة الاتصال */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-foreground">
                حالة الاتصال
              </Text>
              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getStatusColor() }}
              />
            </View>
            <Text className="text-2xl font-bold text-foreground mb-2">
              {getStatusText()}
            </Text>
            <Text className="text-sm text-muted">
              آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}
            </Text>
          </View>

          {/* Permissions Status Card */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-semibold text-foreground">
                صلاحيات النظام
              </Text>
              <View
                className={`px-2 py-1 rounded-full ${permissions.sms ? 'bg-success/20' : 'bg-error/20'}`}
              >
                <Text className={`text-xs font-bold ${permissions.sms ? 'text-success' : 'text-error'}`}>
                  {permissions.sms ? 'SMS مفعل' : 'SMS غير مفعل'}
                </Text>
              </View>
            </View>
            {!permissions.sms && Platform.OS === 'android' && (
              <View>
                <Text className="text-xs text-error mb-2">يجب منح صلاحيات الرسائل ليعمل التطبيق بشكل صحيح.</Text>
                <TouchableOpacity onPress={requestPermissions} className="bg-primary px-3 py-2 rounded items-center">
                   <Text className="text-white text-sm font-semibold">طلب الصلاحيات</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* بطاقة معلومات الجهاز */}
          <View className="gap-4">
            {/* البطارية */}
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-xs text-muted mb-2">البطارية</Text>
              <Text className="text-2xl font-bold text-foreground">
                {batteryLevel}%
              </Text>
              <View className="mt-2 h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-success"
                  style={{ width: `${batteryLevel}%` }}
                />
              </View>
            </View>

            {/* نوع الشبكة */}
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-xs text-muted mb-2">الشبكة</Text>
              <Text className="text-sm font-semibold text-foreground capitalize">
                {networkType === 'WIFI' ? 'Wi-Fi' : networkType}
              </Text>
            </View>
          </View>

          {/* بطاقة الطابور */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-sm text-muted mb-2">إحصائيات الرسائل</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-foreground">{queueStats.pending}</Text>
                <Text className="text-xs text-muted">معلقة</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-success">{queueStats.sent}</Text>
                <Text className="text-xs text-muted">تم الإرسال</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-error">{queueStats.failed}</Text>
                <Text className="text-xs text-muted">فشلت</Text>
              </View>
            </View>
          </View>

          {/* بطاقة الرسائل الفاشلة */}
          {retryStats.totalFailed > 0 && (
            <View className="bg-error/10 rounded-lg p-4 border border-error">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-semibold text-error">رسائل فاشلة</Text>
                <View className="bg-error rounded-full px-2 py-1">
                  <Text className="text-xs font-bold text-background">
                    {retryStats.totalFailed}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-error/70 mb-3">
                {retryStats.pendingRetries} معلقة، {retryStats.failedFinal} فشل نهائي
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/failed-messages')}
                className="bg-error rounded-lg py-2 items-center"
              >
                <Text className="text-sm font-semibold text-background">عرض التفاصيل</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* الأزرار */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={() => router.push('/whatsapp')}
              className="bg-primary rounded-lg py-3 items-center"
            >
              <Text className="text-white font-semibold">فتح واتساب</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/logs')}
              className="bg-surface border border-border rounded-lg py-3 items-center"
            >
              <Text className="text-foreground font-semibold">عرض السجل</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/settings')}
              className="bg-surface border border-border rounded-lg py-3 items-center"
            >
              <Text className="text-foreground font-semibold">الإعدادات</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/connection-manager')}
              className="bg-surface border border-border rounded-lg py-3 items-center"
            >
              <Text className="text-foreground font-semibold">إدارة الاتصال</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/failed-messages')}
              className="bg-surface border border-border rounded-lg py-3 items-center"
            >
              <Text className="text-foreground font-semibold">الرسائل الفاشلة</Text>
            </TouchableOpacity>

            {/* قسم الاشتراكات والدفع */}
            <View className="border-t border-border pt-4 mt-2">
              <Text className="text-lg font-semibold text-foreground mb-3">الاشتراكات والدفع</Text>
              
              <TouchableOpacity
                onPress={() => router.push('/plans')}
                className="bg-primary rounded-lg py-3 items-center mb-3"
              >
                <Text className="text-white font-semibold">اختيار الباقة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/manage-subscription')}
                className="bg-surface border border-border rounded-lg py-3 items-center mb-3"
              >
                <Text className="text-foreground font-semibold">إدارة الاشتراك</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/payment-methods')}
                className="bg-surface border border-border rounded-lg py-3 items-center mb-3"
              >
                <Text className="text-foreground font-semibold">طرق الدفع</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/invoices')}
                className="bg-surface border border-border rounded-lg py-3 items-center mb-3"
              >
                <Text className="text-foreground font-semibold">الفواتير</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/payment-history')}
                className="bg-surface border border-border rounded-lg py-3 items-center mb-3"
              >
                <Text className="text-foreground font-semibold">سجل الدفعات</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/apply-coupon')}
                className="bg-surface border border-border rounded-lg py-3 items-center"
              >
                <Text className="text-foreground font-semibold">تطبيق كوبون</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              disabled={isInitializing}
              onPress={handleDisconnect}
              className={`py-3 rounded-lg items-center ${
                isInitializing ? 'bg-error/50' : 'bg-error/10 border border-error'
              }`}
            >
              <Text className="text-error font-semibold">
                {isInitializing ? 'جاري...' : 'قطع الاتصال'}
              </Text>
            </TouchableOpacity>

            {/* بطاقة حالة خدمة الخلفية */}
            <View className="bg-surface rounded-lg p-4 border border-border">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-semibold text-foreground">
                  خدمة الخلفية
                </Text>
                <View
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: status.isRunning ? '#10b981' : '#ef4444',
                  }}
                />
              </View>
              <Text className="text-xs text-muted mb-2">
                محاولات إعادة الاتصال: {status.reconnectAttempts}/{status.maxReconnectAttempts}
              </Text>
              <Text className="text-xs text-muted">
                رسائل معلقة: {status.pendingMessages}
              </Text>
            </View>
          </View>

          {/* السجل الأخير */}
          {logs.length > 0 && (
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-sm font-semibold text-foreground mb-3">
                آخر الأحداث
              </Text>
              <FlatList
                data={logs.slice(0, 5)}
                keyExtractor={(item: LogEntry) => item.id}
                scrollEnabled={false}
                renderItem={({ item }: { item: LogEntry }) => (
                  <View className="py-2 border-b border-border last:border-b-0">
                    <View className="flex-row justify-between items-start">
                      <Text className="text-xs text-muted flex-1">
                        {new Date(item.timestamp).toLocaleTimeString('ar-SA')}
                      </Text>
                      <Text
                        className={`text-xs font-semibold ${
                          item.type === 'success'
                            ? 'text-success'
                            : item.type === 'error'
                              ? 'text-error'
                              : 'text-foreground'
                        }`}
                      >
                        {item.message}
                      </Text>
                    </View>
                  </View>
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

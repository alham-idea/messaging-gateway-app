import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { socketService } from '@/lib/services/socket-service';
import { deviceStatusService } from '@/lib/services/device-status-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [networkType, setNetworkType] = useState('unknown');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    checkConnection();
    updateStatus();

    // تحديث الحالة كل 5 ثوان
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    const url = await AsyncStorage.getItem('socketUrl');
    if (!url && !socketService.isConnected()) {
      router.replace('/(tabs)');
    }
  };

  const updateStatus = () => {
    setIsConnected(socketService.isConnected());
    const status = deviceStatusService.getStatus();
    setBatteryLevel(deviceStatusService.getBatteryPercentage());
    setNetworkType(status.networkType);

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

    setLogs((prev) => [newLog, ...prev].slice(0, 50)); // الاحتفاظ بآخر 50 سجل
  };

  const handleDisconnect = async () => {
    socketService.disconnect();
    deviceStatusService.stopMonitoring();
    await AsyncStorage.removeItem('socketUrl');
    router.replace('/(tabs)');
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

          {/* بطاقة معلومات الجهاز */}
          <View className="grid grid-cols-2 gap-4">
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
            <Text className="text-sm text-muted mb-2">الرسائل المعلقة</Text>
            <Text className="text-3xl font-bold text-foreground">
              {queueCount}
            </Text>
          </View>

          {/* الأزرار */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={() => router.push('/whatsapp')}
              className="bg-primary rounded-lg py-3 items-center"
            >
              <Text className="text-white font-semibold">فتح واتساب</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {}}
              className="bg-surface border border-border rounded-lg py-3 items-center"
            >
              <Text className="text-foreground font-semibold">عرض السجل (قريباً)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDisconnect}
              className="bg-error/10 border border-error rounded-lg py-3 items-center"
            >
              <Text className="text-error font-semibold">قطع الاتصال</Text>
            </TouchableOpacity>
          </View>

          {/* السجل الأخير */}
          {logs.length > 0 && (
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-sm font-semibold text-foreground mb-3">
                آخر الأحداث
              </Text>
              <FlatList
                data={logs.slice(0, 5)}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
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

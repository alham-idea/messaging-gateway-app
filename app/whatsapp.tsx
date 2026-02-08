import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { WhatsAppWebView } from '@/components/whatsapp-webview';
import { whatsAppService } from '@/lib/services/whatsapp-service';

export default function WhatsAppScreen() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // الاستماع للرسائل الواردة
    const unsubscribe = whatsAppService.onMessageReceived((message) => {
      console.log('📨 رسالة واردة:', message);
      // يمكن إضافة إشعار هنا
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleWebViewReady = () => {
    setIsReady(true);
    console.log('✓ واتساب ويب جاهز');
  };

  const handleWebViewError = (errorMsg: string) => {
    setError(errorMsg);
    Alert.alert('خطأ', errorMsg);
  };

  const handleScanQR = () => {
    if (!isReady) {
      Alert.alert('تنبيه', 'يرجى الانتظار حتى يتم تحميل واتساب ويب');
      return;
    }

    Alert.alert(
      'مسح رمز QR',
      'افتح الكاميرا على هاتفك وامسح رمز QR المعروض على الشاشة',
      [
        { text: 'حسناً', onPress: () => {} }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'مسح البيانات',
      'هل تريد مسح بيانات واتساب المخزنة؟',
      [
        {
          text: 'إلغاء',
          onPress: () => {},
          style: 'cancel'
        },
        {
          text: 'مسح',
          onPress: () => {
            // يمكن إضافة منطق مسح البيانات هنا
            Alert.alert('تم', 'تم مسح البيانات بنجاح');
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* الرأس */}
      <View className="bg-surface border-b border-border px-4 py-3 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">
            واتساب
          </Text>
          <Text className="text-xs text-muted mt-1">
            {isReady ? '✓ متصل' : 'جاري الاتصال...'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          className="px-3 py-2"
        >
          <Text className="text-primary font-semibold">رجوع</Text>
        </TouchableOpacity>
      </View>

      {/* محتوى WebView */}
      <WhatsAppWebView
        onReady={handleWebViewReady}
        onError={handleWebViewError}
      />

      {/* شريط الأدوات السفلي */}
      <View className="bg-surface border-t border-border px-4 py-3 gap-2">
        <TouchableOpacity
          disabled={!isReady}
          onPress={handleScanQR}
          className={`py-3 rounded-lg items-center ${
            isReady ? 'bg-primary' : 'bg-primary/50'
          }`}
        >
          <Text className="text-white font-semibold">
            مسح رمز QR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleClearCache}
          className="py-3 rounded-lg items-center bg-surface border border-border"
        >
          <Text className="text-foreground font-semibold">
            مسح البيانات المخزنة
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

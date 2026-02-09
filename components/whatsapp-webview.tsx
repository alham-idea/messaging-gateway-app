import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';
import { whatsAppDesktopService } from '@/lib/services/whatsapp-desktop-service';

interface WhatsAppWebViewProps {
  onReady?: () => void;
  onError?: (error: string) => void;
}

export function WhatsAppWebView({ onReady, onError }: WhatsAppWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [stats, setStats] = useState({ isReady: false, isDesktop: false, pendingMessages: 0, incomingMessages: 0 });

  useEffect(() => {
    // تعيين مرجع WebView للخدمة الجديدة
    whatsAppDesktopService.setWebViewRef(webViewRef.current);
  }, []);

  const handleWebViewMessage = (event: any) => {
    whatsAppDesktopService.handleWebViewMessage(event);
    // تحديث الإحصائيات
    const currentStats = whatsAppDesktopService.getStats();
    setStats(currentStats);
    setIsDesktop(currentStats.isDesktop);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    // حقن كود المراقبة والاكتشاف بعد تحميل الصفحة
    whatsAppDesktopService.injectMonitoringScript();
    setIsReady(true);
    onReady?.();
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    const errorMsg = `خطأ في تحميل واتساب: ${nativeEvent.description}`;
    setError(errorMsg);
    onError?.(errorMsg);
    console.error(errorMsg);
  };

  return (
    <View className="flex-1 bg-background">
      {/* شريط الأدوات */}
      <View className="bg-surface border-b border-border px-4 py-3 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">
            واتساب ويب {isDesktop ? '🖥️ سطح المكتب' : '📱 الهاتف'}
          </Text>
          <Text className="text-xs text-muted mt-1">
            {isReady ? '✓ جاهز' : isLoading ? 'جاري التحميل...' : 'غير متصل'}
          </Text>
        </View>

        {isLoading && (
          <ActivityIndicator color="#1e3a8a" size="small" />
        )}
      </View>

      {/* شريط الإحصائيات */}
      {isReady && (
        <View className="bg-surface/50 border-b border-border px-4 py-2 flex-row justify-around">
          <View className="items-center">
            <Text className="text-xs text-muted">رسائل معلقة</Text>
            <Text className="text-sm font-semibold text-foreground">{stats.pendingMessages}</Text>
          </View>
          <View className="items-center">
            <Text className="text-xs text-muted">رسائل واردة</Text>
            <Text className="text-sm font-semibold text-foreground">{stats.incomingMessages}</Text>
          </View>
          <View className="items-center">
            <Text className="text-xs text-muted">الحالة</Text>
            <Text className="text-sm font-semibold text-foreground">{stats.isReady ? '✓' : '✗'}</Text>
          </View>
        </View>
      )}

      {/* رسالة الخطأ */}
      {error && (
        <View className="bg-error/10 border-b border-error px-4 py-3">
          <Text className="text-error text-sm">{error}</Text>
          <TouchableOpacity
            onPress={() => setError(null)}
            className="mt-2"
          >
            <Text className="text-error text-xs font-semibold">إغلاق</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://web.whatsapp.com' }}
        onMessage={handleWebViewMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={false}
        userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        // السماح بالوصول إلى الكاميرا والميكروفون إذا لزم الأمر
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        // تفعيل المحتوى المختلط
        mixedContentMode="always"
        // إعدادات الأمان
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
        // إعدادات الأداء
        cacheMode="LOAD_DEFAULT"
        cacheEnabled={true}
        // إعدادات الويب
        webviewDebuggingEnabled={true}
        style={{ flex: 1 }}
      />

      {/* تحميل في الخلفية */}
      {isLoading && (
        <View className="absolute inset-0 bg-background/50 items-center justify-center">
          <ActivityIndicator color="#1e3a8a" size="large" />
          <Text className="text-foreground mt-4 text-center">
            جاري تحميل واتساب ويب...
          </Text>
        </View>
      )}
    </View>
  );
}

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';
import { whatsAppService } from '@/lib/services/whatsapp-service';

interface WhatsAppWebViewProps {
  onReady?: () => void;
  onError?: (error: string) => void;
}

export function WhatsAppWebView({ onReady, onError }: WhatsAppWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // تعيين مرجع WebView للخدمة
    whatsAppService.setWebViewRef(webViewRef.current);
  }, []);

  const handleWebViewMessage = (event: any) => {
    whatsAppService.handleWebViewMessage(event);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    // حقن كود المراقبة بعد تحميل الصفحة
    whatsAppService.injectMonitoringScript();
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

  const handleWebViewError = (error: string) => {
    setError(error);
    onError?.(error);
  };

  return (
    <View className="flex-1 bg-background">
      {/* شريط الأدوات */}
      <View className="bg-surface border-b border-border px-4 py-3 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">
            واتساب ويب
          </Text>
          <Text className="text-xs text-muted mt-1">
            {isReady ? '✓ جاهز' : isLoading ? 'جاري التحميل...' : 'غير متصل'}
          </Text>
        </View>

        {isLoading && (
          <ActivityIndicator color="#1e3a8a" size="small" />
        )}
      </View>

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
        scalesPageToFit={true}
        userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
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

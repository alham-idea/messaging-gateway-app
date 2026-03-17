import React, { useCallback } from 'react';
import { ScrollView, View, Text, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { FailedMessageCard } from '@/components/failed-message-card';
import { useRetryManager } from '@/hooks/use-retry-manager';
import { messageHandlerService } from '@/lib/services/message-handler-service';
import { cn } from '@/lib/utils';

export default function FailedMessagesScreen() {
  const router = useRouter();
  const { failedMessages, stats, removeFailedMessage, clearAll } = useRetryManager();

  const handleRetry = useCallback((messageId: string) => {
    console.log(`🔄 إعادة محاولة يدوية للرسالة ${messageId}`);
    messageHandlerService.retryMessage(messageId);
    // إزالة الرسالة من القائمة الفاشلة مؤقتاً حتى تعود بنتيجة
    removeFailedMessage(messageId);
  }, [removeFailedMessage]);

  const handleRemove = useCallback((messageId: string) => {
    removeFailedMessage(messageId);
  }, [removeFailedMessage]);

  const handleClearAll = useCallback(() => {
    if (failedMessages.length > 0) {
      clearAll();
    }
  }, [failedMessages.length, clearAll]);

  return (
    <ScreenContainer className="flex-1 bg-background">
      {/* رأس الشاشة */}
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <Text className="text-lg font-semibold text-primary">← رجوع</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-foreground">الرسائل الفاشلة</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* الإحصائيات */}
      <View className="mb-4 gap-2">
        <View className="flex-row gap-2">
          <View className="flex-1 rounded-lg bg-surface p-3">
            <Text className="text-xs text-muted">إجمالي الفاشلة</Text>
            <Text className="mt-1 text-2xl font-bold text-foreground">
              {stats.totalFailed}
            </Text>
          </View>
          <View className="flex-1 rounded-lg bg-surface p-3">
            <Text className="text-xs text-muted">المحاولات</Text>
            <Text className="mt-1 text-2xl font-bold text-foreground">
              {stats.totalAttempts}
            </Text>
          </View>
          <View className="flex-1 rounded-lg bg-surface p-3">
            <Text className="text-xs text-muted">معلقة</Text>
            <Text className="mt-1 text-2xl font-bold text-primary">
              {stats.pendingRetries}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1 rounded-lg bg-surface p-3">
            <Text className="text-xs text-muted">فشل نهائي</Text>
            <Text className="mt-1 text-2xl font-bold text-error">
              {stats.failedFinal}
            </Text>
          </View>
          <View className="flex-1 rounded-lg bg-surface p-3">
            <Text className="text-xs text-muted">متوسط المحاولات</Text>
            <Text className="mt-1 text-2xl font-bold text-foreground">
              {stats.averageAttempts.toFixed(1)}
            </Text>
          </View>
          <View className="flex-1 rounded-lg bg-surface p-3">
            <Text className="text-xs text-muted">معدل النجاح</Text>
            <Text className="mt-1 text-2xl font-bold text-success">
              {stats.totalAttempts > 0
                ? Math.round(((stats.totalAttempts - stats.failedFinal) / stats.totalAttempts) * 100)
                : 0}
              %
            </Text>
          </View>
        </View>
      </View>

      {/* قائمة الرسائل الفاشلة */}
      {failedMessages.length > 0 ? (
        <>
          <View className="mb-3 flex-row items-center justify-between">
            <Pressable
              onPress={handleClearAll}
              className="rounded bg-error/20 px-3 py-2"
              style={({ pressed }) => [pressed && { opacity: 0.8 }]}
            >
              <Text className="text-sm font-semibold text-error">حذف الكل</Text>
            </Pressable>
            <Text className="text-sm text-muted">
              {failedMessages.length} رسالة معلقة
            </Text>
          </View>

          <FlatList
            data={failedMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FailedMessageCard
                message={item}
                onRetry={handleRetry}
                onRemove={handleRemove}
              />
            )}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </>
      ) : (
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-6xl">✅</Text>
          <Text className="text-center text-lg font-semibold text-foreground">
            لا توجد رسائل فاشلة
          </Text>
          <Text className="text-center text-sm text-muted">
            جميع الرسائل تم إرسالها بنجاح
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

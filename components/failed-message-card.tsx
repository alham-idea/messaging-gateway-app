import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { FailedMessage } from '@/lib/services/retry-service';
import { cn } from '@/lib/utils';

interface FailedMessageCardProps {
  message: FailedMessage;
  onRetry?: (messageId: string) => void;
  onRemove?: (messageId: string) => void;
}

export function FailedMessageCard({
  message,
  onRetry,
  onRemove,
}: FailedMessageCardProps) {
  // حساب الوقت المتبقي للمحاولة التالية
  const timeUntilRetry = useMemo(() => {
    const remaining = message.nextRetryTime - Date.now();
    if (remaining <= 0) return 'الآن';

    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}س ${minutes % 60}د`;
    } else if (minutes > 0) {
      return `${minutes}د ${seconds % 60}ث`;
    } else {
      return `${seconds}ث`;
    }
  }, [message.nextRetryTime]);

  // حساب نسبة التقدم
  const progressPercentage = (message.attempts / message.maxAttempts) * 100;

  // تحديد اللون بناءً على حالة الرسالة
  const getStatusColor = () => {
    if (message.attempts >= message.maxAttempts) {
      return 'error';
    } else if (message.attempts >= 3) {
      return 'warning';
    }
    return 'primary';
  };

  const statusColor = getStatusColor();

  return (
    <View className="mb-3 rounded-lg border border-border bg-surface p-4 shadow-sm">
      {/* رأس البطاقة */}
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-muted">
            {message.channel === 'whatsapp' ? '💬 واتساب' : '📱 SMS'}
          </Text>
          <Text className="mt-1 text-lg font-bold text-foreground" numberOfLines={1}>
            {message.phoneNumber}
          </Text>
        </View>
        <View
          className={cn(
            'rounded-full px-2 py-1',
            statusColor === 'error' && 'bg-error/20',
            statusColor === 'warning' && 'bg-warning/20',
            statusColor === 'primary' && 'bg-primary/20'
          )}
        >
          <Text
            className={cn(
              'text-xs font-semibold',
              statusColor === 'error' && 'text-error',
              statusColor === 'warning' && 'text-warning',
              statusColor === 'primary' && 'text-primary'
            )}
          >
            محاولة {message.attempts}/{message.maxAttempts}
          </Text>
        </View>
      </View>

      {/* نص الرسالة */}
      <View className="mb-3 rounded bg-background p-2">
        <Text className="text-sm text-foreground" numberOfLines={2}>
          {message.message}
        </Text>
      </View>

      {/* شريط التقدم */}
      <View className="mb-3 h-2 overflow-hidden rounded-full bg-border">
        <View
          className={cn(
            'h-full',
            statusColor === 'error' && 'bg-error',
            statusColor === 'warning' && 'bg-warning',
            statusColor === 'primary' && 'bg-primary'
          )}
          style={{ width: `${progressPercentage}%` }}
        />
      </View>

      {/* معلومات التوقيت */}
      <View className="mb-3 flex-row justify-between">
        <View>
          <Text className="text-xs text-muted">آخر محاولة</Text>
          <Text className="text-sm font-semibold text-foreground">
            {new Date(message.lastAttemptTime).toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-muted">المحاولة التالية</Text>
          <Text className="text-sm font-semibold text-foreground">{timeUntilRetry}</Text>
        </View>
      </View>

      {/* رسالة الخطأ */}
      {message.error && (
        <View className="mb-3 rounded bg-error/10 p-2">
          <Text className="text-xs text-error">{message.error}</Text>
        </View>
      )}

      {/* الأزرار */}
      <View className="flex-row gap-2">
        {message.attempts < message.maxAttempts ? (
          <>
            <Pressable
              onPress={() => onRetry?.(message.id)}
              className="flex-1 rounded bg-primary py-2"
              style={({ pressed }) => [pressed && { opacity: 0.8 }]}
            >
              <Text className="text-center text-sm font-semibold text-background">
                إعادة محاولة الآن
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onRemove?.(message.id)}
              className="rounded border border-border bg-background px-3 py-2"
              style={({ pressed }) => [pressed && { opacity: 0.8 }]}
            >
              <Text className="text-center text-sm font-semibold text-foreground">حذف</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => onRemove?.(message.id)}
            className="flex-1 rounded bg-error py-2"
            style={({ pressed }) => [pressed && { opacity: 0.8 }]}
          >
            <Text className="text-center text-sm font-semibold text-background">
              حذف الرسالة الفاشلة
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

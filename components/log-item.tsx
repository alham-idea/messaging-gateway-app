import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { LogMessage } from '@/lib/services/log-service';

interface LogItemProps {
  log: LogMessage;
  onDelete: (id: string) => void;
  onPress?: (log: LogMessage) => void;
}

export function LogItem({ log, onDelete, onPress }: LogItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeColor = () => {
    switch (log.type) {
      case 'whatsapp':
        return '#25D366';
      case 'sms':
        return '#0a7ea4';
      case 'system':
        return '#687076';
      case 'error':
        return '#EF4444';
      default:
        return '#11181C';
    }
  };

  const getTypeLabel = () => {
    switch (log.type) {
      case 'whatsapp':
        return 'واتساب';
      case 'sms':
        return 'رسالة نصية';
      case 'system':
        return 'نظام';
      case 'error':
        return 'خطأ';
      default:
        return 'غير معروف';
    }
  };

  const getStatusLabel = () => {
    switch (log.status) {
      case 'pending':
        return 'معلق';
      case 'sent':
        return 'مرسل';
      case 'delivered':
        return 'مُسلّم';
      case 'read':
        return 'مقروء';
      case 'failed':
        return 'فشل';
      default:
        return 'غير معروف';
    }
  };

  const getStatusColor = () => {
    switch (log.status) {
      case 'pending':
        return '#F59E0B';
      case 'sent':
        return '#0a7ea4';
      case 'delivered':
        return '#10b981';
      case 'read':
        return '#10b981';
      case 'failed':
        return '#EF4444';
      default:
        return '#687076';
    }
  };

  const getDirectionLabel = () => {
    switch (log.direction) {
      case 'sent':
        return '📤 مرسل';
      case 'received':
        return '📥 مستقبل';
      case 'internal':
        return '⚙️ داخلي';
      default:
        return 'غير معروف';
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'تأكيد الحذف',
      'هل تريد حذف هذا السجل؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          onPress: () => onDelete(log.id),
          style: 'destructive',
        },
      ]
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-SA');
  };

  return (
    <View className="bg-surface rounded-lg border border-border mb-3 overflow-hidden">
      {/* رأس السجل */}
      <TouchableOpacity
        onPress={() => {
          setIsExpanded(!isExpanded);
          onPress?.(log);
        }}
        className="p-4 active:opacity-70"
      >
        <View className="flex-row items-start justify-between mb-2">
          {/* النوع والحالة */}
          <View className="flex-row items-center gap-2 flex-1">
            <View
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getTypeColor() }}
            />
            <Text className="text-xs font-semibold text-foreground">
              {getTypeLabel()}
            </Text>
            <View
              className="px-2 py-1 rounded"
              style={{ backgroundColor: getStatusColor() + '20' }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: getStatusColor() }}
              >
                {getStatusLabel()}
              </Text>
            </View>
          </View>

          {/* الوقت */}
          <Text className="text-xs text-muted">
            {formatTime(log.timestamp)}
          </Text>
        </View>

        {/* الاتجاه والرقم */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs text-muted">
            {getDirectionLabel()}
          </Text>
          {log.phoneNumber && (
            <Text className="text-xs font-semibold text-foreground">
              {log.phoneNumber}
            </Text>
          )}
        </View>

        {/* الرسالة (معاينة) */}
        <Text
          className="text-sm text-foreground"
          numberOfLines={2}
        >
          {log.message}
        </Text>
      </TouchableOpacity>

      {/* التفاصيل الموسعة */}
      {isExpanded && (
        <View className="bg-background border-t border-border p-4">
          {/* الرسالة الكاملة */}
          <View className="mb-3">
            <Text className="text-xs text-muted mb-1">الرسالة الكاملة:</Text>
            <Text className="text-sm text-foreground bg-surface rounded p-2">
              {log.message}
            </Text>
          </View>

          {/* المعلومات الإضافية */}
          <View className="gap-2 mb-3">
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted">التاريخ:</Text>
              <Text className="text-xs text-foreground">
                {formatDate(log.timestamp)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-xs text-muted">معرّف السجل:</Text>
              <Text className="text-xs text-foreground font-mono">
                {log.id.substring(0, 12)}...
              </Text>
            </View>

            {log.metadata?.error && (
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">الخطأ:</Text>
                <Text className="text-xs text-error">
                  {log.metadata.error}
                </Text>
              </View>
            )}

            {log.metadata?.retries !== undefined && (
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">محاولات:</Text>
                <Text className="text-xs text-foreground">
                  {log.metadata.retries}
                </Text>
              </View>
            )}

            {log.metadata?.duration !== undefined && (
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">المدة:</Text>
                <Text className="text-xs text-foreground">
                  {log.metadata.duration}ms
                </Text>
              </View>
            )}
          </View>

          {/* أزرار الإجراءات */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleDelete}
              className="flex-1 bg-error/10 border border-error rounded py-2 items-center"
            >
              <Text className="text-error text-xs font-semibold">حذف</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

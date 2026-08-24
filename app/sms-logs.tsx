import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { databaseService, type DBMessage } from '@/lib/services/database-service';
import { messageHandlerService } from '@/lib/services/message-handler-service';
import {
  filterSmsLogs,
  maskPhoneNumber,
  smsStatusColor,
  smsStatusIcon,
  smsStatusLabel,
  type SmsLogFilter,
} from '@/lib/services/sms-log-utils';

const FILTERS: Array<{ key: SmsLogFilter; label: string }> = [
  { key: 'all', label: 'الكل' },
  { key: 'sent', label: 'تم الإرسال' },
  { key: 'pending', label: 'قيد الانتظار' },
  { key: 'processing', label: 'جارٍ المعالجة' },
  { key: 'failed', label: 'فشل' },
];

const statusColorMap = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  muted: 'muted',
} as const;

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('ar-SA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SmsLogsScreen() {
  const colors = useColors();
  const isFocused = useIsFocused();
  const [logs, setLogs] = useState<DBMessage[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, sent: 0, failed: 0 });
  const [filter, setFilter] = useState<SmsLogFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [nextLogs, nextStats] = await Promise.all([
        databaseService.getSmsDeliveryLogs(100),
        databaseService.getSmsDeliveryStats(),
      ]);
      setLogs(nextLogs);
      setStats(nextStats);
    } catch (loadError) {
      console.error('Failed to load SMS delivery logs:', loadError);
      setError('تعذر تحميل سجلات SMS');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (isFocused) void loadLogs();
  }, [isFocused, loadLogs]));

  const visibleLogs = useMemo(() => filterSmsLogs(logs, filter), [logs, filter]);

  const retry = useCallback(async (item: DBMessage) => {
    setRetryingId(item.id);
    try {
      await messageHandlerService.retryMessage(item.id);
      await loadLogs(true);
    } catch (retryError) {
      console.error('Failed to retry SMS:', retryError);
      Alert.alert('تعذر إعادة المحاولة', 'لم تتم إعادة إدخال الرسالة إلى طابور SMS.');
    } finally {
      setRetryingId(null);
    }
  }, [loadLogs]);

  const renderSummary = () => (
    <View className="flex-row gap-2 mb-4">
      {[
        { label: 'الكل', value: stats.total, color: colors.foreground },
        { label: 'تم', value: stats.sent, color: colors.success },
        { label: 'انتظار', value: stats.pending + stats.processing, color: colors.warning },
        { label: 'فشل', value: stats.failed, color: colors.error },
      ].map((item) => (
        <View key={item.label} className="flex-1 rounded-2xl border border-border bg-surface px-2 py-3">
          <Text className="text-center text-xs text-muted">{item.label}</Text>
          <Text className="mt-1 text-center text-xl font-bold" style={{ color: item.color }}>{item.value}</Text>
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item }: { item: DBMessage }) => {
    const tone = statusColorMap[smsStatusColor(item.status)];
    const toneColor = colors[tone];
    return (
      <View className="mb-3 rounded-2xl border border-border bg-surface p-4">
        <View className="flex-row items-start">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${toneColor}20` }}>
            <Text className="text-lg font-bold" style={{ color: toneColor }}>{smsStatusIcon(item.status)}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-foreground">{maskPhoneNumber(item.phoneNumber)}</Text>
              <Text className="text-xs text-muted">{formatTime(item.createdAt || item.timestamp)}</Text>
            </View>
            <Text className="mt-2 text-sm leading-5 text-foreground" numberOfLines={2}>{item.message}</Text>
            <View className="mt-3 flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-semibold" style={{ color: toneColor }}>{smsStatusLabel(item.status)}</Text>
                <Text className="mt-1 text-xs text-muted">المحاولات: {item.retryCount}</Text>
              </View>
              {item.status === 'failed' && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="إعادة محاولة إرسال SMS"
                  disabled={retryingId === item.id}
                  onPress={() => void retry(item)}
                  style={({ pressed }) => ({
                    minHeight: 40,
                    justifyContent: 'center',
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    backgroundColor: pressed ? colors.primary + 'DD' : colors.primary,
                    opacity: retryingId === item.id ? 0.6 : 1,
                  })}
                >
                  {retryingId === item.id ? <ActivityIndicator color={colors.background} /> : <Text className="font-semibold" style={{ color: colors.background }}>إعادة المحاولة</Text>}
                </Pressable>
              )}
            </View>
            {item.error ? <Text className="mt-2 text-xs leading-5 text-error" numberOfLines={2}>{item.error}</Text> : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="px-4 pt-3">
      <FlatList
        data={visibleLogs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadLogs(true)} tintColor={colors.primary} />}
        ListHeaderComponent={(
          <View>
            <View className="mb-5 flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-3xl font-bold text-foreground">سجلات SMS</Text>
                <Text className="mt-1 text-sm leading-5 text-muted">متابعة الرسائل المرسلة عبر شريحة الجهاز فقط</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="تحديث سجلات SMS"
                onPress={() => void loadLogs(true)}
                style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1, padding: 8 })}
              >
                <Text className="font-semibold text-primary">تحديث</Text>
              </Pressable>
            </View>
            {renderSummary()}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={FILTERS}
              keyExtractor={(item) => item.key}
              contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === item.key }}
                  onPress={() => setFilter(item.key)}
                  style={({ pressed }) => ({
                    borderRadius: 999,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor: filter === item.key ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: filter === item.key ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: filter === item.key ? colors.background : colors.foreground, fontWeight: '600' }}>{item.label}</Text>
                </Pressable>
              )}
            />
            {loading && <View className="items-center py-10"><ActivityIndicator color={colors.primary} /></View>}
            {error && !loading && (
              <View className="mb-4 rounded-2xl border border-error bg-surface p-4">
                <Text className="text-center text-error">{error}</Text>
                <Pressable onPress={() => void loadLogs()} style={{ alignSelf: 'center', marginTop: 12, padding: 8 }}>
                  <Text className="font-semibold text-primary">حاول مرة أخرى</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={!loading && !error ? (
          <View className="items-center rounded-2xl border border-border bg-surface px-6 py-12">
            <Text className="mb-2 text-3xl">—</Text>
            <Text className="text-center text-base font-semibold text-foreground">لا توجد سجلات مطابقة</Text>
            <Text className="mt-2 text-center text-sm leading-5 text-muted">ستظهر هنا نتائج إرسال SMS الجديدة بعد بدء المعالجة.</Text>
          </View>
        ) : null}
      />
    </ScreenContainer>
  );
}

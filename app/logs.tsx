import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useLogs } from '@/hooks/use-logs';
import { LogFilterComponent } from '@/components/log-filter';
import { LogItem } from '@/components/log-item';
import { LogMessage } from '@/lib/services/log-service';

export default function LogsScreen() {
  const router = useRouter();
  const {
    filteredLogs,
    stats,
    isLoading,
    filter,
    updateFilter,
    resetFilter,
    deleteLog,
    clearAllLogs,
    search,
    exportLogs,
  } = useLogs();

  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(true);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    search(text);
  };

  const handleClearAll = () => {
    Alert.alert(
      'تأكيد حذف جميع السجلات',
      'هل تريد حذف جميع السجلات؟ لا يمكن التراجع عن هذا الإجراء.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف الكل',
          onPress: () => clearAllLogs(),
          style: 'destructive',
        },
      ]
    );
  };

  const handleExport = (format: 'json' | 'csv') => {
    try {
      const data = exportLogs(format);
      const filename = `logs_${Date.now()}.${format}`;

      Alert.alert(
        'تم التصدير',
        `تم تصدير ${filteredLogs.length} سجل إلى ${filename}`,
        [{ text: 'حسناً' }]
      );

      console.log(`📤 تم تصدير السجلات بصيغة ${format}`);
    } catch (error) {
      Alert.alert('خطأ', 'فشل تصدير السجلات');
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text className="mt-4 text-foreground">جاري تحميل السجلات...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
        ListHeaderComponent={
          <View className="gap-4 mb-4">
            {/* رأس الشاشة */}
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-2xl font-bold text-foreground">السجلات</Text>
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-surface border border-border rounded-lg p-2"
              >
                <Text className="text-foreground text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            {/* الإحصائيات */}
            {showStats && stats && (
              <View className="bg-surface rounded-lg p-4 border border-border">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-sm font-semibold text-foreground">
                    الإحصائيات
                  </Text>
                  <TouchableOpacity onPress={() => setShowStats(false)}>
                    <Text className="text-xs text-muted">إخفاء</Text>
                  </TouchableOpacity>
                </View>

                <View className="gap-2">
                  {/* إجمالي الرسائل */}
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-muted">إجمالي الرسائل:</Text>
                    <Text className="text-xs font-semibold text-foreground">
                      {stats.totalMessages}
                    </Text>
                  </View>

                  {/* معدل النجاح */}
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-muted">معدل النجاح:</Text>
                    <Text className="text-xs font-semibold text-success">
                      {stats.successRate.toFixed(1)}%
                    </Text>
                  </View>

                  {/* المرسل والمستقبل */}
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-muted">مرسل / مستقبل:</Text>
                    <Text className="text-xs font-semibold text-foreground">
                      {stats.sentCount} / {stats.receivedCount}
                    </Text>
                  </View>

                  {/* الفاشل */}
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-muted">فاشل:</Text>
                    <Text className="text-xs font-semibold text-error">
                      {stats.failedCount}
                    </Text>
                  </View>

                  {/* متوسط وقت الاستجابة */}
                  {stats.averageResponseTime > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-muted">
                        متوسط الاستجابة:
                      </Text>
                      <Text className="text-xs font-semibold text-foreground">
                        {stats.averageResponseTime.toFixed(0)}ms
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* الفلاتر */}
            <LogFilterComponent
              filter={filter}
              onFilterChange={updateFilter}
              onReset={resetFilter}
            />

            {/* عدد النتائج */}
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">
                {filteredLogs.length} من {stats?.totalMessages || 0} سجل
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => handleExport('json')}
                  className="bg-primary/10 border border-primary rounded px-3 py-1"
                >
                  <Text className="text-primary text-xs font-semibold">JSON</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleExport('csv')}
                  className="bg-primary/10 border border-primary rounded px-3 py-1"
                >
                  <Text className="text-primary text-xs font-semibold">CSV</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-lg text-muted mb-2">لا توجد سجلات</Text>
            <Text className="text-xs text-muted">
              ستظهر السجلات هنا عند إرسال أو استقبال رسائل
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <LogItem
            log={item}
            onDelete={deleteLog}
            onPress={(log) => {
              console.log('تفاصيل السجل:', log);
            }}
          />
        )}
        ListFooterComponent={
          filteredLogs.length > 0 ? (
            <View className="gap-3 mt-4">
              <TouchableOpacity
                onPress={handleClearAll}
                className="bg-error/10 border border-error rounded-lg py-3 items-center"
              >
                <Text className="text-error font-semibold">حذف جميع السجلات</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        scrollEnabled={false}
      />
    </ScreenContainer>
  );
}

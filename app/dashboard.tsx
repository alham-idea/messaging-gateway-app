import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface DashboardStats {
  whatsappMessages: number;
  smsMessages: number;
  totalMessages: number;
  balance: number;
  subscriptionPlan: string;
  subscriptionStatus: string;
  messagesRemaining: number;
}

interface Payment {
  id: number;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
}

export default function DashboardScreen() {
  const colors = useColors();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: استخدام التوكن المحفوظ
      const [statsRes, paymentsRes] = await Promise.all([
        fetch('http://localhost:3000/api/dashboard/stats', {
          headers: { 'Authorization': 'Bearer YOUR_TOKEN_HERE' },
        }),
        fetch('http://localhost:3000/api/dashboard/payments', {
          headers: { 'Authorization': 'Bearer YOUR_TOKEN_HERE' },
        }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'pending':
        return 'text-warning';
      case 'failed':
        return 'text-error';
      default:
        return 'text-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'pending':
        return 'قيد الانتظار';
      case 'failed':
        return 'فشل';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <Text className="text-2xl font-bold text-foreground mb-6">لوحة التحكم</Text>

        {/* Balance Card */}
        {stats && (
          <>
            <View className="bg-primary rounded-lg p-6 mb-6">
              <Text className="text-sm text-background/80 mb-2">الرصيد المتاح</Text>
              <Text className="text-4xl font-bold text-background mb-2">
                {stats.balance.toFixed(2)} ر.س
              </Text>
              <Text className="text-sm text-background/80">
                الباقة: {stats.subscriptionPlan}
              </Text>
            </View>

            {/* Stats Grid */}
            <View className="flex-row gap-4 mb-6">
              {/* WhatsApp Messages */}
              <View className="flex-1 bg-surface rounded-lg p-4">
                <Text className="text-xs text-muted mb-2">رسائل واتساب</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {stats.whatsappMessages}
                </Text>
              </View>

              {/* SMS Messages */}
              <View className="flex-1 bg-surface rounded-lg p-4">
                <Text className="text-xs text-muted mb-2">رسائل SMS</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {stats.smsMessages}
                </Text>
              </View>
            </View>

            {/* Messages Remaining */}
            <View className="bg-surface rounded-lg p-4 mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-semibold text-foreground">
                  الرسائل المتبقية
                </Text>
                <Text className="text-sm font-bold text-primary">
                  {stats.messagesRemaining}
                </Text>
              </View>
              <View className="w-full h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary"
                  style={{
                    width: `${Math.min((stats.messagesRemaining / 1000) * 100, 100)}%`,
                  }}
                />
              </View>
              <Text className="text-xs text-muted mt-2">
                من أصل 1000 رسالة شهرية
              </Text>
            </View>

            {/* Subscription Status */}
            <View className="bg-surface rounded-lg p-4 mb-6">
              <Text className="text-sm font-semibold text-foreground mb-3">
                حالة الاشتراك
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">الحالة</Text>
                <View
                  className={cn(
                    'px-3 py-1 rounded-full',
                    stats.subscriptionStatus === 'active'
                      ? 'bg-success/10'
                      : 'bg-error/10'
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs font-semibold',
                      stats.subscriptionStatus === 'active'
                        ? 'text-success'
                        : 'text-error'
                    )}
                  >
                    {stats.subscriptionStatus === 'active'
                      ? 'نشط'
                      : 'منتهي الصلاحية'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Payments Section */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-foreground">
                  سجل المدفوعات
                </Text>
                <TouchableOpacity>
                  <Text className="text-sm font-semibold text-primary">
                    عرض الكل
                  </Text>
                </TouchableOpacity>
              </View>

              {payments.length > 0 ? (
                <FlatList
                  data={payments.slice(0, 5)}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View className="bg-surface rounded-lg p-4 mb-3 flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">
                          {item.description}
                        </Text>
                        <Text className="text-xs text-muted mt-1">
                          {new Date(item.date).toLocaleDateString('ar-SA')}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-sm font-bold text-foreground">
                          {item.amount.toFixed(2)} ر.س
                        </Text>
                        <Text
                          className={cn(
                            'text-xs font-semibold mt-1',
                            getStatusColor(item.status)
                          )}
                        >
                          {getStatusLabel(item.status)}
                        </Text>
                      </View>
                    </View>
                  )}
                />
              ) : (
                <View className="bg-surface rounded-lg p-6 items-center justify-center">
                  <Text className="text-sm text-muted">لا توجد مدفوعات</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View className="gap-3">
              <TouchableOpacity className="bg-primary rounded-lg py-3 items-center">
                <Text className="text-background font-semibold">
                  إضافة رصيد
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-surface border border-border rounded-lg py-3 items-center">
                <Text className="text-foreground font-semibold">
                  ترقية الباقة
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

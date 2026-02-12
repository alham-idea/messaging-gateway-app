import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useSubscriptions } from "@/hooks/use-subscriptions";

export default function ManageSubscriptionScreen() {
  const router = useRouter();
  const colors = useColors();
  const { currentSubscription, usageStats, loading, cancelSubscription } = useSubscriptions();
  const [canceling, setCanceling] = useState(false);

  const handleCancelSubscription = () => {
    Alert.alert(
      "إلغاء الاشتراك",
      "هل أنت متأكد من رغبتك في إلغاء الاشتراك؟ سيتم فقدان الوصول إلى جميع الميزات.",
      [
        {
          text: "إلغاء",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "تأكيد الإلغاء",
          onPress: async () => {
            try {
              setCanceling(true);
              await cancelSubscription();
              Alert.alert("تم", "تم إلغاء الاشتراك بنجاح");
              router.replace("/dashboard");
            } catch (error) {
              Alert.alert("خطأ", "فشل إلغاء الاشتراك");
            } finally {
              setCanceling(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-muted">جاري تحميل الاشتراك...</Text>
      </ScreenContainer>
    );
  }

  if (!currentSubscription || !usageStats) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground mb-4">لا توجد اشتراكات نشطة</Text>
        <TouchableOpacity
          onPress={() => router.push("/plans")}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-background font-semibold">اختر باقة</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const whatsappPercentage = (usageStats.usage.whatsappUsed / usageStats.usage.whatsappLimit) * 100;
  const smsPercentage = (usageStats.usage.smsUsed / usageStats.usage.smsLimit) * 100;

  return (
    <ScreenContainer className="flex-1">
      <ScreenHeader
        title="إدارة الاشتراك"
        subtitle="عرض وإدارة اشتراكك الحالي"
        showBackButton={true}
      />
      <ScrollView showsVerticalScrollIndicator={false} className="p-4">

        {/* Current Plan Card */}
        <View className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 mb-6 border border-primary/20">
          <View className="mb-4">
            <Text className="text-sm text-muted mb-1">الباقة الحالية</Text>
            <Text className="text-3xl font-bold text-foreground">
              {usageStats.plan.name}
            </Text>
          </View>

          <View className="border-t border-primary/20 pt-4">
            <View className="flex-row justify-between mb-3">
              <Text className="text-base text-muted">السعر الشهري:</Text>
              <Text className="text-lg font-semibold text-foreground">
                {usageStats.plan.monthlyPrice} ر.س
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-base text-muted">الفاتورة التالية:</Text>
              <Text className="text-lg font-semibold text-foreground">
                {new Date(currentSubscription.nextBillingDate).toLocaleDateString("ar-SA")}
              </Text>
            </View>
          </View>
        </View>

        {/* Usage Stats */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-4">الاستخدام الحالي</Text>

          {/* WhatsApp Usage */}
          <View className="bg-surface rounded-xl p-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-foreground">رسائل واتساب</Text>
              <Text className="text-sm text-muted">
                {usageStats.usage.whatsappUsed.toLocaleString()} / {usageStats.usage.whatsappLimit.toLocaleString()}
              </Text>
            </View>
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${
                  whatsappPercentage > 80 ? "bg-error" : whatsappPercentage > 60 ? "bg-warning" : "bg-success"
                }`}
                style={{ width: `${Math.min(whatsappPercentage, 100)}%` }}
              />
            </View>
            <Text className="text-xs text-muted mt-2">
              {whatsappPercentage.toFixed(0)}% مستخدم
            </Text>
          </View>

          {/* SMS Usage */}
          <View className="bg-surface rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-foreground">رسائل SMS</Text>
              <Text className="text-sm text-muted">
                {usageStats.usage.smsUsed.toLocaleString()} / {usageStats.usage.smsLimit.toLocaleString()}
              </Text>
            </View>
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${
                  smsPercentage > 80 ? "bg-error" : smsPercentage > 60 ? "bg-warning" : "bg-success"
                }`}
                style={{ width: `${Math.min(smsPercentage, 100)}%` }}
              />
            </View>
            <Text className="text-xs text-muted mt-2">
              {smsPercentage.toFixed(0)}% مستخدم
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View className="gap-3 mb-4">
          <TouchableOpacity
            onPress={() => router.push("/plans")}
            className="bg-primary py-4 rounded-lg items-center justify-center"
            activeOpacity={0.7}
          >
            <Text className="text-lg font-semibold text-background">ترقية أو تنزيل الباقة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCancelSubscription}
            disabled={canceling}
            className="bg-surface border border-error py-4 rounded-lg items-center justify-center"
            activeOpacity={0.7}
          >
            {canceling ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <Text className="text-lg font-semibold text-error">إلغاء الاشتراك</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View className="bg-surface rounded-lg p-4">
          <Text className="text-sm text-muted">
            <Text className="font-semibold text-foreground">ملاحظة:</Text> يمكنك تغيير باقتك في أي وقت. التغييرات ستسري من الفاتورة التالية.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

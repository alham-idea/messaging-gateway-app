import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useSubscriptions } from "@/hooks/use-subscriptions";

export default function SubscriptionConfirmationScreen() {
  const router = useRouter();
  const colors = useColors();
  const { planId, billingCycle } = useLocalSearchParams();
  const { plans, changeSubscription, loading: subscriptionLoading } = useSubscriptions();
  const [loading, setLoading] = useState(false);

  const planIdNum = typeof planId === "string" ? parseInt(planId) : planId;
  const selectedPlan = plans.find((p) => p.id === planIdNum);
  const billingCycleValue = (billingCycle as "monthly" | "yearly") || "monthly";

  const handleConfirm = async () => {
    if (!selectedPlan) return;

    try {
      setLoading(true);
      await changeSubscription(selectedPlan.id, billingCycleValue);
      router.replace("/manage-subscription");
    } catch (error) {
      console.error("Failed to confirm subscription:", error);
      setLoading(false);
    }
  };

  if (!selectedPlan) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">خطة غير موجودة</Text>
      </ScreenContainer>
    );
  }

  const displayPrice =
    billingCycleValue === "yearly" && selectedPlan.yearlyPrice
      ? selectedPlan.yearlyPrice
      : selectedPlan.monthlyPrice;

  const features = selectedPlan.features
    ? typeof selectedPlan.features === "string"
      ? JSON.parse(selectedPlan.features)
      : selectedPlan.features
    : [];

  return (
    <ScreenContainer className="flex-1">
      <ScreenHeader
        title="تأكيد الاشتراك"
        subtitle="يرجى مراجعة تفاصيل الاشتراك قبل التأكيد"
        showBackButton={true}
      />
      <ScrollView showsVerticalScrollIndicator={false} className="p-4">

        {/* Summary Card */}
        <View className="bg-surface rounded-2xl p-6 mb-8 border border-border">
          <View className="mb-6">
            <Text className="text-sm text-muted mb-2">الباقة المختارة</Text>
            <Text className="text-2xl font-bold text-foreground">{selectedPlan.name}</Text>
          </View>

          <View className="border-t border-border pt-6 mb-6">
            <View className="flex-row justify-between mb-4">
              <Text className="text-base text-muted">السعر الشهري:</Text>
              <Text className="text-lg font-semibold text-foreground">
                {selectedPlan.monthlyPrice} ر.س
              </Text>
            </View>
            <View className="flex-row justify-between mb-4">
              <Text className="text-base text-muted">دورة الفواتير:</Text>
              <Text className="text-lg font-semibold text-foreground">
                {billingCycleValue === "yearly" ? "سنوي" : "شهري"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-base text-muted">تاريخ البدء:</Text>
              <Text className="text-lg font-semibold text-foreground">
                {new Date().toLocaleDateString("ar-SA")}
              </Text>
            </View>
          </View>

          <View className="border-t border-border pt-6">
            <View className="flex-row justify-between">
              <Text className="text-base font-semibold text-foreground">الإجمالي:</Text>
              <Text className="text-2xl font-bold text-primary">{displayPrice} ر.س</Text>
            </View>
            <Text className="text-xs text-muted mt-2">
              {billingCycleValue === "yearly"
                ? "سيتم خصم المبلغ سنوياً"
                : "سيتم خصم المبلغ شهرياً"}
            </Text>
          </View>
        </View>

        {/* Features List */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-foreground mb-4">المميزات المتضمنة:</Text>
          <View className="gap-3">
            {Array.isArray(features) &&
              features.map((feature: string, index: number) => (
                <View key={index} className="flex-row items-center gap-3">
                  <View className="w-5 h-5 rounded-full bg-success items-center justify-center">
                    <Text className="text-xs text-background font-bold">✓</Text>
                  </View>
                  <Text className="text-base text-foreground flex-1">{feature}</Text>
                </View>
              ))}
          </View>
        </View>

        {/* Terms */}
        <View className="bg-warning/10 rounded-lg p-4 mb-8">
          <Text className="text-sm text-foreground">
            بتأكيدك هذا الاشتراك، فإنك توافق على{" "}
            <Text className="font-semibold text-primary">شروط الخدمة</Text> و{" "}
            <Text className="font-semibold text-primary">سياسة الخصوصية</Text>
          </Text>
        </View>

        {/* Buttons */}
        <View className="gap-3 mb-4">
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={loading || subscriptionLoading}
            className="bg-primary py-4 rounded-lg items-center justify-center"
            activeOpacity={0.7}
          >
            {loading || subscriptionLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="text-lg font-semibold text-background">تأكيد الاشتراك</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            disabled={loading || subscriptionLoading}
            className="bg-surface border border-border py-4 rounded-lg items-center justify-center"
            activeOpacity={0.7}
          >
            <Text className="text-lg font-semibold text-foreground">إلغاء</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

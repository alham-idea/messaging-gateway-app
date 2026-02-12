import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { PlanCard } from "@/components/plan-card";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useSubscriptions } from "@/hooks/use-subscriptions";

export default function PlansScreen() {
  const router = useRouter();
  const colors = useColors();
  const { plans, currentSubscription, loading } = useSubscriptions();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handleSelectPlan = (planId: number) => {
    if (currentSubscription && planId === currentSubscription.planId) {
      return;
    }
    router.push({
      pathname: "/subscription-confirmation",
      params: { planId: planId.toString(), billingCycle },
    });
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-muted">جاري تحميل الباقات...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScreenHeader
        title="اختر باقتك"
        subtitle="اختر الباقة المناسبة لاحتياجاتك"
        showBackButton={true}
      />
      <ScrollView showsVerticalScrollIndicator={false} className="p-4">

        {/* Billing Cycle Toggle */}
        <View className="flex-row bg-surface rounded-lg p-1 mb-8">
          <TouchableOpacity
            onPress={() => setBillingCycle("monthly")}
            className={`flex-1 py-3 rounded-md items-center justify-center ${
              billingCycle === "monthly" ? "bg-primary" : ""
            }`}
          >
            <Text
              className={`font-semibold ${
                billingCycle === "monthly" ? "text-background" : "text-foreground"
              }`}
            >
              شهري
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setBillingCycle("yearly")}
            className={`flex-1 py-3 rounded-md items-center justify-center ${
              billingCycle === "yearly" ? "bg-primary" : ""
            }`}
          >
            <View className="items-center">
              <Text
                className={`font-semibold ${
                  billingCycle === "yearly" ? "text-background" : "text-foreground"
                }`}
              >
                سنوي
              </Text>
              <Text
                className={`text-xs ${
                  billingCycle === "yearly" ? "text-background/80" : "text-success"
                }`}
              >
                وفر 17%
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plans */}
        {plans.map((plan) => {
          const features = plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) : [];
          const isPopular = plan.id === 2;
          const isCurrentPlan = currentSubscription ? plan.id === currentSubscription.planId : false;

          return (
            <PlanCard
              key={plan.id}
              name={plan.name}
              description={plan.description}
              monthlyPrice={plan.monthlyPrice}
              yearlyPrice={plan.yearlyPrice}
              whatsappLimit={plan.whatsappMessagesLimit}
              smsLimit={plan.smsMessagesLimit}
              features={Array.isArray(features) ? features : []}
              isCurrentPlan={isCurrentPlan}
              isPopular={isPopular}
              onSelect={() => handleSelectPlan(plan.id)}
              billingCycle={billingCycle}
            />
          );
        })}

        {/* Footer Note */}
        <View className="mt-8 mb-4 p-4 bg-surface rounded-lg">
          <Text className="text-xs text-muted text-center">
            يمكنك تغيير باقتك في أي وقت. سيتم احتساب الفرق في الفاتورة التالية.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

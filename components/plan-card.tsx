import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { cn } from "@/lib/utils";

interface Feature {
  name: string;
  included: boolean;
}

interface PlanCardProps {
  name: string;
  description?: string;
  monthlyPrice: string;
  yearlyPrice?: string;
  whatsappLimit: number;
  smsLimit: number;
  features: string[];
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  onSelect: () => void;
  billingCycle: "monthly" | "yearly";
}

export function PlanCard({
  name,
  description,
  monthlyPrice,
  yearlyPrice,
  whatsappLimit,
  smsLimit,
  features,
  isCurrentPlan,
  isPopular,
  onSelect,
  billingCycle,
}: PlanCardProps) {
  const displayPrice = billingCycle === "yearly" && yearlyPrice ? yearlyPrice : monthlyPrice;
  const pricePerMonth = billingCycle === "yearly" && yearlyPrice 
    ? (parseFloat(yearlyPrice) / 12).toFixed(0)
    : monthlyPrice;

  return (
    <View
      className={cn(
        "rounded-2xl p-6 border-2 mb-4",
        isPopular ? "border-primary bg-primary/5" : "border-border bg-surface",
        isCurrentPlan && "ring-2 ring-primary"
      )}
    >
      {/* Header */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xl font-bold text-foreground">{name}</Text>
          {isPopular && (
            <View className="bg-primary px-3 py-1 rounded-full">
              <Text className="text-xs font-semibold text-background">الأكثر شهرة</Text>
            </View>
          )}
        </View>
        {description && (
          <Text className="text-sm text-muted">{description}</Text>
        )}
      </View>

      {/* Price */}
      <View className="mb-6 py-4 border-t border-b border-border">
        <View className="flex-row items-baseline gap-1 mb-1">
          <Text className="text-4xl font-bold text-foreground">{displayPrice}</Text>
          <Text className="text-lg text-muted">ر.س</Text>
        </View>
        <Text className="text-sm text-muted">
          {billingCycle === "yearly" ? "سنوياً" : "شهرياً"}
          {billingCycle === "yearly" && yearlyPrice && (
            <Text className="text-xs"> (~{pricePerMonth} ر.س/شهر)</Text>
          )}
        </Text>
      </View>

      {/* Limits */}
      <View className="mb-6 gap-3">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center">
            <Text className="text-lg">💬</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm text-muted">رسائل واتساب</Text>
            <Text className="text-lg font-semibold text-foreground">
              {whatsappLimit.toLocaleString()} رسالة/شهر
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center">
            <Text className="text-lg">📱</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm text-muted">رسائل SMS</Text>
            <Text className="text-lg font-semibold text-foreground">
              {smsLimit.toLocaleString()} رسالة/شهر
            </Text>
          </View>
        </View>
      </View>

      {/* Features */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-foreground mb-3">المميزات المتضمنة:</Text>
        <View className="gap-2">
          {features.map((feature, index) => (
            <View key={index} className="flex-row items-center gap-2">
              <View className="w-5 h-5 rounded-full bg-success items-center justify-center">
                <Text className="text-xs text-background font-bold">✓</Text>
              </View>
              <Text className="text-sm text-foreground flex-1">{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Button */}
      <TouchableOpacity
        onPress={onSelect}
        className={cn(
          "py-3 rounded-lg items-center justify-center",
          isCurrentPlan
            ? "bg-surface border border-primary"
            : isPopular
            ? "bg-primary"
            : "bg-surface border border-border"
        )}
        activeOpacity={0.7}
      >
        <Text
          className={cn(
            "font-semibold text-base",
            isCurrentPlan
              ? "text-primary"
              : isPopular
              ? "text-background"
              : "text-foreground"
          )}
        >
          {isCurrentPlan ? "الخطة الحالية" : "اختر هذه الخطة"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

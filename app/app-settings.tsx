import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function AppSettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);

  return (
    <ScreenContainer className="flex-1">
      <ScreenHeader
        title="إعدادات التطبيق"
        subtitle="تخصيص إعدادات التطبيق والتطبيق"
        showBackButton={true}
      />
      <ScrollView showsVerticalScrollIndicator={false} className="p-4">
        <View className="gap-4">
          {/* General Settings */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-4">الإعدادات العامة</Text>

            {/* Notifications */}
            <View className="bg-surface rounded-lg p-4 mb-3 border border-border flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">الإشعارات</Text>
                <Text className="text-sm text-muted mt-1">تفعيل الإشعارات والتنبيهات</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            {/* Dark Mode */}
            <View className="bg-surface rounded-lg p-4 mb-3 border border-border flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">الوضع الليلي</Text>
                <Text className="text-sm text-muted mt-1">تفعيل الوضع الليلي للتطبيق</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>

          {/* Subscription Settings */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-4">إعدادات الاشتراك</Text>

            {/* Auto Renewal */}
            <View className="bg-surface rounded-lg p-4 mb-3 border border-border flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">التجديد التلقائي</Text>
                <Text className="text-sm text-muted mt-1">تجديد الاشتراك تلقائياً عند انتهاؤه</Text>
              </View>
              <Switch
                value={autoRenew}
                onValueChange={setAutoRenew}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            {/* Billing Email */}
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-base font-semibold text-foreground mb-2">البريد الإلكتروني للفواتير</Text>
              <Text className="text-sm text-muted">user@example.com</Text>
              <TouchableOpacity className="mt-3 py-2 px-3 bg-primary/10 rounded-lg">
                <Text className="text-sm font-semibold text-primary">تعديل</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* API Settings */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-4">إعدادات API</Text>

            {/* API Key */}
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-base font-semibold text-foreground mb-2">مفتاح API</Text>
              <Text className="text-xs text-muted font-mono mb-3">sk_live_abc123def456...</Text>
              <TouchableOpacity className="py-2 px-3 bg-primary/10 rounded-lg">
                <Text className="text-sm font-semibold text-primary">نسخ المفتاح</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* About */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-4">حول التطبيق</Text>

            <View className="bg-surface rounded-lg p-4 border border-border">
              <View className="flex-row justify-between mb-3">
                <Text className="text-base text-muted">إصدار التطبيق</Text>
                <Text className="text-base font-semibold text-foreground">1.0.0</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-base text-muted">آخر تحديث</Text>
                <Text className="text-base font-semibold text-foreground">
                  {new Date().toLocaleDateString("ar-SA")}
                </Text>
              </View>
            </View>
          </View>

          {/* Danger Zone */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-error mb-4">منطقة الخطر</Text>

            <TouchableOpacity className="bg-error/10 rounded-lg p-4 border border-error">
              <Text className="text-base font-semibold text-error">حذف جميع البيانات</Text>
              <Text className="text-sm text-error/80 mt-1">حذف جميع البيانات المحفوظة محلياً</Text>
            </TouchableOpacity>
          </View>

          {/* Info Card */}
          <View className="bg-primary/10 rounded-lg p-4 mb-4">
            <Text className="text-sm text-foreground">
              <Text className="font-semibold">ملاحظة:</Text> التغييرات يتم حفظها تلقائياً.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

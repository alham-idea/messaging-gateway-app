import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function ApplyCouponScreen() {
  const colors = useColors();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const applyCouponMutation = trpc.payments.applyCoupon.useQuery(
    { couponCode, amount: parseFloat(amount) || 0 },
    { enabled: false }
  );

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError("الرجاء إدخال رمز الكوبون");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("الرجاء إدخال مبلغ صحيح");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await applyCouponMutation.refetch();
      if (response.data) {
        setResult(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في تطبيق الكوبون");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-4">
          {/* Header */}
          <View className="mb-6">
            <Pressable onPress={() => router.back()} className="mb-4">
              <Text className="text-lg font-semibold text-primary">← رجوع</Text>
            </Pressable>
            <Text className="text-3xl font-bold text-foreground mb-2">
              تطبيق كوبون
            </Text>
            <Text className="text-base text-muted">
              استخدم رمز الخصم الخاص بك
            </Text>
          </View>

          {/* Coupon Code Input */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              رمز الكوبون
            </Text>
            <TextInput
              placeholder="أدخل رمز الكوبون"
              value={couponCode}
              onChangeText={(text) => {
                setCouponCode(text.toUpperCase());
                setError("");
              }}
              placeholderTextColor={colors.muted}
              style={{
                backgroundColor: colors.surface,
                color: colors.foreground,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
            />
          </View>

          {/* Amount Input */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-foreground mb-2">
              المبلغ (ر.س)
            </Text>
            <TextInput
              placeholder="0.00"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setError("");
              }}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.muted}
              style={{
                backgroundColor: colors.surface,
                color: colors.foreground,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
            />
          </View>

          {/* Error Message */}
          {error && (
            <View
              style={{ backgroundColor: colors.error + "20" }}
              className="rounded-lg p-4 mb-4 border border-error"
            >
              <Text style={{ color: colors.error }} className="text-base font-medium">
                {error}
              </Text>
            </View>
          )}

          {/* Result */}
          {result && (
            <View
              style={{ backgroundColor: colors.success + "20" }}
              className="rounded-lg p-4 mb-6 border border-success"
            >
              <Text
                style={{ color: colors.success }}
                className="text-base font-semibold mb-3"
              >
                ✓ تم تطبيق الكوبون بنجاح
              </Text>

              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-base text-foreground">نوع الخصم:</Text>
                  <Text className="text-base font-semibold text-foreground">
                    {result.discountType === "percentage"
                      ? `${result.discountValue}%`
                      : `${result.discountValue} ر.س`}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-base text-foreground">مبلغ الخصم:</Text>
                  <Text className="text-base font-semibold text-foreground">
                    {result.discountAmount.toFixed(2)} ر.س
                  </Text>
                </View>

                <View className="flex-row justify-between pt-2 border-t border-success">
                  <Text className="text-lg font-bold text-foreground">
                    المبلغ النهائي:
                  </Text>
                  <Text
                    style={{ color: colors.success }}
                    className="text-lg font-bold"
                  >
                    {result.finalAmount.toFixed(2)} ر.س
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Apply Button */}
          <Pressable
            onPress={handleApplyCoupon}
            disabled={loading}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                opacity: pressed || loading ? 0.8 : 1,
              },
            ]}
            className="rounded-full py-4 px-6 items-center justify-center"
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="text-background font-semibold text-lg">
                تطبيق الكوبون
              </Text>
            )}
          </Pressable>

          {/* Info Box */}
          <View
            style={{ backgroundColor: colors.surface }}
            className="rounded-lg p-4 mt-6 border border-border"
          >
            <Text className="text-sm font-semibold text-foreground mb-2">
              💡 نصيحة
            </Text>
            <Text className="text-sm text-muted leading-relaxed">
              استخدم رموز الخصم الخاصة بك للحصول على تخفيفات على الاشتراكات والخدمات.
              تأكد من أن الكوبون صالح ولم ينتهِ صلاحيته.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

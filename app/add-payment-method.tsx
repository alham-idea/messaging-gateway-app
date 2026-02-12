import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function AddPaymentMethodScreen() {
  const colors = useColors();
  const router = useRouter();
  const [methodType, setMethodType] = useState<"credit_card" | "debit_card" | "bank_account" | "wallet">("credit_card");
  const [cardBrand, setCardBrand] = useState("");
  const [last4, setLast4] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const addPaymentMethodMutation = trpc.payments.addPaymentMethod.useMutation();

  const handleAddPaymentMethod = async () => {
    if (!last4 || last4.length !== 4) {
      alert("الرجاء إدخال آخر 4 أرقام من البطاقة");
      return;
    }

    setLoading(true);
    try {
      await addPaymentMethodMutation.mutateAsync({
        methodType,
        last4,
        cardBrand: cardBrand || undefined,
        expiryMonth: expiryMonth ? parseInt(expiryMonth) : undefined,
        expiryYear: expiryYear ? parseInt(expiryYear) : undefined,
        isDefault,
      });
      router.back();
    } catch (error) {
      console.error("Failed to add payment method:", error);
      alert("فشل في إضافة طريقة الدفع");
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
              إضافة طريقة دفع
            </Text>
            <Text className="text-base text-muted">
              أضف طريقة دفع جديدة لحسابك
            </Text>
          </View>

          {/* Method Type Selection */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">
              نوع الدفع
            </Text>
            {["credit_card", "debit_card", "bank_account", "wallet"].map((type) => (
              <Pressable
                key={type}
                onPress={() => setMethodType(type as any)}
                style={({ pressed }) => [
                  {
                    backgroundColor: methodType === type ? colors.primary : colors.surface,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                className="rounded-lg p-4 mb-2 border border-border"
              >
                <Text
                  className={`text-base font-medium ${
                    methodType === type ? "text-background" : "text-foreground"
                  }`}
                >
                  {type === "credit_card" && "بطاقة ائتمان"}
                  {type === "debit_card" && "بطاقة خصم"}
                  {type === "bank_account" && "حساب بنكي"}
                  {type === "wallet" && "محفظة رقمية"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Card Brand */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              اسم البطاقة (اختياري)
            </Text>
            <TextInput
              placeholder="مثال: Visa, Mastercard"
              value={cardBrand}
              onChangeText={setCardBrand}
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

          {/* Last 4 Digits */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              آخر 4 أرقام
            </Text>
            <TextInput
              placeholder="0000"
              value={last4}
              onChangeText={(text) => setLast4(text.slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
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

          {/* Expiry Month */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              شهر الانتهاء (اختياري)
            </Text>
            <TextInput
              placeholder="MM"
              value={expiryMonth}
              onChangeText={(text) => setExpiryMonth(text.slice(0, 2))}
              keyboardType="numeric"
              maxLength={2}
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

          {/* Expiry Year */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-foreground mb-2">
              سنة الانتهاء (اختياري)
            </Text>
            <TextInput
              placeholder="YYYY"
              value={expiryYear}
              onChangeText={(text) => setExpiryYear(text.slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
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

          {/* Set as Default */}
          <Pressable
            onPress={() => setIsDefault(!isDefault)}
            style={({ pressed }) => [
              {
                backgroundColor: isDefault ? colors.primary : colors.surface,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            className="rounded-lg p-4 mb-6 border border-border flex-row items-center"
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                backgroundColor: isDefault ? colors.primary : colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                marginRight: 12,
              }}
            />
            <Text className={`text-base font-medium ${isDefault ? "text-background" : "text-foreground"}`}>
              اجعلها طريقة الدفع الافتراضية
            </Text>
          </Pressable>

          {/* Add Button */}
          <Pressable
            onPress={handleAddPaymentMethod}
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
                إضافة طريقة الدفع
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
